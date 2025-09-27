use serde::{Deserialize, Serialize};

use crate::statblock::{Defenses, Monster};

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub enum Type {
    MONSTER(String),
    PLAYER,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Condition {
    pub variant: String,
    pub value: Option<i64>,
}

pub const CONDITIONS_WITHOUT_VALUE: &[&str] = &[
    "Blinded",
    "Concealed",
    "Confused",
    "Dazzled",
    "Fascinated",
    "Fatigued",
    "Fleeing",
    "Grabbed",
    "Hidden",
    "Immobilised",
    "OffGuard",
    "Prone",
    "Quickened",
    "Restrained",
    "Unconscious",
];

pub const CONDITIONS_WITH_VALUE: &[&str] = &[
    "Clumsy",
    "Doomed",
    "Drained",
    "Dying",
    "Enfeebled",
    "Frightened",
    "Sickened",
    "Slowed",
    "Stunned",
    "Stupefied",
    "Wounded",
];

fn default_true() -> bool {
    true
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Participant {
    pub id: String,
    pub kind: Type,
    pub name: String,
    pub max_hp: i64,
    pub hp: i64,
    pub initiative: i64,
    pub conditions: Vec<Condition>,
    pub notes: String,
    lvl: i64,
    defenses: Defenses,
    pub perception: i64,
    #[serde(default= "default_true")]
    pub visible: bool,
}

impl Into<Participant> for Monster {
    fn into(self) -> Participant {
        Participant {
            id: String::new(),
            kind: Type::MONSTER(self.name.clone()),
            name: self.name,
            max_hp: self.hp,
            hp: self.hp,
            initiative: 0,
            conditions: vec![],
            notes: String::new(),
            lvl: self.lvl,
            defenses: self.defenses,
            perception: self.senses.perception,
            visible: false
        }
    }
}

impl Participant {
    pub fn new(id: &str) -> Participant {
        Participant {
            id: id.to_owned(),
            kind: Type::PLAYER,
            name: String::new(),
            max_hp: 0,
            hp: 0,
            initiative: 0,
            conditions: vec![],
            notes: String::new(),
            lvl: 0,
            defenses: Defenses::default(),
            perception: 0,
            visible: true,
        }
    }
}
