use std::{fs, path::PathBuf};

use super::TrackerData;

pub fn save(path: &PathBuf, data: &TrackerData) {
    if !path.exists() {
        fs::create_dir(&path).unwrap();
    }
    let data_file = path.join("data.json");
    fs::write(&data_file, serde_json::to_string_pretty(data).unwrap()).unwrap();
}

pub fn load(path: &PathBuf) -> TrackerData {
    let data_file = path.join("data.json");
    if !fs::exists(&data_file).unwrap() {
        return TrackerData::default();
    }

    serde_json::from_str(&fs::read_to_string(data_file).unwrap()).unwrap()
}