const { invoke } = window.__TAURI__.core;

export function formatSkills(skills) {
    return Object.entries(skills)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, modifier]) => `${titleCase(name)} ${modifier}`)
        .join(', ');
}

function titleCase(str) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function formatActionType(actionType) {
    switch (actionType) {
        case 'One': return ' [one-action]';
        case 'Two': return ' [two-actions]';
        case 'Three': return ' [three-actions]';
        case 'Free': return ' [free-action]';
        case 'Reaction': return ' [reaction]';
        default: return '';
    }
}

export function formatTraitForDisplay(trait) {
    const reachMatch = trait.match(/^reach-(\d+)$/);
    if (reachMatch) {
        return `reach ${reachMatch[1]} feet`;
    }
    return trait;
}

export function formatAttack(attack) {
    const isAgile = attack.traits.includes('agile');
    const map1 = attack.bonus - (isAgile ? 4 : 5);
    const map2 = attack.bonus - (isAgile ? 8 : 10);
    const traitsDisplay = attack.traits.map(formatTraitForDisplay).join(', ');
    const traitsLabel = traitsDisplay ? ` (${traitsDisplay})` : '';
    const damageDisplay = attack.damage_rolls
        .map(r => `${r.damage} ${r.damage_type}`)
        .join(' plus ');
    return `<b>Melee</b> [one-action] ${attack.name} +${attack.bonus} [+${map1}/+${map2}]${traitsLabel}, Damage ${damageDisplay}`;
}

export function formatAbility(ability) {
    const actionLabel = formatActionType(ability.action_type);
    const traitsLabel = ability.traits.length > 0 ? ` (${ability.traits.join(', ')})` : '';
    const desc = stripPf2eLinks(ability.description);
    return `<div class="statblock-ability"><b>${ability.name}</b>${actionLabel}${traitsLabel} ${desc}</div>`;
}

export function stripPf2eLinks(html) {
    return html
        .replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1')
        .replace(/@UUID\[[^\]]+\]/g, '');
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

export function createCondition(id, name, value) {
    if (!value && [
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
        "Wounded"
    ].includes(name)) {
        value = 1;
    }

    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.display = "inline-block";

    const cond = document.createElement("img");
    cond.src = `/assets/conditions-svg/${name.toLowerCase()}.svg`;
    cond.classList.add("condition");

    container.appendChild(cond);
    let badge;
    if (value) {
        badge = document.createElement("span");
        badge.textContent = value;
        badge.classList.add("condition-value");

        container.appendChild(badge);
    }

    cond.onclick = () => {
        if (id != undefined) {
            if (value) {
                badge.textContent = parseInt(badge.textContent) + 1;
            }
            invoke("add_condition", {id: id, name: name}).then(() => {});
        }
    }

    cond.oncontextmenu = (e) => {
        e.preventDefault();
        if (id != undefined) {
            if (!value || parseInt(badge.textContent) === 1) {
                container.remove();
            } else {
                badge.textContent = parseInt(badge.textContent) - 1;
            }
            invoke("remove_condition", {id: id, name: name}).then(() => {});
        }
    };

    return container;
}
