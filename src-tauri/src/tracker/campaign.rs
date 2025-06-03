use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::statblock::Participant;

#[derive(Serialize, Deserialize, Clone)]
pub struct TrackerData {
    pub current: String,
    pub campaigns: Vec<Campaign>,
}

impl TrackerData {
    pub fn default() -> Self {
        let campaign = Campaign::default();
        TrackerData {
            current: campaign.id.clone(),
            campaigns: vec![campaign],
        }
    }

    pub fn get_current_campaign(&mut self) -> &mut Campaign {
        self.campaigns.iter_mut().find(|campaign| campaign.id == self.current).unwrap()
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: String,
    current: String,
    pub name: String,
    pub encounters: Vec<Encounter>,
}

impl Campaign {
    pub fn default() -> Self {
        let encounter = Encounter::default();
        Campaign {
            id: Uuid::new_v4().to_string(),
            current: encounter.id.clone(),
            name: String::from("default"),
            encounters: vec![encounter],
        }
    }

    pub fn get_current_encounter(&mut self) -> &mut Encounter {
        self.encounters.iter_mut().find(|encounter| encounter.id == self.current).unwrap()
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Encounter {
    id: String,
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

    pub fn reset_initiative(&mut self) {
        self.participants.iter_mut().for_each(|p| p.initiative = 0);
    }

    fn default() -> Self {
        Encounter {
            id: Uuid::new_v4().to_string(),
            name: String::from("default"),
            participants: vec![],
            round: 1,
            current: String::default(),
        }
    }
}
