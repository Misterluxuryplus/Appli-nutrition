"use strict";

const STORAGE_KEY = "objectif-equilibre-v1";
const PHOTO_AI_ENDPOINT = window.MYCOACHNUTRI_PHOTO_AI_ENDPOINT || "";

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
const photoInputs = document.querySelectorAll(".photo-input");
const photoStatus = document.querySelector("#photo-status");
const photoAnalysis = document.querySelector("#photo-analysis");
const photoPreview = document.querySelector("#photo-preview");
const photoResult = document.querySelector("#photo-result");
const photoCalories = document.querySelector("#photo-calories");
const photoDescription = document.querySelector("#photo-description");
const photoFeedback = document.querySelector("#photo-feedback");
const photoFeedbackTitle = document.querySelector("#photo-feedback-title");
const photoFeedbackMessage = document.querySelector("#photo-feedback-message");
const photoValidate = document.querySelector("#photo-validate");
const photoEdit = document.querySelector("#photo-edit");
const stepsInput = document.querySelector("#steps-input");
const stepsEstimate = document.querySelector("#steps-estimate");
const stepsMessage = document.querySelector("#steps-message");
const waterMessage = document.querySelector("#water-message");
const updateBanner = document.querySelector("#update-banner");
const updateButton = document.querySelector("#update-button");

let pendingServiceWorker = null;
let refreshingForUpdate = false;
let currentPhotoAnalysis = null;
let currentPhotoObjectUrl = null;

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
    resetPhotoAnalysis();
    saveState();
    render();
  });

  photoInputs.forEach((input) => {
    input.addEventListener("change", () => {
      handlePhotoSelection(input.files?.[0]);
    });
  });

  photoValidate.addEventListener("click", () => {
    validatePhotoMeal();
  });

  photoEdit.addEventListener("click", () => {
    editPhotoMealManually();
  });
}

function bindSport() {
  sportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(sportForm);
    const calories = Math.max(0, Math.round(Number(formData.get("calories") || 0)));

    if (!calories) return;

    state.sports.unshift({
      id: createId(),
      label: "Sport",
      calories,
      createdAt: new Date().toISOString()
    });

    sportForm.reset();
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
    resetPhotoAnalysis();
    stepsInput.value = "";
    render();
    showView("home");
  });
}

function openMealForm(mealType) {
  mealForm.hidden = false;
  mealForm.elements.mealType.value = mealType;
  selectedMealTitle.textContent = mealLabels[mealType] || mealLabels.breakfast;
  resetPhotoAnalysis();
  mealForm.scrollIntoView({ behavior: "smooth", block: "start" });
  mealDescription.focus();
}

async function handlePhotoSelection(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    photoStatus.textContent = "Choisissez une image de repas.";
    photoAnalysis.hidden = false;
    return;
  }

  if (currentPhotoObjectUrl) URL.revokeObjectURL(currentPhotoObjectUrl);
  currentPhotoObjectUrl = URL.createObjectURL(file);
  photoPreview.src = currentPhotoObjectUrl;
  photoAnalysis.hidden = false;
  photoResult.hidden = true;
  photoFeedback.hidden = true;
  photoStatus.hidden = false;
  photoStatus.textContent = "Analyse de la photo en cours...";

  try {
    currentPhotoAnalysis = await analyzeMealPhoto(file);
    renderPhotoAnalysisState(currentPhotoAnalysis);
  } catch {
    renderPhotoDifficult();
  }
}

