use std::{collections::HashMap, fs, path::Path};

use crate::statblock::{Monster, Defenses};

use serde_json::Value;
use walkdir::WalkDir;

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
    let saves = &system["saves"];

    Some(Monster {
        name: parsed["name"].as_str().unwrap().to_string(),
        defenses: deserialize_saves(saves, attributes),
        hp: attributes["hp"]["max"].as_i64().unwrap(),
        lvl: system["details"]["level"]["value"].as_i64().unwrap(),
    })
}

fn deserialize_saves(saves: &Value, attributes: &Value) -> Defenses {
    Defenses {
        ac: attributes["ac"]["value"].as_i64().unwrap(),
        fortitude: saves["fortitude"]["value"].as_i64().unwrap(),
        reflex: saves["reflex"]["value"].as_i64().unwrap(),
        will: saves["will"]["value"].as_i64().unwrap(),
        all_saves: attributes["allSaves"]["value"].as_str().unwrap_or("").to_string()
    }
}
