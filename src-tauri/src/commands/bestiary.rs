use std::sync::Mutex;

use crate::statblock::Monster;

use super::AppState;


#[tauri::command(async)]
pub fn get_all(state: tauri::State<'_, Mutex<AppState>>) -> Vec<Monster> {
    let cache = &state.lock().unwrap().bestiary;
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}

#[tauri::command]
pub fn find_by_name(state: tauri::State<'_, Mutex<AppState>>, name: &str) -> Vec<Monster> {
    let cache = &state.lock().unwrap().bestiary;
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.retain(|monster| monster.name.to_lowercase().contains(name));
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}

#[tauri::command]
pub fn get_by_name(state: tauri::State<'_, Mutex<AppState>>, name: &str) -> Option<Monster> {
    let cache = &state.lock().unwrap().bestiary;
    cache.find_by_name(name).cloned()
}

#[tauri::command]
pub fn find_by_trait(state: tauri::State<'_, Mutex<AppState>>, name: &str) -> Vec<Monster> {
    let cache = &state.lock().unwrap().bestiary;
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.retain(|monster| {
        monster
            .traits
            .rest
            .iter()
            .any(|monster_trait| monster_trait.contains(name))
    });
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}