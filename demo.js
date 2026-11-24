"use strict";

const initialHp = 18;
const maxHp = 20;
const scratchDamage = 3;
const initialLog = "검문소 북문에 도착했다.";
const byId = (id) => document.getElementById(id);
const modeButtons = document.querySelectorAll("[data-mode]");
const sheetButtons = document.querySelectorAll("[data-tab]");
const playPanel = document.querySelector(".play-panel");
const boardZone = document.querySelector(".board-zone");
const boardFrame = byId("gameSystemFrame");
const storyInput = byId("narratorInput");
const exampleAction = storyInput.value;
const details = {
  scene: ["시간·장소", "19:40 · 검문소 북문"],
  note: ["유저 노트", "하연이 직접 선택한 행동만 진행한다. 상황에 맞는 과거 기억과 주변 물체를 활용한다."],
  memory: ["요약 메모리", "이전 턴에서 안내인이 “종을 세 번 울리면 보초가 샛문을 열어줘”라고 알려줬다."],
  ledger: ["인물·사건", "북문 보초 · 검문소를 지키는 인물. 세 번 울리는 종을 샛문 개방 신호로 알아듣는다."],
  quest: ["퀘스트", "이 예시 턴에서 추적 중인 퀘스트가 없습니다."],
  event: ["GM 이벤트", "검문소 통과 · 보초의 신호를 기억하면 북문의 샛문을 열 수 있다."],
};
const contextEntries = [
  ["캐릭터 상태", "하연 · 정찰병 · 턴 시작 시 체력 18 / 20, 스테미나 7 / 20"],
  ["탐험보드", "하연은 북문 앞 C4에 있다. 보초는 E4에 있고 E3에 신호용 종이 있다."],
  ["장소 설정", "오래된 북문에는 낮은 샛문이 있다. 안쪽으로 휜 쇠고리가 통로에 걸쳐 있다."],
  ["과거 기억", details.memory[1]],
];
const stats = [
  ["체력", 20, 0, -2, 18], ["스테미나", 20, 0, -13, 7],
  ["힘", 4, 0, 0, 4], ["건강", 4, 0, 0, 4], ["속도", 7, 0, 0, 7],
  ["정밀", 6, "+1", 0, 7], ["지능", 5, 0, 0, 5], ["지혜", 6, 0, 0, 6],
  ["매력", 5, 0, 0, 5], ["데미지", "x", "+3", 0, 3], ["데미지(보조)", "x", 0, 0, 0],
  ["방어력", "x", "+2", 0, 2],
];

let stage = 0;
let accepted = false;
let mode = "story";

function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function drawStaticSheet() {
  const table = byId("stat-table");
  const header = makeElement("div", "", "stat-row is-head");
  for (const [index, label] of ["능력치", "기본", "보너스", "상태", "결과"].entries()) {
    header.append(makeElement("span", label, index ? "number" : ""));
  }
  table.append(header);
  for (const [index, values] of stats.entries()) {
    const row = makeElement("div", "", "stat-row");
    for (const [column, value] of values.entries()) {
      const cell = makeElement("span", String(value), column ? "number" : "stat-name");
      if (index === 0 && column === 3) cell.id = "hp-stat-state";
      if (index === 0 && column === 4) cell.id = "hp-stat-result";
      row.append(cell);
    }
    table.append(row);
  }
  for (const slots of document.querySelectorAll("[data-party-slots]")) {
    for (const [index, name] of ["지우", "비어 있음", "비어 있음"].entries()) {
      const slot = makeElement("article", "", "party-slot");
      const block = makeElement("div", "", "slot-name");
      block.append(
        makeElement("span", "Slot " + (index + 1), "tiny-label"),
        makeElement("strong", name),
        makeElement("p", index === 0 ? "길잡이 · HP 20/20 · SP 14/20" : "동료를 추가할 수 있는 슬롯입니다.", "slot-meta")
      );
      slot.append(block);
      slots.append(slot);
    }
  }
}

function hpValue() {
  return accepted ? initialHp - scratchDamage : initialHp;
}

function setMode(next) {
  mode = next;
  for (const button of modeButtons) {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    playPanel.classList.toggle("is-" + button.dataset.mode + "-mode", active);
  }
  const hasBoard = mode === "explore" || mode === "combat";
  boardZone.classList.toggle("is-story-board", mode === "story");
  boardZone.classList.toggle("is-status-board", mode === "profile");
  boardZone.classList.toggle("is-explore-board", mode === "explore");
  boardZone.classList.toggle("is-combat-board", mode === "combat");
  byId("storyMainBoard").hidden = mode !== "story";
  byId("statusMainBoard").hidden = mode !== "profile";
  boardFrame.parentElement.hidden = !hasBoard;
  if (hasBoard) {
    const source = "./board.html?v=2&mode=" + mode + "&hp=" + hpValue();
    if (boardFrame.getAttribute("src") !== source) boardFrame.setAttribute("src", source);
  }
}

