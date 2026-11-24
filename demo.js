"use strict";

const initialHp = 18;
const damage = 3;
const maxHp = 20;
const initialLog = "검문소 북문에 도착했다.";
const byId = (id) => document.getElementById(id);
const viewButtons = document.querySelectorAll("[data-view]");
const steps = document.querySelectorAll("[data-step]");
const hpValues = document.querySelectorAll("[data-hp]");

let stage = 0;
let decision = "";

byId("player-message").querySelector("[data-action-text]").textContent =
  byId("sample-action").querySelector("[data-action-text]").textContent;

for (const button of viewButtons) {
  button.addEventListener("click", () => setView(button.dataset.view));
}

function setView(view) {
  for (const button of viewButtons) {
    const selected = button.dataset.view === view;
    button.setAttribute("aria-pressed", String(selected));
    byId(button.dataset.view).hidden = !selected;
  }
}

function render() {
  byId("reset").disabled = stage === 0;
  byId("input-area").hidden = stage !== 0;
  byId("request-area").hidden = stage !== 1;
  byId("player-message").hidden = stage < 1;
  byId("gm-message").hidden = stage < 2;
  byId("proposal").hidden = stage < 2;
  byId("proposal-actions").hidden = stage === 3;
  byId("context-empty").hidden = stage >= 1;
  byId("context-data").hidden = stage < 1;

  steps.forEach((step, index) => {
    const complete = index < stage || (index === 3 && decision !== "");
    step.classList.toggle("is-done", complete);
    if (index === stage && !complete) {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  });

  const hp = decision === "approved" ? initialHp - damage : initialHp;
  const hpText = `${hp} / ${maxHp}`;
  for (const value of hpValues) value.textContent = hpText;
  const meter = byId("hp-meter");
  meter.value = hp;
  meter.textContent = hpText;

  const proposal = byId("proposal");
  if (decision) {
    proposal.dataset.decision = decision;
    byId("proposal-label").textContent = decision === "approved" ? "상태 변경 적용" : "상태 변경 거절";
    byId("proposal-note").textContent = decision === "approved"
      ? "상태창과 전투보드에 HP 15 / 20이 표시됩니다."
      : "현재 HP 18 / 20을 유지합니다.";
  } else {
    delete proposal.dataset.decision;
    byId("proposal-label").textContent = "상태 변경 제안 · 승인 대기";
    byId("proposal-note").textContent = "쇠고리에 긁혀 HP 3 감소";
  }
}

function appendLog(text) {
  const row = document.createElement("li");
  row.textContent = text;
  byId("log").append(row);
}

function announce(text) {
  byId("announcement").textContent = text;
}

byId("submit-action").addEventListener("click", () => {
  if (stage !== 0) return;
  stage = 1;
  appendLog("AI 요청용 자료 4건을 선택했다.");
  render();
  byId("show-reply").focus();
  announce("예시 행동을 보냈습니다. AI 처리 흐름에서 선택한 자료 4건을 확인하세요.");
});

byId("show-reply").addEventListener("click", () => {
  if (stage !== 1) return;
  stage = 2;
  appendLog("AI가 하연의 HP 3 감소를 제안했다.");
  render();
  byId("approve").focus();
  announce("예시 서술이 도착했습니다. 하연의 HP를 18에서 15로 변경하는 제안이 승인 대기 중입니다.");
});

function resolveProposal(result) {
  if (stage !== 2) return;
  stage = 3;
  decision = result;
  const message = result === "approved" ? "승인했다. 하연의 HP가 15가 되었다." : "거절했다. 하연의 HP는 18이다.";
  appendLog(message);
  render();
  byId("reset").focus({ preventScroll: true });
  announce(message);
}

byId("approve").addEventListener("click", () => resolveProposal("approved"));
byId("reject").addEventListener("click", () => resolveProposal("rejected"));

byId("reset").addEventListener("click", () => {
  stage = 0;
  decision = "";
  byId("log").replaceChildren();
  appendLog(initialLog);
  byId("context-data").querySelectorAll("details").forEach((detail, index) => {
    detail.open = index < 2;
  });
  setView("story");
  render();
  byId("submit-action").focus();
  announce("예시 턴을 초기화했습니다.");
});

for (const board of document.querySelectorAll("[data-board]")) {
  const explore = board.dataset.board === "explore";
  for (let row = 1; row <= 6; row += 1) {
    for (let column = 1; column <= 8; column += 1) {
      const cell = document.createElement("span");
      cell.className = "board-cell";
      if (explore && column === 5) cell.dataset.terrain = row === 4 ? "gate" : "wall";
      if (row === 4 && column === 3) {
        cell.innerHTML = '<span class="board-token">연</span>';
      } else if (explore && row === 4 && column === 5) {
        cell.innerHTML = '<span class="board-token guard">초</span>';
      } else if (explore && row === 3 && column === 5) {
        cell.innerHTML = '<span class="board-token signal">종</span>';
      }
      board.append(cell);
    }
  }
}
