use std::sync::Mutex;

use crate::{statblock::Monster, bestiary::Bestiary};

lazy_static!{
    static ref CACHE: Mutex<Bestiary> = Mutex::new(Bestiary::new("../data/packs"));
}

#[tauri::command]
pub fn greet(name: &str) -> Result<Monster, String> {
    let cache = CACHE.lock().unwrap();
    cache.monsters.get(name).ok_or("Not Found".to_string()).cloned()
}