function setSheet(tab) {
  for (const button of sheetButtons) {
    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  for (const panel of document.querySelectorAll("[data-sheet]")) {
    panel.hidden = panel.dataset.sheet !== tab;
  }
}

function showInfo(title, entries) {
  byId("info-title").textContent = title;
  const body = byId("info-body");
  body.replaceChildren();
  for (const [heading, copy] of entries) {
    const card = makeElement("article", "", "detail-card");
    if (heading) card.append(makeElement("h3", heading));
    card.append(makeElement("p", copy));
    body.append(card);
  }
  byId("info-dialog").showModal();
}

function appendLog(text) {
  byId("logList").prepend(makeElement("p", text, "log-entry"));
}

function announce(text) {
  byId("announcement").textContent = text;
}

function render() {
  byId("player-message").hidden = stage < 1;
  byId("gm-message").hidden = stage < 2;
  byId("stateProposals").hidden = stage !== 2;
  byId("context-button").hidden = stage === 0;
  byId("show-reply").hidden = stage !== 1;
  byId("narratorSend").disabled = stage !== 0;
  byId("result").hidden = stage !== 3;
  byId("result").classList.toggle("is-rejected", stage === 3 && !accepted);
  const flowCopy = [
    "행동을 보내면 설정·도감과 현재 상태를 어떻게 참고하는지 볼 수 있습니다.",
    "현재 행동에 맞춰 참고 자료 4건을 골랐습니다.",
    "예시 응답이 도착했습니다. 상태 변경을 적용하거나 거절할 수 있습니다.",
    "예시 턴을 마쳤습니다. 위쪽 메뉴에서 전투보드와 상태창을 확인할 수 있습니다.",
  ];
  byId("flow-status").textContent = flowCopy[stage];
  const hp = hpValue();
  for (const value of document.querySelectorAll("[data-hp]")) value.textContent = hp + " / " + maxHp;
  byId("hero-health").style.setProperty("--meter", (hp / maxHp * 100) + "%");
  byId("damage-counter").value = maxHp - hp;
  byId("hp-stat-state").textContent = hp - maxHp;
  byId("hp-stat-result").textContent = hp;
  const messages = byId("narratorMessages");
  if (mode === "story") messages.scrollTop = messages.scrollHeight;
}

for (const button of modeButtons) button.addEventListener("click", () => setMode(button.dataset.mode));
for (const button of sheetButtons) button.addEventListener("click", () => setSheet(button.dataset.tab));
for (const button of document.querySelectorAll("[data-info]")) {
  button.addEventListener("click", () => {
    const [title, copy] = details[button.dataset.info];
    showInfo(title, [["", copy]]);
  });
}
byId("context-button").addEventListener("click", () => showInfo("이번 요청에 전달한 자료", contextEntries));

byId("profile-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const body = byId("profile-body");
  body.hidden = !body.hidden;
  button.setAttribute("aria-expanded", String(!body.hidden));
  button.textContent = body.hidden ? "펼치기" : "접기";
});

byId("narratorForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (stage !== 0) return;
  stage = 1;
  byId("player-action").textContent = exampleAction;
  appendLog("AI 요청용 자료 4건을 선택했다.");
  render();
  byId("context-button").focus();
  announce("참고 자료 4건을 골랐습니다. 이번 요청 자료에서 근거를 확인하세요.");
});

byId("show-reply").addEventListener("click", () => {
  if (stage !== 1) return;
  stage = 2;
  byId("gm-text").textContent = "종이 세 번 울리자 보초가 등불을 돌리고 빗장을 푼다. 열린 샛문으로 몸을 밀어 넣는 순간, 휘어진 쇠고리가 팔을 스친다. 하연은 문 안쪽 그늘에 이르러 소매 아래 번지는 피를 발견한다.";
  byId("proposal-text").textContent = "하연: HP −3 (18 → 15) · 쇠고리에 팔을 긁힘";
  appendLog("AI가 하연의 체력 감소를 제안했다.");
  render();
  byId("approve").focus();
  announce("하연의 HP를 18에서 15로 바꾸는 변경 제안이 대기 중입니다.");
});

function resolveProposal(apply) {
  if (stage !== 2) return;
  stage = 3;
  accepted = apply;
  const result = apply ? "변경 적용 · 하연의 HP 18 → 15" : "변경 거절 · 하연의 HP 18 유지";
  byId("result").textContent = result;
  appendLog(result);
  render();
  byId("context-button").focus();
  announce(result);
}

byId("approve").addEventListener("click", () => resolveProposal(true));
byId("reject").addEventListener("click", () => resolveProposal(false));

byId("reset").addEventListener("click", () => {
  stage = 0;
  accepted = false;
  byId("logList").replaceChildren(makeElement("p", initialLog, "log-entry"));
  setMode("story");
  setSheet("overview");
  render();
  storyInput.focus();
  announce("예시 턴을 초기화했습니다.");
});

drawStaticSheet();
render();
