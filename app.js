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
  { name: "œuf dur", aliases: ["oeuf dur", "oeufs durs", "oeufs dur", "oeuf", "oeufs"], kcal100: 155, defaultGrams: 50, unitCalories: 70 },
  { name: "poire", aliases: ["poire", "poires"], kcal100: 57, defaultGrams: 150 },
  { name: "pomme", aliases: ["pomme", "pommes"], kcal100: 54, defaultGrams: 150 },
  { name: "banane", aliases: ["banane", "bananes"], kcal100: 90, defaultGrams: 110 },
  { name: "orange", aliases: ["orange", "oranges"], kcal100: 47, defaultGrams: 180 },
  { name: "kiwi", aliases: ["kiwi", "kiwis"], kcal100: 61, defaultGrams: 80 },
  { name: "riz cuit", aliases: ["riz cuit", "riz"], kcal100: 145, defaultGrams: 150 },
  { name: "pâtes cuites", aliases: ["pates cuites", "pates", "pasta"], kcal100: 150, defaultGrams: 150 },
  { name: "pomme de terre cuite", aliases: ["pomme de terre cuite", "pommes de terre", "patate"], kcal100: 85, defaultGrams: 200 },
  { name: "semoule cuite", aliases: ["semoule cuite", "semoule"], kcal100: 120, defaultGrams: 120 },
  { name: "pain complet", aliases: ["pain complet", "tranche de pain complet", "tartine complete"], kcal100: 250, defaultGrams: 60, portionWeights: { tranche: 30, portion: 60 } },
  { name: "pain blanc", aliases: ["pain blanc", "baguette", "tranche de pain blanc", "tartine"], kcal100: 265, defaultGrams: 30, portionWeights: { tranche: 30, portion: 60 } },
  { name: "beurre", aliases: ["beurre doux", "beurre demi sel", "beurre"], kcal100: 753, defaultGrams: 10, portionWeights: { cuillere_cafe: 5, cuillere_soupe: 15, portion: 10 } },
  { name: "poulet cuit", aliases: ["poulet cuit", "poulet"], kcal100: 165, defaultGrams: 120 },
  { name: "dinde cuite", aliases: ["dinde cuite", "dinde"], kcal100: 150, defaultGrams: 120 },
  { name: "steak haché cuit", aliases: ["steak hache cuit", "steak hache", "boeuf hache"], kcal100: 250, defaultGrams: 100 },
  { name: "viande cuite", aliases: ["viande cuite", "viande"], kcal100: 220, defaultGrams: 150 },
  { name: "poisson blanc", aliases: ["poisson blanc", "cabillaud", "colin"], kcal100: 90, defaultGrams: 120 },
  { name: "saumon", aliases: ["saumon"], kcal100: 200, defaultGrams: 120 },
  { name: "thon au naturel", aliases: ["thon au naturel", "thon nature", "thon"], kcal100: 116, defaultGrams: 100 },
  { name: "skyr nature", aliases: ["skyr nature", "skyr"], kcal100: 60, defaultGrams: 150 },
  { name: "fromage blanc 0%", aliases: ["fromage blanc 0", "fromage blanc"], kcal100: 50, defaultGrams: 200 },
  { name: "yaourt nature", aliases: ["yaourt nature", "yaourt"], kcal100: 65, defaultGrams: 125 },
  { name: "fromage", aliases: ["fromage rape", "fromage râpé", "fromage"], kcal100: 350, defaultGrams: 30 },
  { name: "lait demi-écrémé", aliases: ["lait demi ecreme", "lait"], kcal100: 47, defaultGrams: 250, unit: "ml", portionWeights: { verre: 250, portion: 250 } },
  { name: "légumes cuits", aliases: ["legumes cuits", "legumes"], kcal100: 35, defaultGrams: 150 },
  { name: "carotte cuite", aliases: ["carotte cuite", "carottes cuites", "carotte", "carottes"], kcal100: 35, defaultGrams: 150 },
  { name: "courgette cuite", aliases: ["courgette cuite", "courgettes cuites", "courgette", "courgettes"], kcal100: 17, defaultGrams: 150 },
  { name: "brocoli cuit", aliases: ["brocoli cuit", "brocolis cuits", "brocoli", "brocolis"], kcal100: 29, defaultGrams: 150 },
  { name: "haricots verts cuits", aliases: ["haricots verts cuits", "haricots verts"], kcal100: 30, defaultGrams: 150 },
  { name: "tomate", aliases: ["tomate", "tomates"], kcal100: 18, defaultGrams: 120 },
  { name: "lentilles cuites", aliases: ["lentilles cuites", "lentilles"], kcal100: 112, defaultGrams: 150 },
  { name: "pois chiches cuits", aliases: ["pois chiches cuits", "pois chiches"], kcal100: 147, defaultGrams: 150 },
  { name: "haricots rouges cuits", aliases: ["haricots rouges cuits", "haricots rouges"], kcal100: 115, defaultGrams: 150 },
  { name: "tofu nature", aliases: ["tofu nature", "tofu"], kcal100: 125, defaultGrams: 120 },
  { name: "huile d'olive", aliases: ["huile d'olive", "huile olive", "huile"], kcal100: 900, defaultGrams: 10, portionWeights: { cuillere_cafe: 5, cuillere_soupe: 15 } }
];

