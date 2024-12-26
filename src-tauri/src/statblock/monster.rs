#[derive(Debug)]
pub struct Monster {
    pub name: String,
    pub saves: Saves,
    pub ac: i64,
    pub hp: i64,
}

#[derive(Debug)]
pub struct Saves {
    pub fortitude: i64,
    pub reflex: i64,
    pub will: i64,
}