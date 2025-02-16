use std::sync::Mutex;

use tauri::AppHandle;

use crate::tracker::{Campaign, TrackerData};

use super::{update_tracker, AppState};

#[tauri::command]
pub fn get_campaigns(state: tauri::State<'_, Mutex<AppState>>) -> TrackerData {
    state.lock().unwrap().tracker_data.clone()
}

#[tauri::command]
pub fn create_campaign(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>) -> Campaign {
    let new_campaign = Campaign::default();
    let new_id = new_campaign.id.clone();
    let mut app_state = state.lock().unwrap();
    app_state.tracker_data.campaigns.push(new_campaign.clone());
    app_state.tracker_data.current = new_id;
    update_tracker(&app, &app_state.tracker_data);
    new_campaign
}

#[tauri::command]
pub fn set_current_campaign(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    app_state.tracker_data.current = id.to_string();
    update_tracker(&app, &app_state.tracker_data);
}