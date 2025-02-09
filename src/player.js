import * as mapper from "./mapper.js";

"use strict";

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

invoke("get_tracker").then(data => {
    loadCombatants(data);
});

listen("tracker_updated", (_) => {
    invoke("get_tracker").then(data => {
        loadCombatants(data);
    });
});

function loadCombatants(encounter) {
    const table = document.getElementById("combatants").getElementsByTagName("tbody")[0];
    table.innerHTML = "";
    encounter.participants.forEach(item => {
        const combatant = table.insertRow();

        if (encounter.current == item.id) {
            combatant.classList.add("current-combatant");
        }

        let initiative = combatant.insertCell();
        initiative.innerHTML = item.initiative;

        let name = combatant.insertCell();
        name.innerHTML = item.name;

        let health = combatant.insertCell();
        health.style.backgroundColor = mapHealthColor(item.hp / item.max_hp);
        health.innerHTML = mapHealthPercent(item.hp / item.max_hp);
        health.style.color = "#363636";
        
        let conditions = combatant.insertCell();
        item.conditions.forEach(existingCondition => {
            conditions.appendChild(mapper.createCondition(undefined, existingCondition.variant, existingCondition.value));
        });

        let notes = combatant.insertCell();
        notes.innerHTML = item.notes;
    });
}

function mapHealthColor(percent) {
    const color1 = "#cd0000";
    const color2 = "#7ae47a";
    
    if (isNaN(percent)) {
        return "#808080";
    }
    
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate the RGB values
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);

    // Convert the interpolated RGB values back to a hex color
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function mapHealthPercent(percent) {
    if (isNaN(percent)) {
        return "UNKNOWN";
    }

    if (percent >= 1) {
        return "UNHARMED";
    }

    if (percent >= 0.75) {
        return "SLIGHTLY INJURED";
    }

    if (percent >= 0.5) {
        return "INJURED";
    }

    if (percent >= 0.25) {
        return "BADLY INJURED";
    }

    if (percent > 0) {
        return "NEAR DEATH";
    }
    
    return "DEAD";
}