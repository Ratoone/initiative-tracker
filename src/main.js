const { invoke } = window.__TAURI__.core;

function loadTableData(items) {
    const table = document.getElementById("monster-list-body");
    table.innerHTML = "";
    items.forEach(item => {
        let row = table.insertRow();
        let addButton = row.insertCell();
        addButton.innerHTML = "Add";
        addButton.classList.add("add-button");

        let nameCell = row.insertCell();
        nameCell.innerHTML = item.name;
        nameCell.onclick = () => onTableRowClick(item);
        
        let lvlCell = row.insertCell();
        lvlCell.innerHTML = item.lvl;
        lvlCell.classList.add(`${item.traits.rarity}-trait`)
        lvlCell.classList.add("level")
    });
}

function onTableRowClick(item) {
    console.log(item);
    document.getElementById("statblock-name").innerHTML = `<b>${item.name}</b>`;
    document.getElementById("statblock-level").innerText = item.lvl;
    document.getElementById("statblock-level").classList = `${item.traits.rarity}-trait level`
    
    createTraitBar(item.traits);
    document.getElementById("statblock-senses").innerHTML = `${listValue("Perception", item.senses.perception)} ${listValue("", item.senses.details)} ${listArray("", item.senses.rest)}`;
    document.getElementById("statblock-languages").innerHTML = `${listArray("Languages", item.languages)} ${item.language_detail}`;
    document.getElementById("statblock-skills").innerHTML = `<b>Skills</b> ${formatSkills(item.skills)}`;
    
    document.getElementById("statblock-defenses").innerHTML = `${listValue("AC", item.defenses.ac)} ${listValue("", item.defenses.ac_detail)} ${listValue("Fort", item.defenses.fortitude)} ${listValue("Reflex", item.defenses.reflex)} ${listValue("Will", item.defenses.will)} ${item.defenses.all_saves}`;
    document.getElementById("statblock-health").innerHTML = `${listValue("HP", item.hp)} ${item.hp_detail ? item.hp_detail + ";" : ""} ${listArray("Immunities", item.endurances.immunities)} ${listArray("Resistances", item.endurances.resistances)} ${listArray("Weaknesses", item.endurances.weaknesses)}`;

    document.getElementById("statblock-speed").innerHTML = `<b>Speed</b> ${listValue("", item.speed.base)} ${listArray("", item.speed.rest)}`;
}

function formatSkills(skills) {
    return Object.entries(skills).reduce((str, [p, val]) => {
        return `${str} ${p} +${val}, `;
    }, "").slice(0, -2);
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

function listValue(name, value) {
    return !value ? "" : `<b>${name}</b> ${value};`
}

function listArray(name, array) {
    return array.length === 0 ? "" : `<b>${name}</b> ${array.join(", ")};`
}

invoke("get_all").then(data => {
    console.log(data);
    loadTableData(data)
});

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