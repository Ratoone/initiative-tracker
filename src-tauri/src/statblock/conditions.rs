use serde::{Deserialize, Serialize};

use crate::statblock::{Defenses, Monster};

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub enum Type {
    MONSTER(String),
    PLAYER,
    CUSTOM,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, Default, PartialEq)]
pub enum Template {
    WEAK = -1,
    #[default]
    NONE = 0,
    ELITE = 1
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Condition {
    pub variant: String,
    pub value: Option<i64>,
}

pub const CONDITIONS_WITHOUT_VALUE: &[&str] = &[
    "Blinded",
    "Concealed",
    "Confused",
    "Dazzled",
    "Fascinated",
    "Fatigued",
    "Fleeing",
    "Grabbed",
    "Hidden",
    "Immobilised",
    "OffGuard",
    "Prone",
    "Quickened",
    "Restrained",
    "Unconscious",
];

pub const CONDITIONS_WITH_VALUE: &[&str] = &[
    "Clumsy",
    "Doomed",
    "Drained",
    "Dying",
    "Enfeebled",
    "Frightened",
    "Sickened",
    "Slowed",
    "Stunned",
    "Stupefied",
    "Wounded",
];

fn default_true() -> bool {
    true
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Participant {
    pub id: String,
    pub kind: Type,
    pub name: String,
    pub max_hp: i64,
    pub hp: i64,
    pub initiative: i64,
    pub conditions: Vec<Condition>,
    pub notes: String,
    pub lvl: i64,
    defenses: Defenses,
    pub perception: i64,
    #[serde(default= "default_true")]
    pub visible: bool,
    #[serde(default)]
    pub template: Template
}

impl Into<Participant> for Monster {
    fn into(self) -> Participant {
        Participant {
            id: String::new(),
            kind: Type::MONSTER(self.name.clone()),
            name: self.name,
            max_hp: self.hp,
            hp: self.hp,
            initiative: 0,
            conditions: vec![],
            notes: String::new(),
            lvl: self.lvl,
            defenses: self.defenses,
            perception: self.senses.perception,
            visible: false,
            template: Template::default(),
        }
    }
}

impl Participant {
    pub fn new(id: &str) -> Participant {
        Participant {
            id: id.to_owned(),
            kind: Type::PLAYER,
            name: String::new(),
            max_hp: 0,
            hp: 0,
            initiative: 0,
            conditions: vec![],
            notes: String::new(),
            lvl: 0,
            defenses: Defenses::default(),
            perception: 0,
            visible: true,
            template: Template::default(),
        }
    }

    pub fn apply_template(&mut self, template: Template) {
        if self.template == template {
            return;
        }

        if template == Template::WEAK && self.lvl < 0 {
            return;
        }
        
        let diff: i64 = template as i64 - self.template as i64;
        if diff.abs() > 1 {
            self.apply_template(Template::NONE);
            self.apply_template(template);
            return;
        }

        self.perception += 2 * diff;
        self.defenses.ac += 2 * diff;
        self.defenses.fortitude += 2 * diff;
        self.defenses.reflex += 2 * diff;
        self.defenses.will += 2 * diff;

        let old_lvl = self.lvl;
        if self.lvl <= 0 && diff > 0 {
            self.lvl += 2;
        } else if self.lvl == 1 && diff < 0 {
            self.lvl -= 2;
        } else {
            self.lvl += diff;
        }
        let hp_diff = match std::cmp::max(self.lvl, old_lvl) {
            ..1 => 0,
            1..=2 => 10,
            3..=5 => 15,
            6..=20 => 20,
            21.. => 30,
        };
        self.hp += diff * hp_diff;
        self.max_hp += diff * hp_diff;
        self.template = template;
    }
}