const HOMEMADE_DISHES = ["lasagnes maison", "gratin maison", "couscous maison", "quiche maison", "plat maison"];
const INDUSTRIAL_PRODUCT_TERMS = ["coca", "coca cola", "kinder bueno", "danette", "chips", "biscuits", "biscuit", "soda", "boisson", "barre chocolatee", "cereales", "yaourt de marque", "plat prepare"];

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
    console.log("submit repas déclenché");
    const formData = new FormData(mealForm);
    const description = String(formData.get("description")).trim();
    const mealType = formData.get("mealType") || "breakfast";
    console.log("mealType:", mealType);
    console.log("description:", description);

    if (!description) {
      setMealEstimateStatus("Décrivez votre repas avant de l'estimer.", "error");
      return;
    }

    setMealEstimateStatus("Estimation approximative.", "default");
    mealSubmitButton.disabled = true;
    mealSubmitButton.textContent = "Ajout...";

    const estimate = estimateMealCalories(description);
    console.log("calories:", estimate.calories || 0);

    mealSubmitButton.disabled = false;
    configureMealForm(mealType);

    if (!estimate.found) {
      const unknown = estimate.unknown?.join(", ");
      const messages = {
        partial: `Certains éléments n'ont pas été reconnus : ${unknown || "nom imprécis"}. Précisez leur nom si nécessaire.`,
        homemade: "Plat maison détecté. Détailler les ingrédients : indiquez chaque ingrédient et sa quantité. Sans détail, aucune calorie fiable n'est ajoutée. Estimation approximative.",
        industrial: "Produit industriel détecté. Utilisez « Scanner un produit » pour récupérer les données réelles Open Food Facts."
      };
      setMealEstimateStatus(
        messages[estimate.reason] || "Aucun aliment reconnu. Précisez le nom ou utilisez le scanner pour un produit industriel.",
        "error"
      );
      return;
    }

    state.meals.unshift({
      id: createId(),
      mealType,
      description,
      calories: estimate.calories,
      estimateDetails: estimate.details,
      usedAveragePortion: estimate.usedAveragePortion,
      createdAt: new Date().toISOString()
    });

    mealForm.reset();
    mealForm.elements.mealType.value = mealType;
    mealForm.hidden = true;
    resetScannedProduct();
    saveState();
    render();
  });

  mealForm.addEventListener("invalid", (event) => {
    event.preventDefault();
    setMealEstimateStatus("Complétez les champs du repas avant de valider.", "error");
  }, true);

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
  mealSubmitButton.textContent = "Ajouter ce repas";
  setMealEstimateStatus("Estimation approximative.", "default");
}

