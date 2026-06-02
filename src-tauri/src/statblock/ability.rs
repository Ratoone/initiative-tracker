use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub enum ActionType {
    Passive,
    Free,
    Reaction,
    One,
    Two,
    Three,
}

#[derive(Debug, Clone, Serialize)]
pub enum AbilityCategory {
    Interaction,
    Defensive,
    Offensive,
}

#[derive(Debug, Clone, Serialize)]
pub struct Ability {
    pub name: String,
    pub action_type: Option<ActionType>,
    pub description: String,
    pub traits: Vec<String>,
    pub category: AbilityCategory,
}
