// IARE — приложение для сотрудников (администраторы и мастера). Шаг 1:
// вход по нику и паролю, роли, три языка, выбор точки, управление сотрудниками.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, getDocs, setDoc, updateDoc, collection, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig, STAFF_EMAIL_DOMAIN, APP_VERSION } from "../shared/firebase-config.js";
import { t, getLang, setLang, LANG_LIST, localized } from "../shared/i18n.js";

// ---------- Firebase ----------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Локальная копия базы на телефоне: быстрый старт и работа при плохом интернете.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  db = initializeFirestore(app, {});
}

// Второй экземпляр нужен, чтобы главный администратор создавал сотрудников,
// не выходя из своего аккаунта.
let secondaryApp = null;
function getSecondaryAuth() {
  if (!secondaryApp) secondaryApp = initializeApp(firebaseConfig, "secondary");
  return getAuth(secondaryApp);
}

// ---------- Состояние и помощники ----------

const state = {
  profile: null,      // { uid, nick, name, role, branch, active }
  branches: [],       // [{ id: "S", name: { ru, en, ka }, closeTime, order }]
  branch: null,       // буква текущей точки
  render: null,       // текущий экран — перерисовывается при смене языка
  pendingError: ""    // сообщение для экрана входа после выхода
};

const DEFAULT_BRANCHES = [
  { id: "S", name: { ru: "Основная", en: "Main", ka: "მთავარი" }, closeTime: "19:00", order: 1 },
  { id: "V", name: { ru: "Филиал", en: "Branch", ka: "ფილიალი" }, closeTime: "19:00", order: 2 }
];

