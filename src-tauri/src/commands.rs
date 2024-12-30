use std::sync::Mutex;

use crate::{bestiary::Bestiary, statblock::Monster};

lazy_static! {
    static ref CACHE: Mutex<Bestiary> = Mutex::new(Bestiary::new("../data/packs"));
}

#[tauri::command]
pub fn greet(name: &str) -> Result<Monster, String> {
    let cache = CACHE.lock().unwrap();
    cache
        .monsters
        .get(name)
        .ok_or("Not Found".to_string())
        .cloned()
}

#[tauri::command(async)]
pub fn get_all() -> Vec<Monster> {
    let cache = CACHE.lock().unwrap();
    let mut monsters: Vec<Monster> = cache.monsters.values().cloned().collect();
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}
