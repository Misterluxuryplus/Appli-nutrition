"use strict";

const STORAGE_KEY = "objectif-equilibre-v1";

const defaultState = {
  profile: null,
  meals: [],
  sports: [],
  steps: {
    count: 0,
    calories: 0
  },
  waterLiters: 0,
  history: [],
  weight: {
    startWeight: null,
    lastWeight: null,
    lastWeighDate: null,
    frequencyDays: 30,
    entries: []
  },
  periodActive: null
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
const selectedMealEyebrow = document.querySelector("#selected-meal-eyebrow");
const selectedMealTitle = document.querySelector("#selected-meal-title");
const portionLegend = document.querySelector("#portion-legend");
const portionLightLabel = document.querySelector("#portion-light-label");
const portionNormalLabel = document.querySelector("#portion-normal-label");
const portionHeartyLabel = document.querySelector("#portion-hearty-label");
const mealSubmitButton = document.querySelector("#meal-submit-button");
const mealEstimateStatus = document.querySelector("#meal-estimate-status");
const barcodeScanInput = document.querySelector("#barcode-scan-input");
const barcodeStatus = document.querySelector("#barcode-status");
const barcodeResult = document.querySelector("#barcode-result");
const barcodeProductName = document.querySelector("#barcode-product-name");
const barcodeProductBrand = document.querySelector("#barcode-product-brand");
const barcodeProductCalories = document.querySelector("#barcode-product-calories");
const barcodeProductServing = document.querySelector("#barcode-product-serving");
const barcodeCustomQuantity = document.querySelector("#barcode-custom-quantity");
const barcodeQuantityStatus = document.querySelector("#barcode-quantity-status");
const barcodeAddDay = document.querySelector("#barcode-add-day");
const stepsInput = document.querySelector("#steps-input");
const stepsEstimate = document.querySelector("#steps-estimate");
const stepsMessage = document.querySelector("#steps-message");
const waterMessage = document.querySelector("#water-message");
const weightSetupForm = document.querySelector("#weight-setup-form");
const weightCard = document.querySelector("#weight-card");
const weightFrequency = document.querySelector("#weight-frequency");
const weightUpdateForm = document.querySelector("#weight-update-form");
const showWeightUpdate = document.querySelector("#show-weight-update");
const periodPanel = document.querySelector("#period-panel");
const periodMessage = document.querySelector("#period-message");
const updateBanner = document.querySelector("#update-banner");
const updateButton = document.querySelector("#update-button");

let pendingServiceWorker = null;
let refreshingForUpdate = false;
let currentScannedProduct = null;
let currentProductQuantity = null;

const mealLabels = {
  breakfast: "Ajouter mon petit-déjeuner",
  lunch: "Ajouter mon déjeuner",
  dinner: "Ajouter mon dîner",
  snack: "Ajouter une collation",
  pleasure: "Ajouter un écart / plaisir"
};

const mealPlaceholders = {
  breakfast: "Ex : fromage blanc, fruit, pain complet",
  lunch: "Ex : riz, poulet, légumes, yaourt",
  dinner: "Ex : poisson, légumes, pommes de terre",
  snack: "Ex : fruit, skyr, amandes",
  pleasure: "Ex : gâteau, bonbons, soda, glace, chips"
};

const LOCAL_NUTRITION_DATABASE = [
  { name: "œuf", aliases: ["oeuf dur", "oeufs durs", "oeufs dur", "oeuf", "oeufs"], kcal100: 155, defaultGrams: 50, unitCalories: 70 },
  { name: "poire", aliases: ["poire", "poires"], kcal100: 57, defaultGrams: 150 },
  { name: "pomme", aliases: ["pomme", "pommes"], kcal100: 54, defaultGrams: 150 },
  { name: "banane", aliases: ["banane", "bananes"], kcal100: 90, defaultGrams: 120 },
  { name: "riz cuit", aliases: ["riz cuit", "riz"], kcal100: 145, defaultGrams: 150 },
  { name: "pâtes cuites", aliases: ["pates cuites", "pates", "pasta"], kcal100: 150, defaultGrams: 150 },
  { name: "pomme de terre cuite", aliases: ["pomme de terre cuite", "pommes de terre", "patate"], kcal100: 85, defaultGrams: 200 },
  { name: "pain complet", aliases: ["pain complet", "tranche de pain complet", "tartine"], kcal100: 250, defaultGrams: 30 },
  { name: "poulet cuit", aliases: ["poulet cuit", "poulet"], kcal100: 165, defaultGrams: 120 },
  { name: "poisson blanc", aliases: ["poisson blanc", "cabillaud", "colin"], kcal100: 90, defaultGrams: 120 },
  { name: "saumon", aliases: ["saumon"], kcal100: 200, defaultGrams: 120 },
  { name: "skyr nature", aliases: ["skyr nature", "skyr"], kcal100: 60, defaultGrams: 150 },
  { name: "fromage blanc 0%", aliases: ["fromage blanc 0", "fromage blanc"], kcal100: 50, defaultGrams: 150 },
  { name: "yaourt nature", aliases: ["yaourt nature", "yaourt"], kcal100: 65, defaultGrams: 125 },
  { name: "chocolat", aliases: ["chocolat", "barre chocolatee"], kcal100: 540, defaultGrams: 30 },
  { name: "bonbons", aliases: ["bonbons", "bonbon"], kcal100: 360, defaultGrams: 40 },
  { name: "chips", aliases: ["chips"], kcal100: 535, defaultGrams: 40 },
  { name: "soda", aliases: ["soda", "cola", "canette de soda", "canette"], kcal100: 42, defaultGrams: 330, unit: "ml" },
  { name: "glace", aliases: ["glace"], kcal100: 210, defaultGrams: 100 },
  { name: "croissant", aliases: ["croissant", "viennoiserie"], kcal100: 406, defaultGrams: 60 },
  { name: "pizza", aliases: ["pizza"], kcal100: 260, defaultGrams: 300 },
  { name: "burger", aliases: ["burger", "hamburger"], kcal100: 295, defaultGrams: 220 }
];

const portionLabels = {
  light: "Léger",
  normal: "Normal",
  hearty: "Copieux",
  large: "Copieux"
};

const pleasurePortionLabels = {
  light: "Petit plaisir",
  normal: "Plaisir moyen",
  hearty: "Gros plaisir",
  large: "Gros plaisir"
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
  bindWeight();
  bindReset();
  setupSpeechRecognition();
  restoreProfileForm();
  render();
  registerServiceWorker();
}

function bindWeight() {
  weightSetupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(weightSetupForm);
    const startWeight = Number(formData.get("startWeight"));
    const frequencyDays = Number(formData.get("frequencyDays") || 30);
    if (!startWeight) return;

    const today = getTodayKey();
    state.weight = {
      startWeight,
      lastWeight: startWeight,
      lastWeighDate: today,
      frequencyDays,
      entries: [{ date: today, weight: startWeight }]
    };

    weightSetupForm.reset();
    saveState();
    render();
  });

  weightFrequency.addEventListener("change", () => {
    ensureWeightState();
    state.weight.frequencyDays = Number(weightFrequency.value || 30);
    saveState();
    render();
  });

  showWeightUpdate.addEventListener("click", () => {
    weightUpdateForm.hidden = false;
    weightUpdateForm.elements.currentWeight.focus();
  });

  weightUpdateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const currentWeight = Number(new FormData(weightUpdateForm).get("currentWeight"));
    if (!currentWeight) return;

    ensureWeightState();
    const today = getTodayKey();
    state.weight.lastWeight = currentWeight;
    state.weight.lastWeighDate = today;
    state.weight.entries = [
      ...(state.weight.entries || []).filter((entry) => entry.date !== today),
      { date: today, weight: currentWeight }
    ];

    weightUpdateForm.reset();
    weightUpdateForm.hidden = true;
    saveState();
    render();
  });

  document.querySelectorAll('input[name="periodActive"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.periodActive = input.value === "yes";
      saveState();
      render();
    });
  });
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

  mealForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(mealForm);
    const description = String(formData.get("description")).trim();
    const mealType = formData.get("mealType") || "breakfast";
    const portion = formData.get("portion");
    mealEstimateStatus.textContent = "Estimation approximative.";
    mealSubmitButton.disabled = true;
    mealSubmitButton.textContent = "Estimation...";

    const estimate = estimateMealCalories(description, portion);

    mealSubmitButton.disabled = false;
    configureMealForm(mealType);

    if (!estimate.found) {
      mealEstimateStatus.textContent = estimate.reason === "quantity"
        ? "Quantité non claire. Ajoutez une quantité précise, par exemple 150 g de riz cuit, 1 poire ou 2 œufs."
        : "Aliment non trouvé. Essayez d'ajouter une quantité ou un nom plus précis. Estimation approximative.";
      return;
    }

    state.meals.unshift({
      id: createId(),
      mealType,
      description,
      portion,
      calories: estimate.calories,
      estimateDetails: estimate.details,
      createdAt: new Date().toISOString()
    });

    mealForm.reset();
    mealForm.elements.mealType.value = mealType;
    mealForm.elements.portion.value = "normal";
    mealForm.hidden = true;
    resetScannedProduct();
    saveState();
    render();
  });

  barcodeScanInput.addEventListener("change", () => {
    handleBarcodeScan(barcodeScanInput.files?.[0]);
  });

  document.querySelectorAll("[data-product-quantity]").forEach((button) => {
    button.addEventListener("click", () => {
      chooseProductQuantity(button.dataset.productQuantity, button.dataset.productUnit);
    });
  });

  barcodeCustomQuantity.addEventListener("input", () => {
    chooseProductQuantity(Number(barcodeCustomQuantity.value || 0), currentScannedProduct?.unit);
  });

  barcodeAddDay.addEventListener("click", () => {
    addScannedProductToDay();
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
    stepsInput.value = "";
    render();
    showView("home");
  });
}

