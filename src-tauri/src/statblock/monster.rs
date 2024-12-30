use std::collections::HashMap;

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Monster {
    pub name: String,
    pub defenses: Defenses,
    pub hp: i64,
    pub hp_detail: String,
    pub lvl: i64,
    pub endurances: Endurances,
    pub traits: Traits,
    pub skills: HashMap<String, i64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Defenses {
    pub ac: i64,
    pub ac_detail: String,
    pub fortitude: i64,
    pub reflex: i64,
    pub will: i64,
    pub all_saves: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct Endurances {
    pub immunities: Vec<String>,
    pub resistances: Vec<String>,
    pub weaknesses: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Traits {
    pub rarity: String,
    pub size: String,
    pub rest: Vec<String>,
}