const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chipsEl = document.getElementById("chips");

// States: waitGreeting -> askUnits -> askImperialData/askMetricData -> askGoal -> afterPlan
let convoStep = "waitGreeting";
let unitSystem = null; // "imperial" or "metric"
let heightM = null;    // height in meters
let weightKg = null;   // weight in kilograms
let bmi = null;
let goal = null;

// ---------- Helper: add chat bubble ----------
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

// ---------- BMI helpers ----------
function getBmiCategory(b) {
  if (b < 18.5) return "underweight";
  if (b < 25) return "normal";
  if (b < 30) return "overweight";
  return "obese";
}

function getHealthyWeightRangeText() {
  if (!heightM || !weightKg || !bmi) return "";

  const lowKg = 18.5 * heightM * heightM;
  const highKg = 24.9 * heightM * heightM;

  let msg =
    `For your height, a healthy BMI range (18.5–24.9) means a weight between ` +
    `<b>${lowKg.toFixed(1)} kg</b> and <b>${highKg.toFixed(1)} kg</b>.`;

  if (weightKg < lowKg) {
    msg += `<br>You’d need to gain about <b>${(lowKg - weightKg).toFixed(
      1
    )} kg</b> to reach the lower end.`;
  } else if (weightKg > highKg) {
    msg += `<br>You’d need to lose about <b>${(weightKg - highKg).toFixed(
      1
    )} kg</b> to reach the upper end.`;
  } else {
    msg += `<br>You’re already in the healthy range — main goal is to maintain and build quality muscle.`;
  }

  return msg;
}

// ---------- Diet & workout by goal ----------
function getDietText(goalType) {
  const b = bmi;
  const cat = b ? getBmiCategory(b) : null;

  if (goalType === "lose") {
    return (
      "🥗 <b>Weight / Fat Loss Diet</b><br>" +
      (cat ? `Based on your BMI (<b>${b.toFixed(1)}</b>, ${cat}), we’ll aim for a small calorie deficit.<br><br>` : "") +
      "<b>Vegetarian option:</b><br>" +
      "• Breakfast: Oats with skim milk, berries, and a scoop of whey or soy protein.<br>" +
      "• Lunch: Lentil/bean curry, brown rice or roti, and a big mixed salad.<br>" +
      "• Snack: Greek yogurt or low-fat curd with fruit and a handful of nuts.<br>" +
      "• Dinner: Grilled paneer/tofu with veggies (stir-fry or roasted), plus a light carb like quinoa or roti.<br>" +
      "• Focus on: High protein, lots of veggies, minimal sugary drinks, and controlled portion sizes.<br><br>" +
      "<b>Non-vegetarian option:</b><br>" +
      "• Breakfast: Scrambled eggs or egg whites with whole grain toast and fruit.<br>" +
      "• Lunch: Grilled chicken or fish with brown rice and veggies/salad.<br>" +
      "• Snack: Greek yogurt or a protein shake with some nuts.<br>" +
      "• Dinner: Lean chicken/fish with a big portion of veggies and a small serving of rice/potatoes/roti.<br>" +
      "• Focus on: High protein, moderate healthy fats, fewer refined carbs, and a small calorie deficit."
    );
  }

  if (goalType === "muscle") {
    return (
      "🍛 <b>Muscle Building Diet</b><br>" +
      (cat ? `With a BMI of <b>${b.toFixed(1)}</b> (${cat}), we’ll use a small calorie surplus, not a dirty bulk.<br><br>` : "") +
      "<b>Vegetarian option:</b><br>" +
      "• Breakfast: Oats with milk, peanut butter, banana, and a scoop of whey/plant protein.<br>" +
      "• Lunch: Paneer or tofu curry, rice/roti, and a big veggie side.<br>" +
      "• Snack: Protein shake + nuts or hummus with whole grain crackers.<br>" +
      "• Dinner: Lentils/beans + paneer/tofu + veggies + a carb like rice/pasta/quinoa.<br>" +
      "• Focus on: High protein every meal, enough carbs to fuel heavy lifts, and healthy fats (nuts, seeds, olive oil).<br><br>" +
      "<b>Non-vegetarian option:</b><br>" +
      "• Breakfast: Eggs/egg whites, whole grain toast, fruit, and maybe milk or a protein shake.<br>" +
      "• Lunch: Chicken/turkey/fish with rice or pasta and veggies.<br>" +
      "• Snack: Greek yogurt, cottage cheese, or protein shake with nuts.<br>" +
      "• Dinner: Lean meat or fish + potatoes/rice/quinoa + veggies.<br>" +
      "• Focus on: 1.6–2.2 g protein per kg of body weight, steady surplus, not junk food overload."
    );
  }

  if (goalType === "abs") {
    return (
      "🥦 <b>Abs / Core Definition Diet</b><br>" +
      (cat ? `Your BMI is <b>${b.toFixed(1)}</b> (${cat}). Visible abs need relatively low body fat + strong core.<br><br>` : "") +
      "<b>Vegetarian option:</b><br>" +
      "• Breakfast: High-protein oats (oats + milk/water + protein powder) and berries.<br>" +
      "• Lunch: Mixed veggie salad with beans/lentils/tofu, light dressing.<br>" +
      "• Snack: Low-fat yogurt/curd with fruit, or roasted chana.<br>" +
      "• Dinner: Paneer/tofu stir-fry with lots of veggies, small portion of rice/roti.<br>" +
      "• Focus on: Slight calorie deficit, high fiber, high protein, minimal sugar and processed snacks.<br><br>" +
      "<b>Non-vegetarian option:</b><br>" +
      "• Breakfast: Egg whites and veggies omelette, one slice whole grain toast.<br>" +
      "• Lunch: Grilled chicken/fish with salad and a small portion of rice/roti.<br>" +
      "• Snack: Protein shake or boiled eggs with some veggies.<br>" +
      "• Dinner: Lean meat or fish with a big serving of veggies and minimal carbs.<br>" +
      "• Focus on: Lean protein, low-ish carbs timed around workouts, lots of veggies, water, and low sugar."
    );
  }

  // default / maintain
  return (
    "🍽️ <b>Maintenance / Toning Diet</b><br>" +
    (cat ? `At a BMI of <b>${b.toFixed(1)}</b> (${cat}), we’ll aim to maintain weight while improving body composition.<br><br>` : "") +
    "<b>Vegetarian option:</b><br>" +
    "• Balanced meals: protein source (paneer/tofu/beans), whole grains (rice/roti/quinoa), and veggies at each meal.<br>" +
    "• Snacks: Fruit, yogurt, nuts in moderate portions.<br>" +
    "• Focus on: Consistency, not perfection, with enough protein to support training.<br><br>" +
    "<b>Non-vegetarian option:</b><br>" +
    "• Similar structure: lean meat/fish + whole grains + veggies.<br>" +
    "• Snacks: Greek yogurt, boiled eggs, fruit, nuts.<br>" +
    "• Focus on: Eating around your hunger levels, not stuffing or starving, and keeping protein high."
  );
}

