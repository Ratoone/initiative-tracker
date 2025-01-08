import * as mapper from "./mapper.js";

const { invoke } = window.__TAURI__.core;

invoke("get_all").then(data => {
    loadTableData(data)
});

invoke("get_tracker").then(data => {
    loadCombatants(data);
});

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
    console.log(item);
    document.getElementById("statblock-name").innerHTML = `<b>${item.name}</b>`;
    document.getElementById("statblock-level").innerText = item.lvl;
    document.getElementById("statblock-level").classList = `${item.traits.rarity}-trait level`
    
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
    combatants.forEach(combatant => {
        const participant = createTrackerParticipant(combatant);
        tracker.appendChild(participant);
    });
}

function createTrackerParticipant(combatant, item) {
    const monster = document.createElement("div");
    monster.id = combatant.id;
    monster.classList = "tracker-participant side-by-side"
    monster.innerHTML = `
        <div>Initiative</div>
        <div class="participant-general">
            <div class="side-by-side">
                <div class="level">${combatant.lvl}</div>
                <div>${combatant.name}</div>
            </div>
            <div class="health-bar"><i class="fa fa-heart"></i> ${combatant.hp}/${combatant.max_hp}</div>
            <div class="side-by-side">
                <button>Statblock</button>
                <i class="fa fa-trash"></i>
            </div>
        </div>
        <div>
            <div><i class="fa fa-dumbbell"></i> +${combatant.defenses.fortitude}</div>
            <div><i class="fa fa-bolt"></i> +${combatant.defenses.reflex}</div>
            <div><i class="fa fa-brain"></i> +${combatant.defenses.will}</div>
            <div><i class="fa fa-eye"></i> +${combatant.perception}</div>
        </div>
        <div><i class="fa fa-shield"></i> ${combatant.defenses.ac}</div>
    `;

    monster.getElementsByTagName("button")[0].onclick = () => displayStatblock(item);
    monster.getElementsByClassName("fa-trash")[0].onclick = () => deleteTrackerParticipant(combatant.id);
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
            return await invoke("get_by_name", {name: searchValue});
        case "Trait":
            return await invoke("get_by_trait", {name: searchValue});
        default:
            return [];
    }
}

$("#player-view").on("click", function() {
    invoke("open_player_view");
});