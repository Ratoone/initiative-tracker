import * as mapper from "./mapper.js";

"use strict";
const { invoke } = window.__TAURI__.core;
const { info } = window.__TAURI__.log;

invoke("get_all").then(data => {
    loadTableData(data);
});

function showCampaigns() {
    invoke("get_campaigns").then(data => {
        const campaignSelect = document.getElementById("campaign-select");
        campaignSelect.innerHTML = "<option>New Campaign</option>";
        data.campaigns.forEach(campaign => {
            var opt = document.createElement("option");
            opt.value = campaign.id;
            opt.innerText = campaign.name;
            campaignSelect.appendChild(opt);
            
            if (campaign.id === data.current) {
                opt.selected = true;
                showEncounters(campaign);
            }
        });

        campaignSelect.onchange = e => {
            if (e.target.value === "New Campaign") {
                invoke("create_campaign").then(campaign => {
                    data.campaigns.push(campaign);
                    data.current = campaign.id;
                    var opt = document.createElement("option");
                    opt.value = campaign.id;
                    opt.innerText = campaign.name;
                    campaignSelect.appendChild(opt);
                    campaignSelect.value = campaign.id;
                    showEncounters(campaign);
                });
                return;
            }

            console.log(e.target)
            const selectedCampaign = data.campaigns.filter(c => c.id === e.target.value)[0];
            invoke("set_current_campaign", {id: selectedCampaign.id}).then(() => {
                data.current = selectedCampaign.current;
                showEncounters(selectedCampaign);
            });
        };

        document.getElementById("delete-campaign").onclick = _e => {
            invoke("delete_campaign", {id: data.current}).then(() => {
                showCampaigns();
            });
        };

        const rename = document.getElementById("rename-campaign");
        rename.onclick = _e => {
            const newName = document.createElement("input");
            rename.replaceWith(newName);
            newName.focus();
            newName.onblur = _e => {
                invoke("rename_campaign", {id: data.current, name: newName.value}).then(() => {
                    newName.replaceWith(rename);
                    showCampaigns();
                });
            };
            newName.onkeyup = e => {
                switch (e.key) {
                    case "Enter": e.currentTarget.blur();
                    case "Escape": newName.replaceWith(rename);
                }
            };
        };

    });
}
showCampaigns();

function showEncounters(campaign) {
    const encounters = document.getElementById("encounter-list");
    encounters.innerHTML = "";
    campaign.encounters.forEach(encounter => {
        const chip = document.createElement("div");
        chip.id = encounter.id;
        chip.classList.add("encounter-chip");
        chip.classList.add("side-by-side");
        chip.innerHTML = `
            <div class="edit-encounter" contenteditable="true">${encounter.name}</div> 
            <i class="fa fa-trash"></i>
        `;
        chip.getElementsByTagName("i")[0].onclick = () => {
            invoke("delete_encounter", {id: encounter.id}).then(() => {
                showCampaigns();
            });
        };
        if (campaign.current === encounter.id) {
            chip.classList.add("current-combatant");
        }

        chip.ondblclick = _ => {
            invoke("set_current_encounter", {id: chip.id}).then(() => {
                encounters.getElementsByClassName("current-combatant")[0].classList.remove("current-combatant");
                chip.classList.add("current-combatant");
                loadCurrentCombat();
            });
        }

        chip.getElementsByClassName("edit-encounter")[0].onblur = e => {
            invoke("rename_encounter", {id: chip.id, name: e.target.innerText}).then(() =>{});
        }
        chip.getElementsByClassName("edit-encounter")[0].onkeydown = e => {
            if (e.key === "Enter") {
                e.preventDefault();
                setTimeout(function() {
                    e.target.blur();
                }, 0);
                return false;
            }
            return true;
        };

        encounters.appendChild(chip);
    });
    
    const plusChip = document.createElement("div");
    plusChip.classList.add("encounter-chip");
    plusChip.innerText = "+";
    plusChip.onclick = _ => {
        invoke("create_encounter").then(data => {
            campaign.encounters.push(data);
            campaign.current = data.id;
            showEncounters(campaign);
        });
    }
    encounters.appendChild(plusChip);

    loadCurrentCombat();
}

function loadCurrentCombat() {
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
    tracker.innerHTML = "";
    combatants.participants.forEach(combatant => {
        if (combatant.kind.MONSTER !== undefined) {
            invoke("get_by_name", {name: combatant.kind.MONSTER}).then(item => {
                document.getElementById(combatant.id).getElementsByClassName("view-statblock")[0].onclick = () => displayStatblock(item);
            });
        }
        const participant = createTrackerParticipant(combatant);
        tracker.appendChild(participant);
        if (combatants.current === combatant.id) {
            participant.classList.add("current-combatant")
        }
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
            <div class="health-bar">
                <i class="fa fa-heart"></i> 
                <span class="editable-hp" contenteditable="true">${combatant.hp ?? 0}</span>
                /
                <span class="editable-max-hp" contenteditable="true">${combatant.max_hp ?? 0}</span>
            </div>
            <div class="side-by-side">
                <div class="dropdown">
                    <button class="dropbtn">Add Condition</button>
                    <div class="dropdown-content"></div>
                </div>
                ${item === undefined && combatant.kind?.MONSTER === undefined ? "" : "<button class='view-statblock'>Statblock</button>"}
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
    
    let maxHp = monster.getElementsByClassName("editable-max-hp")[0];
    maxHp.onblur = () => {
        let value = parseInt(eval(maxHp.innerText.replace(/[^0-9\+\-]/, "")));
        maxHp.innerText = value;
        if (value !== NaN) {
            invoke("update_max_hp", {id: monster.id, value: value}).then(() =>{});
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
        console.log("Blurred!")
        let value = parseInt(initiative.innerText.replace(/[^0-9\+\-]/, ""));
        initiative.innerText = value;
        if (value !== NaN) {
            invoke("update_initiative", {id: monster.id, value: value}).then(() =>{});
            document.getElementById("encounter-tracker").innerHTML = "";
            loadCurrentCombat();
        }
    }

    let conditionBox = monster.getElementsByClassName("participant-conditions")[0];
    combatant.conditions.forEach(existingCondition => {
        conditionBox.appendChild(mapper.createCondition(monster.id, existingCondition.variant, existingCondition.value));
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

    monster.ondblclick = () => {
        document.getElementsByClassName("current-combatant tracker-participant")[0]?.classList.remove("current-combatant");
        monster.classList.add("current-combatant");
        invoke("update_current", {id: monster.id}).then(() => {});
    }

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

$("#reset-initiative").on("click", () => {
    invoke("reset_initiative").then(() => {});
    loadCurrentCombat();
});
