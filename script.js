// 🔥 CONFIG FIREBASE (inserita correttamente)
firebase.initializeApp({
  apiKey: "AIzaSyDXdzIjSD36C99h4H55oA4-xwo5iGPmyrg",
  authDomain: "babbo-natale-segreto-a4b2c.firebaseapp.com",
  databaseURL: "https://babbo-natale-segreto-a4b2c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "babbo-natale-segreto-a4b2c",
  storageBucket: "babbo-natale-segreto-a4b2c.firebasestorage.app",
  messagingSenderId: "789273540190",
  appId: "1:789273540190:web:da0d75ac0a0423279926cf"
});

const db = firebase.database();

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

let me = null;

// 👉 ENTRA NEL GIOCO (AVVIO GARANTITO)
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

  // 🔥 FORZA L'AVVIO DEL TURNO SE NON ESISTE
  db.ref("turn").transaction(current => {
    return current === null ? pos : current;
  });

  login.classList.add("hidden");
  game.classList.remove("hidden");
});

// 👉 AGGIORNA TURNO
db.ref("turn").on("value", snap => {
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

// 👉 PROSSIMO TURNO (CON RITARDO + ULTIMO GIOCATORE)
function nextTurn() {
  db.ref("players").once("value", snap => {
    const players = snap.val() || [];
    const active = [];

    for (let i = 1; i <= 8; i++) {
      if (players[i] && players[i].active) {
        active.push(i);
      }
    }

    setTimeout(() => {

      if (active.length === 0) {
        db.ref("turn").set(null);
        return;
      }

      if (active.length === 1) {
        db.ref("turn").set(active[0]);
        return;
      }

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

    }, 2000);
  });
}
