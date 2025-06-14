use std::sync::Mutex;

use tauri::AppHandle;

use crate::tracker::Encounter;

use super::{update_tracker, AppState};

#[tauri::command]
pub fn create_encounter(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>) -> Encounter {
    let new_encounter = Encounter::default();
    let new_id = new_encounter.id.clone();
    let mut app_state = state.lock().unwrap();
    let current_campaign = app_state.tracker_data.get_current_campaign();
    current_campaign.encounters.push(new_encounter.clone());
    current_campaign.current = new_id;
    update_tracker(&app, &app_state.tracker_data);
    new_encounter
}

#[tauri::command]
pub fn rename_encounter(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str, name: &str) {
    let mut app_state = state.lock().unwrap();
    let current_campaign = app_state.tracker_data.get_current_campaign();
    let encounter: &mut Encounter = current_campaign.encounters.iter_mut().find(|enc| enc.id == id).unwrap();
    encounter.name = name.to_string();
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn delete_encounter(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    let current_campaign = app_state.tracker_data.get_current_campaign();
    current_campaign.encounters.retain(|enc| enc.id != id );
    if !current_campaign.encounters.is_empty() && current_campaign.current == id {
        current_campaign.current = current_campaign.encounters[0].id.clone(); 
    }
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn set_current_encounter(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    let current_campaign = app_state.tracker_data.get_current_campaign();
    current_campaign.current = id.to_string();
    update_tracker(&app, &app_state.tracker_data);
}
