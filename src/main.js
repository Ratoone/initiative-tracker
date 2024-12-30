const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;
let monsters;

async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = JSON.stringify(await invoke("greet", { name: greetInputEl.value }));
    console.log(greetMsgEl.textContent);
}

function loadTableData(items) {
    const table = document.getElementById("monster-list-body");
    items.forEach(item => {
        let row = table.insertRow();
        let nameCell = row.insertCell(0);
        nameCell.innerHTML = item.name;
        let lvlCell = row.insertCell(1);
        lvlCell.innerHTML = item.lvl;
        row.onclick = () => onTableRowClick(item);
    });
}

function onTableRowClick(item) {
    console.log(item);
    document.getElementById("statblock-name").innerHTML = `<b>${item.name}</b>`;
    document.getElementById("statblock-level").innerText = item.lvl;
    document.getElementById("statblock-defenses").innerHTML = `<b>AC</b> ${item.defenses.ac}; <b>Fort</b> ${item.defenses.fortitude}; <b>Reflex</b> ${item.defenses.reflex}; <b>Will</b> ${item.defenses.will}; ${item.defenses.all_saves}`;
}

window.addEventListener("DOMContentLoaded", () => {
    greetInputEl = document.querySelector("#greet-input");
    greetMsgEl = document.querySelector("#greet-msg");
    document.querySelector("#greet-form").addEventListener("submit", (e) => {
        e.preventDefault();
        greet();
    });
});

invoke("get_all").then(data => {
    console.log(data);
    loadTableData(data)
})