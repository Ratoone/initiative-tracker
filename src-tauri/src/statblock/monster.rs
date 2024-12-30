use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Monster {
    pub name: String,
    pub defenses: Defenses,
    pub hp: i64,
    pub lvl: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Defenses {
    pub ac: i64,
    pub fortitude: i64,
    pub reflex: i64,
    pub will: i64,
    pub all_saves: String,
}
