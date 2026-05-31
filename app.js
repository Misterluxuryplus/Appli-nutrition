"use strict";

const STORAGE_KEY = "objectif-equilibre-v1";
const PHOTO_MESSAGE = "Analyse photo bientôt disponible.";

const defaultState = {
  profile: null,
  meals: [],
  sports: [],
  steps: {
    count: 0,
    calories: 0
  },
  waterLiters: 0,
  history: []
};

let state = loadState();

const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll("[data-view-target]");
const profileForm = document.querySelector("#profile-form");
const mealForm = document.querySelector("#meal-form");
const sportForm = document.querySelector("#sport-form");
const resetButton = document.querySelector("#reset-button");
const voiceButton = document.querySelector("#voice-button");
const voiceStatus = document.querySelector("#voice-status");
const mealDescription = mealForm.elements.description;
const selectedMealTitle = document.querySelector("#selected-meal-title");
const photoInput = document.querySelector("#meal-photo");
const photoStatus = document.querySelector("#photo-status");
const stepsInput = document.querySelector("#steps-input");
const stepsEstimate = document.querySelector("#steps-estimate");
const stepsMessage = document.querySelector("#steps-message");
const waterMessage = document.querySelector("#water-message");

const mealLabels = {
  breakfast: "Ajouter mon petit-déjeuner",
  lunch: "Ajouter mon déjeuner",
  dinner: "Ajouter mon dîner",
  snack: "Ajouter une collation"
};

const foodKeywords = [
  { words: ["pates", "pâtes", "pasta"], calories: 380 },
  { words: ["riz"], calories: 320 },
  { words: ["pain", "baguette", "tartine"], calories: 220 },
  { words: ["viande", "boeuf", "steak"], calories: 330 },
  { words: ["poulet", "dinde"], calories: 260 },
  { words: ["oeuf", "oeufs", "œuf", "œufs", "omelette"], calories: 190 },
  { words: ["fromage blanc", "skyr"], calories: 120 },
  { words: ["yaourt"], calories: 110 },
  { words: ["fromage"], calories: 190 },
  { words: ["legumes", "légumes", "salade", "crudites", "crudités"], calories: 120 },
  { words: ["croissant", "viennoiserie"], calories: 260 },
  { words: ["chocolat"], calories: 300 },
  { words: ["bonbons", "bonbon"], calories: 260 },
  { words: ["pizza"], calories: 760 },
  { words: ["burger", "hamburger"], calories: 650 },
  { words: ["frites"], calories: 420 },
  { words: ["poisson", "saumon", "thon"], calories: 260 },
  { words: ["soupe"], calories: 150 },
  { words: ["fruit", "pomme", "banane", "orange"], calories: 95 },
  { words: ["huile", "sauce", "mayonnaise"], calories: 140 }
];

const portionFactors = {
  light: 0.75,
  normal: 1,
  hearty: 1.3
};

const portionLabels = {
  light: "Léger",
  normal: "Normal",
  hearty: "Copieux",
  large: "Copieux"
};

const activityFactors = {
  low: 1.3,
  medium: 1.55,
  high: 1.75
};

const goalAdjustments = {
  lose: -450,
  cut: -250,
  maintain: 0,
  muscle: 250
};

// Estimation simple en kcal par kg et par minute.
const sportRates = {
  strength: 0.07,
  walk: 0.05,
  bike: 0.095,
  run: 0.13,
  swim: 0.11,
  housework: 0.055,
  gardening: 0.075,
  pingpong: 0.065,
  other: 0.07
};

const sportLabels = {
  strength: "Musculation",
  walk: "Marche",
  bike: "Vélo",
  run: "Course",
  swim: "Natation",
  housework: "Ménage",
  gardening: "Jardinage",
  pingpong: "Ping-pong",
  other: "Autre"
};

const intensityFactors = {
  light: 0.8,
  normal: 1,
  intense: 1.25
};

init();

function init() {
  bindNavigation();
  bindProfile();
  bindMeals();
  bindSport();
  bindSteps();
  bindWater();
  bindReset();
  setupSpeechRecognition();
  restoreProfileForm();
  render();
  registerServiceWorker();
}

function bindNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTarget));
  });
}

function bindProfile() {
  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const profile = {
      sex: formData.get("sex"),
      age: Number(formData.get("age")),
      height: Number(formData.get("height")),
      weight: Number(formData.get("weight")),
      goal: formData.get("goal"),
      activity: formData.get("activity"),
      weeklySport: Number(formData.get("weeklySport"))
    };

    state.profile = {
      ...profile,
      calculations: calculateProfile(profile)
    };

    saveState();
    render();
    showView("day");
  });
}

