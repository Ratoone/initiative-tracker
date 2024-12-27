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
  const table = document.getElementById("monsterListBody");
  items.forEach( item => {
    let row = table.insertRow();
    let nameCell = row.insertCell(0);
    nameCell.innerHTML = item.name;
    let lvlCell = row.insertCell(1);
    lvlCell.innerHTML = item.lvl;
  });
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