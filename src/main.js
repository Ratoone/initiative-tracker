import * as mapper from "./mapper.js";

const { invoke } = window.__TAURI__.core;

invoke("get_all").then(data => {
    loadTableData(data)
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
    const participant = createTrackerParticipant(item);
    tracker.appendChild(participant);
    invoke("add_to_tracker", {monsterName: item.name, id: participant.id}).then(() => {});
}

function createTrackerParticipant(item) {
    const monster = document.createElement("div");
    monster.id = crypto.randomUUID();
    monster.classList = "tracker-participant side-by-side"
    monster.innerHTML = `
        <div>Initiative</div>
        <div class="participant-general">
            <div class="side-by-side">
                <div class="level">${item.lvl}</div>
                <div>${item.name}</div>
            </div>
            <div class="health-bar"><i class="fa fa-heart"></i> ${item.hp}/${item.hp}</div>
            <div class="side-by-side">
                <button>Statblock</button>
                <i class="fa fa-trash"></i>
            </div>
        </div>
        <div>
            <div><i class="fa fa-dumbbell"></i> +${item.defenses.fortitude}</div>
            <div><i class="fa fa-bolt"></i> +${item.defenses.reflex}</div>
            <div><i class="fa fa-brain"></i> +${item.defenses.will}</div>
            <div><i class="fa fa-eye"></i> +${item.senses.perception}</div>
        </div>
        <div><i class="fa fa-shield"></i> ${item.defenses.ac}</div>
    `;

    monster.getElementsByTagName("button")[0].onclick = () => displayStatblock(item);
    monster.getElementsByClassName("fa-trash")[0].onclick = () => deleteTrackerParticipant(monster.id);
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