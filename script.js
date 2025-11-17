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

// Show/hide chips
function setChips(visible, goals = []) {
  if (!visible) {
    chipsEl.style.display = "none";
    return;
  }
  chipsEl.style.display = "flex";
  chipsEl.innerHTML = "";
  goals.forEach(goal => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = goal;
    chip.dataset.goal = goal;
    chipsEl.appendChild(chip);
  });
}

// Start messages
addMessage("Hey, I'm your AI Advisor 👋");
setTimeout(() => {
  addMessage("I'll estimate your BMI and build a personalized workout routine to match your goals.");
}, 800);
setTimeout(() => {
  addMessage("Ready to get started? Just say hi or tell me a bit about yourself!");
}, 1600);

// Main handler
function processUserMessage(rawInput) {
  const input = rawInput.trim();
  if (!input) return;
  
  addMessage(input, "user");
  setChips(false); // Hide chips after user responds
  
  if (convoStep === "intro") {
    convoStep = "unit";
    setTimeout(() => {
      addMessage("Awesome! Let's begin. 🎯");
    }, 300);
    setTimeout(() => {
      addMessage("First, which measurement system do you prefer?");
      setChips(true, ["Metric (cm/kg)", "Imperial (in/lbs)"]);
    }, 1000);
    return;
  }
  
  if (convoStep === "unit") {
    if (/imperial|in|lbs|pounds/i.test(input)) {
      unitSystem = "imperial";
      addMessage("Got it! We'll use imperial units. 📏");
    } else {
      unitSystem = "metric";
      addMessage("Perfect! We'll use metric units. 📏");
    }
    setTimeout(() => {
      addMessage(`What's your height in ${unitSystem === "metric" ? "centimeters (cm)" : "inches"}?`);
    }, 800);
    convoStep = "height";
    return;
  }
  
  if (convoStep === "height") {
    const h = parseFloat(input);
    if (isNaN(h) || h <= 0) {
      return addMessage("Hmm, that doesn't look right. Please enter a valid number for your height.");
    }
    height = unitSystem === "imperial" ? h * 0.0254 : h / 100;
    
    addMessage(`Nice! ${input}${unitSystem === "metric" ? "cm" : '"'} recorded. ✓`);
    setTimeout(() => {
      addMessage(`Now, what's your weight in ${unitSystem === "metric" ? "kilograms (kg)" : "pounds (lbs)"}?`);
    }, 800);
    convoStep = "weight";
    return;
  }
  
  if (convoStep === "weight") {
    const w = parseFloat(input);
    if (isNaN(w) || w <= 0) {
      return addMessage("That doesn't seem right. Please enter a valid number for your weight.");
    }
    weight = unitSystem === "imperial" ? w * 0.453592 : w;
    bmi = weight / (height * height);
    
    setTimeout(() => {
      addMessage(`Great! Your BMI is <b>${bmi.toFixed(1)}</b>.`);
    }, 500);
    
    setTimeout(() => {
      let bmiCategory = "";
      if (bmi < 18.5) bmiCategory = "You're in the underweight range.";
      else if (bmi < 25) bmiCategory = "You're in the healthy weight range! 🎉";
      else if (bmi < 30) bmiCategory = "You're in the overweight range.";
      else bmiCategory = "You're in the obese range.";
      
      addMessage(bmiCategory);
    }, 1300);
    
    setTimeout(() => {
      addMessage("Now, what's your main fitness goal?");
      setChips(true, ["Lose fat", "Build muscle", "Maintain weight"]);
    }, 2100);
    
    convoStep = "goal";
    return;
  }
  
  if (convoStep === "goal") {
    let plan = "";
    let goal = "";
    
    if (/lose|fat|weight loss|slim/i.test(input)) {
      goal = "fat loss";
      plan = "🔥 <b>Your Fat Loss Plan:</b><br><br>";
      plan += "• <b>Cardio:</b> 3–4 sessions/week (30-45 min)<br>";
      plan += "• <b>Strength:</b> 2–3 sessions/week (full body)<br>";
      plan += "• <b>Nutrition:</b> Light calorie deficit (300-500 cal)<br>";
      plan += "• <b>Focus:</b> High-rep ranges, circuit training";
    } else if (/build|muscle|gain|bulk|strength/i.test(input)) {
      goal = "muscle building";
      plan = "💪 <b>Your Muscle Building Plan:</b><br><br>";
      plan += "• <b>Lifting:</b> 4–5 sessions/week (split routine)<br>";
      plan += "• <b>Progressive overload:</b> Increase weight weekly<br>";
      plan += "• <b>Nutrition:</b> Small calorie surplus (200-300 cal)<br>";
      plan += "• <b>Focus:</b> Compound movements, 8-12 rep range";
    } else {
      goal = "maintenance";
      plan = "⚖️ <b>Your Maintenance Plan:</b><br><br>";
      plan += "• <b>Balanced workouts:</b> 3–4 sessions/week<br>";
      plan += "• <b>Cardio:</b> 2–3 moderate sessions<br>";
      plan += "• <b>Strength:</b> 2–3 full-body sessions<br>";
      plan += "• <b>Nutrition:</b> Eat at maintenance calories";
    }
    
    setTimeout(() => {
      addMessage(`Perfect! I've created a <b>${goal}</b> plan for you. 🎯`);
    }, 500);
    
    setTimeout(() => {
      addMessage(plan);
    }, 1300);
    
    // Healthy weight range
    const low = (18.5 * height * height);
    const high = (24.9 * height * height);
    const lowDisplay = unitSystem === "imperial" ? (low / 0.453592).toFixed(1) + " lbs" : low.toFixed(1) + " kg";
    const highDisplay = unitSystem === "imperial" ? (high / 0.453592).toFixed(1) + " lbs" : high.toFixed(1) + " kg";
    
    setTimeout(() => {
      addMessage(`💡 <b>FYI:</b> A healthy BMI weight range for your height is <b>${lowDisplay} – ${highDisplay}</b>.`);
    }, 2100);
    
    setTimeout(() => {
      addMessage("Need anything else? Feel free to ask questions or type <b>restart</b> to start over! 😊");
    }, 2900);
    
    convoStep = "done";
    return;
  }
  
  if (convoStep === "done") {
    if (/restart|reset|start over/i.test(input)) {
      addMessage("Restarting... See you in a sec! 👋");
      setTimeout(() => location.reload(), 1000);
      return;
    }
    
    // Simple Q&A for done state
    if (/thank|thanks/i.test(input)) {
      addMessage("You're welcome! Happy to help. 💪");
    } else if (/help|question/i.test(input)) {
      addMessage("I'm here to help! Ask me anything about fitness, BMI, or type <b>restart</b> to create a new plan.");
    } else {
      addMessage("I'm not sure how to help with that, but you can type <b>restart</b> to create a new workout plan!");
    }
  }
}

// Input handlers
sendBtn.addEventListener("click", () => {
  const val = inputEl.value;
  if (!val.trim()) return;
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
