"use strict";

const STORAGE_KEY = "objectif-equilibre-v1";

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

const foodKeywords = [
  { words: ["pizza"], calories: 760 },
  { words: ["burger", "hamburger"], calories: 650 },
  { words: ["frites"], calories: 420 },
  { words: ["pates", "pasta"], calories: 380 },
  { words: ["riz"], calories: 320 },
  { words: ["pain", "baguette"], calories: 220 },
  { words: ["poulet", "dinde"], calories: 260 },
  { words: ["boeuf", "steak"], calories: 330 },
  { words: ["poisson", "saumon", "thon"], calories: 260 },
  { words: ["oeuf", "omelette"], calories: 180 },
  { words: ["salade", "legumes", "légumes"], calories: 120 },
  { words: ["soupe"], calories: 150 },
  { words: ["fromage"], calories: 180 },
  { words: ["yaourt", "skyr"], calories: 110 },
  { words: ["fruit", "pomme", "banane", "orange"], calories: 95 },
  { words: ["chocolat", "gateau", "gâteau", "dessert"], calories: 310 },
  { words: ["huile", "sauce", "mayonnaise"], calories: 140 }
];

const portionFactors = {
  light: 0.75,
  normal: 1,
  large: 1.3
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

const sportCaloriesPerKgPerMinute = {
  walk: 0.05,
  bike: 0.095,
  run: 0.13,
  strength: 0.07,
  swim: 0.11,
  fitness: 0.09
};

const sportLabels = {
  walk: "Marche",
  bike: "Velo",
  run: "Course",
  strength: "Musculation",
  swim: "Natation",
  fitness: "Fitness"
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
    const calories = estimateMealCalories(description, portion);

    state.meals.unshift({
      id: createId(),
      description,
      portion,
      calories,
      createdAt: new Date().toISOString()
    });

    mealForm.reset();
    mealForm.elements.portion.value = "normal";
    saveState();
    render();
    showView("summary");
  });

  sportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(sportForm);
    const activityType = formData.get("activityType");
    const duration = Number(formData.get("duration"));
    const calories = estimateSportCalories(activityType, duration);

    state.sports.unshift({
      id: createId(),
      activityType,
      duration,
      calories,
      createdAt: new Date().toISOString()
    });

    sportForm.reset();
    saveState();
    render();
    showView("summary");
  });

  resetButton.addEventListener("click", () => {
    const confirmed = window.confirm("Effacer toutes les données locales de test ?");
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaultState);
    profileForm.reset();
    mealForm.reset();
    sportForm.reset();
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
        message: "Un écart n’annule pas tes efforts. Reprends simplement ton équilibre au prochain repas.",
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
  const baseCalories = matches.reduce((total, item) => total + item.calories, 0) || 450;

  return Math.round(baseCalories * portionFactors[portion]);
}

function estimateSportCalories(activityType, duration) {
  const weight = state.profile?.weight || 70;
  const rate = sportCaloriesPerKgPerMinute[activityType] || 0.07;
  return Math.round(weight * duration * rate);
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
        <small>${portionLabel(meal.portion)} · ${formatCalories(meal.calories)}</small>
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
        <strong>${sportLabels[sport.activityType]}</strong>
        <small>${sport.duration} min · ${formatCalories(sport.calories)}</small>
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
  if (!target) return "Remplis ton profil pour obtenir une estimation adaptée.";
  if (balance > 350) return "Il te reste de la marge aujourd'hui. Pense surtout à rester à l'écoute de ta faim.";
  if (balance < -350) return "Le bilan passe au-dessus du repère aujourd'hui. Ce n'est pas grave : une tendance se regarde sur plusieurs jours.";
  return "Tu es proche de ton repère. Continue tranquillement, sans chercher la perfection.";
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
      // Le service worker peut échouer en ouverture locale file://, l'app reste utilisable.
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
    light: "Portion légère",
    normal: "Portion normale",
    large: "Grosse portion"
  }[portion];
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
