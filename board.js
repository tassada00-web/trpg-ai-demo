"use strict";

const params = new URLSearchParams(location.search);
const byId = (id) => document.getElementById(id);

if (params.get("mode") === "combat") {
  renderCombat();
} else {
  renderExploration();
}

function renderExploration() {
  const board = byId("explorationBoard");
  const app = byId("explorationApp");
  const paths = [
    ".........", "..oofog..", "...oo....", "soooood..",
    "..o...o..", "..fooog..", ".........",
  ];
  const kinds = { s: "start", o: "normal", f: "fortune", d: "danger", g: "goal" };
  const direction = [[0, -1, "n"], [1, 0, "e"], [0, 1, "s"], [-1, 0, "w"]];
  board.style.setProperty("--explore-cols", paths[0].length);
  board.style.setProperty("--explore-rows", paths.length);
  paths.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const cell = document.createElement("div");
      cell.className = "explore-cell";
      if (!kinds[tile]) {
        cell.classList.add("wall");
      } else {
        cell.classList.add("path", kinds[tile]);
        for (const [dx, dy, side] of direction) {
          if (kinds[paths[y + dy]?.[x + dx]]) cell.classList.add("open-" + side);
        }
        if (x === 2 && y === 3) {
          cell.classList.add("current");
          const pawn = document.createElement("div");
          pawn.className = "explore-pawn";
          cell.append(pawn);
        } else if (tile === "s" || tile === "g") {
          const label = document.createElement("span");
          label.className = "explore-label";
          label.textContent = tile.toUpperCase();
          cell.append(label);
        }
      }
      board.append(cell);
    });
  });
  byId("toggle-fog").addEventListener("click", (event) => {
    const on = board.classList.toggle("fog-on");
    event.currentTarget.setAttribute("aria-pressed", String(on));
    event.currentTarget.textContent = on ? "전체 안개 끄기" : "전체 안개 켜기";
  });
  app.hidden = false;
}

function renderCombat() {
  const board = byId("board");
  const hp = params.get("hp") === "15" ? 15 : 18;
  const units = [
    { id: "hayeon", name: "하연", label: "연", type: "player", col: 2, row: 3, status: "HP " + hp + " / 20 · SP 7 / 20" },
    { id: "guard", name: "보초", label: "초", type: "enemy", col: 4, row: 3, status: "HP 20 / 20 · SP 20 / 20" },
  ];
  function selectUnit(unit) {
    for (const piece of board.querySelectorAll(".piece")) {
      piece.classList.toggle("selected", piece.dataset.id === unit.id);
    }
    for (const candidate of units) {
      byId("pick-" + candidate.id).setAttribute("aria-pressed", String(candidate.id === unit.id));
    }
    byId("battleLog").textContent = unit.name + " · " + unit.status;
  }
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      const unit = units.find((candidate) => candidate.row === row && candidate.col === col);
      if (unit) {
        const token = document.createElement("button");
        token.type = "button";
        token.className = "piece " + unit.type;
        token.dataset.id = unit.id;
        token.textContent = unit.label;
        token.title = unit.name + " · " + unit.status;
        token.setAttribute("aria-label", token.title);
        token.addEventListener("click", () => selectUnit(unit));
        byId("pick-" + unit.id).addEventListener("click", () => selectUnit(unit));
        cell.append(token);
      }
      board.append(cell);
    }
  }
  selectUnit(units[0]);
  byId("battleApp").hidden = false;
}