function openMealForm(mealType) {
  mealForm.hidden = false;
  mealForm.elements.mealType.value = mealType;
  configureMealForm(mealType);
  resetScannedProduct();
  mealForm.scrollIntoView({ behavior: "smooth", block: "start" });
  mealDescription.focus();
}

function configureMealForm(mealType) {
  const isPleasure = mealType === "pleasure";
  selectedMealEyebrow.textContent = isPleasure ? "Écart / plaisir" : "Repas";
  selectedMealTitle.textContent = mealLabels[mealType] || mealLabels.breakfast;
  mealDescription.placeholder = mealPlaceholders[mealType] || mealPlaceholders.lunch;
  portionLegend.textContent = isPleasure ? "Taille du plaisir" : "Taille du repas";
  portionLightLabel.textContent = isPleasure ? "Petit plaisir" : "Léger";
  portionNormalLabel.textContent = isPleasure ? "Moyen plaisir" : "Normal";
  portionHeartyLabel.textContent = isPleasure ? "Gros plaisir" : "Copieux";
  mealSubmitButton.textContent = isPleasure ? "Estimer le plaisir" : "Estimer le repas";
  mealEstimateStatus.textContent = "Estimation approximative.";
}

async function handleBarcodeScan(file) {
  if (!file) return;

  try {
    barcodeStatus.textContent = "Lecture du code-barres...";
    const value = await detectBarcodeFromImage(file);
    if (!value) {
      barcodeStatus.textContent = "Code-barres non détecté. Essayez une photo plus nette du code-barres.";
      return;
    }

    await loadScannedProduct(value);
  } catch {
    barcodeStatus.textContent = "Caméra ou scanner indisponible. Réessayez avec une photo plus nette du code-barres.";
  } finally {
    barcodeScanInput.value = "";
  }
}

