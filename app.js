"use strict";

const STORAGE_KEY = "objectif-equilibre-v1";
const SUPPORT_MESSAGE = "Un écart n’annule pas tes efforts. Reprends simplement ton équilibre au prochain repas.";

const defaultState = {
  profile: null,
  meals: [],
  sports: [],
  cravings: [],
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
const cravingToggle = document.querySelector("#craving-toggle");
const cravingOptions = document.querySelector("#craving-options");

// Valeurs volontairement approximatives : l'objectif est la rapidité, pas la précision médicale.
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

const feelingLabels = {
  hungry: "Encore faim",
  good: "Bien",
  full: "Trop plein"
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

// Estimation kcal par kg et par minute avant modulation par intensité.
const sportRates = {
  strength: 0.07,
  walk: 0.05,
  bike: 0.095,
  pingpong: 0.065,
  cardio: 0.12,
  other: 0.07
};

const sportLabels = {
  strength: "Musculation",
  walk: "Marche",
  bike: "Vélo",
  pingpong: "Ping-pong",
  cardio: "Cardio",
  other: "Autre"
};

const intensityFactors = {
  light: 0.8,
  normal: 1,
  intense: 1.25
};

const intensityLabels = {
  light: "Intensité légère",
  normal: "Intensité normale",
  intense: "Intensité intense"
};

init();

function init() {
  bindNavigation();
  bindForms();
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

function bindForms() {
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
    showView("summary");
  });

  mealForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(mealForm);
    const description = String(formData.get("description")).trim();
    const portion = formData.get("portion");
    const feeling = formData.get("feeling");
    const calories = estimateMealCalories(description, portion);

    state.meals.unshift({
      id: createId(),
      description,
      portion,
      feeling,
      calories,
      createdAt: new Date().toISOString()
    });

    mealForm.reset();
    mealForm.elements.portion.value = "normal";
    mealForm.elements.feeling.value = "good";
    saveState();
    render();
    showView("summary");
  });

  sportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(sportForm);
    const activityType = formData.get("activityType");
    const duration = Number(formData.get("duration"));
    const intensity = formData.get("intensity");
    const calories = estimateSportCalories(activityType, duration, intensity);

    state.sports.unshift({
      id: createId(),
      activityType,
      duration,
      intensity,
      calories,
      createdAt: new Date().toISOString()
    });

    sportForm.reset();
    sportForm.elements.intensity.value = "normal";
    saveState();
    render();
    showView("summary");
  });

  resetButton.addEventListener("click", () => {
    const confirmed = window.confirm("Effacer le profil, les repas, le sport, l’historique et localStorage ?");
    if (!confirmed) return;

    localStorage.clear();
    state = structuredClone(defaultState);
    profileForm.reset();
    mealForm.reset();
    sportForm.reset();
    cravingOptions.hidden = true;
    render();
    showView("home");
  });

  cravingToggle.addEventListener("click", () => {
    cravingOptions.hidden = !cravingOptions.hidden;
  });

  document.querySelectorAll("[data-craving-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cravings.unshift({
        id: createId(),
        type: button.dataset.cravingType,
        message: SUPPORT_MESSAGE,
        createdAt: new Date().toISOString()
      });

      saveState();
      render();
      showView("summary");
    });
  });
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

  return Math.round(baseCalories * portionFactors[portion]);
}

function estimateSportCalories(activityType, duration, intensity) {
  const weight = state.profile?.weight || 70;
  const rate = sportRates[activityType] || sportRates.other;
  const intensityFactor = intensityFactors[intensity] || 1;
  return Math.round(weight * duration * rate * intensityFactor);
}

function render() {
  renderProfileResults();
  renderMeals();
  renderSports();
  renderCravings();
  renderSummary();
}

function renderProfileResults() {
  const panel = document.querySelector("#profile-results");
  if (!state.profile) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  document.querySelector("#bmr-result").textContent = formatCalories(state.profile.calculations.bmr);
  document.querySelector("#maintenance-result").textContent = formatCalories(state.profile.calculations.maintenance);
  document.querySelector("#target-result").textContent = formatCalories(state.profile.calculations.target);
}

function renderMeals() {
  const list = document.querySelector("#meal-list");
  list.innerHTML = "";

  state.meals.forEach((meal) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(meal.description)}</strong>
        <small>${portionLabel(meal.portion)} · ${feelingLabels[meal.feeling] || "Bien"} · ${formatCalories(meal.calories)}</small>
      </div>
      <button type="button" aria-label="Supprimer ce repas" data-delete-meal="${meal.id}">×</button>
    `;
    list.append(item);
  });

  list.querySelectorAll("[data-delete-meal]").forEach((button) => {
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
    item.innerHTML = `
      <div>
        <strong>${sportLabels[sport.activityType] || "Autre"}</strong>
        <small>${sport.duration} min · ${intensityLabels[sport.intensity] || "Intensité normale"} · ${formatCalories(sport.calories)}</small>
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

function renderCravings() {
  const list = document.querySelector("#craving-list");
  list.innerHTML = "";

  state.cravings.forEach((craving) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(craving.type)}</strong>
        <small>${escapeHtml(craving.message)}</small>
      </div>
      <button type="button" aria-label="Supprimer cette note" data-delete-craving="${craving.id}">×</button>
    `;
    list.append(item);
  });

  list.querySelectorAll("[data-delete-craving]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cravings = state.cravings.filter((craving) => craving.id !== button.dataset.deleteCraving);
      saveState();
      render();
    });
  });
}

function renderSummary() {
  const target = state.profile?.calculations.target || 0;
  const food = sumCalories(state.meals);
  const sport = sumCalories(state.sports);
  const balance = target - food + sport;

  document.querySelector("#summary-target").textContent = target ? formatCalories(target) : "-";
  document.querySelector("#summary-food").textContent = formatCalories(food);
  document.querySelector("#summary-sport").textContent = formatCalories(sport);
  document.querySelector("#summary-balance").textContent = target ? formatCalories(balance) : "-";
  document.querySelector("#kind-message").textContent = buildKindMessage(target, balance);
}

function buildKindMessage(target, balance) {
  const lastMeal = state.meals[0];
  const hasRecentCraving = state.cravings.length > 0;

  if (!target) return "Remplis ton profil pour obtenir une estimation adaptée.";
  if (hasRecentCraving) return "Un écart n’annule pas tes efforts.";
  if (lastMeal?.portion === "hearty" || lastMeal?.feeling === "full") {
    return "Repas un peu copieux, pas grave, équilibre simplement le prochain.";
  }
  if (balance >= -250 && balance <= 450) return "Bonne journée globale, continue comme ça.";
  if (balance > 450) return "Il te reste de la marge aujourd’hui. Reste surtout à l’écoute de tes sensations.";
  return "La journée est au-dessus du repère, ce n’est qu’une estimation. Reviens simplement à ton rythme.";
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

  recognition.addEventListener("end", () => {
    if (voiceStatus.textContent === "Écoute en cours...") {
      voiceStatus.textContent = "Reconnaissance vocale si disponible.";
    }
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // L'application reste utilisable si l'ouverture locale bloque le service worker.
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

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function portionLabel(portion) {
  return {
    light: "Repas léger",
    normal: "Repas normal",
    hearty: "Repas copieux",
    large: "Repas copieux"
  }[portion] || "Repas normal";
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