function setMealEstimateStatus(message, type = "default") {
  mealEstimateStatus.textContent = message;
  mealEstimateStatus.classList.toggle("is-error", type === "error");
  mealEstimateStatus.classList.toggle("is-success", type === "success");
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
    calories: currentProductQuantity.calories,
    source: "barcode",
    estimateDetails: `${Math.round(currentProductQuantity.quantity)} ${currentProductQuantity.unit}, ${Math.round(currentScannedProduct.kcal100)} kcal/100 ${currentScannedProduct.unit}, Open Food Facts. Estimation approximative.`,
    createdAt: new Date().toISOString()
  });

  mealForm.reset();
  mealForm.elements.mealType.value = mealType;
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

function estimateMealCalories(description) {
  const localEstimate = estimateFromLocalNutrition(description);
  return localEstimate;
}

function estimateFromLocalNutrition(description) {
  const matches = [];
  const unknownSegments = [];
  const homemadeSegments = [];
  const industrialSegments = [];

  splitFoodSegments(description).forEach((segment) => {
    if (isHomemadeDish(segment)) {
      homemadeSegments.push(segment);
      return;
    }
    if (isIndustrialProduct(segment)) {
      industrialSegments.push(segment);
      return;
    }

    const foodMatches = findFoodMatches(segment);
    if (!foodMatches.length) {
      unknownSegments.push(segment);
      return;
    }

    foodMatches.forEach(({ food, alias }) => {
      const explicitAmount = extractExplicitAmount(segment, alias, food.unit || "g");
      const serving = explicitAmount ? null : extractServingAmount(segment, alias, food);
      const usedAveragePortion = !explicitAmount && !serving;
      const amount = explicitAmount?.amount || serving?.amount || food.defaultGrams;
      const quantity = serving?.quantity || (usedAveragePortion ? 1 : 0);
      const usesUnitCalories = Boolean(food.unitCalories && (serving?.unitKey === "piece" || usedAveragePortion));
      const calories = usesUnitCalories
        ? Math.round(quantity * food.unitCalories)
        : calculateFoodCalories(amount, food.kcal100);

      matches.push({
        food,
        alias,
        amount,
        quantity,
        calories,
        usesUnitCalories,
        usedAveragePortion,
        unit: food.unit || "g"
      });
    });
  });

  if (homemadeSegments.length && !matches.length) {
    return { found: false, reason: "homemade", unknown: homemadeSegments };
  }
  if (industrialSegments.length) {
    return { found: false, reason: "industrial", unknown: industrialSegments };
  }
  if (unknownSegments.length) {
    return { found: false, reason: "partial", unknown: unknownSegments };
  }
  if (!matches.length) return { found: false };

  const total = Math.round(matches.reduce((sum, item) => sum + item.calories, 0));
  const details = matches
    .map((item) => {
      if (item.usesUnitCalories) {
        const averageNote = item.usedAveragePortion ? " — quantité non précisée, portion moyenne utilisée" : "";
        return `${item.quantity} × ${item.food.name} = ${item.calories} kcal (${item.food.unitCalories} kcal/pièce)${averageNote}`;
      }
      const averageNote = item.usedAveragePortion ? " — quantité non précisée, portion moyenne utilisée" : "";
      return `${item.food.name} ${Math.round(item.amount)} ${item.unit} = ${item.calories} kcal (${item.food.kcal100} kcal/100 ${item.unit})${averageNote}`;
    })
    .join(" · ");

  return {
    found: true,
    calories: total,
    usedAveragePortion: matches.some((item) => item.usedAveragePortion),
    details: `${details} · Total = ${formatCalories(total)}. Estimation approximative, base locale inspirée de Ciqual/ANSES.`
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

function splitFoodSegments(description) {
  return String(description)
    .split(/\r?\n|,|;|\+/)
    .map((segment) => normalizeText(segment).trim())
    .filter(Boolean);
}

function isHomemadeDish(segment) {
  return HOMEMADE_DISHES.some((dish) => segment.includes(normalizeText(dish)));
}

function isIndustrialProduct(segment) {
  return INDUSTRIAL_PRODUCT_TERMS.some((term) => segment.includes(normalizeText(term)));
}

function findFoodMatches(segment) {
  const candidates = [];

  LOCAL_NUTRITION_DATABASE.forEach((food) => {
    food.aliases.forEach((rawAlias) => {
      const alias = normalizeText(rawAlias);
      const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "g");
      let match = regex.exec(segment);
      while (match) {
        candidates.push({ food, alias, index: match.index, end: match.index + alias.length });
        match = regex.exec(segment);
      }
    });
  });

  return candidates
    .sort((a, b) => a.index - b.index || (b.end - b.index) - (a.end - a.index))
    .filter((candidate, index, all) => {
      return !all.slice(0, index).some((selected) => {
        const overlaps = candidate.index < selected.end && candidate.end > selected.index;
        return overlaps && (selected.end - selected.index) >= (candidate.end - candidate.index);
      });
    });
}

function extractExplicitAmount(text, alias, expectedUnit) {
  const escapedAlias = escapeRegex(alias);
  const unit = "(kg|kilogramme|kilogrammes|g|gr|gramme|grammes|ml|cl|l|litre|litres)";
  const before = text.match(new RegExp(`(\\d+(?:[,.]\\d+)?)\\s*${unit}\\s*(?:de|d'|du|des)?\\s*${escapedAlias}`));
  const after = text.match(new RegExp(`${escapedAlias}\\s*(?:de|d'|du|des)?\\s*(\\d+(?:[,.]\\d+)?)\\s*${unit}`));
  const afterHasFollowingFood = after
    ? findFoodMatches(text.slice((after.index || 0) + after[0].length)).length > 0
    : false;
  const acceptedAfter = afterHasFollowingFood ? null : after;
  const value = before?.[1] || acceptedAfter?.[1];
  const valueUnit = before?.[2] || acceptedAfter?.[2];
  if (!value) return null;
  return convertExplicitAmount(Number(value.replace(",", ".")), valueUnit, expectedUnit);
}

function convertExplicitAmount(amount, rawUnit, expectedUnit) {
  const unit = normalizeText(rawUnit);
  const converted = unit === "kg" || unit.startsWith("kilogramme")
    ? { amount: amount * 1000, unit: "g" }
    : unit === "l" || unit.startsWith("litre")
      ? { amount: amount * 1000, unit: "ml" }
      : unit === "cl"
        ? { amount: amount * 10, unit: "ml" }
        : unit === "ml"
          ? { amount, unit: "ml" }
          : { amount, unit: "g" };

  return converted.unit === expectedUnit ? converted : null;
}

function extractServingAmount(text, alias, food) {
  const escapedAlias = escapeRegex(alias);
  const quantityToken = "(\\d+(?:[,.]\\d+)?|un|une|deux|trois|quatre|cinq)";
  const servingUnit = "(portions?|tranches?|cuilleres?\\s+a\\s+soupe|cuilleres?\\s+a\\s+cafe|verres?|pieces?)";
  const withUnit = text.match(new RegExp(`\\b${quantityToken}\\s*${servingUnit}\\s*(?:de\\s+|d'|du\\s+|des\\s+)?${escapedAlias}\\b`));
  const direct = text.match(new RegExp(`\\b${quantityToken}\\s*(?:x\\s*)?(?:de\\s+|d'|du\\s+|des\\s+)?${escapedAlias}\\b`));
  const match = withUnit || direct;
  if (!match) return null;

  const quantity = parseQuantityToken(match[1]);
  const unitKey = withUnit ? normalizeServingUnit(match[2]) : "piece";
  const amountPerUnit = food.portionWeights?.[unitKey] || food.defaultGrams;
  return {
    quantity,
    unitKey,
    amount: quantity * amountPerUnit
  };
}

function parseQuantityToken(value) {
  const words = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5 };
  return words[value] || Number(String(value).replace(",", "."));
}

