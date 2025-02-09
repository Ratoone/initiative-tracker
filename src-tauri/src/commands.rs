use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};

use crate::{
    bestiary::{load, save, Bestiary, Condition, Encounter, Participant, CONDITIONS_WITHOUT_VALUE, CONDITIONS_WITH_VALUE},
    statblock::Monster,
};

const PLAYER_VIEW: &str = "player_view";
pub struct AppState {
    bestiary: Bestiary,
    tracker: Encounter,
}

impl AppState {
    pub fn new(app: &AppHandle) -> Self {
        AppState {
            bestiary: Bestiary::new("../data/packs"),
            tracker: load(&app.path().app_data_dir().unwrap()).first().unwrap().encounters.first().unwrap().clone(),
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
    app_state.tracker.add_combatant(participant);
    update_tracker(&app, &app_state.tracker);
}

#[tauri::command]
pub fn get_tracker(state: tauri::State<'_, Mutex<AppState>>) -> Encounter {
    let app_state = state.lock().unwrap();
    app_state.tracker.clone()
}

#[tauri::command]
pub fn remove_from_tracker(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    app_state.tracker.remove_combatant(id);
    update_tracker(&app, &app_state.tracker);
}

#[tauri::command]
pub fn update_hp(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str, value: i64) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.tracker.find_by_id(id);
    if let Some(ref mut target) = participant {
        target.hp = value;
        update_tracker(&app, &app_state.tracker);
    }
}

#[tauri::command]
pub fn update_max_hp(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str, value: i64) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.tracker.find_by_id(id);
    if let Some(ref mut target) = participant {
        target.max_hp = value;
        update_tracker(&app, &app_state.tracker);
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
    let mut participant = app_state.tracker.find_by_id(id);
    if let Some(ref mut target) = participant {
        target.name = value.to_string();
        update_tracker(&app, &app_state.tracker);
    }
}

#[tauri::command]
pub fn add_player(app: AppHandle, state: tauri::State<'_, Mutex<AppState>>, id: &str) {
    let mut app_state = state.lock().unwrap();
    let participant: Participant = Participant::new(id);
    app_state.tracker.add_combatant(participant);
    update_tracker(&app, &app_state.tracker);
}

#[tauri::command]
pub fn update_initiative(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
    value: i64,
) {
    let mut app_state = state.lock().unwrap();
    let mut participant = app_state.tracker.find_by_id(id);
    if let Some(ref mut target) = participant {
        target.initiative = value;
        app_state
            .tracker
            .participants
            .sort_by(|m1, m2| m2.initiative.cmp(&m1.initiative));
        update_tracker(&app, &app_state.tracker);
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
    let participant = app_state.tracker.find_by_id(id);
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
        update_tracker(&app, &app_state.tracker);
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
    let participant = app_state.tracker.find_by_id(id);
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
                        update_tracker(&app, &app_state.tracker);
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

        update_tracker(&app, &app_state.tracker);
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
    let mut participant = app_state.tracker.find_by_id(id);
    if let Some(ref mut target) = participant {
        target.notes = value.to_string();
        update_tracker(&app, &app_state.tracker);
    }
}

#[tauri::command]
pub fn update_current(
    app: AppHandle,
    state: tauri::State<'_, Mutex<AppState>>,
    id: &str,
) {
    let mut app_state = state.lock().unwrap();
    app_state.tracker.current = id.to_string();
    update_tracker(&app, &app_state.tracker);
}

fn update_tracker(app: &AppHandle, encounter: &Encounter) {
    app.emit("tracker_updated", "").unwrap();
    save(&app.path().app_data_dir().unwrap(), encounter);
}
