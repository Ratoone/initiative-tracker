use std::sync::Mutex;

use tauri::Manager;

use crate::{bestiary::Bestiary, statblock::Monster};

#[derive(Default)]
pub struct AppState {
  bestiary: Bestiary,
  tracker: Vec<Monster>,
}

impl AppState {
    pub fn new() -> Self {
        AppState { 
            bestiary: Bestiary::new("../data/packs"),
            tracker: vec![],
        }
    }
}

#[tauri::command(async)]
pub fn get_all(state: tauri::State<'_, Mutex<AppState>>) -> Vec<Monster> {
    let cache = &state.lock().unwrap().bestiary;
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}

#[tauri::command]
pub fn get_by_name(state: tauri::State<'_, Mutex<AppState>>, name: &str) -> Vec<Monster> {
    let cache = &state.lock().unwrap().bestiary;
    let mut monsters: Vec<Monster> = cache.monsters.clone();
    monsters.retain(|monster| monster.name.to_lowercase().contains(name));
    monsters.sort_by(|m1, m2| m1.name.cmp(&m2.name));
    monsters
}

#[tauri::command]
pub fn get_by_trait(state: tauri::State<'_, Mutex<AppState>>, name: &str) -> Vec<Monster> {
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

#[tauri::command]
pub async fn open_player_view(handle: tauri::AppHandle) {
    match handle.get_webview_window("playerView") {
        Some(window) => window.set_focus().unwrap(),
        None => {
            tauri::WebviewWindowBuilder::new(
                &handle,
                "playerView",
                tauri::WebviewUrl::App("player.html".into()),
            )
            .build()
            .unwrap();
        }
    }
}

#[tauri::command]
pub fn add_to_tracker(state: tauri::State<'_, Mutex<AppState>>, monster_name: &str) {
    let mut app_state = state.lock().unwrap();
    let monster: Monster = app_state.bestiary.find_by_name(monster_name).unwrap().clone();
    println!("{:?}", &monster);
    app_state.tracker.push(monster);
}
