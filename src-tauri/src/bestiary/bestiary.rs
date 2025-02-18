use crate::statblock::Monster;

use super::deserialize::walk_bestiary;

pub struct Bestiary {
    pub monsters: Vec<Monster>,
}

impl Bestiary {
    pub fn new(base_path: &str) -> Self {
        let monsters = walk_bestiary(base_path);
        Bestiary { monsters }
    }

    pub fn find_by_name(&self, name: &str) -> Option<&Monster> {
        self.monsters.iter().find(|&m| m.name == name)
    }
}
