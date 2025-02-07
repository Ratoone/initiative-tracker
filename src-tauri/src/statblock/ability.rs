use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Ability {
    pub name: String,
    pub actions: Option<ActionType>,
    pub description: String,
    pub traits: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub enum ActionType {}