async function detectBarcodeFromImage(file) {
  if ("BarcodeDetector" in window) {
    const image = await createImageBitmap(file);
    const detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"]
    });
    const codes = await detector.detect(image);
    if (codes[0]?.rawValue) return codes[0].rawValue;
  }

  return scanBarcodeWithZxing(file);
}

async function scanBarcodeWithZxing(file) {
  try {
    await ensureZxingBrowser();
    if (!window.ZXingBrowser?.BrowserMultiFormatReader) return "";
    const reader = new ZXingBrowser.BrowserMultiFormatReader();
    const imageUrl = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(imageUrl);
      return result?.getText?.() || result?.text || "";
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  } catch {
    return "";
  }
}

function ensureZxingBrowser() {
  if (window.ZXingBrowser?.BrowserMultiFormatReader) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@zxing/browser@latest/umd/index.min.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

async function loadScannedProduct(barcode) {
  barcodeStatus.textContent = "Recherche dans Open Food Facts...";
  resetScannedProduct();
  const product = await fetchOpenFoodFactsProduct(barcode);
  if (!product.found) {
    barcodeStatus.textContent = "Produit non trouvé dans Open Food Facts.";
    return;
  }

  currentScannedProduct = product;
  renderScannedProduct(product);
}

function renderScannedProduct(product) {
  barcodeProductName.textContent = product.name;
  barcodeProductBrand.textContent = product.brands || "Marque non renseignée";
  barcodeProductCalories.textContent = `${Math.round(product.kcal100)} kcal / 100 ${product.unit}`;
  barcodeProductServing.textContent = product.servingLabel || "Non renseignée";
  barcodeCustomQuantity.placeholder = `Quantité en ${product.unit}`;
  barcodeQuantityStatus.textContent = "Choisissez une quantité pour calculer les calories.";
  barcodeStatus.textContent = "Produit trouvé dans Open Food Facts.";
  barcodeResult.hidden = false;
  chooseProductQuantity(product.servingAmount || 0, product.unit);
}

function chooseProductQuantity(value, unit = currentScannedProduct?.unit) {
  if (!currentScannedProduct) return;
  const quantity = value === "serving" ? currentScannedProduct.servingAmount : Number(value || 0);
  if (!quantity) {
    currentProductQuantity = null;
    barcodeQuantityStatus.textContent = "Choisissez une quantité pour calculer les calories.";
    return;
  }

  currentProductQuantity = {
    quantity,
    unit: currentScannedProduct.unit || unit,
    calories: calculateFoodCalories(quantity, currentScannedProduct.kcal100)
  };
  barcodeQuantityStatus.textContent = `${Math.round(quantity)} ${currentProductQuantity.unit} ≈ ${formatCalories(currentProductQuantity.calories)}. Estimation approximative.`;
}

function addScannedProductToDay() {
  if (!currentScannedProduct || !currentProductQuantity) {
    barcodeQuantityStatus.textContent = "Choisissez une quantité avant d'ajouter le produit.";
    return;
  }

  const mealType = mealForm.elements.mealType.value || "snack";
  state.meals.unshift({
    id: createId(),
    mealType,
    description: `${currentScannedProduct.name}${currentScannedProduct.brands ? ` - ${currentScannedProduct.brands}` : ""}`,
    portion: "normal",
    calories: currentProductQuantity.calories,
    source: "barcode",
    estimateDetails: `${Math.round(currentProductQuantity.quantity)} ${currentProductQuantity.unit}, ${Math.round(currentScannedProduct.kcal100)} kcal/100 ${currentScannedProduct.unit}, Open Food Facts. Estimation approximative.`,
    createdAt: new Date().toISOString()
  });

  mealForm.reset();
  mealForm.elements.mealType.value = mealType;
  mealForm.elements.portion.value = "normal";
  mealForm.hidden = true;
  resetScannedProduct();
  saveState();
  render();
}

function resetScannedProduct() {
  currentScannedProduct = null;
  currentProductQuantity = null;
  barcodeResult.hidden = true;
  barcodeCustomQuantity.value = "";
  barcodeQuantityStatus.textContent = "Choisissez une quantité pour calculer les calories.";
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
  const localEstimate = estimateFromLocalNutrition(description, portion);
  return localEstimate;
}

function estimateFromLocalNutrition(description, portion) {
  const normalized = normalizeText(description);
  const matches = [];
  const usedFoods = new Set();
  let needsQuantity = false;

  LOCAL_NUTRITION_DATABASE.forEach((food) => {
    const alias = findFoodAlias(normalized, food);
    if (!alias || usedFoods.has(food.name)) return;
    const explicitGrams = extractExplicitAmount(normalized, alias);
    const quantity = extractServingQuantity(normalized, alias);
    if (!explicitGrams && !quantity) {
      needsQuantity = true;
      return;
    }
    const grams = explicitGrams || quantity * food.defaultGrams;
    const calories = food.unitCalories && !explicitGrams
      ? Math.round(quantity * food.unitCalories)
      : calculateFoodCalories(grams, food.kcal100);
    matches.push({ food, alias, grams, quantity, calories, usesUnitCalories: Boolean(food.unitCalories && !explicitGrams) });
    usedFoods.add(food.name);
  });

  if (needsQuantity) return { found: false, reason: "quantity" };
  if (!matches.length) return { found: false };

  const total = Math.round(matches.reduce((sum, item) => sum + item.calories, 0));
  const details = matches
    .map((item) => {
      if (item.usesUnitCalories) {
        return `${item.quantity} ${item.food.name}${item.quantity > 1 ? "s" : ""} (${item.food.unitCalories} kcal/pièce)`;
      }
      return `${item.food.name} ${Math.round(item.grams)} ${item.food.unit || "g"} (${item.food.kcal100} kcal/100 ${item.food.unit || "g"})`;
    })
    .join(", ");

  return {
    found: true,
    calories: total,
    details: `${details}. Estimation approximative.`
  };
}

async function fetchOpenFoodFactsProduct(barcode) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,product_quantity`
    );
    if (!response.ok) return { found: false };
    const data = await response.json();
    if (data.status === 0 || !data.product) return { found: false };
    return normalizeOpenFoodFactsProduct(data.product, barcode);
  } catch {
    return { found: false };
  }
}

function normalizeOpenFoodFactsProduct(product, barcode) {
  const kcal100ml = Number(product.nutriments?.["energy-kcal_100ml"] || 0);
  const kcal100g = Number(product.nutriments?.["energy-kcal_100g"] || 0);
  const usesMilliliters = Boolean(kcal100ml);
  const kcal100 = usesMilliliters ? kcal100ml : kcal100g;
  if (!kcal100) return { found: false };

  const unit = usesMilliliters ? "ml" : "g";
  const servingFromText = parseAmountWithUnit(product.serving_size);
  const servingAmount = Number(product.serving_quantity || 0) || servingFromText.amount || Number(product.product_quantity || 0) || 0;

  return {
    found: true,
    barcode,
    name: product.product_name || `Produit ${barcode}`,
    brands: product.brands || "",
    kcal100,
    unit,
    servingAmount,
    servingLabel: product.serving_size || (servingAmount ? `${Math.round(servingAmount)} ${unit}` : ""),
    productQuantity: Number(product.product_quantity || 0)
  };
}

function parseAmountWithUnit(value) {
  const matches = [...String(value || "").toLowerCase().matchAll(/(\d+(?:[,.]\d+)?)\s*(g|gr|gramme|grammes|ml|cl)\b/g)];
  if (!matches.length) return { amount: 0, unit: "" };
  const match = matches[matches.length - 1];
  const amount = Number(match[1].replace(",", "."));
  const unit = match[2];
  return {
    amount: unit === "cl" ? amount * 10 : amount,
    unit: unit === "cl" ? "ml" : unit
  };
}

function findFoodAlias(normalizedDescription, food) {
  return food.aliases
    .map((alias) => normalizeText(alias))
    .sort((a, b) => b.length - a.length)
    .find((alias) => new RegExp(`\\b${escapeRegex(alias)}\\b`).test(normalizedDescription));
}

function extractExplicitAmount(text, alias) {
  const escapedAlias = escapeRegex(alias);
  const unit = "(g|gr|gramme|grammes|ml|cl)";
  const before = text.match(new RegExp(`(\\d+(?:[,.]\\d+)?)\\s*${unit}\\s*(?:de|d'|du|des)?\\s*${escapedAlias}`));
  const after = text.match(new RegExp(`${escapedAlias}\\s*(?:de|d'|du|des)?\\s*(\\d+(?:[,.]\\d+)?)\\s*${unit}`));
  const globalAmount = text.match(new RegExp(`(\\d+(?:[,.]\\d+)?)\\s*${unit}\\b`));
  const value = before?.[1] || after?.[1] || globalAmount?.[1];
  const valueUnit = before?.[2] || after?.[2] || globalAmount?.[2];
  if (!value) return 0;
  const amount = Number(value.replace(",", "."));
  return valueUnit === "cl" ? amount * 10 : amount;
}

function extractServingQuantity(text, alias) {
  const escapedAlias = escapeRegex(alias);
  const numeric = text.match(new RegExp(`\\b(\\d+(?:[,.]\\d+)?)\\s*(?:x\\s*)?(?:de\\s+|d'|du\\s+|des\\s+)?${escapedAlias}\\b`));
  if (numeric) return Number(numeric[1].replace(",", "."));

  const words = {
    un: 1,
    une: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5
  };
  const word = Object.keys(words).find((key) => new RegExp(`\\b${key}\\s+(?:de\\s+|d'|du\\s+|des\\s+)?${escapedAlias}\\b`).test(text));
  return word ? words[word] : 0;
}

function calculateFoodCalories(grams, kcal100) {
  return Math.round((Number(grams || 0) * Number(kcal100 || 0)) / 100);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  renderHistory();
  renderWeight();
}

function renderNavigationState() {
  document.querySelectorAll('[data-view-target="day"], [data-view-target="history"]').forEach((button) => {
    button.hidden = false;
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
        <small>${getPortionLabel(meal)} · ${formatCalories(meal.calories)}</small>
        <small>Estimation approximative.</small>
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
  const pleasure = sumCalories(state.meals.filter((meal) => meal.mealType === "pleasure"));
  const sport = sumCalories(state.sports);
  const stepsCalories = Number(state.steps?.calories || 0);
  const remaining = target - eaten + sport + stepsCalories;
  const progress = target ? Math.min((eaten / target) * 100, 100) : 0;

  document.querySelector("#summary-food").textContent = formatCalories(eaten);
  document.querySelector("#summary-sport").textContent = formatCalories(sport);
  document.querySelector("#summary-steps").textContent = formatCalories(stepsCalories);
  document.querySelector("#summary-balance").textContent = target ? formatCalories(Math.max(remaining, 0)) : "-";
  document.querySelector("#summary-pleasure").textContent = `🍫 Plaisirs notés : ${formatCalories(pleasure)}`;
  document.querySelector("#progress-target-label").textContent = target ? formatCalories(target) : "Objectif du jour";

  const progressFill = document.querySelector("#calorie-progress");
  progressFill.style.width = `${progress}%`;
  progressFill.classList.toggle("is-over", target > 0 && eaten > target);
  document.querySelector("#kind-message").textContent = buildKindMessage(target, remaining);
}

function renderHistory() {
  const list = document.querySelector("#history-list");
  const detail = document.querySelector("#history-detail");
  list.innerHTML = "";

  const entries = [...(state.history || [])].sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) {
    list.innerHTML = `<p class="empty-state">⚪ Aucune donnée enregistrée pour le moment.</p>`;
    detail.hidden = true;
    return;
  }

  entries.forEach((entry) => {
    const status = getDayStatus(entry);
    const button = document.createElement("button");
    button.className = "history-day-button";
    button.type = "button";
    button.dataset.historyDate = entry.date;
    button.innerHTML = `
      <span>${formatDate(entry.date)}</span>
      <strong>${status.label}</strong>
    `;
    list.append(button);
  });

  list.querySelectorAll("[data-history-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = entries.find((item) => item.date === button.dataset.historyDate);
      if (entry) renderHistoryDetail(entry);
    });
  });

  renderHistoryDetail(entries[0]);
}

