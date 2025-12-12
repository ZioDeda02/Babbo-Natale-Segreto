// 🔥 CONFIG FIREBASE
firebase.initializeApp({
  apiKey: "INSERISCI",
  authDomain: "INSERISCI",
  databaseURL: "INSERISCI",
  projectId: "INSERISCI"
});

const db = firebase.database();

// 📌 DOM (ora è sicuro: script è in fondo all'HTML)
const nameInput = document.getElementById("nameInput");
const posInput = document.getElementById("posInput");
const login = document.getElementById("login");
const game = document.getElementById("game");
const status = document.getElementById("status");
const buttons = document.getElementById("buttons");
const message = document.getElementById("message");
const joinBtn = document.getElementById("joinBtn");
const endGameBtn = document.getElementById("endGameBtn");

let me = null;

// 👉 ENTRA
joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const pos = parseInt(posInput.value);

  if (!name || isNaN(pos) || pos < 1 || pos > 8) {
    alert("Inserisci nome e posizione valida (1–8)");
    return;
  }

  me = pos;

  db.ref("players/" + pos).set({
    name,
    active: true,
    skip: false
  });

  db.ref("turn").once("value", snap => {
    if (!snap.exists()) db.ref("turn").set(pos);
  });

  login.classList.add("hidden");
  game.classList.remove("hidden");
});

// 👉 TURNO
db.ref("turn").on("value", snap => {
  if (snap.val() === me) {
    status.innerText = "🎅 È il tuo turno!";
    buttons.style.display = "block";
  } else {
    status.innerText = "⏳ Attendi il tuo turno...";
    buttons.style.display = "none";
    message.innerText = "";
  }
});

// 👉 PESCA
buttons.addEventListener("click", e => {
  const type = e.target.dataset.pick;
  if (!type) return;

  const messages = {
    bonus: "Complimentiii!!! 😆",
    fake: "Sei stato fregato 😂",
    surprise: "Wow che bontà 😋, goditelo!!!",
    skip: "Ops… il prossimo giro lo salti 😬"
  };

  message.innerText = messages[type];

  if (type === "skip") {
    db.ref("players/" + me + "/skip").set(true);
  }

  nextTurn();
});

// 👉 FINE GIOCO
endGameBtn.addEventListener("click", () => {
  db.ref("players/" + me + "/active").set(false);
  message.innerText = "🎄 Il tuo gioco è finito!";
  nextTurn();
});

// 👉 PROSSIMO TURNO
function nextTurn() {
  db.ref("players").once("value", snap => {
    const players = snap.val() || {};
    let current = me;

    for (let i = 0; i < 8; i++) {
      current = current % 8 + 1;
      const p = players[current];

      if (!p || !p.active) continue;

      if (p.skip) {
        db.ref("players/" + current + "/skip").set(false);
        continue;
      }

      db.ref("turn").set(current);
      return;
    }

    db.ref("turn").set(null);
  });
}