function getWorkoutText(goalType) {
  if (goalType === "lose") {
    return (
      "🏋️ <b>Weight / Fat Loss Workout Plan</b><br>" +
      "• <b>3–4 days/week:</b> Full-body strength training (squats, lunges, rows, presses, hip hinges). 3 sets of 8–12 reps.<br>" +
      "• <b>3–5 days/week:</b> 30–40 minutes of brisk walking, cycling, or light jogging.<br>" +
      "• Optional: 1–2 short HIIT sessions per week (10–15 min) if joints handle it.<br>" +
      "• Goal: Keep or build muscle while slowly dropping body fat."
    );
  }

  if (goalType === "muscle") {
    return (
      "🏋️‍♂️ <b>Muscle Building Workout Plan</b><br>" +
      "• <b>4–5 days/week lifting:</b><br>" +
      "  – Day 1: Push (chest, shoulders, triceps)<br>" +
      "  – Day 2: Pull (back, biceps)<br>" +
      "  – Day 3: Legs (quads, hamstrings, glutes, calves)<br>" +
      "  – Day 4: Upper or full-body, optional Day 5 for weak points.<br>" +
      "• 3–4 sets of 6–12 reps on compounds, 8–15 on accessories.<br>" +
      "• 1–2 light cardio sessions per week just for heart health (15–20 min walk/bike).<br>" +
      "• Progress: Try to add small amounts of weight or reps each week (progressive overload)."
    );
  }

  if (goalType === "abs") {
    return (
      "💥 <b>Abs / Core Workout Plan</b><br>" +
      "• <b>3–4 days/week:</b> Full-body or upper/lower strength (so your whole body stays strong).<br>" +
      "• <b>3 days/week core finishers:</b><br>" +
      "  – Planks (front + side) 3 x 30–45 seconds<br>" +
      "  – Hanging knee/leg raises or lying leg raises 3 x 10–15 reps<br>" +
      "  – Dead bugs/bicycle crunches 3 x 12–20 reps<br>" +
      "• <b>3–5 days/week:</b> 20–30 minutes of moderate cardio (walk, bike, jog).<br>" +
      "• Reminder: Abs show when body fat is low enough — diet and consistency matter more than crazy ab circuits."
    );
  }

  // default / maintain
  return (
    "🏃 <b>Maintenance / Toning Workout Plan</b><br>" +
    "• <b>2–3 days/week:</b> Strength training (full body or upper/lower split).<br>" +
    "• <b>2–3 days/week:</b> 20–30 minutes of cardio (walking, light jogging, sports).<br>" +
    "• Focus: Keep getting a bit stronger over time, keep activity consistent, and stay in a good routine you actually enjoy."
  );
}

