use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};

use crate::{statblock::{Condition, Monster, Participant, Template, CONDITIONS_WITHOUT_VALUE, CONDITIONS_WITH_VALUE}, tracker::{save, Encounter, TrackerData}};

use super::AppState;


const PLAYER_VIEW: &str = "player_view";

#[tauri::command]
pub async fn open_player_view(handle: AppHandle) {
    match handle.get_webview_window(PLAYER_VIEW) {
        Some(window) => window.set_focus().unwrap(),
        None => {
            tauri::WebviewWindowBuilder::new(
                &handle,
                PLAYER_VIEW,
                tauri::WebviewUrl::App("player.html".into()),
            )
            .build()
            .unwrap();
        }
    }
}

#[tauri::command]
pub fn add_to_tracker(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    monster_name: &str,
    id: &str,
) {
    let mut app_state = state.lock().unwrap();
    let monster: Monster = app_state
        .bestiary
        .find_by_name(monster_name)
        .unwrap()
        .clone();
    let mut participant: Participant = monster.into();
    participant.id = id.to_string();
    app_state.get_current_encounter().add_combatant(participant);
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn get_tracker(state: tauri::State<'_, Mutex<AppState>>) -> Encounter {
    let mut app_state = state.lock().unwrap();
    app_state.get_current_encounter().clone()
}

#[tauri::command]
pub fn remove_from_tracker(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    app_state.get_current_encounter().remove_combatant(id);
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn update_hp(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str, value: i64) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(ref mut target) = participant {
        target.hp = value;
        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn update_max_hp(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str, value: i64) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(ref mut target) = participant {
        target.max_hp = value;
        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn update_name(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    value: &str,
) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(ref mut target) = participant {
        target.name = value.to_string();
        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn add_player(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    let participant: Participant = Participant::new(id);
    app_state.get_current_encounter().add_combatant(participant);
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn update_initiative(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    value: i64,
) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(ref mut target) = participant {
        target.initiative = value;
        app_state
            .get_current_encounter()
            .participants
            .sort_by(|m1, m2| m2.initiative.cmp(&m1.initiative));
        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn add_condition(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    name: &str,
) {
    let mut app_state = state.lock().unwrap();
    let participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(target) = participant {
        let existing_condition = target
            .conditions
            .iter_mut()
            .find(|condition| condition.variant == name);
        match existing_condition {
            None => {
                if CONDITIONS_WITH_VALUE.contains(&name) {
                    target.conditions.push(Condition {
                        variant: name.to_string(),
                        value: Some(1),
                    });
                } else if CONDITIONS_WITHOUT_VALUE.contains(&name) {
                    target.conditions.push(Condition {
                        variant: name.to_string(),
                        value: None,
                    });
                } else {
                    println!("Error, no valid condition");
                    return;
                }
            }
            Some(condition) => {
                if let Some(value) = &mut condition.value {
                    *value += 1;
                }
            }
        };
        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn remove_condition(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    name: &str,
) {
    let mut app_state = state.lock().unwrap();
    let participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(target) = participant {
        let existing_condition = target
            .conditions
            .iter_mut()
            .find(|condition| condition.variant == name);
        match existing_condition {
            Some(condition) => {
                if let Some(value) = &mut condition.value {
                    *value -= 1;
                    if *value > 0 {
                        update_tracker(&app, &app_state.tracker_data);
                        return;
                    }
                }
                let index = target
                    .conditions
                    .iter()
                    .position(|x| x.variant == name)
                    .unwrap();
                target.conditions.remove(index);
            }
            None => {
                println!("Error, no valid condition");
                return;
            }
        }

        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn update_notes(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    value: &str,
) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(ref mut target) = participant {
        target.notes = value.to_string();
        update_tracker(&app, &app_state.tracker_data);
    }
}

#[tauri::command]
pub fn update_current(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
) {
    let mut app_state = state.lock().unwrap();
    app_state.get_current_encounter().current = id.to_string();
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn reset_initiative(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
) {
    let mut app_state = state.lock().unwrap();
    app_state.get_current_encounter().reset_initiative();
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn roll_initiative(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
) {
    let mut app_state = state.lock().unwrap();
    app_state.get_current_encounter().roll_initiative();
    update_tracker(&app, &app_state.tracker_data);
}

pub fn update_tracker(app: &AppHandle, data: &TrackerData) {
    app.emit("tracker_updated", "").unwrap();
    save(&app.path().app_data_dir().unwrap(), data);
}

#[tauri::command]
pub fn toggle_visible(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
) {
    let mut app_state = state.lock().unwrap();
    let participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(target) = participant {
        target.visible = !target.visible
    }
    update_tracker(&app, &app_state.tracker_data);
}

#[tauri::command]
pub fn update_template(    
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    value: Template
) {
    let mut app_state = state.lock().unwrap();
    let participant = app_state.get_current_encounter().find_by_id(id);
    if let Some(target) = participant {
        target.apply_template(value);
    }
    update_tracker(&app, &app_state.tracker_data);
}