function bindMeals() {
  document.querySelectorAll("[data-meal-type]").forEach((button) => {
    button.addEventListener("click", () => {
      openMealForm(button.dataset.mealType);
    });
  });

  mealForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(mealForm);
    const description = String(formData.get("description")).trim();
    const mealType = formData.get("mealType") || "breakfast";
    const portion = formData.get("portion");
    const calories = estimateMealCalories(description, portion);

    state.meals.unshift({
      id: createId(),
      mealType,
      description,
      portion,
      calories,
      createdAt: new Date().toISOString()
    });

    mealForm.reset();
    mealForm.elements.mealType.value = mealType;
    mealForm.elements.portion.value = "normal";
    mealForm.hidden = true;
    photoStatus.hidden = true;
    saveState();
    render();
  });

  photoInput.addEventListener("change", () => {
    photoStatus.textContent = PHOTO_MESSAGE;
    photoStatus.hidden = false;
  });
}

function bindSport() {
  sportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(sportForm);
    const activityType = formData.get("activityType");
    const duration = Number(formData.get("duration") || 0);
    const intensity = formData.get("intensity");
    const manualCalories = Number(formData.get("manualCalories") || 0);
    const calories = manualCalories || estimateSportCalories(activityType, duration, intensity);

    if (!activityType && !manualCalories) return;

    state.sports.unshift({
      id: createId(),
      activityType: activityType || "other",
      duration,
      intensity,
      manualCalories,
      calories,
      createdAt: new Date().toISOString()
    });

    sportForm.reset();
    sportForm.elements.intensity.value = "normal";
    saveState();
    render();
  });
}

function bindSteps() {
  stepsInput.addEventListener("input", () => {
    saveSteps(Number(stepsInput.value || 0));
  });
}

function bindWater() {
  document.querySelectorAll("[data-water]").forEach((button) => {
    button.addEventListener("click", () => {
      state.waterLiters = Number(button.dataset.water);
      saveState();
      render();
    });
  });
}

function bindReset() {
  resetButton.addEventListener("click", () => {
    const confirmed = window.confirm("Effacer le profil, les repas, le sport, les pas, l’eau et localStorage ?");
    if (!confirmed) return;

    localStorage.clear();
    state = structuredClone(defaultState);
    profileForm.reset();
    mealForm.reset();
    sportForm.reset();
    mealForm.hidden = true;
    photoStatus.hidden = true;
    stepsInput.value = "";
    render();
    showView("home");
  });
}

function openMealForm(mealType) {
  mealForm.hidden = false;
  mealForm.elements.mealType.value = mealType;
  selectedMealTitle.textContent = mealLabels[mealType] || mealLabels.breakfast;
  photoStatus.hidden = true;
  mealForm.scrollIntoView({ behavior: "smooth", block: "start" });
  mealDescription.focus();
}

function showView(viewId) {
  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });

  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function calculateProfile(profile) {
  // Formule Mifflin-St Jeor : 10P + 6.25T - 5A + ajustement sexe.
  const sexOffset = profile.sex === "male" ? 5 : -161;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexOffset;
  const maintenance = bmr * activityFactors[profile.activity];
  const target = maintenance + goalAdjustments[profile.goal];

  return {
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    target: Math.max(1200, Math.round(target))
  };
}

function estimateMealCalories(description, portion) {
  const normalized = normalizeText(description);
  const matches = foodKeywords.filter((item) => item.words.some((word) => normalized.includes(normalizeText(word))));
  const baseCalories = matches.reduce((total, item) => total + item.calories, 0) || 430;
  return Math.round(baseCalories * (portionFactors[portion] || 1));
}

function estimateSportCalories(activityType, duration, intensity) {
  const weight = state.profile?.weight || 70;
  const rate = sportRates[activityType] || sportRates.other;
  return Math.round(weight * duration * rate * (intensityFactors[intensity] || 1));
}

function calculateStepsCalories(steps) {
  return Math.round((steps * 0.035) / 10) * 10;
}

function render() {
  renderProfileResults();
  renderMeals();
  renderSports();
  renderSteps();
  renderWater();
  renderSummary();
}

