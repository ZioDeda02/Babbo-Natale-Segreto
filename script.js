import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  runTransaction,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 🔥 CONFIG FIREBASE (LA TUA)
const firebaseConfig = {
  apiKey: "AIzaSyDXdzIjSD36C99h4H55oA4-xwo5iGPmyrg",
  authDomain: "babbo-natale-segreto-a4b2c.firebaseapp.com",
  databaseURL: "https://babbo-natale-segreto-a4b2c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "babbo-natale-segreto-a4b2c",
  storageBucket: "babbo-natale-segreto-a4b2c.firebasestorage.app",
  messagingSenderId: "789273540190",
  appId: "1:789273540190:web:da0d75ac0a0423279926cf"
};

// 🚀 INIT
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 📌 DOM
const nameInput = document.getElementById("nameInput");
const posInput = document.getElementById("posInput");
const login = document.getElementById("login");
const game = document.getElementById("game");
const status = document.getElementById("status");
const buttons = document.getElementById("buttons");
const message = document.getElementById("message");
const joinBtn = document.getElementById("joinBtn");
const endGameBtn = document.getElementById("endGameBtn");
const resetBtn = document.getElementById("resetBtn");

let me = null;

// 👉 ENTRA NEL GIOCO
joinBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const pos = parseInt(posInput.value);

  if (!name || isNaN(pos) || pos < 1 || pos > 8) {
    alert("Inserisci nome e posizione valida (1–8)");
    return;
  }

  me = pos;

  await set(ref(db, "players/" + pos), {
    name,
    active: true,
    skip: false
  });

  // primo giocatore avvia il gioco
  await runTransaction(ref(db, "turn"), current => {
    return current === null ? pos : current;
  });

  login.classList.add("hidden");
  game.classList.remove("hidden");
});

// 👉 ASCOLTA TURNO
onValue(ref(db, "turn"), snap => {
  const turn = snap.val();

  if (turn === null) {
    status.innerText = "⏳ In attesa che il gioco inizi…";
    buttons.style.display = "none";
    return;
  }

  if (turn === me) {
    status.innerText = "🎅 È il tuo turno!";
    buttons.style.display = "block";
  } else {
    status.innerText = "⏳ Attendi il tuo turno…";
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
    set(ref(db, "players/" + me + "/skip"), true);
  }

  nextTurn();
});

// 👉 FINE GIOCO
endGameBtn.addEventListener("click", async () => {
  await set(ref(db, "players/" + me + "/active"), false);
  message.innerText = "🎄 Il tuo gioco è finito!";
  nextTurn();
});

// 👉 RESET PARTITA
resetBtn.addEventListener("click", async () => {
  if (!confirm("Vuoi davvero resettare la partita?")) return;

  await remove(ref(db, "players"));
  await remove(ref(db, "turn"));
  location.reload();
});

// 👉 PROSSIMO TURNO (2 secondi + ultimo giocatore)
async function nextTurn() {
  const snap = await get(ref(db, "players"));
  const players = snap.val() || {};
  const active = [];

  for (let i = 1; i <= 8; i++) {
    if (players[i] && players[i].active) active.push(i);
  }

  setTimeout(async () => {

    if (active.length === 0) {
      await set(ref(db, "turn"), null);
      return;
    }

    if (active.length === 1) {
      await set(ref(db, "turn"), active[0]);
      return;
    }

    let current = me;

    for (let i = 0; i < 8; i++) {
      current = current % 8 + 1;
      const p = players[current];

      if (!p || !p.active) continue;

      if (p.skip) {
        await set(ref(db, "players/" + current + "/skip"), false);
        continue;
      }

      await set(ref(db, "turn"), current);
      return;
    }

  }, 2000);
}
