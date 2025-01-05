use serde::Serialize;

use crate::statblock::Monster;

#[derive(Serialize, Clone)]
enum Type {
    MONSTER(String),
}

#[derive(Serialize, Clone)]
enum Condition {

}

#[derive(Serialize, Clone)]
pub struct Participant {
    pub id: String,
    kind: Type,
    name: String,
    max_hp: i64,
    hp: i64,
    initiative: i64,
    conditions: Vec<Condition>,
    notes: String,
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
        }
    }
}