function renderProfileResults() {
  const panel = document.querySelector("#profile-results");
  if (!state.profile) {
    panel.hidden = true;
    return;
  }

  const { bmr, maintenance, target } = state.profile.calculations;
  panel.hidden = false;
  document.querySelector("#bmr-result").textContent = formatCalories(bmr);
  document.querySelector("#maintenance-result").textContent = formatCalories(maintenance);
  document.querySelector("#target-result").textContent = formatCalories(target);
  document.querySelector("#bmr-sentence").textContent = `Votre corps brûle environ ${formatCalories(bmr)} par jour, même au repos.`;
  document.querySelector("#maintenance-sentence").textContent = `En mangeant environ ${formatCalories(maintenance)} par jour, votre poids devrait rester stable.`;
  document.querySelector("#target-sentence").textContent = `Pour perdre du poids progressivement, essayez de rester autour de ${formatCalories(target)} par jour.`;
  renderExampleDay(target);
}

function renderExampleDay(target) {
  const split = {
    breakfast: Math.round(target * 0.25),
    lunch: Math.round(target * 0.35),
    dinner: Math.round(target * 0.3),
    snack: Math.round(target * 0.1)
  };
  const scale = target / 2000;
  const bread = range(30, 60, scale);
  const protein = range(120, 180, scale);
  const lunchStarch = range(80, 160, scale);
  const dinnerStarch = range(60, 140, scale);

  document.querySelector("#example-breakfast").textContent = formatCalories(split.breakfast);
  document.querySelector("#example-lunch").textContent = formatCalories(split.lunch);
  document.querySelector("#example-dinner").textContent = formatCalories(split.dinner);
  document.querySelector("#example-snack").textContent = formatCalories(split.snack);
  document.querySelector("#advice-breakfast").innerHTML = buildAdviceHtml(
    ["🥣 Skyr ou fromage blanc", "🍌 Fruit", `🍞 ${bread} g de pain complet ou flocons d’avoine`],
    ["🥚 Œufs", "🥛 Yaourt nature", "🍎 Autre fruit"]
  );
  document.querySelector("#advice-lunch").innerHTML = buildAdviceHtml(
    [`🍗 ${protein} g de poulet, dinde, poisson, œufs ou viande halal possible`, "🥦 Légumes", `🍚 ${lunchStarch} g de riz, pâtes, pommes de terre ou semoule`],
    ["🫘 Lentilles, pois chiches ou haricots rouges", "🐟 Thon ou saumon", "🥗 Grande salade complète"]
  );
  document.querySelector("#advice-dinner").innerHTML = buildAdviceHtml(
    [`🐟 ${protein} g de poisson, œufs, poulet, tofu ou légumineuses`, "🥦 Légumes", `🥔 ${dinnerStarch} g de féculents selon la faim`],
    ["🍳 Omelette", "🫘 Lentilles ou pois chiches", "🥣 Soupe + produit laitier"]
  );
  document.querySelector("#advice-snack").innerHTML = buildAdviceHtml(
    ["🍎 Fruit", "🥣 Skyr, fromage blanc ou yaourt nature"],
    ["🥜 Quelques amandes", "🍌 Banane", "🥛 Lait ou boisson sans sucre"]
  );
}

