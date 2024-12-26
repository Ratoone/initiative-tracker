mod statblock;
mod deserialize;
use crate::deserialize::deserialize;

use std::env::current_dir;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    println!("{:?}", current_dir().unwrap().as_path());
    let monster = deserialize("../data/packs/pathfinder-monster-core/kobold-warrior.json");
    format!("Hello, {}! You've been greeted from Rust! {:?}", name, monster)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
