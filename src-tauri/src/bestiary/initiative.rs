use serde::Serialize;

use crate::statblock::{Defenses, Monster};

#[derive(Serialize, Clone)]
enum Type {
    MONSTER(String),
}

#[derive(Serialize, Clone)]
pub enum Condition {

}

#[derive(Serialize, Clone)]
pub struct Participant {
    pub id: String,
    kind: Type,
    name: String,
    max_hp: i64,
    pub hp: i64,
    initiative: i64,
    pub conditions: Vec<Condition>,
    pub notes: String,
    lvl: i64,
    defenses: Defenses,
    perception: i64,
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
        }
    }
}