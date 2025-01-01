use std::sync::Mutex;

use crate::{bestiary::Bestiary, statblock::Monster};

lazy_static! {
    static ref CACHE: Mutex<Bestiary> = Mutex::new(Bestiary::new("../data/packs"));
}

#[tauri::command(async)]
pub fn get_all() -> Vec<Monster> {
    let cache = CACHE.lock().unwrap();
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}

#[tauri::command]
pub fn get_by_name(name: &str) -> Vec<Monster> {
    let cache = CACHE.lock().unwrap();
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.retain(|monster| monster.name.to_lowercase().contains(name));
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}

#[tauri::command]
pub fn get_by_trait(name: &str) -> Vec<Monster> {
    let cache = CACHE.lock().unwrap();
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.retain(|monster| monster.traits.rest.iter().any(|monster_trait| monster_trait.contains(name)));
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}