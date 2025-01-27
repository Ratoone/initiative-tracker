import * as mapper from "./mapper.js";

"use strict";
const { invoke } = window.__TAURI__.core;

invoke("get_all").then(data => {
    loadTableData(data)
});

reload();

function reload() {
    invoke("get_tracker").then(data => {
        loadCombatants(data);
    });
}

function loadTableData(items) {
    const table = document.getElementById("monster-list-body");
    table.innerHTML = "";
    items.forEach(item => {
        let row = table.insertRow();
        let addButton = row.insertCell();
        addButton.innerHTML = "Add";
        addButton.classList.add("add-button");
        addButton.onclick = () => onAddToTrackerClick(item);

        let nameCell = row.insertCell();
        nameCell.innerHTML = item.name;
        nameCell.onclick = () => displayStatblock(item);
        
        let lvlCell = row.insertCell();
        lvlCell.innerHTML = item.lvl;
        lvlCell.classList.add(`${item.traits.rarity}-trait`)
        lvlCell.classList.add("level")
    });
}

function displayStatblock(item) {
    document.getElementById("statblock-name").innerHTML = `<b>${item.name}</b>`;
    document.getElementById("statblock-level").innerText = item.lvl;
    document.getElementById("statblock-level").classList = `${item.traits.rarity}-trait level`
    document.getElementById("statblock-dc").innerHTML = item.traits.rest.map(trait => {
        let skill = mapper.traitToRcSkill(trait);
        if (skill === "") {
            return "";
        }

        return mapper.listValue("Recall Knowledge", `- ${trait} (${skill}) DC ${mapper.levelToDc(item.lvl) + mapper.rarityDcMod(item.traits.rarity)}`);
    }).filter(text => text !== "").join("<br>");
    
    createTraitBar(item.traits);
    document.getElementById("statblock-senses").innerHTML = `${mapper.listValue("Perception", item.senses.perception)} ${mapper.listValue("", item.senses.details)} ${mapper.listArray("", item.senses.rest)}`;
    document.getElementById("statblock-languages").innerHTML = `${mapper.listArray("Languages", item.languages)} ${item.language_detail}`;
    document.getElementById("statblock-skills").innerHTML = `<b>Skills</b> ${mapper.formatSkills(item.skills)}`;
    
    document.getElementById("statblock-defenses").innerHTML = `${mapper.listValue("AC", item.defenses.ac)} ${mapper.listValue("", item.defenses.ac_detail)} ${mapper.listValue("Fort", item.defenses.fortitude)} ${mapper.listValue("Reflex", item.defenses.reflex)} ${mapper.listValue("Will", item.defenses.will)} ${item.defenses.all_saves}`;
    document.getElementById("statblock-health").innerHTML = `${mapper.listValue("HP", item.hp)} ${item.hp_detail ? item.hp_detail + ";" : ""} ${mapper.listArray("Immunities", item.endurances.immunities)} ${mapper.listArray("Resistances", item.endurances.resistances)} ${mapper.listArray("Weaknesses", item.endurances.weaknesses)}`;

    document.getElementById("statblock-speed").innerHTML = `<b>Speed</b> ${mapper.listValue("", item.speed.base)} ${mapper.listArray("", item.speed.rest)}`;
}

function onAddToTrackerClick(item) {
    const tracker = document.getElementById("encounter-tracker");
    const combatant = mapper.mapCombatant(item);
    const participant = createTrackerParticipant(combatant, item);
    tracker.appendChild(participant);
    invoke("add_to_tracker", {monsterName: item.name, id: participant.id}).then(() => {});
}

function loadCombatants(combatants) {
    const tracker = document.getElementById("encounter-tracker");
    combatants.forEach(async combatant => {
        let item;
        if (combatant.kind.MONSTER !== undefined) {
            item = await invoke("get_by_name", {name: combatant.kind.MONSTER});
        }
        const participant = createTrackerParticipant(combatant, item);
        tracker.appendChild(participant);
    });
}