function renderHistoryDetail(entry) {
  const status = getDayStatus(entry);
  document.querySelector("#history-detail").hidden = false;
  document.querySelector("#history-detail-title").textContent = formatDate(entry.date);
  document.querySelector("#history-detail-food").textContent = formatCalories(entry.eaten || 0);
  document.querySelector("#history-detail-sport").textContent = formatCalories(entry.sport || 0);
  document.querySelector("#history-detail-steps").textContent = `${Number(entry.steps || 0).toLocaleString("fr-FR")} pas`;
  document.querySelector("#history-detail-water").textContent = formatLiters(entry.waterLiters || 0);
  document.querySelector("#history-detail-status").textContent = status.label;
}

function getDayStatus(entry) {
  const hasData = Number(entry.eaten || 0) || Number(entry.sport || 0) || Number(entry.steps || 0) || Number(entry.waterLiters || 0);
  if (!hasData) return { level: "none", label: "⚪ Aucune donnée" };
  if (!entry.target) return { level: "none", label: "⚪ Aucune donnée" };
  const remaining = Number(entry.target) - Number(entry.eaten || 0) + Number(entry.sport || 0) + Number(entry.stepsCalories || 0);
  if (remaining >= 0) return { level: "ok", label: "🟢 Dans l'objectif" };
  if (remaining >= -300) return { level: "near", label: "🟠 Proche de l'objectif" };
  return { level: "over", label: "🔴 Au-dessus de l'objectif" };
}