const NICK_RE = /^[a-z0-9._-]{3,20}$/;
const $app = document.getElementById("app");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const nickToEmail = (nick) => `${nick.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;

function show(renderFn) {
  state.render = renderFn;
  document.title = `${t("appTitle")} — ${t("staff_app")}`;
  renderFn();
  updateOnline();
}

function rerender() {
  if (state.render) show(state.render);
}

function langBar() {
  return `<div class="langs">${LANG_LIST.map((l) =>
    `<button class="chip ${l === getLang() ? "on" : ""}" data-lang="${l}">${l.toUpperCase()}</button>`
  ).join("")}</div>`;
}

function bindLang() {
  $app.querySelectorAll("[data-lang]").forEach((b) => {
    b.onclick = () => { setLang(b.dataset.lang); rerender(); };
  });
}

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("show"), 10);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

function errText(err) {
  const c = (err && err.code) || "";
  if (c === "auth/network-request-failed" || c === "unavailable") return t("err_network");
  if (c === "auth/too-many-requests") return t("err_toomany");
  if (c === "auth/email-already-in-use") return t("err_exists");
  if ([
    "auth/invalid-credential", "auth/invalid-login-credentials", "auth/wrong-password",
    "auth/user-not-found", "auth/invalid-email"
  ].includes(c)) return t("err_login");
  return t("err_generic", { msg: c || (err && err.message) || String(err) });
}

function updateOnline() {
  document.body.classList.toggle("offline", !navigator.onLine);
  const bar = document.getElementById("offline");
  if (bar) bar.textContent = t("offline");
}
window.addEventListener("online", updateOnline);
window.addEventListener("offline", updateOnline);

// ---------- Вход и выход ----------

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    state.profile = null;
    const msg = state.pendingError;
    state.pendingError = "";
    renderLogin(msg);
    return;
  }

  renderLoading();
  try {
    const snap = await getDoc(doc(db, "staff", user.uid));
    if (!snap.exists() || snap.data().active !== true) {
      return logoutWithError(t("err_noprofile"));
    }
    state.profile = { uid: user.uid, ...snap.data() };
    await loadBranches();
    pickBranchOrHome();
  } catch (err) {
    console.error(err);
    if (err && err.code === "permission-denied") return logoutWithError(t("err_noprofile"));
    renderFatal(errText(err));
  }
});

async function logoutWithError(msg) {
  state.pendingError = msg;
  await signOut(auth);
}

async function onLogin(e) {
  e.preventDefault();
  const nick = document.getElementById("nick").value.trim().toLowerCase();
  const pass = document.getElementById("pass").value;
  const errEl = document.getElementById("err");
  const btn = document.getElementById("loginBtn");

  if (!nick || !pass) { errEl.textContent = t("err_fill"); return; }
  if (!NICK_RE.test(nick)) { errEl.textContent = t("err_login"); return; }

  btn.disabled = true;
  errEl.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, nickToEmail(nick), pass);
    // дальше работает onAuthStateChanged
  } catch (err) {
    btn.disabled = false;
    errEl.textContent = errText(err);
  }
}

function doLogout() {
  signOut(auth);
}

// ---------- Точки ----------

async function loadBranches() {
  const snap = await getDocs(collection(db, "branches"));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // При первом входе главного администратора создаём точки S и V.
  if (list.length === 0 && state.profile.role === "chief") {
    const batch = writeBatch(db);
    DEFAULT_BRANCHES.forEach((b) => {
      batch.set(doc(db, "branches", b.id), {
        name: b.name, closeTime: b.closeTime, order: b.order, createdAt: serverTimestamp()
      });
    });
    await batch.commit();
    list = DEFAULT_BRANCHES.map((b) => ({ ...b }));
  }

  list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  state.branches = list;
}

function pickBranchOrHome() {
  const p = state.profile;

  // Мастер всегда работает на своей точке из профиля.
  if (p.role === "master") {
    state.branch = p.branch;
    return renderHome();
  }

  // Администратор выбирает точку один раз — телефон её запоминает.
  let saved = null;
  try { saved = localStorage.getItem("iare_branch"); } catch (e) { /* нет хранилища */ }
  if (saved && state.branches.some((b) => b.id === saved)) {
    state.branch = saved;
    return renderHome();
  }
  renderBranchPick();
}

// ---------- Экраны ----------

function renderLoading() {
  state.render = null;
  $app.innerHTML = `
    <div class="center">
      <div class="logo">${esc(t("appTitle"))}</div>
      <p class="muted" style="text-align:center">${esc(t("loading"))}</p>
    </div>`;
}

function renderFatal(msg) {
  show(() => {
    $app.innerHTML = `
      <div class="center">
        ${langBar()}
        <div class="logo">${esc(t("appTitle"))}</div>
        <p class="error" style="text-align:center">${esc(msg)}</p>
        <button class="btn primary" id="retry">${esc(t("retry"))}</button>
        <button class="btn ghost" id="logout">${esc(t("logout"))}</button>
      </div>`;
    bindLang();
    document.getElementById("retry").onclick = () => location.reload();
    document.getElementById("logout").onclick = doLogout;
  });
}

function renderLogin(err = "") {
  show(() => {
    $app.innerHTML = `
      <div class="center">
        ${langBar()}
        <div class="logo">${esc(t("appTitle"))}</div>
        <h1>${esc(t("login_title"))}</h1>
        <form id="loginForm" class="card form" autocomplete="on" novalidate>
          <label>${esc(t("nick"))}
            <input id="nick" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false">
          </label>
          <label>${esc(t("password"))}
            <input id="pass" type="password" autocomplete="current-password">
          </label>
          <p class="error" id="err">${esc(err)}</p>
          <button class="btn primary" id="loginBtn" type="submit">${esc(t("login_btn"))}</button>
        </form>
        <p class="muted small" style="text-align:center">${esc(t("version"))} ${APP_VERSION}</p>
      </div>`;
    bindLang();
    document.getElementById("loginForm").onsubmit = onLogin;
  });
}

function renderBranchPick() {
  show(() => {
    $app.innerHTML = `
      <div class="center">
        ${langBar()}
        <h1>${esc(t("choose_branch"))}</h1>
        <div class="list">
          ${state.branches.map((b) => `
            <button class="btn big" data-branch="${esc(b.id)}">
              <span class="letter">${esc(b.id)}</span> ${esc(localized(b.name))}
            </button>`).join("")}
        </div>
        ${state.branches.length === 0 ? `<p class="error">${esc(t("err_nobranches"))}</p>` : ""}
        <button class="btn ghost" id="logout">${esc(t("logout"))}</button>
      </div>`;
    bindLang();
    $app.querySelectorAll("[data-branch]").forEach((b) => {
      b.onclick = () => {
        state.branch = b.dataset.branch;
        try { localStorage.setItem("iare_branch", state.branch); } catch (e) { /* не критично */ }
        renderHome();
      };
    });
    document.getElementById("logout").onclick = doLogout;
  });
}

function menuFor(role) {
  const admin = [
    { id: "new", label: "menu_new_order" },
    { id: "orders", label: "menu_orders" },
    { id: "settings", label: "menu_settings" }
  ];
  if (role === "chief") {
    return [...admin, { id: "staff", label: "menu_staff", ready: true }, { id: "money", label: "menu_money" }];
  }
  if (role === "admin") return admin;
  return [{ id: "ready", label: "menu_ready" }, { id: "earnings", label: "menu_earnings" }];
}

function go(id) {
  if (id === "staff") return renderStaff();
  toast(t("soon"));
}

function renderHome() {
  show(() => {
    const p = state.profile;
    const br = state.branches.find((b) => b.id === state.branch);
    const items = menuFor(p.role);

    $app.innerHTML = `
      <header class="top">
        <div class="logo sm">${esc(t("appTitle"))}</div>
        ${langBar()}
      </header>

      <section class="card me">
        <div class="me-name">${esc(t("hello", { name: p.name || p.nick }))}</div>
        <div class="muted">@${esc(p.nick)} · ${esc(t("role_" + p.role))}</div>
        <div class="branch-tag">
          <span class="letter">${esc(state.branch || "—")}</span> ${esc(br ? localized(br.name) : "")}
        </div>
      </section>

      <nav class="grid">
        ${items.map((i) => `
          <button class="tile ${i.ready ? "" : "soon"}" data-go="${i.id}">
            <span class="tile-title">${esc(t(i.label))}</span>
            ${i.ready ? "" : `<span class="tile-sub">${esc(t("soon"))}</span>`}
          </button>`).join("")}
      </nav>

      <footer class="bottom">
        ${p.role !== "master" ? `<button class="btn ghost" id="chBranch">${esc(t("change_branch"))}</button>` : ""}
        <button class="btn ghost" id="logout">${esc(t("logout"))}</button>
        <p class="muted small">${esc(t("version"))} ${APP_VERSION}</p>
      </footer>`;

    bindLang();
    $app.querySelectorAll("[data-go]").forEach((b) => { b.onclick = () => go(b.dataset.go); });
    const ch = document.getElementById("chBranch");
    if (ch) ch.onclick = renderBranchPick;
    document.getElementById("logout").onclick = doLogout;
  });
}

// ---------- Сотрудники (только главный администратор) ----------

async function renderStaff() {
  if (state.profile.role !== "chief") return renderHome();
  renderLoading();

  let list = [];
  try {
    const snap = await getDocs(collection(db, "staff"));
    list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  } catch (err) {
    return renderFatal(errText(err));
  }

  const order = { chief: 0, admin: 1, master: 2 };
  list.sort((a, b) =>
    (order[a.role] ?? 9) - (order[b.role] ?? 9) || String(a.nick).localeCompare(String(b.nick)));

  show(() => {
    $app.innerHTML = `
      <header class="top">
        <button class="btn ghost back" id="back" aria-label="back">←</button>
        <h1 class="h">${esc(t("menu_staff"))}</h1>
        ${langBar()}
      </header>

      <button class="btn primary wide" id="add">+ ${esc(t("staff_add"))}</button>

      <div class="list">
        ${list.map((s) => `
          <div class="card row ${s.active ? "" : "off"}">
            <div>
              <div class="me-name">${esc(s.name || s.nick)}</div>
              <div class="muted">@${esc(s.nick)} · ${esc(t("role_" + s.role))} · ${esc(s.branch || "")}</div>
              <div class="small ${s.active ? "ok" : "error"}">${esc(t(s.active ? "active" : "disabled"))}</div>
            </div>
            ${s.uid !== state.profile.uid ? `
              <button class="btn ghost" data-toggle="${esc(s.uid)}" data-active="${s.active ? 1 : 0}">
                ${esc(t(s.active ? "disable" : "enable"))}
              </button>` : ""}
          </div>`).join("")}
      </div>`;

    bindLang();
    document.getElementById("back").onclick = renderHome;
    document.getElementById("add").onclick = renderStaffForm;
    $app.querySelectorAll("[data-toggle]").forEach((b) => {
      b.onclick = async () => {
        b.disabled = true;
        try {
          await updateDoc(doc(db, "staff", b.dataset.toggle), {
            active: b.dataset.active !== "1",
            updatedAt: serverTimestamp(),
            updatedBy: state.profile.uid
          });
          renderStaff();
        } catch (err) {
          b.disabled = false;
          toast(errText(err));
        }
      };
    });
  });
}

function renderStaffForm() {
  show(() => {
    $app.innerHTML = `
      <header class="top">
        <button class="btn ghost back" id="back" aria-label="back">←</button>
        <h1 class="h">${esc(t("staff_add"))}</h1>
        ${langBar()}
      </header>

      <form id="staffForm" class="card form" novalidate>
        <label>${esc(t("name"))}
          <input id="fName" maxlength="40">
        </label>
        <label>${esc(t("nick"))}
          <input id="fNick" maxlength="20" autocapitalize="none" autocorrect="off" spellcheck="false">
          <span class="hint">${esc(t("nick_hint"))}</span>
        </label>
        <label>${esc(t("password"))}
          <input id="fPass" type="text" autocomplete="new-password">
          <span class="hint">${esc(t("pass_hint"))}</span>
        </label>
        <label>${esc(t("role"))}
          <select id="fRole">
            <option value="admin">${esc(t("role_admin"))}</option>
            <option value="master">${esc(t("role_master"))}</option>
          </select>
        </label>
        <label>${esc(t("branch"))}
          <select id="fBranch">
            ${state.branches.map((b) =>
              `<option value="${esc(b.id)}">${esc(b.id)} — ${esc(localized(b.name))}</option>`).join("")}
          </select>
        </label>
        <p class="error" id="err"></p>
        <div class="actions">
          <button type="button" class="btn ghost" id="cancel">${esc(t("cancel"))}</button>
          <button type="submit" class="btn primary" id="saveBtn">${esc(t("save"))}</button>
        </div>
      </form>`;

    bindLang();
    document.getElementById("back").onclick = renderStaff;
    document.getElementById("cancel").onclick = renderStaff;
    document.getElementById("staffForm").onsubmit = onStaffSave;
  });
}

async function onStaffSave(e) {
  e.preventDefault();
  const name = document.getElementById("fName").value.trim();
  const nick = document.getElementById("fNick").value.trim().toLowerCase();
  const pass = document.getElementById("fPass").value;
  const role = document.getElementById("fRole").value;
  const branch = document.getElementById("fBranch").value;
  const errEl = document.getElementById("err");
  const btn = document.getElementById("saveBtn");

  if (!name) { errEl.textContent = t("err_name"); return; }
  if (!NICK_RE.test(nick)) { errEl.textContent = t("err_nick"); return; }
  if (pass.length < 6) { errEl.textContent = t("err_pass"); return; }
  if (!["admin", "master"].includes(role) || !branch) { errEl.textContent = t("err_fill"); return; }

  btn.disabled = true;
  errEl.textContent = "";
  try {
    const sAuth = getSecondaryAuth();
    const cred = await createUserWithEmailAndPassword(sAuth, nickToEmail(nick), pass);
    await signOut(sAuth);
    await setDoc(doc(db, "staff", cred.user.uid), {
      nick, name, role, branch,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: state.profile.uid
    });
    toast(t("saved"));
    renderStaff();
  } catch (err) {
    btn.disabled = false;
    errEl.textContent = errText(err);
  }
}
