use std::sync::Mutex;

mod bestiary;
mod commands;
mod statblock;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_all,
            commands::find_by_name,
            commands::get_by_name,
            commands::find_by_trait,
            commands::open_player_view,
            commands::add_to_tracker,
            commands::get_tracker,
            commands::remove_from_tracker,
            commands::update_hp,
            commands::update_name,
            commands::add_player,
        ])
        .manage(Mutex::new(commands::AppState::new()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
