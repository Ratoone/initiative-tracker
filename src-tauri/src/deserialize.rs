use std::{collections::HashMap, fs, path::Path};

use crate::statblock::{Defenses, Endurances, Monster, Senses, Traits};

use serde_json::Value;
use walkdir::WalkDir;

trait StringValue {
    fn string_value(&self) -> String;
    fn get_string(&self) -> String;
}

trait I64Value {
    fn int_value(&self) -> i64;
    fn get_int(&self) -> i64;
}

trait ArrayValue<T, F> {
    fn array_value(&self, f: F) -> Vec<T>
    where
        F: FnMut(&Value) -> T;
}

impl StringValue for Value {
    fn string_value(&self) -> String {
        self["value"].get_string()
    }

    fn get_string(&self) -> String {
        self.as_str().unwrap_or("").to_string()
    }
}

impl I64Value for Value {
    fn int_value(&self) -> i64 {
        self["value"].get_int()
    }

    fn get_int(&self) -> i64 {
        self.as_i64().unwrap_or_default()
    }
}

impl<T, F> ArrayValue<T, F> for Value {
    fn array_value(&self, f: F) -> Vec<T>
    where
        F: FnMut(&Value) -> T,
    {
        self.as_array()
            .map(|list| list.iter().map(f).collect())
            .unwrap_or(vec![])
    }
}

pub fn walk_bestiary(base_path: &str) -> HashMap<String, Monster> {
    let mut entries: HashMap<String, Monster> = HashMap::new();

    for entry in WalkDir::new(base_path).into_iter().filter_map(|e| e.ok()) {
        let dir_entry = entry.path();
        if dir_entry.is_dir() {
            continue;
        }

        let result = deserialize(dir_entry);
        if let Some(creature) = result {
            entries.insert(creature.name.clone(), creature);
        }
    }

    entries
}

pub fn deserialize(path: &Path) -> Option<Monster> {
    let json = fs::read_to_string(path).unwrap();
    let parsed: Value = serde_json::from_str(&json).unwrap();
    if parsed["type"] != "npc" {
        return None;
    }
    let system = &parsed["system"];
    let attributes = &system["attributes"];

    Some(Monster {
        name: parsed["name"].get_string(),
        defenses: map_saves(&system["saves"], attributes),
        hp: attributes["hp"]["max"].as_i64().unwrap(),
        hp_detail: attributes["hp"]["details"].get_string(),
        lvl: system["details"]["level"].int_value(),
        endurances: map_endurances(attributes),
        traits: map_traits(&system["traits"]),
        skills: map_skills(&system["skills"]),
        senses: map_senses(&system["perception"]),
    })
}

fn map_senses(senses: &Value) -> Senses {
    Senses {
        perception: senses["mod"].get_int(),
        details: senses["details"].get_string(),
        rest: senses["senses"].array_value(|el| {
            let mut sense = el["type"].get_string();
            if !el["acuity"].is_null() {
                sense += format!(" ({})", el["acuity"].get_string()).as_str();
            }

            if !el["range"].is_null() {
                sense += format!(" {} feet", el["range"].get_int()).as_str();
            }
            sense
        })
    }
}

fn map_skills(skills: &Value) -> HashMap<String, i64> {
    let mut mapped_skills: HashMap<String, i64> = HashMap::new();
    if skills.is_null() {
        return mapped_skills;
    }

    let map = skills.as_object().unwrap();
    map.iter().for_each(|(key, value)| {
        mapped_skills.insert(key.clone(), value["base"].get_int());
    });
    mapped_skills
}

fn map_saves(saves: &Value, attributes: &Value) -> Defenses {
    Defenses {
        ac: attributes["ac"].int_value(),
        ac_detail: attributes["ac"]["details"].get_string(),
        fortitude: saves["fortitude"].int_value(),
        reflex: saves["reflex"].int_value(),
        will: saves["will"].int_value(),
        all_saves: attributes["allSaves"].string_value(),
    }
}

fn map_endurances(attributes: &Value) -> Endurances {
    Endurances {
        immunities: attributes["immunities"].array_value(|el| el["type"].get_string()),
        resistances: attributes["resistances"].array_value(|el| {
            let mut string = format!("{} {}", el["type"].get_string(), el.int_value());
            if let Some(exceptions) = el["exceptions"].as_array() {
                if !exceptions.is_empty() {
                    string = format!(
                        "{} (except {})",
                        string,
                        el["exceptions"]
                            .array_value(StringValue::get_string)
                            .join(", ")
                    );
                }
            }

            if let Some(exceptions) = el["doubleVs"].as_array() {
                if !exceptions.is_empty() {
                    string = format!(
                        "{} (double vs. {})",
                        string,
                        el["doubleVs"]
                            .array_value(StringValue::get_string)
                            .join(", ")
                    );
                }
            }
            string
        }),
        weaknesses: attributes["weaknesses"]
            .array_value(|el| format!("{} {}", el["type"].get_string(), el.int_value())),
    }
}

fn map_traits(traits: &Value) -> Traits {
    Traits {
        size: map_size(&traits["size"].string_value()).to_string(),
        rarity: traits["rarity"].get_string(),
        rest: traits["value"].array_value(StringValue::get_string)
    }
}

fn map_size(size: &String) -> &str {
    match size.as_str() {
        "tiny" => "tiny",
        "sm" => "small",
        "med" => "medium",
        "lg" => "large",
        "huge" => "huge",
        "grg" => "gargantuan",
        _ => ""
    }
}