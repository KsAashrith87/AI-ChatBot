const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chipsEl = document.getElementById("chips");

let convoStep = "intro";
let unitSystem = "metric";
let height = null;
let weight = null;
let bmi = null;

// Add chat bubble
function addMessage(text, from = "bot") {
  const row = document.createElement("div");
  row.className = "message-row " + from;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble " + from;
  bubble.innerHTML = text.replace(/\n/g, "<br>");

  if (from === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "AI";
    row.appendChild(avatar);
  }

  row.appendChild(bubble);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

// Start messages
addMessage("Hey, I’m your AI Advisor 👋");
addMessage("I’ll estimate your BMI and build a workout routine to match your goals.");
addMessage("Say anything to get started.");

// Main handler
function processUserMessage(rawInput) {
  const input = rawInput.trim();
  if (!input) return;

  addMessage(input, "user");

  if (convoStep === "intro") {
    convoStep = "unit";
    return addMessage("Great! Use metric (cm/kg) or imperial (in/lbs)?");
  }

  if (convoStep === "unit") {
    if (/imperial/i.test(input)) unitSystem = "imperial";
    addMessage(`Enter your height in ${unitSystem === "metric" ? "cm" : "inches"}.`);
    convoStep = "height";
    return;
  }

  if (convoStep === "height") {
    const h = parseFloat(input);
    if (isNaN(h) || h <= 0) return addMessage("Enter a valid height.");
    height = unitSystem === "imperial" ? h * 0.0254 : h / 100;
    convoStep = "weight";
    return addMessage(`Enter your weight in ${unitSystem === "metric" ? "kg" : "lbs"}.`);
  }

  if (convoStep === "weight") {
    const w = parseFloat(input);
    if (isNaN(w) || w <= 0) return addMessage("Enter a valid weight.");
    weight = unitSystem === "imperial" ? w * 0.453592 : w;

    bmi = weight / (height * height);
    addMessage(`Your BMI is <b>${bmi.toFixed(1)}</b>.`);

    convoStep = "goal";
    return addMessage("What’s your goal? (lose fat, build muscle, maintain)");
  }

  if (convoStep === "goal") {
    let plan = "";

    if (input.toLowerCase().includes("lose")) {
      plan += "🔥 <b>Fat Loss Plan:</b><br>• 3–4x/week cardio<br>• 2–3x/week strength<br>• Light calorie deficit";
    } else if (input.toLowerCase().includes("build")) {
      plan += "💪 <b>Muscle Gain Plan:</b><br>• 3–4x/week lifting<br>• Progressive overload<br>• Small calorie surplus";
    } else {
      plan += "⚖️ <b>Maintenance Plan:</b><br>• Balanced workouts<br>• Moderate cardio<br>• Consistent nutrition";
    }

    addMessage(plan);

    // Healthy BMI range
    const low = (18.5 * height * height);
    const high = (24.9 * height * height);

    addMessage(
      `Healthy BMI weight range: <b>${low.toFixed(1)}kg – ${high.toFixed(1)}kg</b>.`
    );

    convoStep = "done";
    return;
  }

  if (convoStep === "done") {
    addMessage("Ask anything else or type restart.");
    if (input.toLowerCase().includes("restart")) location.reload();
  }
}

// Input handlers
sendBtn.addEventListener("click", () => {
  const val = inputEl.value;
  inputEl.value = "";
  processUserMessage(val);
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

// Quick goal chips
chipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  inputEl.value = chip.dataset.goal;
  sendBtn.click();
});
