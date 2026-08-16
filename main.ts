type Occupant = "goat" | "car";
type Phase = "pick" | "decide" | "result";

type StatBucket = { wins: number; total: number };

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el as T;
}

const doorEls = [getEl<HTMLButtonElement>("door-0"), getEl<HTMLButtonElement>("door-1"), getEl<HTMLButtonElement>("door-2")];
const messageEl = getEl<HTMLParagraphElement>("message");
const decisionActions = getEl<HTMLDivElement>("decision-actions");
const resultActions = getEl<HTMLDivElement>("result-actions");
const stayBtn = getEl<HTMLButtonElement>("stay-btn");
const switchBtn = getEl<HTMLButtonElement>("switch-btn");
const playAgainBtn = getEl<HTMLButtonElement>("play-again-btn");
const simulateBtn = getEl<HTMLButtonElement>("simulate-btn");
const switchValueEl = getEl<HTMLSpanElement>("switch-value");
const stayValueEl = getEl<HTMLSpanElement>("stay-value");
const switchFillEl = getEl<HTMLDivElement>("switch-fill");
const stayFillEl = getEl<HTMLDivElement>("stay-fill");

const stats = {
  switch: { wins: 0, total: 0 } as StatBucket,
  stay: { wins: 0, total: 0 } as StatBucket,
};

let doors: Occupant[] = [];
let picked: number | null = null;
let hostReveal: number | null = null;
let phase: Phase = "pick";

function shuffledDoors(): Occupant[] {
  const arr: Occupant[] = ["goat", "goat", "car"];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function otherIndices(...exclude: number[]): number[] {
  return [0, 1, 2].filter((d) => !exclude.includes(d));
}

function newRound(): void {
  doors = shuffledDoors();
  picked = null;
  hostReveal = null;
  phase = "pick";
  render();
}

function pickDoor(index: number): void {
  if (phase !== "pick") return;
  picked = index;
  const goatOptions = otherIndices(picked).filter((d) => doors[d] !== "car");
  hostReveal = goatOptions[Math.floor(Math.random() * goatOptions.length)]!;
  phase = "decide";
  render();
}

function decide(switched: boolean): void {
  if (phase !== "decide" || picked === null || hostReveal === null) return;
  const finalPick = switched ? otherIndices(picked, hostReveal)[0]! : picked;
  const win = doors[finalPick] === "car";
  recordResult(switched, win);
  phase = "result";
  render(finalPick, win, switched);
}

function recordResult(switched: boolean, win: boolean): void {
  const bucket = switched ? stats.switch : stats.stay;
  bucket.total += 1;
  if (win) bucket.wins += 1;
  updateStatsDisplay();
}

function formatStat(bucket: StatBucket): string {
  if (bucket.total === 0) return "0 / 0 — –";
  const pct = ((bucket.wins / bucket.total) * 100).toFixed(1);
  return `${bucket.wins} / ${bucket.total} — ${pct}%`;
}

function updateStatsDisplay(): void {
  switchValueEl.textContent = formatStat(stats.switch);
  stayValueEl.textContent = formatStat(stats.stay);
  switchFillEl.style.width = stats.switch.total === 0 ? "0%" : `${(stats.switch.wins / stats.switch.total) * 100}%`;
  stayFillEl.style.width = stats.stay.total === 0 ? "0%" : `${(stats.stay.wins / stats.stay.total) * 100}%`;
}

function render(finalPick?: number, win?: boolean, switched?: boolean): void {
  doorEls.forEach((el, i) => {
    const face = el.querySelector<HTMLSpanElement>(".door-face")!;
    el.classList.remove("is-picked", "is-host-revealed", "is-final-car", "is-final-goat");
    el.disabled = phase !== "pick";
    face.textContent = "🚪";

    if (phase === "decide") {
      if (i === picked) el.classList.add("is-picked");
      if (i === hostReveal) {
        el.classList.add("is-host-revealed");
        face.textContent = "🐐";
      }
    }

    if (phase === "result") {
      el.classList.add(doors[i] === "car" ? "is-final-car" : "is-final-goat");
      face.textContent = doors[i] === "car" ? "🚗" : "🐐";
    }
  });

  decisionActions.hidden = phase !== "decide";
  resultActions.hidden = phase !== "result";

  if (phase === "pick") {
    messageEl.textContent = "Pick a door to begin.";
  } else if (phase === "decide" && picked !== null && hostReveal !== null) {
    const other = otherIndices(picked, hostReveal)[0]!;
    messageEl.textContent = `Door ${hostReveal + 1} had a goat. Stay with Door ${picked + 1}, or switch to Door ${other + 1}?`;
    stayBtn.textContent = `Stay with Door ${picked + 1}`;
    switchBtn.textContent = `Switch to Door ${other + 1}`;
  } else if (phase === "result" && finalPick !== undefined) {
    messageEl.textContent = `You ${switched ? "switched" : "stayed"} and ${win ? "won" : "lost"}! The car was behind Door ${finalPick + 1}.`;
  }
}

function simulateRounds(count: number): void {
  for (let i = 0; i < count; i++) {
    const trialDoors = shuffledDoors();
    const trialPick = Math.floor(Math.random() * 3);
    const goatOptions = otherIndices(trialPick).filter((d) => trialDoors[d] !== "car");
    const trialHostReveal = goatOptions[Math.floor(Math.random() * goatOptions.length)]!;
    const switchPick = otherIndices(trialPick, trialHostReveal)[0]!;

    stats.stay.total += 1;
    if (trialDoors[trialPick] === "car") stats.stay.wins += 1;

    stats.switch.total += 1;
    if (trialDoors[switchPick] === "car") stats.switch.wins += 1;
  }
  updateStatsDisplay();
  messageEl.textContent = `Simulated ${count} rounds for each strategy.`;
}

doorEls.forEach((el) => {
  el.addEventListener("click", () => pickDoor(Number(el.dataset.index)));
});
stayBtn.addEventListener("click", () => decide(false));
switchBtn.addEventListener("click", () => decide(true));
playAgainBtn.addEventListener("click", newRound);
simulateBtn.addEventListener("click", () => simulateRounds(100));

updateStatsDisplay();
newRound();
