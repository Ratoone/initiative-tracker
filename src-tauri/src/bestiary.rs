use crate::{deserialize::walk_bestiary, statblock::Monster};

#[derive(Default)]
pub struct Bestiary {
    pub monsters: Vec<Monster>,
}

impl Bestiary {
    pub fn new(base_path: &str) -> Self {
        let monsters = walk_bestiary(base_path);
        Bestiary { monsters }
    }
}
