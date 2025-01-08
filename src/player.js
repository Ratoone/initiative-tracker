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

function loadCombatants(items) {
    const table = document.getElementById("combatants").getElementsByTagName("tbody")[0];
    table.innerHTML = "";
    items.forEach(item => {
        const combatant = table.insertRow();
        let initiative = combatant.insertCell();
        initiative.innerHTML = item.initiative;

        let name = combatant.insertCell();
        name.innerHTML = item.name;

        let health = combatant.insertCell();
        health.innerHTML = `${item.hp}/${item.max_hp}`;

        let conditions = combatant.insertCell();

        let notes = combatant.insertCell();
        notes.innerHTML = item.notes;
    });
}