function renderWeight() {
  ensureWeightState();
  const hasWeight = Boolean(state.weight.startWeight && state.weight.lastWeight);
  weightSetupForm.hidden = hasWeight;
  weightCard.hidden = !hasWeight;
  if (!hasWeight) return;

  const frequency = Number(state.weight.frequencyDays || 30);
  const nextDate = addDays(state.weight.lastWeighDate || getTodayKey(), frequency);
  const isDue = getTodayKey() >= nextDate;
  const startWeight = Number(state.weight.startWeight);
  const lastWeight = Number(state.weight.lastWeight);
  const change = lastWeight - startWeight;
  const progression = startWeight ? (change / startWeight) * 100 : 0;

  document.querySelector("#weight-current").textContent = formatWeight(startWeight);
  document.querySelector("#weight-last").textContent = formatWeight(lastWeight);
  weightFrequency.value = String(frequency);
  document.querySelector("#next-weigh-date").textContent = formatDate(nextDate);
  document.querySelector("#weigh-due").hidden = !isDue;
  document.querySelector("#weight-result-current").textContent = formatWeight(lastWeight);
  document.querySelector("#weight-result-change").textContent = formatSignedWeight(change);
  document.querySelector("#weight-result-total").textContent = formatSignedPercent(progression);
  document.querySelector("#weight-message").textContent = buildWeightMessage(change);
  document.querySelector("#weight-results").hidden = false;

  const isFemale = state.profile?.sex === "female";
  periodPanel.hidden = !isFemale;
  if (isFemale) {
    document.querySelectorAll('input[name="periodActive"]').forEach((input) => {
      input.checked = state.periodActive === (input.value === "yes");
    });
    periodMessage.hidden = state.periodActive !== true;
    if (state.periodActive === true) {
      document.querySelector("#weight-message").textContent =
        "Cette pesée peut être influencée par les règles. Il est conseillé d'observer votre évolution sur plusieurs semaines.";
    }
  }
}

