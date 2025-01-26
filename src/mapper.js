const { invoke } = window.__TAURI__.core;

export function formatSkills(skills) {
    return Object.entries(skills).reduce((str, [p, val]) => {
        return `${str} ${p} +${val}, `;
    }, "").slice(0, -2);
}

export function listValue(name, value) {
    return !value ? "" : `<b>${name}</b> ${value};`
}

export function listArray(name, array) {
    return array.length === 0 ? "" : `<b>${name}</b> ${array.join(", ")};`
}

export function mapCombatant(item) {
    return {
        id: crypto.randomUUID(),
        name: item.name,
        max_hp: item.hp,
        hp: item.hp,
        initiative: 0,
        conditions: [],
        notes: "",
        lvl: item.lvl,
        defenses: item.defenses,
        perception: item.senses.perception,
    };
}

export function newPlayer() {
    return {
        id: crypto.randomUUID(),
        name: "",
        conditions: [],
    };
}

export function levelToDc(level) {
    if (level < 20) {
        return level + Math.floor(level / 3) + 14;
    }

    return 2 * level;
}

export function rarityDcMod(rarity) {
    switch (rarity) {
        case "uncommon":
            return 2;
        case "rare":
            return 5;
        case "uniqeu":
            return 10;
        default:
            return 0;
    }
}

export function traitToRcSkill(trait) {
    switch (trait) {
        case "aberration": 
            return "Occultism";
        case "animal": 
            return "Nature";
        case "astral": 
            return "Occultism";
        case "beast": 
            return "Arcana, Nature";
        case "celestial": 
            return "Religion";
        case "construct": 
            return "Arcana, Crafting";
        case "dragon": 
            return "Arcana";
        case "dream": 
            return "Occultism";
        case "elemental": 
            return "Arcana, Nature";
        case "ethereal": 
            return "Occultism";
        case "fey": 
            return "Nature";
        case "fiend": 
            return "Religion";
        case "fungus": 
            return "Nature";
        case "humanoid": 
            return "Society";
        case "monitor": 
            return "Religion";
        case "ooze": 
            return "Occultism";
        case "plant": 
            return "Nature";
        case "shade": 
            return "Religion";
        case "spirit": 
            return "Occultism";
        case "time": 
            return "Occultism";
        case "undead": 
            return "Religion";
    }

    return "";
}

export const conditions = [
    "Blinded", 
    "Clumsy", 
    "Concealed", 
    "Confused", 
    "Dazzled", 
    "Doomed", 
    "Drained", 
    "Dying", 
    "Enfeebled", 
    "Fascinated", 
    "Fatigued", 
    "Fleeing", 
    "Frightened", 
    "Grabbed", 
    "Hidden", 
    "Immobilised", 
    "OffGuard", 
    "Prone", 
    "Quickened", 
    "Restrained", 
    "Sickened", 
    "Slowed", 
    "Stunned", 
    "Stupefied", 
    "Unconscious", 
    "Wounded"
];

export function createCondition(id, name) {
    const cond = document.createElement("img");
    cond.src = `/assets/conditions-svg/${name.toLowerCase()}.svg`;
    cond.classList.add("condition");
    cond.onclick = () => {
        if (id != undefined) {
            invoke("add_condition", {id: id, name: name}).then(() => {});
        }
    }

    cond.oncontextmenu = (e) => {
        e.preventDefault();
        if (id != undefined) {
            cond.remove();
            invoke("remove_condition", {id: id, name: name}).then(() => {});
        }
    };
    return cond;
}