function createTrackerParticipant(combatant, item) {
    const monster = document.createElement("div");
    monster.id = combatant.id;
    monster.classList = "tracker-participant side-by-side"
    monster.innerHTML = `
        <div class="editable-init" contenteditable="true">${combatant.initiative || "??"}</div>
        <div class="participant-general">
            <div class="side-by-side">
                <div class="level">${combatant.lvl ?? ""}</div>
                <div class="editable-name" contenteditable="true">${combatant.name}</div>
            </div>
            <div class="health-bar"><i class="fa fa-heart"></i> <span class="editable-hp" contenteditable="true">${combatant.hp ?? 0}</span>/${combatant.max_hp ?? 0}</div>
            <div class="side-by-side">
                <div class="dropdown">
                    <button class="dropbtn">Add Condition</button>
                    <div class="dropdown-content"></div>
                </div>
                ${item === undefined ? "" : "<button class='view-statblock'>Statblock</button>"}
                <i class="fa fa-trash"></i>
            </div>
            <div class="participant-conditions"></div>
            <div class="participant-notes" contenteditable="true">${combatant.notes ?? ""}</div>
        </div>
        <div>
            <div><i class="fa fa-dumbbell"></i> +${combatant.defenses?.fortitude ?? 0}</div>
            <div><i class="fa fa-bolt"></i> +${combatant.defenses?.reflex ?? 0}</div>
            <div><i class="fa fa-brain"></i> +${combatant.defenses?.will ?? 0}</div>
            <div><i class="fa fa-eye"></i> +${combatant.perception ?? 0}</div>
        </div>
        <div><i class="fa fa-shield"></i> ${combatant.defenses?.ac ?? 0}</div>
    `;

    if (item !== undefined) {
        monster.getElementsByClassName("view-statblock")[0].onclick = () => displayStatblock(item);
    }
    monster.getElementsByClassName("fa-trash")[0].onclick = () => deleteTrackerParticipant(combatant.id);
    
    monster.querySelectorAll("[contenteditable=true]").forEach(content => {
        content.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                setTimeout(function() {
                    content.blur();
                }, 0);
                return false;
            }
            return true;
        };
    });
    
    let currentHp = monster.getElementsByClassName("editable-hp")[0];
    currentHp.onblur = () => {
        let value = parseInt(eval(currentHp.innerText.replace(/[^0-9\+\-]/, "")));
        currentHp.innerText = value;
        if (value !== NaN) {
            invoke("update_hp", {id: monster.id, value: value}).then(() =>{});
        }
    }

    let name = monster.getElementsByClassName("editable-name")[0];
    name.onblur = () => {
        invoke("update_name", {id: monster.id, value: name.innerText}).then(() =>{});
    }

    let notes = monster.getElementsByClassName("participant-notes")[0];
    notes.onblur = () => {
        invoke("update_notes", {id: monster.id, value: notes.innerText}).then(() =>{});
    }

    let initiative = monster.getElementsByClassName("editable-init")[0];
    initiative.onblur = () => {
        let value = parseInt(initiative.innerText.replace(/[^0-9\+\-]/, ""));
        initiative.innerText = value;
        if (value !== NaN) {
            invoke("update_initiative", {id: monster.id, value: value}).then(() =>{});
            document.getElementById("encounter-tracker").innerHTML = "";
            reload();
        }
    }

    let conditionBox = monster.getElementsByClassName("participant-conditions")[0];
    combatant.conditions.forEach(existingCondition => {
        conditionBox.appendChild(mapper.createCondition(monster.id, existingCondition.variant));
    });
    
    let conditionDropdown = monster.getElementsByClassName("dropdown-content")[0];
    mapper.conditions.forEach(condition => {
        const conditionChoice = document.createElement("a");
        conditionChoice.innerText = condition;
        conditionChoice.onclick = () => {
            conditionBox.appendChild(mapper.createCondition(monster.id, condition));
            invoke("add_condition", {id: monster.id, name: condition}).then(() => {});
        };

        conditionDropdown.appendChild(conditionChoice);
        return `<a>${condition}</a>`
    });

    return monster;
}

function deleteTrackerParticipant(id) {
    document.getElementById(id).remove();
    invoke("remove_from_tracker", {id: id});
}

function createTraitBar(traits) {
    const container = document.getElementById("statblock-traits");
    container.innerText = "";
    if (traits.rarity != "common") {
        createTraitChip(traits.rarity, `${traits.rarity}-trait`);
    }
    createTraitChip(traits.size, "size-trait");
    traits.rest.forEach(element => {
        createTraitChip(element)
    });
}

function createTraitChip(name, extraClass) {
    const container = document.getElementById("statblock-traits");
    const chip = document.createElement("div");
    chip.classList.add("trait-chip");
    chip.classList.add(extraClass)
    chip.textContent = name;
    container.appendChild(chip);
}

$("#filter-text").on("input", async function() {
    const value = $(this).val();
    let data = await getFilteredMonsterData(value, $("#filter-by").val());
    loadTableData(data);
});

$("#filter-by").on("input", function() {
    $("#filter-text").val("");
    $("#filter-text").trigger("input");
});

async function getFilteredMonsterData(searchValue, searchBy) {
    if (searchValue === "") {
        return await invoke("get_all");
    }

    switch (searchBy) {
        case "Name":
            return await invoke("find_by_name", {name: searchValue});
        case "Trait":
            return await invoke("find_by_trait", {name: searchValue});
        default:
            return [];
    }
}

$("#player-view").on("click", function() {
    invoke("open_player_view");
});

$("#add-player").on("click", () => {
    const tracker = document.getElementById("encounter-tracker");
    const combatant = mapper.newPlayer();
    const participant = createTrackerParticipant(combatant);
    tracker.appendChild(participant);
    invoke("add_player", {id: participant.id}).then(() => {});
});