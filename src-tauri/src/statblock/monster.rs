use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Monster {
    pub name: String,
    pub saves: Saves,
    pub ac: i64,
    pub hp: i64,
    pub lvl: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct Saves {
    pub fortitude: i64,
    pub reflex: i64,
    pub will: i64,
}
