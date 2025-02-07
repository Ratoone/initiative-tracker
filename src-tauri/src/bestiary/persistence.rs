use std::{fs, path::PathBuf};

use serde::{Deserialize, Serialize};

use super::Participant;

#[derive(Serialize, Deserialize, Clone)]
pub struct Campaign {
    name: String,
    pub encounters: Vec<Encounter>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Encounter {
    name: String,
    pub participants: Vec<Participant>,
}

pub fn save(path: &PathBuf, participants: &Vec<Participant>) {
    if !path.exists() {
        fs::create_dir(&path).unwrap();
    }
    let data_file = path.join("data.json");
    let campaigns = vec![Campaign {
        name: "default".to_string(),
        encounters: vec![Encounter {
            name: "default".to_string(),
            participants: participants.clone()
        }]
    }];
    fs::write(&data_file, serde_json::to_string(&campaigns).unwrap()).unwrap();
    println!("{}", fs::read_to_string(data_file).unwrap());
}

pub fn load(path: &PathBuf) -> Vec<Campaign> {
    let data_file = path.join("data.json");
    serde_json::from_str(&fs::read_to_string(data_file).unwrap()).unwrap()
}