function renderMeals() {
  document.querySelectorAll("[data-meal-list]").forEach((list) => {
    list.innerHTML = "";
  });

  state.meals.forEach((meal) => {
    const list = document.querySelector(`[data-meal-list="${meal.mealType || "breakfast"}"]`);
    if (!list) return;
    const item = document.createElement("li");
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(meal.description)}</strong>
        <small>${portionLabels[meal.portion] || "Normal"} · ${formatCalories(meal.calories)}</small>
      </div>
      <button type="button" aria-label="Supprimer ce repas" data-delete-meal="${meal.id}">×</button>
    `;
    list.append(item);
  });

  document.querySelectorAll("[data-delete-meal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.meals = state.meals.filter((meal) => meal.id !== button.dataset.deleteMeal);
      saveState();
      render();
    });
  });
}

function renderSports() {
  const list = document.querySelector("#sport-list");
  list.innerHTML = "";

  state.sports.forEach((sport) => {
    const item = document.createElement("li");
    const label = sportLabels[sport.activityType] || "Activité";
    const detail = sport.manualCalories ? "Saisie manuelle" : `${sport.duration || 0} min`;
    item.innerHTML = `
      <div>
        <strong>${label}</strong>
        <small>${detail} · ${formatCalories(sport.calories)}</small>
      </div>
      <button type="button" aria-label="Supprimer cette activité" data-delete-sport="${sport.id}">×</button>
    `;
    list.append(item);
  });

  list.querySelectorAll("[data-delete-sport]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sports = state.sports.filter((sport) => sport.id !== button.dataset.deleteSport);
      saveState();
      render();
    });
  });
}

function renderSteps() {
  const steps = Number(state.steps?.count || 0);
  const calories = Number(state.steps?.calories || 0);
  stepsInput.value = steps || "";
  stepsEstimate.textContent = `${steps.toLocaleString("fr-FR")} pas ≈ ${calories.toLocaleString("fr-FR")} kcal`;
  stepsMessage.textContent = steps >= 8000 ? "Chaque mouvement compte 👍" : "Même sans salle, marcher aide beaucoup.";
}

function renderWater() {
  const liters = Number(state.waterLiters || 0);
  document.querySelector("#summary-water").textContent = formatLiters(liters);
  waterMessage.textContent = liters >= 2 ? "Bonne hydratation 👍" : "Boire aide aussi la satiété et l’énergie.";
  document.querySelectorAll("[data-water]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.water) === liters);
  });
}

function renderSummary() {
  const target = state.profile?.calculations.target || 0;
  const eaten = sumCalories(state.meals);
  const sport = sumCalories(state.sports);
  const stepsCalories = Number(state.steps?.calories || 0);
  const remaining = target - eaten + sport + stepsCalories;
  const progress = target ? Math.min((eaten / target) * 100, 100) : 0;

  document.querySelector("#summary-food").textContent = formatCalories(eaten);
  document.querySelector("#summary-sport").textContent = formatCalories(sport);
  document.querySelector("#summary-steps").textContent = formatCalories(stepsCalories);
  document.querySelector("#summary-balance").textContent = target ? formatCalories(Math.max(remaining, 0)) : "-";
  document.querySelector("#progress-target-label").textContent = target ? formatCalories(target) : "Objectif du jour";

  const progressFill = document.querySelector("#calorie-progress");
  progressFill.style.width = `${progress}%`;
  progressFill.classList.toggle("is-over", target > 0 && eaten > target);
  document.querySelector("#kind-message").textContent = buildKindMessage(target, remaining);
}

function buildKindMessage(target, remaining) {
  if (!target) return "Remplissez votre profil pour obtenir une estimation adaptée.";
  if (remaining >= 0) return "Vous êtes dans votre objectif aujourd’hui 👍";
  if (remaining >= -300) return "Vous dépassez légèrement aujourd’hui, ce n’est pas grave.";
  return "Journée plus haute que prévu. Reprenez simplement votre équilibre au prochain repas.";
}

function saveSteps(steps) {
  const count = Math.max(0, Math.round(steps || 0));
  state.steps = {
    count,
    calories: calculateStepsCalories(count)
  };
  saveState();
  render();
}

function restoreProfileForm() {
  if (!state.profile) return;

  Object.entries(state.profile).forEach(([key, value]) => {
    if (key === "calculations") return;
    const field = profileForm.elements[key];
    if (!field) return;
    field.value = value;
  });
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceButton.disabled = true;
    voiceStatus.textContent = "Micro non disponible sur ce navigateur.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;

  voiceButton.addEventListener("click", () => {
    voiceStatus.textContent = "Écoute en cours...";
    recognition.start();
  });

  recognition.addEventListener("result", (event) => {
    const text = event.results[0][0].transcript;
    mealDescription.value = mealDescription.value ? `${mealDescription.value} ${text}` : text;
    voiceStatus.textContent = "Texte ajouté.";
  });

  recognition.addEventListener("error", () => {
    voiceStatus.textContent = "Micro indisponible pour le moment.";
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // L'application reste utilisable si le navigateur bloque le service worker.
    });
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...structuredClone(defaultState), ...saved } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sumCalories(entries) {
  return entries.reduce((total, entry) => total + Number(entry.calories || 0), 0);
}

function formatCalories(value) {
  return `${Math.round(value).toLocaleString("fr-FR")} kcal`;
}

function formatLiters(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: value % 1 ? 1 : 0,
    maximumFractionDigits: 1
  })} L`;
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function range(min, max, scale) {
  const low = Math.round((min * scale) / 5) * 5;
  const high = Math.round((max * scale) / 5) * 5;
  return `${low} à ${high}`;
}

function buildAdviceHtml(takeItems, replaceItems) {
  return `
    <div>
      <strong>✅ Tu peux prendre :</strong>
      <ul>${takeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div>
      <strong>🔁 Tu peux remplacer par :</strong>
      <ul>${replaceItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}
