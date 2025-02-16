use tauri::{AppHandle, Manager};

use crate::{bestiary::Bestiary, tracker::{load, Encounter, TrackerData}};

pub struct AppState {
    pub bestiary: Bestiary,
    pub tracker_data: TrackerData,
}

impl AppState {
    pub fn new(app: &AppHandle) -> Self {
        let data = load(&app.path().app_data_dir().unwrap());
        AppState {
            bestiary: Bestiary::new("../data/packs"),
            tracker_data: data,
        }
    }

    pub fn get_current_encounter(&mut self) -> &mut Encounter {
        self.tracker_data.get_current_campaign().get_current_encounter()
    } 
}