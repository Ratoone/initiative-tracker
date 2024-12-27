use std::collections::HashMap;

use crate::{deserialize::walk_bestiary, statblock::Monster};

pub struct Bestiary {
    pub monsters: HashMap<String, Monster>,
}

impl Bestiary {
    pub fn new(base_path: &str) -> Self {
        let monsters = walk_bestiary(base_path);
        Bestiary { monsters }
    }
}
