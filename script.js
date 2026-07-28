const ACCENTS = ["#1D4ED8", "#0B2A6B", "#0EA5E9", "#2C5282", "#3B82F6"];

const DEFAULT_CANDIDATES = [
  { id: "c1", name: "Aria Chen", slogan: "Every voice, one council.", bio: "Grade 11 · Debate Club captain, 2 years on the events committee.", accent: ACCENTS[0] },
  { id: "c2", name: "Marcus Webb", slogan: "Built on trust, driven by action.", bio: "Grade 12 · Current treasurer, founded the peer-tutoring program.", accent: ACCENTS[1] },
  { id: "c3", name: "Priya Patel", slogan: "Small steps. Big change.", bio: "Grade 11 · Sustainability club lead, organized 3 campus drives.", accent: ACCENTS[2] },
];

const DEFAULT_VOTERS = {
  STU2026001: { password: "pass123", hasVoted: false },
  STU2026002: { password: "pass123", hasVoted: false },
  STU2026003: { password: "pass123", hasVoted: false },
};

let candidates = [];
let voters = {};
let currentVoter = null;
let selectedCandidateId = null;

/* ---------- storage helpers (localStorage) ---------- */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) throw new Error("missing");
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- utilities ---------- */
function initials(name) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  updateSteps(id);
}

function updateSteps(screenId) {
  const map = {
    "screen-login": "login",
    "screen-voting": "voting",
    "screen-confirm": "confirm",
    "screen-confirmed": "done",
    "screen-already-voted": "done",
  };
  const order = ["login", "voting", "confirm", "done"];
  const current = map[screenId] || "login";
  const currentIdx = order.indexOf(current);

  document.querySelectorAll(".step").forEach(el => {
    const step = el.dataset.step;
    const idx = order.indexOf(step);
    el.classList.remove("active", "completed");
    if (idx < currentIdx) el.classList.add("completed");
    else if (idx === currentIdx) el.classList.add("active");
  });
}

function showError(elId, textElId, message) {
  const el = document.getElementById(elId);
  el.classList.remove("hidden");
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
  document.getElementById(textElId).textContent = message;
}
function hideError(elId) {
  document.getElementById(elId).classList.add("hidden");
}

/* ---------- ripple effect for buttons ---------- */
function attachRipple(el) {
  el.addEventListener("click", (e) => {
    if (el.disabled) return;
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
}
document.querySelectorAll(".btn-primary, .btn-ghost").forEach(attachRipple);

/* ---------- drifting background dots ---------- */
function spawnDots() {
  const field = document.getElementById("bgField");
  const count = 22;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("div");
    dot.className = "bg-dot";
    const left = Math.random() * 100;
    const duration = 14 + Math.random() * 16;
    const delay = Math.random() * -duration;
    const size = 2 + Math.random() * 3;
    dot.style.left = left + "vw";
    dot.style.bottom = "-10px";
    dot.style.width = dot.style.height = size + "px";
    dot.style.animationDuration = duration + "s";
    dot.style.animationDelay = delay + "s";
    field.appendChild(dot);
  }
}

/* ---------- data load ---------- */
function loadData() {
  candidates = loadJSON("sc_candidates", DEFAULT_CANDIDATES);
  voters = loadJSON("sc_voters", DEFAULT_VOTERS);
  loadJSON("sc_votes", {});

  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("ballotCard").classList.add("active");
}

/* ---------- candidates ---------- */
function renderCandidates() {
  const list = document.getElementById("candidateList");
  list.innerHTML = "";
  candidates.forEach(c => {
    const line = document.createElement("div");
    line.className = "ballot-line";
    line.dataset.id = c.id;
    line.innerHTML = `
      <div class="ballot-line-main">
        <div class="oval"><div class="oval-fill"></div></div>
        <div class="avatar" style="background:${c.accent};">${initials(c.name)}</div>
        <div>
          <div class="cand-name">${c.name}</div>
          <div class="cand-slogan">${c.slogan}</div>
        </div>
        <button class="expand-btn" type="button" aria-label="More about ${c.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      <div class="cand-bio">${c.bio || "No bio provided yet."}</div>
    `;
    line.querySelector(".ballot-line-main").addEventListener("click", (e) => {
      if (e.target.closest(".expand-btn")) return;
      selectCandidate(c.id);
    });
    line.querySelector(".expand-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const bio = line.querySelector(".cand-bio");
      btn.classList.toggle("open");
      bio.classList.toggle("open");
    });
    list.appendChild(line);
  });
}

function selectCandidate(id) {
  selectedCandidateId = id;
  document.querySelectorAll(".ballot-line").forEach(el => {
    el.classList.toggle("selected", el.dataset.id === id);
  });
  document.getElementById("castVoteBtn").disabled = false;
}

