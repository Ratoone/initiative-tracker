#[macro_use(lazy_static)]
extern crate lazy_static;

mod bestiary;
mod commands;
mod deserialize;
mod statblock;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![commands::get_all, commands::get_by_name, commands::get_by_trait])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
