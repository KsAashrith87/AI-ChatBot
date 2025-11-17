const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chipsEl = document.getElementById("chips");

let convoStep = "unit";      // unit -> height -> weight -> goal -> done
let unitSystem = "metric";   // "metric" or "imperial"
let height = null;           // in meters
let weight = null;           // in kg
let bmi = null;

// ---------- Helpers ----------
function addMessage(text, from = "bot") {
  const row = document.createElement("div");
  row.className = "message-row " + (from === "bot" ? "bot" : "user");

  const bubble = document.createElement("div");
  bubble.className = "message-bubble " + (from === "bot" ? "bot" : "user");
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

function bmiCategory(bmiVal) {
  if (bmiVal < 18.5) return "underweight";
  if (bmiVal < 25) return "normal";
  if (bmiVal < 30) return "overweight";
  return "obese";
}

function healthyWeightText() {
  const low = 18.5 * height * height;
  const high = 24.9 * height * height;

  let msg = `For your height, a healthy BMI range (18.5–24.9) is about <b>${low
    .toFixed(1)} kg – ${high.toFixed(1)} kg</b>.`;

  if (weight < low) {
    msg += `<br>You’d need to gain around <b>${(low - weight).toFixed(
      1
    )} kg</b> to reach the lower end of that range.`;
  } else if (weight > high) {
    msg += `<br>You’d need to lose around <b>${(weight - high).toFixed(
      1
    )} kg</b> to reach the upper end of that range.`;
  } else {
    msg += `<br>You’re already in the healthy range — the goal now is maintaining it with smart training and food choices.`;
  }

  msg +=
    "<br><br>We’ll use your goal (build muscle, get abs, or lose weight) to pick a routine that nudges you toward that range in a steady, healthy way.";

  return msg;
}

function buildWorkoutPlan(goalText) {
  const lower = goalText.toLowerCase();
  let plan = "";

  if (lower.includes("abs") || lower.includes("core") || lower.includes("six")) {
    plan =
      "💥 <b>Abs / Core-Focused Plan</b><br>" +
      "• 3–4x/week full-body strength: squats, push-ups/bench, rows, hip hinges.<br>" +
      "• 3x/week 10–15 minutes of core finishers: planks, leg raises, dead bugs, cable crunches.<br>" +
      "• 3–4x/week 20–30 min moderate cardio (walking, bike, incline treadmill) to help lower body fat.<br>" +
      "• Small calorie deficit + high protein = the combo for visible abs.";
  } else if (
    lower.includes("muscle") ||
    lower.includes("bulk") ||
    lower.includes("strength") ||
    lower.includes("build")
  ) {
    plan =
      "💪 <b>Muscle Building Plan</b><br>" +
      "• 3–5x/week lifting with a push/pull/legs or upper/lower split.<br>" +
      "• 3–4 sets of 6–12 reps on big lifts (squats, bench/press, rows, deadlifts).<br>" +
      "• 1–2x/week light cardio for heart health (15–20 min walk/bike).<br>" +
      "• Small calorie surplus + 1.6–2.2 g protein/kg body weight.";
  } else if (
    lower.includes("lose") ||
    lower.includes("fat") ||
    lower.includes("cut") ||
    lower.includes("weight")
  ) {
    plan =
      "🔥 <b>Weight / Fat Loss Plan</b><br>" +
      "• 4–5x/week 30–40 min brisk walking, cycling, or light jogging.<br>" +
      "• 2–3x/week full-body strength training (so you keep muscle while losing fat).<br>" +
      "• Aim for a small calorie deficit (~300–500 kcal/day).<br>" +
      "• Lots of protein, veggies, water, and 7–9 hours of sleep.";
  } else {
    plan =
      "⚖️ <b>Maintenance & Toning Plan</b><br>" +
      "• 2–3x/week strength training (full body or upper/lower split).<br>" +
      "• 2–3x/week 20–30 min cardio or sports.<br>" +
      "• Eat around maintenance calories, focus on whole foods and protein.";
  }

  if (bmi !== null) {
    const cat = bmiCategory(bmi);
    plan += `<br><br>Because your BMI is <b>${bmi.toFixed(
      1
    )}</b> (${cat}), this routine is tuned to help you move toward or stay within a healthy range over time.`;
  }

  return plan;
}

function smallTalkResponse(inputLower) {
  if (inputLower.includes("hi") || inputLower.includes("hello")) {
    return "Hey! 😊 I’m here as your fitness assistant. We’ll use your height, weight, and goal to build a plan.";
  }
  if (inputLower.includes("thank")) {
    return "You’re welcome! If you want to tweak anything, just tell me your goal again or type <b>restart</b>.";
  }
  if (inputLower.includes("bro") || inputLower.includes("dude")) {
    return "😂 I got you. I’ll handle the numbers, you just bring the effort.";
  }
  return null;
}

// ---------- Conversation Logic ----------
function processUserMessage(rawInput) {
  const input = rawInput.trim();
  if (!input) return;

  const lower = input.toLowerCase();
  addMessage(input, "user");

  // Global restart
  if (/restart|start over|reset/.test(lower)) {
    convoStep = "unit";
    height = weight = bmi = null;
    addMessage(
      "Cool, let’s reset everything and start fresh. 👌<br>" +
        "First, what units do you want to use: <b>metric</b> (cm &amp; kg) or <b>imperial</b> (inches &amp; lbs)?"
    );
    return;
  }

  // Light small talk layered on top of flows
  const smallTalk = smallTalkResponse(lower);
  if (smallTalk && convoStep !== "height" && convoStep !== "weight") {
    addMessage(smallTalk);
  }

  // STEP 1: Units
  if (convoStep === "unit") {
    if (lower.includes("imperial")) {
      unitSystem = "imperial";
    } else if (lower.includes("metric")) {
      unitSystem = "metric";
    } else if (!isNaN(parseFloat(input))) {
      // They gave a number right away, assume metric height
      unitSystem = "metric";
      convoStep = "height";
      // fall through to height handler with same input
    } else {
      addMessage(
        "Before I can calculate anything, I need units: type <b>metric</b> (cm, kg) or <b>imperial</b> (inches, lbs)."
      );
      return;
    }

    if (convoStep !== "height") {
      convoStep = "height";
      addMessage(
        `Nice. Let’s start with your <b>height</b> so I can calculate BMI.\n` +
          `Enter your height in <b>${
            unitSystem === "metric" ? "centimeters (e.g. 175)" : "inches (e.g. 70)"
          }</b>.`
      );
      return;
    }
  }

  // STEP 2: Height
  if (convoStep === "height") {
    const h = parseFloat(input);
    if (isNaN(h) || h <= 0) {
      addMessage(
        `That doesn’t look like a valid height. Try a number like <b>${
          unitSystem === "metric" ? "175" : "70"
        }</b>.`
      );
      return;
    }

    height = unitSystem === "metric" ? h / 100 : h * 0.0254;

    convoStep = "weight";
    addMessage(
      "Got it 👍 Now I need your <b>weight</b> so I can finish the BMI.\n" +
        `Enter your weight in <b>${
          unitSystem === "metric" ? "kilograms (e.g. 70)" : "pounds (e.g. 160)"
        }</b>.`
    );
    return;
  }

  // STEP 3: Weight
  if (convoStep === "weight") {
    const w = parseFloat(input);
    if (isNaN(w) || w <= 0) {
      addMessage(
        `That doesn’t look like a valid weight. Try a number like <b>${
          unitSystem === "metric" ? "70" : "160"
        }</b>.`
      );
      return;
    }

    weight = unitSystem === "metric" ? w : w * 0.453592;

    bmi = weight / (height * height);
    const cat = bmiCategory(bmi);

    addMessage(
      `Alright, here’s your BMI: <b>${bmi.toFixed(
        1
      )}</b>, which falls in the <b>${cat}</b> category.`
    );
    addMessage(healthyWeightText());

    convoStep = "goal";
    addMessage(
      "Now the fun part: what do you want to accomplish?\n" +
        "You can say things like <b>build muscle</b>, <b>get abs</b>, or <b>lose weight</b> in general."
    );
    return;
  }

  // STEP 4: Goal & workout recommendation
  if (convoStep === "goal") {
    const plan = buildWorkoutPlan(input);
    addMessage(plan);
    addMessage(
      "If you want, ask me follow-up stuff like <b>how many days per week</b>, <b>how long it might take</b>, or type <b>restart</b> to recalculate BMI."
    );
    convoStep = "done";
    return;
  }

  // STEP 5: Done – more conversational mode
  if (convoStep === "done") {
    if (lower.includes("bmi")) {
      if (bmi) {
        addMessage(
          `Your last BMI was <b>${bmi.toFixed(
            1
          )}</b>. If your height or weight changes, type <b>restart</b> and we’ll redo everything.`
        );
      } else {
        addMessage(
          "We haven’t calculated your BMI yet in this session. Type <b>restart</b> to go through it."
        );
      }
      return;
    }

    if (lower.includes("how many days") || lower.includes("how often")) {
      addMessage(
        "Good question. Most people do well with <b>3–5 days per week</b> of lifting and <b>2–4 days</b> of cardio, depending on your schedule and recovery."
      );
      return;
    }

    if (lower.includes("how long") || lower.includes("how fast")) {
      addMessage(
        "Roughly speaking, visible progress usually shows in <b>4–8 weeks</b>, and bigger changes in <b>3–6 months</b>, as long as you’re consistent with training, sleep, and food."
      );
      return;
    }

    if (lower.includes("diet") || lower.includes("food") || lower.includes("eat")) {
      addMessage(
        "Keep it simple: mostly whole foods, plenty of protein, fruits, veggies, whole grains, and healthy fats. For fat loss, small calorie deficit; for muscle gain, small surplus."
      );
      return;
    }

    if (
      lower.includes("abs") ||
      lower.includes("muscle") ||
      lower.includes("lose weight") ||
      lower.includes("lose fat") ||
      lower.includes("get bigger") ||
      lower.includes("tone")
    ) {
      const plan = buildWorkoutPlan(input);
      addMessage(plan);
      return;
    }

    // Fallback general “AI-ish” reply
    addMessage(
      "Got it. I can tweak your routine, talk about diet, or recalc your BMI. Ask me about <b>workouts</b>, <b>food</b>, <b>how many days</b>, or type <b>restart</b> to start over."
    );
  }
}

// ---------- Initial Messages ----------
addMessage(
  "Hey, I’m your AI fitness assistant 👋<br>" +
    "I’ll use your <b>height</b>, <b>weight</b>, and <b>goal</b> to calculate your BMI and build a routine that actually makes sense for you."
);
addMessage(
  "First thing: what units do you want to use?<br>" +
    "Type <b>metric</b> (cm &amp; kg) or <b>imperial</b> (inches &amp; lbs)."
);

// ---------- Events ----------
sendBtn.addEventListener("click", () => {
  const val = inputEl.value;
  inputEl.value = "";
  processUserMessage(val);
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendBtn.click();
  }
});

chipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const goalText = chip.dataset.goal || chip.textContent;
  inputEl.value = goalText;
  sendBtn.click();
});
