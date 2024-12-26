use std::fs;
use std::error::Error;

use crate::statblock::{Monster, Saves};
use serde_json::Value;

pub fn deserialize(path: &str) -> Result<Monster, Box<dyn Error>> {
    let json = fs::read_to_string(path)?;
    let parsed: Value = serde_json::from_str(&json)?;
    let system = &parsed["system"];
    let attributes = &system["attributes"];
    let saves = &system["saves"];

    Ok(Monster {
        name: parsed["name"].as_str().unwrap().to_string(),
        saves: deserialize_saves(saves),
        ac: attributes["ac"]["value"].as_i64().unwrap(),
        hp: attributes["hp"]["value"].as_i64().unwrap(),
    })
}

fn deserialize_saves(saves: &Value) -> Saves {
    Saves { 
        fortitude: saves["fortitude"]["value"].as_i64().unwrap(),
        reflex: saves["reflex"]["value"].as_i64().unwrap(),
        will: saves["will"]["value"].as_i64().unwrap(),
    }
}