function normalizeServingUnit(value) {
  const unit = normalizeText(value);
  if (unit.startsWith("tranche")) return "tranche";
  if (unit.includes("cuillere") && unit.includes("soupe")) return "cuillere_soupe";
  if (unit.includes("cuillere") && unit.includes("cafe")) return "cuillere_cafe";
  if (unit.startsWith("verre")) return "verre";
  if (unit.startsWith("portion")) return "portion";
  return "piece";
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
  document.querySelector("#target-result").textContent = `${formatCalories(target)} par jour`;
  document.querySelector("#bmr-sentence").textContent = `Votre corps brûle environ ${formatCalories(bmr)} par jour, même au repos.`;
  document.querySelector("#maintenance-sentence").textContent = `En mangeant environ ${formatCalories(maintenance)} par jour, votre poids devrait rester stable.`;
  document.querySelector("#target-sentence").textContent = "Cette valeur reste une estimation simple.";
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
        <strong>🍽️ Calories estimées :</strong>
        <span>${formatCalories(meal.calories)}</span>
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
  waterMessage.textContent = liters >= 2 ? "Bonne hydratation 👍" : "Boire aide aussi la satiété et l’énergie.";
  document.querySelectorAll("[data-water]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.water) === liters);
  });
}

function renderSummary() {
  const calculations = state.profile?.calculations || {};
  const maintenance = calculations.maintenance || 0;
  const eaten = sumCalories(state.meals);
  const sport = sumCalories(state.sports);
  const stepsCalories = Number(state.steps?.calories || 0);
  const totalNet = eaten - sport - stepsCalories;
  const delta = Math.abs(maintenance - totalNet);
  const balanceStatus = getDailyBalanceStatus(maintenance, totalNet, delta);

  document.querySelector("#summary-food").textContent = formatCalories(eaten);
  document.querySelector("#summary-maintenance").textContent = maintenance ? formatCalories(maintenance) : "-";
  document.querySelector("#summary-delta-label").textContent = balanceStatus.label;
  document.querySelector("#summary-delta").textContent = maintenance ? balanceStatus.value : "-";
  document.querySelector("#summary-sport").textContent = formatCalories(sport);
  document.querySelector("#summary-steps").textContent = formatCalories(stepsCalories);
  document.querySelector("#kind-message").textContent = balanceStatus.message;
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
  const maintenance = Number(entry.maintenance || entry.target || 0);
  if (!hasData || !maintenance) return { level: "none", label: "⚪ Aucune donnée" };
  const net = Number(entry.eaten || 0) - Number(entry.sport || 0) - Number(entry.stepsCalories || 0);
  const delta = net - maintenance;
  if (Math.abs(delta) <= 100) return { level: "near", label: "🟠 Proche du maintien" };
  if (delta < 0) return { level: "ok", label: "🟢 Déficit du jour" };
  return { level: "over", label: "🔴 Au-dessus du maintien" };
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

function getDailyBalanceStatus(maintenance, totalNet, delta) {
  if (!maintenance) {
    return {
      label: "📊 Bilan",
      value: "-",
      message: "Remplissez votre profil pour obtenir une estimation adaptée."
    };
  }
  if (delta <= 100) {
    return {
      label: "✅ Journée équilibrée",
      value: "Proche",
      message: "Vous êtes proche de votre maintien aujourd'hui."
    };
  }
  if (totalNet < maintenance) {
    return {
      label: "📉 Déficit du jour",
      value: formatCalories(delta),
      message: `Vous avez consommé environ ${formatCalories(delta)} de moins que votre maintien aujourd'hui.`
    };
  }
  return {
    label: "📈 Excédent du jour",
    value: formatCalories(delta),
    message: `Vous avez consommé environ ${formatCalories(delta)} de plus que votre maintien aujourd'hui.`
  };
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
    maintenance: state.profile?.calculations.maintenance || 0,
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