function buildWeightMessage(change) {
  if (change < -0.2) return "🎉 Bravo, vos efforts portent leurs fruits.";
  if (change > 0.5) return "🙂 Une variation ponctuelle est normale. Continuez vos bonnes habitudes.";
  return "👍 Continuez, la régularité est la clé.";
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
  syncTodayHistory();
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

function syncTodayHistory() {
  const todayEntry = buildTodayHistoryEntry();
  state.history = [
    ...(state.history || []).filter((entry) => entry.date !== todayEntry.date),
    todayEntry
  ].slice(-90);
}

function buildTodayHistoryEntry() {
  return {
    date: getTodayKey(),
    target: state.profile?.calculations.target || 0,
    eaten: sumCalories(state.meals),
    sport: sumCalories(state.sports),
    steps: Number(state.steps?.count || 0),
    stepsCalories: Number(state.steps?.calories || 0),
    waterLiters: Number(state.waterLiters || 0)
  };
}

function ensureWeightState() {
  state.weight = {
    ...structuredClone(defaultState.weight),
    ...(state.weight || {})
  };
  state.weight.entries = state.weight.entries || [];
  state.weight.frequencyDays = Number(state.weight.frequencyDays || 30);
}

function getTodayKey() {
  return toDateKey(new Date());
}

function addDays(dateKey, days) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + Number(days || 30));
  return toDateKey(date);
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sumCalories(entries) {
  return entries.reduce((total, entry) => total + Number(entry.calories || 0), 0);
}

function getPortionLabel(meal) {
  const labels = meal.mealType === "pleasure" ? pleasurePortionLabels : portionLabels;
  return labels[meal.portion] || labels.normal || "Normal";
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

function formatWeight(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })} kg`;
}

function formatSignedWeight(value) {
  const rounded = Number(value || 0);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })} kg`;
}

function formatSignedPercent(value) {
  const rounded = Number(value || 0);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })} %`;
}

function formatDate(dateKey) {
  if (!dateKey) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parseDateKey(dateKey));
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
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
