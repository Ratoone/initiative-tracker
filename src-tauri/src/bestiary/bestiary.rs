use crate::statblock::Monster;

pub struct Bestiary {
    pub monsters: Vec<Monster>,
}

impl Bestiary {
    pub fn empty() -> Self {
        Bestiary { monsters: vec![] }
    }

    pub fn find_by_name(&self, name: &str) -> Option<&Monster> {
        self.monsters.iter().find(|&m| m.name == name)
    }
}