/* ---------- ink burst on confirm ---------- */
function fireInkBurst() {
  const burst = document.getElementById("inkBurst");
  burst.innerHTML = "";
  const n = 10;
  for (let i = 0; i < n; i++) {
    const dot = document.createElement("span");
    const angle = (Math.PI * 2 * i) / n;
    const dist = 60 + Math.random() * 30;
    dot.style.setProperty("--bx", Math.cos(angle) * dist + "px");
    dot.style.setProperty("--by", Math.sin(angle) * dist + "px");
    dot.style.animationDelay = (Math.random() * 0.1) + "s";
    burst.appendChild(dot);
  }
}

/* ---------- reset ---------- */
function resetKiosk() {
  document.getElementById("idInput").value = "";
  document.getElementById("pwInput").value = "";
  hideError("loginError");
  currentVoter = null;
  selectedCandidateId = null;
  showScreen("screen-login");
  loadData();
}

/* ---------- events ---------- */
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("idInput").value.trim().toUpperCase();
  const pw = document.getElementById("pwInput").value;
  const record = voters[id];

  if (!record) {
    showError("loginError", "loginErrorText", "ID card not recognized. Check the number and try again.");
    return;
  }
  if (record.password !== pw) {
    showError("loginError", "loginErrorText", "Incorrect password.");
    return;
  }
  hideError("loginError");
  currentVoter = id;

  if (record.hasVoted) {
    document.getElementById("alreadyVotedId").textContent = id;
    showScreen("screen-already-voted");
  } else {
    selectedCandidateId = null;
    document.getElementById("voterIdLabel").textContent = id;
    document.getElementById("castVoteBtn").disabled = true;
    renderCandidates();
    showScreen("screen-voting");
  }
});

document.getElementById("togglePw").addEventListener("click", () => {
  const pw = document.getElementById("pwInput");
  const btn = document.getElementById("togglePw");
  const isHidden = pw.type === "password";
  pw.type = isHidden ? "text" : "password";
  btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

document.getElementById("castVoteBtn").addEventListener("click", () => {
  if (!selectedCandidateId) return;
  const cand = candidates.find(c => c.id === selectedCandidateId);
  document.getElementById("confirmName").textContent = cand.name;
  showScreen("screen-confirm");
});

document.getElementById("backToVoting").addEventListener("click", () => {
  showScreen("screen-voting");
});

document.getElementById("confirmVoteBtn").addEventListener("click", () => {
  const btn = document.getElementById("confirmVoteBtn");
  btn.disabled = true;
  btn.textContent = "Recording…";

  setTimeout(() => {
    const votes = loadJSON("sc_votes", {});
    votes[selectedCandidateId] = (votes[selectedCandidateId] || 0) + 1;
    saveJSON("sc_votes", votes);

    voters[currentVoter] = { ...voters[currentVoter], hasVoted: true };
    saveJSON("sc_voters", voters);

    document.getElementById("confirmedVoterId").textContent = currentVoter;
    showScreen("screen-confirmed");
    fireInkBurst();

    btn.disabled = false;
    btn.textContent = "Confirm My Vote";
  }, 450); // brief pause so "Recording…" state is visible
});

document.getElementById("doneBtn").addEventListener("click", resetKiosk);
document.getElementById("backToLoginBtn").addEventListener("click", resetKiosk);

/* ---------- admin modal ---------- */
const adminModal = document.getElementById("adminModal");
document.getElementById("openAdmin").addEventListener("click", () => adminModal.classList.add("active"));
document.getElementById("closeAdmin").addEventListener("click", () => adminModal.classList.remove("active"));
adminModal.addEventListener("click", (e) => {
  if (e.target === adminModal) adminModal.classList.remove("active");
});

const newCandName = document.getElementById("newCandName");
const addCandidateBtn = document.getElementById("addCandidateBtn");
newCandName.addEventListener("input", () => {
  addCandidateBtn.disabled = !newCandName.value.trim();
});

addCandidateBtn.addEventListener("click", () => {
  const name = newCandName.value.trim();
  if (!name) return;
  const slogan = document.getElementById("newCandSlogan").value.trim() || "Running for Student Council President";
  const bio = document.getElementById("newCandBio").value.trim();
  const accent = ACCENTS[candidates.length % ACCENTS.length];
  candidates.push({ id: "c" + Date.now(), name, slogan, bio, accent });
  saveJSON("sc_candidates", candidates);

  newCandName.value = "";
  document.getElementById("newCandSlogan").value = "";
  document.getElementById("newCandBio").value = "";
  addCandidateBtn.disabled = true;
  adminModal.classList.remove("active");
});

/* ---------- init ---------- */
spawnDots();
loadData();
