use std::{fs, path::PathBuf};

use serde::{Deserialize, Serialize};

use super::Participant;

#[derive(Serialize, Deserialize, Clone)]
pub struct Campaign {
    name: String,
    pub encounters: Vec<Encounter>,
}

impl Campaign {
    fn default() -> Self {
        Campaign {
            name: String::from("default"),
            encounters: vec![Encounter::default()],
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Encounter {
    name: String,
    pub participants: Vec<Participant>,
    #[serde(default)]
    pub round: i64,
    #[serde(default)]
    pub current: String,
}

impl Encounter {
    pub fn find_by_id(&mut self, id: &str) -> Option<&mut Participant> {
        self.participants.iter_mut().find(|m| m.id == id)
    }

    pub fn remove_combatant(&mut self, id: &str) {
        self.participants.retain(|participant| participant.id != id);
        if id == self.current {
            self.current = self.participants.first().map_or(String::default(), |p| p.id.clone());
        }
    }

    pub fn add_combatant(&mut self, participant: Participant) {
        if self.current == String::default() {
            self.current = participant.id.clone();
        }

        self.participants.push(participant);
    }

    fn default() -> Self {
        Encounter {
            name: String::from("default"),
            participants: vec![],
            round: 1,
            current: String::default(),
        }
    }
}

pub fn save(path: &PathBuf, encounter: &Encounter) {
    if !path.exists() {
        fs::create_dir(&path).unwrap();
    }
    let data_file = path.join("data.json");
    let campaigns = vec![Campaign {
        name: "default".to_string(),
        encounters: vec![encounter.clone()]
    }];
    fs::write(&data_file, serde_json::to_string(&campaigns).unwrap()).unwrap();
}

pub fn load(path: &PathBuf) -> Vec<Campaign> {
    let data_file = path.join("data.json");
    if !fs::exists(&data_file).unwrap() {
        return vec![Campaign::default()];
    }

    serde_json::from_str(&fs::read_to_string(data_file).unwrap()).unwrap()
}