// ---------- Main conversation handler ----------
function processUserMessage(rawInput) {
  const input = rawInput.trim();
  if (!input) return;

  const lower = input.toLowerCase();
  addMessage(input, "user");

  // Global "restart"
  if (lower.includes("restart") || lower.includes("start over") || lower.includes("reset")) {
    convoStep = "waitGreeting";
    unitSystem = null;
    heightM = null;
    weightKg = null;
    bmi = null;
    goal = null;
    addMessage(
      "No problem, we’ll start fresh. 👌<br>" +
        "Say <b>hi</b> or <b>hey</b> to begin again."
    );
    return;
  }

  // STEP 1: Greet back
  if (convoStep === "waitGreeting") {
    if (
      lower.includes("hi") ||
      lower.includes("hello") ||
      lower.includes("hey") ||
      lower.includes("yo")
    ) {
      addMessage(
        "Nice to meet you! 😄<br>" +
          "I’ll calculate your BMI first, then help you decide how to lose weight, build muscle, or get abs."
      );
      addMessage(
        "Which units do you want to use?<br>" +
          "<b>Imperial</b> (feet/inches &amp; pounds) or <b>Metric</b> (cm &amp; kg)?"
      );
      convoStep = "askUnits";
    } else {
      addMessage("Just say something like <b>hi</b> or <b>hey</b> to get started 😊");
    }
    return;
  }

  // STEP 2: Ask which form (units)
  if (convoStep === "askUnits") {
    if (lower.includes("imperial") || lower.includes("feet") || lower.includes("ft")) {
      unitSystem = "imperial";
      convoStep = "askImperialData";
      addMessage(
        "Cool, we’ll use <b>imperial</b> (feet/inches &amp; pounds).<br><br>" +
          "Please send your details in this format:<br>" +
          "Feet: 5<br>" +
          "Inches: 10<br>" +
          "Weight: 170"
      );
      return;
    } else if (lower.includes("metric") || lower.includes("cm") || lower.includes("kg")) {
      unitSystem = "metric";
      convoStep = "askMetricData";
      addMessage(
        "Nice, we’ll use <b>metric</b> (cm &amp; kg).<br><br>" +
          "Please send your details in this format:<br>" +
          "Height (cm): 175<br>" +
          "Weight (kg): 68"
      );
      return;
    } else {
      addMessage(
        "Just tell me which system you prefer:<br>" +
          "<b>Imperial</b> (feet/inches &amp; pounds) or <b>Metric</b> (cm &amp; kg)?"
      );
      return;
    }
  }

  // STEP 3a: Imperial data input: Feet, Inches, Weight
  if (convoStep === "askImperialData") {
    // Get all numbers user typed, in order
    const nums = input.match(/[-+]?\d*\.?\d+/g);
    if (!nums || nums.length < 3) {
      addMessage(
        "I couldn’t read that clearly. Please follow this format:<br>" +
          "Feet: 5<br>Inches: 10<br>Weight: 170"
      );
      return;
    }

    const feet = parseFloat(nums[0]);
    const inches = parseFloat(nums[1]);
    const pounds = parseFloat(nums[2]);

    if (
      isNaN(feet) ||
      isNaN(inches) ||
      isNaN(pounds) ||
      feet <= 0 ||
      inches < 0 ||
      pounds <= 0
    ) {
      addMessage(
        "Those numbers look off. Double-check and send like:<br>" +
          "Feet: 5<br>Inches: 10<br>Weight: 170"
      );
      return;
    }

    const totalInches = feet * 12 + inches;
    heightM = totalInches * 0.0254;
    weightKg = pounds * 0.453592;
    bmi = weightKg / (heightM * heightM);

    const cat = getBmiCategory(bmi);

    addMessage(
      `Your estimated BMI is <b>${bmi.toFixed(1)}</b>, which is considered <b>${cat}</b>.`
    );
    addMessage(getHealthyWeightRangeText());

    convoStep = "askGoal";
    addMessage(
      "Now, what’s your main goal?<br>" +
        "Do you want to <b>lose weight</b>, <b>build muscle</b>, or <b>get abs</b>?"
    );
    return;
  }

  // STEP 3b: Metric data input: Height (cm), Weight (kg)
  if (convoStep === "askMetricData") {
    const nums = input.match(/[-+]?\d*\.?\d+/g);
    if (!nums || nums.length < 2) {
      addMessage(
        "I couldn’t read that clearly. Please follow this format:<br>" +
          "Height (cm): 175<br>Weight (kg): 68"
      );
      return;
    }

    const heightCm = parseFloat(nums[0]);
    const kg = parseFloat(nums[1]);

    if (isNaN(heightCm) || isNaN(kg) || heightCm <= 0 || kg <= 0) {
      addMessage(
        "Those numbers look off. Double-check and send like:<br>" +
          "Height (cm): 175<br>Weight (kg): 68"
      );
      return;
    }

    heightM = heightCm / 100;
    weightKg = kg;
    bmi = weightKg / (heightM * heightM);

    const cat = getBmiCategory(bmi);

    addMessage(
      `Your estimated BMI is <b>${bmi.toFixed(1)}</b>, which is considered <b>${cat}</b>.`
    );
    addMessage(getHealthyWeightRangeText());

    convoStep = "askGoal";
    addMessage(
      "Now, what’s your main goal?<br>" +
        "Do you want to <b>lose weight</b>, <b>build muscle</b>, or <b>get abs</b>?"
    );
    return;
  }

  // STEP 4: Ask goal (lose weight / build muscle / get abs)
  if (convoStep === "askGoal") {
    if (
      lower.includes("lose") ||
      lower.includes("fat") ||
      lower.includes("cut") ||
      lower.includes("weight")
    ) {
      goal = "lose";
    } else if (
      lower.includes("muscle") ||
      lower.includes("bulk") ||
      lower.includes("mass") ||
      lower.includes("strength")
    ) {
      goal = "muscle";
    } else if (lower.includes("abs") || lower.includes("core") || lower.includes("six")) {
      goal = "abs";
    } else {
      goal = "maintain";
    }

    const dietText = getDietText(goal);
    const workoutText = getWorkoutText(goal);

    addMessage(dietText);
    addMessage(workoutText);
    addMessage(
      "If you want to tweak anything or run the numbers again, just type <b>restart</b>."
    );

    convoStep = "afterPlan";
    return;
  }

  // STEP 5: After plan – conversational follow-up
  if (convoStep === "afterPlan") {
    if (lower.includes("bmi")) {
      if (bmi) {
        addMessage(
          `Your latest BMI is <b>${bmi.toFixed(1)}</b>. If your height/weight changes, type <b>restart</b> to recalculate.`
        );
      } else {
        addMessage(
          "We haven’t calculated BMI this session. Type <b>restart</b> if you want to go through it again."
        );
      }
      return;
    }

    if (
      lower.includes("diet") ||
      lower.includes("food") ||
      lower.includes("eat") ||
      lower.includes("meal")
    ) {
      addMessage(
        "Think of your diet as support for the training. Stay mostly on the plans I gave you, but we can adjust portion sizes and protein if needed. Type <b>restart</b> to rerun from the top."
      );
      return;
    }

    if (lower.includes("thanks") || lower.includes("thank you")) {
      addMessage("Anytime! 💪 Stay consistent. If you want to start over, just type <b>restart</b>.");
      return;
    }

    // If they type another goal again, re-send their goal diet/workout
    if (
      lower.includes("lose") ||
      lower.includes("build") ||
      lower.includes("muscle") ||
      lower.includes("abs") ||
      lower.includes("core")
    ) {
      // quick re-map
      if (lower.includes("lose") || lower.includes("weight") || lower.includes("fat")) {
        goal = "lose";
      } else if (lower.includes("muscle") || lower.includes("build")) {
        goal = "muscle";
      } else if (lower.includes("abs") || lower.includes("core")) {
        goal = "abs";
      }
      addMessage(getDietText(goal));
      addMessage(getWorkoutText(goal));
      return;
    }

    // Fallback
    addMessage(
      "I can help adjust your plan, talk more about diet, or we can <b>restart</b> and recalc your BMI."
    );
  }
}

// ---------- Initial greeting ----------
addMessage(
  "Hey! I’m your AI fitness coach 🤖💪<br>" +
    "I’ll grab your height and weight to calculate your BMI, then help you pick a goal and give you a diet + workout plan."
);
addMessage("First, just say <b>hi</b> or <b>hey</b> so we can start.");

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

if (chipsEl) {
  // You can still tap chips later to talk about goals
  chipsEl.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const goalText = chip.dataset.goal || chip.textContent;
    inputEl.value = goalText;
    sendBtn.click();
  });
}