// En production GitHub Pages, configurez window.MYCOACHNUTRI_PHOTO_AI_ENDPOINT
// vers un backend sécurisé qui appelle l'IA sans exposer de clé API dans le navigateur.
async function analyzeMealPhoto(file) {
  if (!PHOTO_AI_ENDPOINT) {
    return {
      status: "low_confidence",
      message: "Aucun service d’analyse IA n’est configuré pour confirmer les aliments."
    };
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("mealType", mealForm.elements.mealType.value || "meal");
  formData.append("portion", mealForm.elements.portion.value || "normal");
  formData.append(
    "instruction",
    "Cette image contient-elle au moins un aliment ou une boisson consommable ? Si oui, identifie l'aliment ou la boisson, même s'il s'agit d'un seul fruit, d'un yaourt, d'une boisson, d'une collation ou d'un aliment emballé visible, puis estime uniquement les calories totales."
  );

  const response = await fetch(PHOTO_AI_ENDPOINT, {
    method: "POST",
    body: formData
  });

  if (!response.ok) throw new Error("Photo analysis failed");

  const result = await response.json();
  return normalizePhotoAiResult(result);
}

function normalizePhotoAiResult(result) {
  const confidence = result.confidenceScore ?? result.confidence ?? result.foodConfidence ?? "medium";
  const hasFood = result.hasFood ?? result.foodDetected ?? result.containsFood ?? result.containsEdibleItem ?? result.hasConsumable;
  const calories = Math.max(0, Math.round(Number(result.calories || result.estimatedCalories || 0)));
  const rawDescription = String(result.description || result.mealDescription || result.foodName || result.detectedFood || "").trim();
  const description = rawDescription || "Aliment ou boisson détecté";

  if (hasFood === false || result.status === "no_food") {
    return { status: "no_food" };
  }

  if (hasFood !== true || isLowConfidence(confidence, description) || !calories) {
    return { status: "low_confidence" };
  }

  return {
    status: "detected",
    calories,
    description,
    portion: result.portion || mealForm.elements.portion.value || "normal",
    confidence
  };
}

function isLowConfidence(confidence, description = "") {
  if (isSimpleFoodDescription(description)) {
    if (typeof confidence === "number") return confidence < 0.4;
    return ["unknown"].includes(String(confidence).toLowerCase());
  }

  if (typeof confidence === "number") return confidence < 0.55;
  return ["low", "faible", "uncertain", "unknown"].includes(String(confidence).toLowerCase());
}

function isSimpleFoodDescription(description) {
  const normalized = normalizeText(description);
  const simpleFoods = [
    "poire",
    "pomme",
    "banane",
    "orange",
    "fruit",
    "skyr",
    "fromage blanc",
    "yaourt",
    "pain",
    "riz",
    "pates",
    "salade",
    "jus",
    "eau",
    "cafe",
    "the",
    "boisson"
  ];

  return simpleFoods.some((food) => normalized.includes(food));
}

function renderPhotoAnalysisState(analysis) {
  if (analysis.status === "detected") {
    renderPhotoDetected(analysis);
    return;
  }

  if (analysis.status === "no_food") {
    renderPhotoInvalid();
    return;
  }

  renderPhotoDifficult();
}

function renderPhotoDetected(analysis) {
  currentPhotoAnalysis = analysis;
  photoCalories.textContent = `≈ ${formatCalories(analysis.calories)}`;
  photoDescription.textContent = analysis.description;
  photoStatus.textContent = "Analyse terminée.";
  photoFeedback.hidden = true;
  photoResult.hidden = false;
}

function renderPhotoInvalid() {
  currentPhotoAnalysis = null;
  photoStatus.textContent = "Photo non conforme.";
  photoFeedbackTitle.textContent = "❌ Photo non conforme";
  photoFeedbackMessage.textContent = "Nous ne détectons pas clairement d’aliment ou de boisson sur cette photo. Merci de photographier un aliment, une boisson ou un repas.";
  photoResult.hidden = true;
  photoFeedback.hidden = false;
}

function renderPhotoDifficult() {
  currentPhotoAnalysis = null;
  photoStatus.textContent = "Photo difficile à analyser.";
  photoFeedbackTitle.textContent = "⚠️ Photo difficile à analyser";
  photoFeedbackMessage.textContent = "Nous avons du mal à identifier les aliments présents. Essayez une photo plus proche et mieux éclairée.";
  photoResult.hidden = true;
  photoFeedback.hidden = false;
}

function validatePhotoMeal() {
  if (!currentPhotoAnalysis || currentPhotoAnalysis.status !== "detected") return;

  const mealType = mealForm.elements.mealType.value || "breakfast";
  state.meals.unshift({
    id: createId(),
    mealType,
    description: currentPhotoAnalysis.description,
    portion: currentPhotoAnalysis.portion || mealForm.elements.portion.value || "normal",
    calories: currentPhotoAnalysis.calories,
    source: "photo",
    createdAt: new Date().toISOString()
  });

  mealForm.reset();
  mealForm.elements.mealType.value = mealType;
  mealForm.elements.portion.value = "normal";
  mealForm.hidden = true;
  resetPhotoAnalysis();
  saveState();
  render();
}

function editPhotoMealManually() {
  if (currentPhotoAnalysis?.description) {
    mealDescription.value = currentPhotoAnalysis.description;
  }
  resetPhotoAnalysis();
  mealDescription.focus();
}

function resetPhotoAnalysis() {
  currentPhotoAnalysis = null;
  photoInputs.forEach((input) => {
    input.value = "";
  });
  photoAnalysis.hidden = true;
  photoResult.hidden = true;
  photoFeedback.hidden = true;
  photoStatus.textContent = "Analyse en cours...";
  photoPreview.removeAttribute("src");
  if (currentPhotoObjectUrl) {
    URL.revokeObjectURL(currentPhotoObjectUrl);
    currentPhotoObjectUrl = null;
  }
}

function showView(viewId) {
  if (viewId === "day" && !state.profile) {
    viewId = "profile";
  }

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

function calculateStepsCalories(steps) {
  return Math.round((steps * 0.035) / 10) * 10;
}

function render() {
  renderNavigationState();
  renderProfileResults();
  renderMeals();
  renderSports();
  renderSteps();
  renderWater();
  renderSummary();
}

function renderNavigationState() {
  document.querySelectorAll('[data-view-target="day"]').forEach((button) => {
    button.hidden = !state.profile;
  });
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
  const breakfastBread = range(40, 60, scale);
  const oats = scaleNumber(60, scale);
  const breakfastEggBread = scaleNumber(40, scale);
  const breadSlices = scaleNumber(60, scale);
  const protein = range(120, 180, scale);
  const lunchRice = range(100, 150, scale);
  const lunchPotatoes = range(150, 250, scale);
  const lunchSemolina = range(80, 120, scale);
  const lunchBread = range(60, 100, scale);
  const dinnerStarch = range(60, 120, scale);
  const dinnerBread = range(40, 80, scale);
  const dairySnack = range(150, 200, scale);
  const almonds = range(15, 20, scale);

  document.querySelector("#example-breakfast").textContent = formatCalories(split.breakfast);
  document.querySelector("#example-lunch").textContent = formatCalories(split.lunch);
  document.querySelector("#example-dinner").textContent = formatCalories(split.dinner);
  document.querySelector("#example-snack").textContent = formatCalories(split.snack);
  document.querySelector("#advice-breakfast").innerHTML = buildAdviceSections([
    ["✅ Choix 1", [`200 g de skyr ou fromage blanc`, "1 fruit", `${breakfastBread} g de pain complet`]],
    ["🔁 Remplacements possibles", [`${oats} g de flocons d'avoine`, `2 œufs + ${breakfastEggBread} g de pain complet`, `2 tranches de pain complet (${breadSlices} g)`]]
  ]);
  document.querySelector("#advice-lunch").innerHTML = buildAdviceSections([
    ["✅ Protéines", [`${protein} g de poulet`, "ou poisson", "ou dinde", "ou œufs"]],
    ["✅ Féculents", [`${lunchRice} g de riz cuit`, `ou ${lunchRice} g de pâtes cuites`, `ou ${lunchPotatoes} g de pommes de terre`, `ou ${lunchSemolina} g de semoule cuite`]],
    ["🔁 Remplacement pain complet", [`Si vous ne prenez pas de féculents : ${lunchBread} g de pain complet`]],
    ["✅ Légumes", ["Légumes à volonté"]]
  ]);
  document.querySelector("#advice-dinner").innerHTML = buildAdviceSections([
    ["✅ Protéines", [`${protein} g : poisson`, "poulet", "œufs", "légumineuses"]],
    ["✅ Féculents", [`${dinnerStarch} g : riz`, "pâtes", "pommes de terre", "semoule"]],
    ["🔁 Remplacement", [`${dinnerBread} g de pain complet`]]
  ]);
  document.querySelector("#advice-snack").innerHTML = buildAdviceSections([
    ["🥣 Collation", [`${dairySnack} g de skyr`, `ou ${dairySnack} g de fromage blanc`, "ou 1 yaourt nature", "+ 1 fruit", `ou ${almonds} g d'amandes`]]
  ]);
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
    item.innerHTML = `
      <div>
        <strong>Sport</strong>
        <small>${formatCalories(sport.calories)}</small>
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
    navigator.serviceWorker.register("service-worker.js").then((registration) => {
      watchForServiceWorkerUpdate(registration);
    }).catch(() => {
      // L'application reste utilisable si le navigateur bloque le service worker.
    });
  }
}

// Détecte une nouvelle version de la PWA et laisse l'utilisateur recharger proprement.
function watchForServiceWorkerUpdate(registration) {
  if (registration.waiting) {
    showUpdateBanner(registration.waiting);
  }

  // Demande au navigateur de vérifier le service worker au chargement de l'app.
  registration.update();

  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdateBanner(newWorker);
      }
      if (newWorker.state === "activated" && navigator.serviceWorker.controller && !refreshingForUpdate) {
        showUpdateBanner(null);
      }
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshingForUpdate) {
      showUpdateBanner(null);
      return;
    }
    window.location.reload();
  });

  updateButton.addEventListener("click", () => {
    refreshingForUpdate = true;
    if (pendingServiceWorker) {
      pendingServiceWorker.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  });
}

function showUpdateBanner(worker) {
  pendingServiceWorker = worker;
  updateBanner.hidden = false;
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

function buildAdviceSections(sections) {
  return sections
    .map(([title, items]) => {
      return `
        <div>
          <strong>${escapeHtml(title)}</strong>
          <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      `;
    })
    .join("");
}

function scaleNumber(value, scale) {
  return Math.round((value * scale) / 5) * 5;
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
