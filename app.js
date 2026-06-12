const STORAGE_KEY = "muscu-coach-mobile";
const MAX_REST_SECONDS = 180;
const TRANSITION_REST_SECONDS = 120;
const defaultWarmup = { type: "Tapis de course", duration: 15, calories: 0, skipped: false };

const thumbnails = {
  push: `<svg viewBox="0 0 120 140" role="img" aria-label="Développé"><rect width="120" height="140" rx="22" fill="#141b28"/><circle cx="60" cy="34" r="15" fill="#ffd166"/><path d="M40 62c13-15 27-15 40 0v38H40z" fill="#38bdf8"/><path d="M18 78h26M76 78h26M44 64v28M76 64v28M50 78h20" stroke="#ff7a3d" stroke-width="8" stroke-linecap="round"/></svg>`,
  pull: `<svg viewBox="0 0 120 140" role="img" aria-label="Tirage"><rect width="120" height="140" rx="22" fill="#121a26"/><path d="M28 28h64M40 28c0 25 8 42 20 42s20-17 20-42" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="75" r="14" fill="#ffd166"/><path d="M38 102c16-15 28-15 44 0v22H38z" fill="#ff7a3d"/></svg>`,
  legs: `<svg viewBox="0 0 120 140" role="img" aria-label="Jambes"><rect width="120" height="140" rx="22" fill="#141b28"/><circle cx="60" cy="30" r="14" fill="#ffd166"/><path d="M44 54h32l8 34H36z" fill="#56e39f"/><path d="M48 88l-14 34M72 88l14 34M38 122h24M58 122h24" stroke="#ff7a3d" stroke-width="8" stroke-linecap="round"/></svg>`,
};

const exerciseVideos = {
  bench: "https://www.youtube.com/shorts/R5V7c7UsMoc",
  shoulder: "https://www.youtube.com/shorts/qEwKCR5JCog",
  dips: "https://www.youtube.com/shorts/2z8JmcrW-As",
  row: "https://www.youtube.com/shorts/GZbfZ033f74",
  pulldown: "https://www.youtube.com/shorts/CAwf7n6Luuc",
  curl: "https://www.youtube.com/shorts/ykJmrZ5v0Oo",
  squat: "https://www.youtube.com/shorts/U3HlEF_E9fo",
  rdl: "https://www.youtube.com/shorts/0zOgz82yNJM",
  press: "https://www.youtube.com/shorts/IZxyjW7MPJQ",
  plank: "https://www.youtube.com/shorts/pSHjTRCQxIw",
};

const motivationMessages = {
  afterWorkout: [
    "Super séance aujourd’hui 🔥",
    "Tu progresses doucement mais sûrement 💪",
    "Encore une séance validée, continue comme ça 👏",
    "Ton corps te remerciera plus tard 😄",
    "Belle régularité aujourd’hui, c’est exactement ça.",
  ],
  progression: [
    "Progression validée 🔥",
    "Tu deviens plus fort séance après séance 💪",
    "Excellent travail aujourd’hui 👏",
    "Très bonne séance, la charge monte au bon moment.",
  ],
  consistency: [
    "La régularité est la clé 🔑",
    "Même une petite séance compte 💪",
    "Continue, tu construis de bonnes habitudes.",
    "Tu installes une vraie routine, garde ce rythme.",
  ],
  programEnd: [
    ({ firstName }) => `Bravo ${firstName}, programme terminé 🔥`,
    "Tu peux être fier de ton évolution 👏",
    "Le plus important : tu n’as pas abandonné 💪",
    "Prêt pour le prochain niveau ? 😄",
  ],
};

const workouts = [
  {
    id: "push",
    name: "Haut du corps",
    type: "Force",
    duration: 45,
    calories: 320,
    muscles: ["Pectoraux", "Épaules", "Triceps"],
    exercises: [
      { id: "bench", name: "Développé couché", sets: 4, reps: 12, muscles: ["Pectoraux", "Triceps"], weight: 0, thumb: "push" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 10, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "dips", name: "Dips assistés", sets: 4, reps: 12, muscles: ["Triceps"], weight: 0, thumb: "push" },
    ],
  },
  {
    id: "pull",
    name: "Dos et bras",
    type: "Hypertrophie",
    duration: 50,
    calories: 350,
    muscles: ["Dos", "Biceps"],
    exercises: [
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 10, muscles: ["Grand dorsal"], weight: 0, thumb: "pull" },
      { id: "curl", name: "Curl haltères", sets: 4, reps: 12, muscles: ["Biceps"], weight: 0, thumb: "pull" },
    ],
  },
  {
    id: "legs",
    name: "Jambes et abdos",
    type: "Puissance",
    duration: 55,
    calories: 410,
    muscles: ["Jambes", "Abdos", "Cardio"],
    exercises: [
      { id: "squat", name: "Squat", sets: 4, reps: 10, muscles: ["Quadriceps"], weight: 0, thumb: "legs" },
      { id: "rdl", name: "Soulevé roumain", sets: 4, reps: 10, muscles: ["Ischios"], weight: 0, thumb: "legs" },
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "full_body",
    name: "Full Body",
    type: "Équilibre",
    duration: 50,
    calories: 380,
    muscles: ["Jambes", "Dos", "Pectoraux", "Épaules", "Abdos"],
    exercises: [
      { id: "squat", name: "Squat", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "bench", name: "Développé couché", sets: 4, reps: 12, muscles: ["Pectoraux"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "weight_loss",
    name: "Perte + Renfo",
    type: "Renfo cardio",
    duration: 45,
    calories: 430,
    muscles: ["Jambes", "Dos", "Pectoraux", "Abdos", "Cardio"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "dips", name: "Dips assistés", sets: 4, reps: 12, muscles: ["Pectoraux", "Bras"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "upper",
    name: "Haut du corps",
    type: "Haut du corps",
    duration: 50,
    calories: 340,
    muscles: ["Dos", "Pectoraux", "Épaules", "Bras"],
    exercises: [
      { id: "bench", name: "Développé couché", sets: 4, reps: 10, muscles: ["Pectoraux"], weight: 0, thumb: "push" },
      { id: "row", name: "Rowing assis", sets: 4, reps: 10, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 10, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "curl", name: "Curl haltères", sets: 4, reps: 12, muscles: ["Bras"], weight: 0, thumb: "pull" },
    ],
  },
  {
    id: "lower",
    name: "Dos & Bras",
    type: "Bas du corps",
    duration: 50,
    calories: 390,
    muscles: ["Jambes", "Abdos", "Cardio"],
    exercises: [
      { id: "squat", name: "Squat", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "rdl", name: "Soulevé roumain", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "beginner",
    name: "Débutant salle",
    type: "Apprentissage",
    duration: 40,
    calories: 280,
    muscles: ["Jambes", "Dos", "Pectoraux", "Abdos", "Cardio"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "bench", name: "Développé couché machine", sets: 4, reps: 12, muscles: ["Pectoraux"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 20, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "burner_1",
    name: "Reprise cardio",
    type: "Cardio léger + renfo",
    duration: 45,
    calories: 430,
    muscles: ["Cardio", "Jambes", "Pectoraux", "Abdos"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "bench", name: "Développé couché machine", sets: 4, reps: 12, muscles: ["Pectoraux"], weight: 0, thumb: "push" },
      { id: "squat", name: "Squat léger", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "burner_2",
    name: "Cardio & Renfo",
    type: "Rameur + haut du corps",
    duration: 45,
    calories: 450,
    muscles: ["Cardio", "Dos", "Épaules", "Bras"],
    exercises: [
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 12, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "curl", name: "Curl haltères", sets: 4, reps: 12, muscles: ["Bras"], weight: 0, thumb: "pull" },
    ],
  },
  {
    id: "burner_3",
    name: "Jambes & Endurance",
    type: "Circuit léger + cardio final",
    duration: 45,
    calories: 460,
    muscles: ["Cardio", "Jambes", "Dos", "Pectoraux", "Abdos"],
    exercises: [
      { id: "squat", name: "Squat dynamique", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "dips", name: "Dips assistés", sets: 4, reps: 12, muscles: ["Pectoraux", "Bras"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "force_1",
    name: "Haut du corps",
    type: "Pectoraux + épaules",
    duration: 50,
    calories: 340,
    muscles: ["Pectoraux", "Épaules", "Triceps"],
    exercises: [
      { id: "bench", name: "Développé couché", sets: 4, reps: 12, muscles: ["Pectoraux", "Triceps"], weight: 0, thumb: "push" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 10, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "dips", name: "Dips assistés", sets: 4, reps: 12, muscles: ["Triceps"], weight: 0, thumb: "push" },
    ],
  },
  {
    id: "force_2",
    name: "Bas du corps",
    type: "Dos + bras",
    duration: 50,
    calories: 350,
    muscles: ["Dos", "Biceps"],
    exercises: [
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 10, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "curl", name: "Curl haltères", sets: 4, reps: 12, muscles: ["Biceps"], weight: 0, thumb: "pull" },
    ],
  },
  {
    id: "force_3",
    name: "Bas du corps",
    type: "Jambes + abdos",
    duration: 55,
    calories: 410,
    muscles: ["Jambes", "Abdos"],
    exercises: [
      { id: "squat", name: "Squat", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "rdl", name: "Soulevé roumain", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "renfo_1",
    name: "Corps solide",
    type: "Corps complet",
    duration: 45,
    calories: 340,
    muscles: ["Jambes", "Dos", "Pectoraux", "Abdos"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "bench", name: "Développé couché machine", sets: 4, reps: 12, muscles: ["Pectoraux"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "renfo_2",
    name: "Dos & Posture",
    type: "Dos + posture",
    duration: 45,
    calories: 330,
    muscles: ["Dos", "Épaules", "Bras"],
    exercises: [
      { id: "rdl", name: "Soulevé roumain", sets: 4, reps: 10, muscles: ["Jambes", "Dos"], weight: 0, thumb: "legs" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 12, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "curl", name: "Curl haltères", sets: 4, reps: 12, muscles: ["Bras"], weight: 0, thumb: "pull" },
    ],
  },
  {
    id: "renfo_3",
    name: "Jambes & Gainage",
    type: "Jambes + gainage",
    duration: 45,
    calories: 360,
    muscles: ["Jambes", "Épaules", "Abdos"],
    exercises: [
      { id: "squat", name: "Squat contrôlé", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 12, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "reprise_1",
    name: "Reprise douce",
    type: "Machines faciles",
    duration: 35,
    calories: 260,
    muscles: ["Jambes", "Dos", "Pectoraux", "Abdos"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "bench", name: "Développé couché machine", sets: 4, reps: 12, muscles: ["Pectoraux"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage doux", sets: 4, reps: 20, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "reprise_2",
    name: "Remise en mouvement",
    type: "Technique douce",
    duration: 35,
    calories: 250,
    muscles: ["Jambes", "Dos", "Épaules", "Abdos"],
    exercises: [
      { id: "squat", name: "Squat léger", sets: 4, reps: 10, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "shoulder", name: "Développé épaules léger", sets: 4, reps: 10, muscles: ["Épaules"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage doux", sets: 4, reps: 20, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "reprise_3",
    name: "Cardio léger",
    type: "Renfo progressif",
    duration: 40,
    calories: 280,
    muscles: ["Cardio", "Jambes", "Dos", "Pectoraux", "Abdos"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "dips", name: "Dips assistés", sets: 4, reps: 12, muscles: ["Pectoraux", "Bras"], weight: 0, thumb: "push" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "plank", name: "Gainage doux", sets: 4, reps: 20, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "cardio_1",
    name: "Cardio progressif",
    type: "Cardio jambes",
    duration: 40,
    calories: 430,
    muscles: ["Cardio", "Jambes", "Abdos"],
    exercises: [
      { id: "press", name: "Presse à cuisses", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "squat", name: "Squat léger", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
  {
    id: "cardio_2",
    name: "Endurance douce",
    type: "Rameur + dos",
    duration: 40,
    calories: 440,
    muscles: ["Cardio", "Dos", "Épaules"],
    exercises: [
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "pulldown", name: "Tirage vertical", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "shoulder", name: "Développé épaules", sets: 4, reps: 12, muscles: ["Épaules"], weight: 0, thumb: "push" },
    ],
  },
  {
    id: "cardio_3",
    name: "Circuit cardio",
    type: "Circuit cardio",
    duration: 40,
    calories: 450,
    muscles: ["Cardio", "Jambes", "Dos", "Pectoraux", "Abdos"],
    exercises: [
      { id: "squat", name: "Squat dynamique", sets: 4, reps: 12, muscles: ["Jambes"], weight: 0, thumb: "legs" },
      { id: "row", name: "Rowing assis", sets: 4, reps: 12, muscles: ["Dos"], weight: 0, thumb: "pull" },
      { id: "dips", name: "Dips assistés", sets: 4, reps: 12, muscles: ["Pectoraux", "Bras"], weight: 0, thumb: "push" },
      { id: "plank", name: "Gainage", sets: 4, reps: 30, muscles: ["Abdos"], weight: 0, thumb: "legs" },
    ],
  },
];

workouts.forEach((workout) => {
  workout.exercises = workout.exercises.map((exercise) => ({
    ...exercise,
    video: exercise.video || exerciseVideos[exercise.id] || "",
  }));
});

const programs = {
  full_body: {
    name: "Améliorer mon cardio",
    sessionNames: ["Cardio progressif", "Endurance douce", "Circuit cardio"],
    sessionDescriptions: [
      "Séance simple pour améliorer ton souffle sans te mettre dans le rouge.",
      "Un travail régulier pour tenir plus longtemps et bouger avec confiance.",
      "Un circuit accessible pour finir la semaine avec de l’énergie.",
    ],
    workoutIds: ["cardio_1", "cardio_2", "cardio_3"],
  },
  weight_loss: {
    name: "Perdre du poids",
    sessionNames: ["Reprise cardio", "Cardio & Renfo", "Jambes & Endurance"],
    sessionDescriptions: [
      "Séance légère pour brûler des calories et reprendre le rythme.",
      "Un mélange simple de cardio et de renforcement pour progresser sans te cramer.",
      "On travaille les jambes et l’endurance pour construire une base solide.",
    ],
    workoutIds: ["burner_1", "burner_2", "burner_3"],
  },
  strength: {
    name: "Renforcement",
    sessionNames: ["Corps solide", "Dos & Posture", "Jambes & Gainage"],
    sessionDescriptions: [
      "Séance complète pour renforcer tout le corps avec des mouvements simples.",
      "On améliore le dos, les épaules et la posture sans compliquer la séance.",
      "Un travail bas du corps et abdos pour te sentir plus stable.",
    ],
    workoutIds: ["renfo_1", "renfo_2", "renfo_3"],
  },
  muscle_gain: {
    name: "Me muscler",
    sessionNames: ["Haut du corps", "Bas du corps", "Full Body"],
    sessionDescriptions: [
      "Séance centrée sur le haut du corps avec une progression propre.",
      "Travail des jambes pour construire de la force et de la stabilité.",
      "Séance complète pour stimuler tout le corps et garder un bon équilibre.",
    ],
    workoutIds: ["force_1", "force_3", "full_body"],
  },
  upper_lower: {
    name: "Renforcement",
    sessionNames: ["Corps solide", "Dos & Posture", "Jambes & Gainage"],
    sessionDescriptions: [
      "Séance complète pour renforcer tout le corps avec des mouvements simples.",
      "On améliore le dos, les épaules et la posture sans compliquer la séance.",
      "Un travail bas du corps et abdos pour te sentir plus stable.",
    ],
    workoutIds: ["renfo_1", "renfo_2", "renfo_3"],
  },
  ppl: {
    name: "Me muscler",
    sessionNames: ["Haut du corps", "Bas du corps", "Full Body"],
    sessionDescriptions: [
      "Séance centrée sur le haut du corps avec une progression propre.",
      "Travail des jambes pour construire de la force et de la stabilité.",
      "Séance complète pour stimuler tout le corps et garder un bon équilibre.",
    ],
    workoutIds: ["force_1", "force_3", "full_body"],
  },
  beginner: {
    name: "Reprendre le sport",
    sessionNames: ["Reprise douce", "Remise en mouvement", "Cardio léger"],
    sessionDescriptions: [
      "Séance douce pour reprendre confiance et retrouver de bonnes sensations.",
      "On remet le corps en mouvement avec des exercices simples et contrôlés.",
      "Un peu de cardio et de renforcement pour finir sans pression.",
    ],
    workoutIds: ["reprise_1", "reprise_2", "reprise_3"],
  },
};

const supportedProgramIds = ["weight_loss", "muscle_gain", "strength", "beginner", "upper_lower", "ppl"];

const durationOptions = [
  { value: 4, label: "4 semaines" },
  { value: 6, label: "6 semaines" },
];

const startOptions = [
  { value: "today", label: "Aujourd’hui" },
  { value: "nextMonday", label: "Lundi prochain" },
  { value: "custom", label: "Choisir une date" },
];

const goalProgramMap = {
  "Perdre du poids": "weight_loss",
  "Me muscler": "muscle_gain",
  "Reprendre le sport": "beginner",
  "Renforcement": "strength",
};

const balancedMuscleGroups = ["Jambes", "Dos", "Pectoraux", "Épaules", "Bras", "Abdos", "Cardio"];

const exerciseGuides = {
  bench: {
    tips: ["Garde les omoplates serrées.", "Descends la barre de façon contrôlée.", "Pousse fort sans décoller les épaules."],
    mistakes: ["Rebondir la barre sur la poitrine.", "Décoller les fesses du banc.", "Ouvrir les coudes trop largement."],
  },
  shoulder: {
    tips: ["Garde le buste stable.", "Monte les haltères au-dessus des épaules.", "Contrôle la descente."],
    mistakes: ["Cambrer fortement le dos.", "Lancer les poids avec l'élan.", "Descendre trop vite."],
  },
  dips: {
    tips: ["Descends lentement.", "Garde les épaules basses.", "Pousse jusqu'à tendre presque les bras."],
    mistakes: ["Rentrer les épaules vers les oreilles.", "Descendre trop bas si douleur.", "Aller trop vite."],
  },
  row: {
    tips: ["Tire les coudes vers l'arrière.", "Garde le dos droit.", "Marque une petite pause en fin de tirage."],
    mistakes: ["Arrondir le dos.", "Tirer avec les épaules seulement.", "Balancer le buste."],
  },
  pulldown: {
    tips: ["Amène la barre vers le haut de la poitrine.", "Garde les épaules basses.", "Contrôle la remontée."],
    mistakes: ["Tirer derrière la nuque.", "Se pencher trop en arrière.", "Relâcher brutalement."],
  },
  curl: {
    tips: ["Garde les coudes proches du corps.", "Monte sans balancer.", "Descends lentement."],
    mistakes: ["Balancer le dos.", "Avancer les coudes.", "Couper l'amplitude."],
  },
  squat: {
    tips: ["Garde le buste solide.", "Pousse les genoux dans l'axe des pieds.", "Descends avec contrôle."],
    mistakes: ["Rentrer les genoux.", "Décoller les talons.", "Arrondir le bas du dos."],
  },
  rdl: {
    tips: ["Recule les hanches.", "Garde le dos neutre.", "Sens l'étirement derrière les cuisses."],
    mistakes: ["Arrondir le dos.", "Plier trop les genoux.", "Éloigner la barre des jambes."],
  },
  press: {
    tips: ["Place les pieds à largeur confortable.", "Descends sans décoller le bassin.", "Pousse avec tout le pied."],
    mistakes: ["Verrouiller brutalement les genoux.", "Descendre trop bas.", "Pousser seulement avec les pointes."],
  },
  plank: {
    tips: ["Garde le dos droit.", "Serre les abdos et les fessiers.", "Respire calmement pendant toute la série."],
    mistakes: ["Creuser le bas du dos.", "Monter les fesses trop haut.", "Bloquer la respiration."],
  },
};

const exerciseAlternatives = {
  bench: [
    { name: "Chest Press machine", thumb: "push" },
    { name: "Développé couché machine", thumb: "push" },
  ],
  shoulder: [
    { name: "Développé épaules machine", thumb: "push" },
    { name: "Élévations latérales légères", thumb: "push" },
  ],
  dips: [
    { name: "Chest Press machine", thumb: "push" },
    { name: "Développé couché machine", thumb: "push" },
    { name: "Pompes inclinées", thumb: "push", bodyweight: true },
  ],
  row: [
    { name: "Rowing machine guidée", thumb: "pull" },
    { name: "Tirage élastique assis", thumb: "pull", bodyweight: true },
  ],
  pulldown: [
    { name: "Tirage vertical assisté", thumb: "pull" },
    { name: "Tirage élastique", thumb: "pull", bodyweight: true },
  ],
  curl: [
    { name: "Curl machine", thumb: "pull" },
    { name: "Curl poulie", thumb: "pull" },
  ],
  squat: [
    { name: "Presse à cuisses", thumb: "legs" },
    { name: "Squat guidé Smith Machine", thumb: "legs" },
  ],
  rdl: [
    { name: "Leg Curl", thumb: "legs" },
    { name: "Hip Thrust machine", thumb: "legs" },
  ],
  press: [
    { name: "Presse à cuisses légère", thumb: "legs" },
    { name: "Squat assisté", thumb: "legs", bodyweight: true },
  ],
  plank: [
    { name: "Gainage genoux au sol", thumb: "legs", bodyweight: true, unit: "sec" },
    { name: "Gainage incliné", thumb: "legs", bodyweight: true, unit: "sec" },
  ],
};

const goalAdvice = {
  "Perdre du poids": "Conseil coach : musculation simple, cardio progressif et régularité.",
  "Me muscler": "Conseil coach : exécution propre et progression douce des charges.",
  "Reprendre le sport": "Conseil coach : séances douces, technique propre et reprise progressive.",
  "Renforcement": "Conseil coach : deviens plus solide avec des charges maîtrisées et régulières.",
};

const goalOptions = ["Perdre du poids", "Me muscler", "Reprendre le sport", "Renforcement"];
const levelOptions = ["Débutant", "Intermédiaire", "Avancé"];
const warmupOptions = ["Tapis de course", "Vélo droit", "Vélo semi-allongé", "Rameur", "Elliptique", "Marche inclinée"];

let draftProfileGoal = goalOptions[0];
let draftProfileLevel = levelOptions[0];
let draftEditGoal = goalOptions[0];
let draftEditLevel = levelOptions[0];
let draftDurationWeeks = 6;
let draftStartMode = "today";
const autoTrainingDays = [1, 3, 5];

function clampWarmupDuration(value) {
  return Math.max(0, Math.min(15, Number(value) || 0));
}

function createWarmupEntry(overrides = {}) {
  return {
    ...defaultWarmup,
    id: overrides.id || `warmup-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: warmupOptions.includes(overrides.type) ? overrides.type : defaultWarmup.type,
    duration: clampWarmupDuration(overrides.duration ?? defaultWarmup.duration),
    calories: Math.max(0, Number(overrides.calories) || 0),
    skipped: false,
  };
}

const defaultState = {
  profile: null,
  bodyWeightHistory: [],
  nextWorkoutIndex: 0,
  activeWorkoutId: null,
  activeScheduledDate: null,
  activeScheduledId: null,
  workoutStartedAt: null,
  sets: {},
  reps: {},
  exerciseStats: {},
  sessionStartWeights: {},
  sessionWeights: {},
  sessionSetWeights: {},
  sessionTimedTargets: {},
  sessionExerciseReplacements: {},
  alternativePickerExerciseId: null,
  restTimers: {},
  executionTimers: {},
  restDurations: {},
  warmup: { ...defaultWarmup },
  warmups: [{ ...defaultWarmup, id: "warmup-1" }],
  cardio: { type: "tapis de course", duration: 0, calories: 0 },
  history: [],
  exerciseHistory: [],
  sessionReports: [],
  scheduledWorkouts: [],
  programPlan: null,
  selectedCalendarDate: null,
  calendarMonth: null,
  lastMessage: "On reprend tranquillement aujourd'hui.",
  homeMotivation: "",
  dailyMotivation: null,
  programEndMotivation: "",
};

function freshState() {
  return {
    ...defaultState,
    bodyWeightHistory: [],
    sets: {},
    reps: {},
    exerciseStats: {},
    sessionStartWeights: {},
    sessionWeights: {},
    sessionSetWeights: {},
    sessionTimedTargets: {},
    sessionExerciseReplacements: {},
    alternativePickerExerciseId: null,
    restTimers: {},
    executionTimers: {},
    restDurations: {},
    warmup: { ...defaultWarmup },
    warmups: [createWarmupEntry()],
    cardio: { type: "tapis de course", duration: 0, calories: 0 },
    history: [],
    exerciseHistory: [],
    sessionReports: [],
    scheduledWorkouts: [],
    programPlan: null,
    homeMotivation: "",
    dailyMotivation: null,
    programEndMotivation: "",
  };
}

let state = normalizeState(loadState());
saveState();
let timerId = null;
const $ = (selector) => document.querySelector(selector);

const elements = {
  appShell: $("#appShell"),
  profileScreen: $("#profileScreen"),
  profileForm: $("#profileForm"),
  homeGreeting: $("#homeGreeting"),
  programMarker: $("#programMarker"),
  programProgressText: $("#programProgressText"),
  programProgressBar: $("#programProgressBar"),
  homeSessionName: $("#homeSessionName"),
  homeSessionDescription: $("#homeSessionDescription"),
  homeSessionMeta: $("#homeSessionMeta"),
  homeSessionDate: $("#homeSessionDate"),
  homeMotivation: $("#homeMotivation"),
  progressPeriod: $("#progressPeriod"),
  statsSessions: $("#statsSessions"),
  statsCalories: $("#statsCalories"),
  statsWeightChange: $("#statsWeightChange"),
  statsProgressions: $("#statsProgressions"),
  caloriesChart: $("#caloriesChart"),
  statsHistoryCount: $("#statsHistoryCount"),
  statsHistoryList: $("#statsHistoryList"),
  programSummarySessions: $("#programSummarySessions"),
  programSummaryCalories: $("#programSummaryCalories"),
  programSummaryProgressions: $("#programSummaryProgressions"),
  programSummaryWeightChange: $("#programSummaryWeightChange"),
  programSummaryStartWeight: $("#programSummaryStartWeight"),
  programFinalWeight: $("#programFinalWeight"),
  programSummaryMessage: $("#programSummaryMessage"),
  sessionType: $("#sessionType"),
  sessionName: $("#sessionName"),
  sessionDescription: $("#sessionDescription"),
  sessionMuscles: $("#sessionMuscles"),
  sessionDuration: $("#sessionDuration"),
  sessionCalories: $("#sessionCalories"),
  warmupList: $("#warmupList"),
  warmupStatus: $("#warmupStatus"),
  exerciseList: $("#exerciseList"),
  cardioType: $("#cardioType"),
  cardioDuration: $("#cardioDuration"),
  cardioCalories: $("#cardioCalories"),
  cardioCaloriesPreview: $("#cardioCaloriesPreview"),
  summarySheet: $("#summarySheet"),
  summaryTitle: $("#summaryTitle"),
  summaryDuration: $("#summaryDuration"),
  summaryExercises: $("#summaryExercises"),
  summaryCalories: $("#summaryCalories"),
  summaryProgressions: $("#summaryProgressions"),
  summaryMessage: $("#summaryMessage"),
  exerciseSheet: $("#exerciseSheet"),
  demoVisual: $("#demoVisual"),
  demoType: $("#demoType"),
  demoTitle: $("#demoTitle"),
  demoMuscles: $("#demoMuscles"),
  demoTips: $("#demoTips"),
  demoMistakes: $("#demoMistakes"),
  profileEditForm: $("#profileEditForm"),
  editFirstName: $("#editFirstName"),
  editAge: $("#editAge"),
  editBodyWeight: $("#editBodyWeight"),
  profileGoalChoices: $("#profileGoalChoices"),
  profileLevelChoices: $("#profileLevelChoices"),
  profileDurationChoices: $("#profileDurationChoices"),
  profileStartChoices: $("#profileStartChoices"),
  profileStartDate: $("#profileStartDate"),
  editGoalChoices: $("#editGoalChoices"),
  editLevelChoices: $("#editLevelChoices"),
  profileEvolution: $("#profileEvolution"),
  weightHistoryCount: $("#weightHistoryCount"),
  startWeight: $("#startWeight"),
  currentWeight: $("#currentWeight"),
  totalWeightChange: $("#totalWeightChange"),
  weightHistoryList: $("#weightHistoryList"),
  goalAdvice: $("#goalAdvice"),
  calendarTitle: $("#calendarTitle"),
  calendarGrid: $("#calendarGrid"),
  selectedDayTitle: $("#selectedDayTitle"),
  selectedDayStatus: $("#selectedDayStatus"),
  missedWorkoutMessage: $("#missedWorkoutMessage"),
  dayDetail: $("#dayDetail"),
  delayBox: $("#delayBox"),
  delayDateInput: $("#delayDateInput"),
  calendarConfirmation: $("#calendarConfirmation"),
};

function loadState() {
  try {
    return { ...freshState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return freshState();
  }
}

function normalizeWarmups(warmups, legacyWarmup = null) {
  const source = Array.isArray(warmups) ? warmups : [];
  const legacy = legacyWarmup && !legacyWarmup.skipped && Number(legacyWarmup.duration || 0) > 0
    ? [legacyWarmup]
    : [];
  const normalized = (source.length ? source : legacy)
    .filter((item) => item && !item.skipped)
    .map((item) => createWarmupEntry(item))
    .filter((item) => item.duration > 0);
  return normalized;
}

function warmupItemCalories(item) {
  return Number(item.calories) || Math.round(Number(item.duration || 0) * 8);
}

function warmupSummary(warmups = []) {
  const items = normalizeWarmups(warmups);
  const duration = items.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const calories = items.reduce((sum, item) => sum + warmupItemCalories(item), 0);
  return {
    type: items.map((item) => item.type).join(" + ") || defaultWarmup.type,
    duration,
    calories,
    skipped: items.length === 0,
    estimatedCalories: calories,
  };
}

function ensureWarmups() {
  state.warmups = normalizeWarmups(state.warmups, state.warmup);
  state.warmup = warmupSummary(state.warmups);
  return state.warmups;
}

function normalizeState(loadedState) {
  const normalized = {
    ...freshState(),
    ...loadedState,
    exerciseStats: loadedState.exerciseStats || {},
    sessionWeights: loadedState.sessionWeights || {},
    sessionSetWeights: loadedState.sessionSetWeights || {},
    sessionTimedTargets: loadedState.sessionTimedTargets || {},
    sessionExerciseReplacements: loadedState.sessionExerciseReplacements || {},
    alternativePickerExerciseId: loadedState.alternativePickerExerciseId || null,
    executionTimers: loadedState.executionTimers || {},
    exerciseHistory: loadedState.exerciseHistory || [],
    sessionReports: loadedState.sessionReports || [],
    scheduledWorkouts: loadedState.scheduledWorkouts || [],
    programPlan: loadedState.programPlan || null,
  };
  normalized.warmups = normalizeWarmups(normalized.warmups, normalized.warmup);
  normalized.warmup = warmupSummary(normalized.warmups);
  const visibleProgramIds = new Set(supportedProgramIds);
  const goalAliases = {
    "Perte de poids": "Perdre du poids",
    "Se muscler": "Me muscler",
    "Renforcement musculaire": "Renforcement",
    "Remise en forme": "Reprendre le sport",
    "Endurance": "Perdre du poids",
    "Cardio fitness": "Perdre du poids",
    "Maintien physique": "Renforcement",
    "Progression force": "Me muscler",
  };

  if (normalized.profile?.goal && goalAliases[normalized.profile.goal]) {
    normalized.profile.goal = goalAliases[normalized.profile.goal];
  }
  if (normalized.profile?.goal && goalProgramMap[normalized.profile.goal]) {
    normalized.programPlan = {
      ...(normalized.programPlan || {}),
      programId: goalProgramMap[normalized.profile.goal],
      durationWeeks: [4, 6].includes(Number(normalized.programPlan?.durationWeeks)) ? Number(normalized.programPlan.durationWeeks) : 6,
      trainingDays: normalized.programPlan?.trainingDays || [...autoTrainingDays],
      startDate: normalized.programPlan?.startDate || todayKey(),
    };
  }
  const oldSessionNamePattern = /(Brûleur|Bruleur|Force|Renfo|Reprise\s*\d|Cardio\s*\d|Full Body|Push|Pull|Legs|Haut|Bas|Split|Calories|Muscle|Départ|Séance douce)/i;
  const inferSimpleProgramId = (item = {}) => {
    if (visibleProgramIds.has(item.programId)) return item.programId;
    if (item.programId === "ppl") return "muscle_gain";
    if (item.programId === "upper_lower") return "strength";
    if (/perte|calorie|brûleur|bruleur/i.test(item.programName || item.sessionName || "")) return "weight_loss";
    if (/muscle|force/i.test(item.programName || item.sessionName || "")) return "muscle_gain";
    if (/renfo/i.test(item.programName || item.sessionName || "")) return "strength";
    if (/reprise|départ|depart|douce/i.test(item.programName || item.sessionName || "")) return "beginner";
    if (/cardio/i.test(item.programName || item.sessionName || "")) return "weight_loss";
    return normalized.programPlan?.programId || "beginner";
  };
  const simpleSessionName = (item = {}) => {
    const programId = inferSimpleProgramId(item);
    const program = programs[programId] || programs.beginner;
    const numberMatch = String(item.sessionName || "").match(/(\d+)/);
    const sequence = numberMatch ? Number(numberMatch[1]) - 1 : Math.max(0, Number(item.sequence || 1) - 1);
    if (item.sessionName && !oldSessionNamePattern.test(item.sessionName)) return item.sessionName;
    return program.sessionNames[sequence % program.sessionNames.length];
  };
  const simpleSessionDescription = (item = {}) => {
    const programId = inferSimpleProgramId(item);
    const program = programs[programId] || programs.beginner;
    const sequence = sessionSequence(item);
    return item.sessionDescription || program.sessionDescriptions?.[sequence % program.sessionDescriptions.length] || "Séance simple et progressive.";
  };
  const sessionSequence = (item = {}) => {
    const numberMatch = String(item.sessionName || "").match(/(\d+)/);
    return numberMatch ? Number(numberMatch[1]) - 1 : Math.max(0, Number(item.sequence || 1) - 1);
  };

  if (normalized.programPlan && !visibleProgramIds.has(normalized.programPlan.programId)) {
    normalized.programPlan.programId = normalized.programPlan.programId === "ppl" ? "muscle_gain" : "strength";
  }

  normalized.scheduledWorkouts = normalized.scheduledWorkouts.map((item) => {
    const programId = inferSimpleProgramId(item);
    const program = programs[programId] || programs.beginner;
    const sequence = sessionSequence(item);
    return {
      ...item,
      id: scheduleId(item),
      programId,
      programName: program.name,
      workoutId: program.workoutIds[sequence % program.workoutIds.length],
      sessionName: simpleSessionName(item),
      sessionDescription: simpleSessionDescription(item),
    };
  });
  normalized.history = (normalized.history || []).map((report) => {
    const programId = inferSimpleProgramId(report);
    const program = programs[programId] || programs.beginner;
    return {
      ...report,
      programName: program.name,
      sessionName: simpleSessionName(report),
      sessionDescription: simpleSessionDescription(report),
    };
  });
  normalized.sessionReports = (normalized.sessionReports || []).map((report) => {
    const programId = inferSimpleProgramId(report);
    const program = programs[programId] || programs.beginner;
    return {
      ...report,
      programName: program.name,
      sessionName: simpleSessionName(report),
      sessionDescription: simpleSessionDescription(report),
    };
  });

  workouts.flatMap((workout) => workout.exercises).forEach((exercise) => {
    const hasRealHistory =
      normalized.exerciseHistory.some((entry) => entry.exerciseId === exercise.id) ||
      normalized.sessionReports.some((report) => report.exercises?.some((entry) => entry.exerciseId === exercise.id));

    if (!hasRealHistory) {
      normalized.exerciseStats[exercise.id] = {
        lastWeight: 0,
        targetWeight: 0,
        sessions: 0,
        sameWeightSessions: 0,
        loweredToday: false,
      };
    }

  });

  return normalized;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetTemporarySessionFields() {
  state.sets = {};
  state.reps = {};
  state.restTimers = {};
  state.executionTimers = {};
  state.sessionStartWeights = {};
  state.sessionWeights = {};
  state.sessionSetWeights = {};
  state.sessionTimedTargets = {};
  state.sessionExerciseReplacements = {};
  state.alternativePickerExerciseId = null;
  state.warmups = [createWarmupEntry()];
  state.warmup = warmupSummary(state.warmups);
  state.cardio = { type: "tapis de course", duration: 0, calories: 0 };
}

function syncActiveSessionInputsFromDOM() {
  // Sauvegarde de sécurité : récupère ce qui est affiché à l'écran avant de changer de page,
  // de quitter l'application ou de relancer un rendu. Ça évite de perdre un poids/reps tapé.
  if (!state?.profile || !state.activeWorkoutId) return;

  document.querySelectorAll('[data-weight]').forEach((input) => {
    const exerciseId = input.dataset.weight;
    const exercise = activeWorkout()?.exercises?.find((item) => item.id === exerciseId);
    if (!exercise || isBodyweightExercise(exercise)) return;
    saveWeightInput(exerciseId, input.value);
  });

  document.querySelectorAll('[data-set-weight]').forEach((input) => {
    saveSetWeight(input.dataset.setWeight, Number(input.dataset.index), input.value);
  });

  document.querySelectorAll('[data-reps]').forEach((input) => {
    const exerciseId = input.dataset.reps;
    const index = Number(input.dataset.index);
    state.reps[setKey(exerciseId, index)] = Math.max(0, Number(input.value) || 0);
  });

  document.querySelectorAll('[data-rest-minutes]').forEach((input) => {
    saveManualRestInput(input.dataset.restMinutes);
  });

  document.querySelectorAll('[data-hold-minutes]').forEach((input) => {
    saveTimedTargetInput(input.dataset.holdMinutes);
  });

  if (elements?.cardioType && elements?.cardioDuration && elements?.cardioCalories) {
    state.cardio = {
      type: elements.cardioType.value,
      duration: Math.max(0, Number(elements.cardioDuration.value) || 0),
      calories: Math.max(0, Number(elements.cardioCalories.value) || 0),
    };
  }

  document.querySelectorAll('[data-warmup-duration]').forEach((input) => {
    saveWarmupInput(input.dataset.warmupDuration, 'duration', input.value);
  });
  document.querySelectorAll('[data-warmup-calories]').forEach((input) => {
    saveWarmupInput(input.dataset.warmupCalories, 'calories', input.value);
  });

  saveState();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function nextMondayKey(fromDateKey = todayKey()) {
  const date = new Date(`${fromDateKey}T00:00:00`);
  const day = date.getDay();
  const daysUntilMonday = ((1 - day + 7) % 7) || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  return localDateKey(date);
}

function selectedProgramStartDate() {
  if (draftStartMode === "nextMonday") return nextMondayKey();
  if (draftStartMode === "custom" && elements.profileStartDate.value) return elements.profileStartDate.value;
  return todayKey();
}

function generateProgramSchedule(programId, durationWeeks, trainingDays, startDate = todayKey()) {
  const program = programs[programId] || programs.full_body;
  const weeklySessions = Math.max(1, trainingDays.length || autoTrainingDays.length);
  const start = new Date(`${startDate}T00:00:00`);
  const planned = [];
  const gaps = weeklySessions >= 3 ? [0, 2, 4] : weeklySessions === 2 ? [0, 3] : [0];
  const totalSessions = durationWeeks * weeklySessions;

  for (let workoutIndex = 0; workoutIndex < totalSessions; workoutIndex += 1) {
    const week = Math.floor(workoutIndex / weeklySessions);
    const dayInWeek = workoutIndex % weeklySessions;
    const date = new Date(start);
    date.setDate(start.getDate() + week * 7 + gaps[dayInWeek]);
    const workoutId = program.workoutIds[workoutIndex % program.workoutIds.length];
    const sessionName = program.sessionNames[workoutIndex % program.sessionNames.length];
    const sessionDescription = program.sessionDescriptions?.[workoutIndex % program.sessionDescriptions.length] || "Séance simple et progressive.";
    planned.push({
      id: `${programId}-${workoutIndex + 1}`,
      date: localDateKey(date),
      workoutId,
      programId,
      programName: program.name,
      sessionName,
      sessionDescription,
      sequence: workoutIndex + 1,
    });
  }

  const endDate = new Date(start);
  endDate.setDate(start.getDate() + durationWeeks * 7 - 1);
  planned.push({
    date: localDateKey(endDate),
    type: "weighIn",
    programId,
    programName: program.name,
    sessionName: "⚖️ Bilan poids",
    sequence: totalSessions + 1,
  });

  return planned;
}

function monthKey(dateKey = todayKey()) {
  return dateKey.slice(0, 7);
}

function localMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function daysSince(dateKey) {
  return Math.floor((new Date(`${todayKey()}T00:00:00`) - new Date(`${dateKey}T00:00:00`)) / 86400000);
}

function normalizeMuscleGroup(muscle) {
  if (["Quadriceps", "Ischios", "Fessiers", "Jambes"].includes(muscle)) return "Jambes";
  if (["Grand dorsal", "Dos"].includes(muscle)) return "Dos";
  if (["Pectoraux"].includes(muscle)) return "Pectoraux";
  if (["Épaules"].includes(muscle)) return "Épaules";
  if (["Biceps", "Triceps", "Bras"].includes(muscle)) return "Bras";
  if (["Abdos"].includes(muscle)) return "Abdos";
  if (["Cardio"].includes(muscle)) return "Cardio";
  return muscle;
}

function reportMuscles(report) {
  const groups = new Set((report.muscles || []).map(normalizeMuscleGroup));
  (report.exercises || []).forEach((exercise) => (exercise.muscles || []).forEach((muscle) => groups.add(normalizeMuscleGroup(muscle))));
  if (report.cardio?.duration || report.cardio?.calories) groups.add("Cardio");
  return [...groups];
}

function exerciseUnit(exercise) {
  return exercise.unit || (exercise.name.toLowerCase().includes("gainage") ? "sec" : "reps");
}

function isBodyweightExercise(exercise) {
  const name = exercise.name.toLowerCase();
  return Boolean(exercise.bodyweight) || exerciseUnit(exercise) === "sec" || name.includes("gainage") || name.includes("poids du corps");
}

function exerciseTargetLabel(exercise) {
  return `${exercise.sets} x ${exerciseTargetValue(exercise)} ${exerciseUnit(exercise)}`;
}

function scheduleId(item = {}) {
  return item.id || `${item.type || "workout"}-${item.programId || "program"}-${item.sequence || item.workoutId || item.date}`;
}

function ensureCalendarState() {
  if (!state.selectedCalendarDate) state.selectedCalendarDate = todayKey();
  if (!state.calendarMonth) state.calendarMonth = monthKey();
  if (!Array.isArray(state.scheduledWorkouts)) state.scheduledWorkouts = [];
  if (state.programPlan && !state.scheduledWorkouts.some((item) => item.type === "weighIn")) {
    const program = programs[state.programPlan.programId] || currentProgram();
    const start = new Date(`${state.programPlan.startDate || todayKey()}T00:00:00`);
    start.setDate(start.getDate() + Number(state.programPlan.durationWeeks || 6) * 7 - 1);
    state.scheduledWorkouts.push({
      id: `weigh-in-${state.programPlan.programId}`,
      date: localDateKey(start),
      type: "weighIn",
      programId: state.programPlan.programId,
      programName: program.name,
      sessionName: "⚖️ Bilan poids",
      sequence: Number(state.programPlan.durationWeeks || 6) * autoTrainingDays.length + 1,
    });
  }
}

function nextPlannedWorkoutFor(dateKey) {
  const existing = [...state.scheduledWorkouts]
    .filter((item) => item.date === dateKey)
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))[0];
  if (existing) return existing;
  return null;
}

function showProfileIfNeeded() {
  const hasProfile = Boolean(state.profile?.firstName);
  elements.profileScreen.classList.toggle("hidden", hasProfile);
  elements.appShell.classList.toggle("hidden", !hasProfile);
}

function renderChoiceCards(container, options, selected, group) {
  container.innerHTML = options.map((option) => `
    <button class="choice-card ${option === selected ? "active" : ""}" type="button" data-choice-group="${group}" data-choice-value="${option}">
      ${option}
    </button>
  `).join("");
}

function renderObjectChoiceCards(container, options, selected, group) {
  container.innerHTML = options.map((option) => `
    <button class="choice-card ${String(option.value ?? option.id) === String(selected) ? "active" : ""}" type="button" data-choice-group="${group}" data-choice-value="${option.value ?? option.id}">
      <strong>${option.label}</strong>
      ${option.description ? `<small>${option.description}</small>` : ""}
    </button>
  `).join("");
}

function renderAllChoices() {
  renderChoiceCards(elements.profileGoalChoices, goalOptions, draftProfileGoal, "profileGoal");
  renderChoiceCards(elements.profileLevelChoices, levelOptions, draftProfileLevel, "profileLevel");
  renderObjectChoiceCards(elements.profileDurationChoices, durationOptions, draftDurationWeeks, "duration");
  renderObjectChoiceCards(elements.profileStartChoices, startOptions, draftStartMode, "startMode");
  elements.profileStartDate.classList.toggle("hidden", draftStartMode !== "custom");
  if (!elements.profileStartDate.value) elements.profileStartDate.value = todayKey();
  renderChoiceCards(elements.editGoalChoices, goalOptions, draftEditGoal, "editGoal");
  renderChoiceCards(elements.editLevelChoices, levelOptions, draftEditLevel, "editLevel");
}

function nextWorkout() {
  const planned = nextPlannedWorkoutItem();
  if (planned) return workouts.find((workout) => workout.id === planned.workoutId) || currentProgramWorkouts()[0];
  const programWorkouts = currentProgramWorkouts();
  return programWorkouts[state.nextWorkoutIndex % programWorkouts.length];
}

function activeWorkout() {
  const workout = workouts.find((item) => item.id === state.activeWorkoutId) || nextWorkout();
  const replacements = state.sessionExerciseReplacements || {};
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => {
      const replacement = replacements[exercise.id];
      return replacement ? { ...exercise, ...replacement, id: exercise.id, originalName: exercise.name } : exercise;
    }),
  };
}

function currentProgram() {
  const programId = state.programPlan?.programId || goalProgramMap[state.profile?.goal] || "beginner";
  return programs[programId] || programs.beginner;
}

function currentProgramWorkouts() {
  return currentProgram().workoutIds.map((id) => workouts.find((workout) => workout.id === id)).filter(Boolean);
}

function nextPlannedWorkoutItem() {
  const doneIds = new Set(state.history.map((report) => report.scheduledId).filter(Boolean));
  const doneDates = new Set(state.history.filter((report) => !report.scheduledId).map((report) => report.date));
  return [...state.scheduledWorkouts]
    .filter((item) => item.type !== "weighIn" && !doneIds.has(scheduleId(item)) && !doneDates.has(item.date))
    .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0) || a.date.localeCompare(b.date))[0];
}

function scheduledWorkoutById(id) {
  return state.scheduledWorkouts.find((item) => scheduleId(item) === id) || null;
}

function activePlannedWorkoutItem() {
  return state.activeScheduledId ? scheduledWorkoutById(state.activeScheduledId) : nextPlannedWorkoutItem();
}

function currentSessionLabel(workout = activeWorkout()) {
  const planned = activePlannedWorkoutItem();
  if (planned && planned.workoutId === workout.id) return planned.sessionName || workout.name;
  return workout.name;
}

function sessionDescriptionFor(workout = activeWorkout()) {
  const planned = activePlannedWorkoutItem();
  if (planned && planned.workoutId === workout.id) return planned.sessionDescription || "Séance simple et progressive.";
  const program = currentProgram();
  const index = Math.max(0, program.workoutIds.indexOf(workout.id));
  return program.sessionDescriptions?.[index % program.sessionDescriptions.length] || "Séance simple et progressive.";
}

function programProgressInfo() {
  const totalSessions = Math.max(1, Number(state.programPlan?.durationWeeks || 1) * autoTrainingDays.length);
  const start = state.programPlan?.startDate || state.profile?.createdAt || todayKey();
  const completed = (state.history || []).filter((report) => report.date >= start).length;
  const planned = nextPlannedWorkoutItem();
  const nextSequence = planned?.sequence || Math.min(totalSessions, completed + 1);
  const percent = Math.min(100, Math.round((completed / totalSessions) * 100));
  const week = Math.max(1, Math.ceil(nextSequence / autoTrainingDays.length));
  return { totalSessions, completed, nextSequence, percent, week };
}

function programMarkerText() {
  const progress = programProgressInfo();
  return `Semaine ${progress.week} • Séance ${progress.nextSequence}`;
}

function latestExerciseResult(exerciseId) {
  return state.exerciseHistory.find((item) => item.exerciseId === exerciseId) || null;
}

function nextWeightAdvice(exercise, stats = getStats(exercise)) {
  if (isBodyweightExercise(exercise)) return null;
  const latest = latestExerciseResult(exercise.id);
  const suggested = Number(latest?.suggestedWeight) || 0;
  if (!latest?.progressionValidated || suggested <= Number(latest.weight) || Number(stats.targetWeight) >= suggested) {
    return null;
  }
  return {
    from: Number(latest.weight) || 0,
    to: suggested,
    current: Number(stats.targetWeight) || 0,
  };
}

function setKey(exerciseId, index) {
  return `${exerciseId}-${index}`;
}

function executionKey(exerciseId, index) {
  return `execution-${exerciseId}-${index}`;
}

function transitionKey(exerciseId) {
  return `transition-${exerciseId}`;
}

function getSetStatus(exerciseId, index) {
  return state.sets[setKey(exerciseId, index)] || "open";
}

function exerciseTargetValue(exercise) {
  if (exerciseUnit(exercise) === "sec") {
    const sessionTarget = state.sessionTimedTargets?.[exercise.id];
    if (sessionTarget !== undefined && sessionTarget !== null && sessionTarget !== "") return Math.max(1, Number(sessionTarget) || exercise.reps);
    return Number(getStats(exercise).targetSeconds || exercise.reps);
  }
  return exercise.reps;
}

function getSetReps(exercise, index) {
  return state.reps[setKey(exercise.id, index)] ?? exerciseTargetValue(exercise);
}

function getStats(exercise) {
  if (!state.exerciseStats[exercise.id]) {
    state.exerciseStats[exercise.id] = {
      lastWeight: exercise.weight,
      targetWeight: exercise.weight,
      sessions: 0,
      sameWeightSessions: 0,
      loweredToday: false,
      targetSeconds: exerciseUnit(exercise) === "sec" ? exercise.reps : undefined,
    };
  }
  if (exerciseUnit(exercise) === "sec" && !state.exerciseStats[exercise.id].targetSeconds) {
    state.exerciseStats[exercise.id].targetSeconds = exercise.reps;
  }
  return state.exerciseStats[exercise.id];
}

function currentSessionWeight(exercise, stats = getStats(exercise)) {
  const savedWeight = state.sessionWeights?.[exercise.id];
  if (savedWeight !== undefined && savedWeight !== null && savedWeight !== "") return Number(savedWeight) || 0;
  if (stats.targetWeight !== undefined && stats.targetWeight !== null) return Number(stats.targetWeight) || 0;
  return 0;
}

function getSetWeight(exercise, index, stats = getStats(exercise)) {
  const key = setKey(exercise.id, index);
  const savedWeight = state.sessionSetWeights?.[key];
  if (savedWeight !== undefined && savedWeight !== null && savedWeight !== "") return Number(savedWeight) || 0;
  if (index > 0) return getSetWeight(exercise, index - 1, stats);
  return currentSessionWeight(exercise, stats);
}

function saveSetWeight(exerciseId, index, value) {
  if (value === "") return;
  const exercise = activeWorkout()?.exercises?.find((item) => item.id === exerciseId);
  if (!exercise || isBodyweightExercise(exercise)) return;
  const nextWeight = Math.round(Math.max(0, Number(value) || 0) * 10) / 10;
  if (!state.sessionSetWeights) state.sessionSetWeights = {};
  for (let setIndex = index; setIndex < exercise.sets; setIndex += 1) {
    state.sessionSetWeights[setKey(exerciseId, setIndex)] = nextWeight;
    const input = document.querySelector(`[data-set-weight="${exerciseId}"][data-index="${setIndex}"]`);
    if (input && input !== document.activeElement) input.value = nextWeight;
  }
  state.sessionWeights[exerciseId] = nextWeight;
  const stats = getStats(exercise);
  const startWeight = Number(state.sessionStartWeights[exerciseId] ?? stats.lastWeight ?? 0);
  stats.targetWeight = nextWeight;
  stats.loweredToday = nextWeight < startWeight;
  saveState();
}

function saveTimedTargetInput(exerciseId) {
  const minuteInput = document.querySelector(`[data-hold-minutes="${exerciseId}"]`);
  const secondInput = document.querySelector(`[data-hold-seconds="${exerciseId}"]`);
  const minutes = Math.max(0, Number(minuteInput?.value) || 0);
  const seconds = Math.max(0, Number(secondInput?.value) || 0);
  state.sessionTimedTargets[exerciseId] = Math.max(1, minutes * 60 + seconds);
  saveState();
}

function restDuration(exerciseId) {
  return Math.min(MAX_REST_SECONDS, Math.max(15, Number(state.restDurations[exerciseId]) || 75));
}

function clampRestSeconds(seconds) {
  return Math.min(MAX_REST_SECONDS, Math.max(10, Number(seconds) || 0));
}

function parseTimerInput(value) {
  const rawValue = String(value || "").trim();
  if (rawValue.includes(":")) {
    const [minutes, seconds] = rawValue.split(":").map((part) => Number(part));
    return clampRestSeconds((minutes || 0) * 60 + (seconds || 0));
  }
  return clampRestSeconds(Number(rawValue));
}

function formatTimer(seconds) {
  const safeSeconds = Math.min(MAX_REST_SECONDS, Math.max(0, Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const restSeconds = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${restSeconds}`;
}

function getTimer(key) {
  const timer = state.restTimers[key];
  if (!timer) return null;
  if (typeof timer === "number") {
    return { duration: 75, remaining: Math.max(0, Math.ceil((timer - Date.now()) / 1000)), endAt: timer, paused: false };
  }
  return timer;
}

function getExecutionTimer(key) {
  const timer = state.executionTimers[key];
  if (!timer) return null;
  return timer;
}

function timerRemaining(timer) {
  if (!timer) return 0;
  if (timer.paused || !timer.endAt) return Math.max(0, Number(timer.remaining) || 0);
  return Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
}

function updateMessage(message) {
  state.lastMessage = message;
  saveState();
}

function pickMotivation(category, context = {}) {
  const options = motivationMessages[category] || motivationMessages.consistency;
  const selected = options[Math.floor(Math.random() * options.length)];
  return typeof selected === "function" ? selected(context) : selected;
}

function setHomeMotivation(message) {
  state.homeMotivation = message;
  updateMessage(message);
}

function dailyMotivation() {
  const today = todayKey();
  if (!state.dailyMotivation || state.dailyMotivation.date !== today) {
    state.dailyMotivation = {
      date: today,
      text: pickMotivation("consistency", { firstName: state.profile?.firstName || "" }),
    };
    saveState();
  }
  return state.dailyMotivation.text;
}

let coachAudioContext = null;

function getCoachAudioContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!coachAudioContext) coachAudioContext = new AudioContext();
    if (coachAudioContext.state === "suspended") coachAudioContext.resume();
    return coachAudioContext;
  } catch {
    return null;
  }
}

function notifyRestTimer(final = false) {
  if (navigator.vibrate) navigator.vibrate(final ? 90 : 25);
  try {
    const audio = getCoachAudioContext();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = final ? 760 : 560;
    gain.gain.value = final ? 0.06 : 0.04;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + (final ? 0.16 : 0.08));
  } catch {
    // Le message visuel reste affiché si le navigateur bloque le son.
  }
}

function showScreen(screenId) {
  syncActiveSessionInputsFromDOM();
  state.currentScreen = screenId;
  saveState();
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === screenId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.screen === screenId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startWorkout(plannedOverride = null) {
  if (state.activeWorkoutId) {
    updateMessage(`Séance en cours retrouvée, ${state.profile.firstName}.`);
    render();
    showScreen("sessionScreen");
    startTimer();
    return;
  }

  const planned = plannedOverride && plannedOverride.workoutId ? plannedOverride : nextPlannedWorkoutItem();
  const workout = planned ? workouts.find((item) => item.id === planned.workoutId) || nextWorkout() : nextWorkout();
  state.activeWorkoutId = workout.id;
  state.activeScheduledDate = planned?.date || null;
  state.activeScheduledId = planned ? scheduleId(planned) : null;
  state.workoutStartedAt = Date.now();
  resetTemporarySessionFields();

  workout.exercises.forEach((exercise) => {
    state.sessionStartWeights[exercise.id] = getStats(exercise).targetWeight;
  });

  updateMessage(`On reprend tranquillement aujourd'hui, ${state.profile.firstName}.`);
  saveState();
  render();
  showScreen("sessionScreen");
}

function saveWeightInput(exerciseId, value) {
  if (value === "") return;
  const nextWeight = Math.max(0, Number(value) || 0);
  const savedWeight = Math.round(nextWeight * 10) / 10;
  if (!state.sessionWeights) state.sessionWeights = {};
  state.sessionWeights[exerciseId] = savedWeight;

  const exercise = activeWorkout()?.exercises?.find((item) => item.id === exerciseId);
  if (!exercise) {
    saveState();
    return;
  }

  const stats = getStats(exercise);
  const startWeight = state.sessionStartWeights[exerciseId] ?? stats.lastWeight;

  stats.targetWeight = savedWeight;
  stats.loweredToday = stats.targetWeight < startWeight;
  saveState();
}

function setWeight(exerciseId, value) {
  if (value === "") value = 0;
  saveWeightInput(exerciseId, value);
  const exercise = activeWorkout().exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;
  saveSetWeight(exerciseId, 0, value);
  const stats = getStats(exercise);
  if (stats.loweredToday) {
    updateMessage("Poids trop lourd aujourd'hui, on garde une charge propre.");
  } else {
    saveState();
  }
  render();
}

function adjustWeight(exerciseId, delta) {
  const exercise = activeWorkout().exercises.find((item) => item.id === exerciseId);
  const stats = getStats(exercise);
  setWeight(exerciseId, Math.max(0, currentSessionWeight(exercise, stats) + delta));
}

function replaceSessionExercise(exerciseId, alternativeIndex) {
  const exercise = activeWorkout().exercises.find((item) => item.id === exerciseId);
  const alternative = exerciseAlternatives[exerciseId]?.[alternativeIndex];
  if (!exercise || !alternative) return;
  state.sessionExerciseReplacements[exerciseId] = {
    name: alternative.name,
    thumb: alternative.thumb || exercise.thumb,
    bodyweight: Boolean(alternative.bodyweight),
    unit: alternative.unit || exercise.unit,
    video: "",
  };
  state.alternativePickerExerciseId = null;
  updateMessage("Exercice adapté à votre niveau 💪");
  saveState();
  render();
}

function setRest(exerciseId, value) {
  state.restDurations[exerciseId] = parseTimerInput(value);
  saveState();
  render();
}

function setManualRest(exerciseId) {
  saveManualRestInput(exerciseId);
  render();
}

function saveManualRestInput(exerciseId) {
  const minuteInput = document.querySelector(`[data-rest-minutes="${exerciseId}"]`);
  const secondInput = document.querySelector(`[data-rest-seconds="${exerciseId}"]`);
  const minutes = Math.max(0, Number(minuteInput?.value) || 0);
  const seconds = Math.max(0, Number(secondInput?.value) || 0);
  state.restDurations[exerciseId] = clampRestSeconds(minutes * 60 + seconds);
  saveState();
}

function setReps(exerciseId, index, value) {
  state.reps[setKey(exerciseId, index)] = Math.max(0, Number(value) || 0);
  saveState();
}

function updateCardio() {
  saveCardioInput();
  renderCardio();
}

function saveCardioInput() {
  state.cardio = {
    type: elements.cardioType.value,
    duration: Math.max(0, Number(elements.cardioDuration.value) || 0),
    calories: Math.max(0, Number(elements.cardioCalories.value) || 0),
  };
  saveState();
}

function saveWarmupInput(id, field, value) {
  state.warmups = ensureWarmups().map((item) => {
    if (item.id !== id) return item;
    if (field === "type") return createWarmupEntry({ ...item, type: value });
    if (field === "duration") return createWarmupEntry({ ...item, duration: value });
    if (field === "calories") return createWarmupEntry({ ...item, calories: value });
    return item;
  });
  state.warmup = warmupSummary(state.warmups);
  saveState();
}

function updateWarmupItem(id, field, value) {
  saveWarmupInput(id, field, value);
  renderWarmup();
}

function addWarmup() {
  state.warmups = [...ensureWarmups(), createWarmupEntry()];
  state.warmup = warmupSummary(state.warmups);
  saveState();
  renderWarmup();
}

function removeWarmup(id) {
  state.warmups = ensureWarmups().filter((item) => item.id !== id);
  state.warmup = warmupSummary(state.warmups);
  saveState();
  renderWarmup();
}

function renderWarmup() {
  const warmups = ensureWarmups();
  const summary = warmupSummary(warmups);
  state.warmup = summary;
  elements.warmupStatus.textContent = summary.skipped ? "Ignoré" : `${summary.duration} min · ${summary.calories} kcal`;
  elements.warmupList.innerHTML = warmups.length
    ? warmups.map((item, index) => `
      <article class="warmup-item">
        <div class="warmup-item-head">
          <strong>Échauffement ${index + 1}</strong>
          <span>${item.duration} min · ${warmupItemCalories(item)} kcal</span>
        </div>
        <div class="choice-block warmup-choice-block">
          <span>Type</span>
          <div class="choice-cards">
            ${warmupOptions.map((option) => `
              <button class="choice-card ${option === item.type ? "active" : ""}" type="button" data-warmup-type="${item.id}" data-warmup-value="${option}">
                ${option}
              </button>
            `).join("")}
          </div>
        </div>
        <div class="cardio-grid warmup-fields">
          <label>Durée
            <input data-warmup-duration="${item.id}" type="number" min="1" max="15" step="1" value="${item.duration}">
          </label>
          <label>Kcal
            <input data-warmup-calories="${item.id}" type="number" min="0" max="500" step="1" placeholder="${Math.round(item.duration * 8)}" value="${item.calories || ""}">
          </label>
        </div>
        ${warmups.length > 1 ? `<button class="mini-link" type="button" data-remove-warmup="${item.id}">Supprimer cet échauffement</button>` : ""}
      </article>
    `).join("")
    : `<p class="empty-warmup">Aucun échauffement sélectionné.</p>`;
}

function markSet(exerciseId, index) {
  const weightInput = document.querySelector(`[data-set-weight="${exerciseId}"][data-index="${index}"]`);
  const enteredWeight = weightInput?.value;
  syncActiveSessionInputsFromDOM();
  if (enteredWeight !== undefined && enteredWeight !== "") {
    saveSetWeight(exerciseId, index, enteredWeight);
  }
  getCoachAudioContext();
  const workout = activeWorkout();
  const exerciseIndex = workout.exercises.findIndex((item) => item.id === exerciseId);
  const exercise = workout.exercises[exerciseIndex];
  const target = exerciseTargetValue(exercise);
  const timedExercise = exerciseUnit(exercise) === "sec";
  const executionDone = !timedExercise || getExecutionTimer(executionKey(exerciseId, index))?.message === "Gainage terminé";
  if (!executionDone) return;
  if (state.reps[setKey(exerciseId, index)] === undefined) {
    state.reps[setKey(exerciseId, index)] = target;
  }
  state.sets[setKey(exerciseId, index)] = "done";
  const duration = restDuration(exerciseId);
  const hasNextExercise = index === exercise.sets - 1 && exerciseIndex < workout.exercises.length - 1;
  if (!hasNextExercise) {
    state.restTimers[setKey(exerciseId, index)] = {
      duration,
      remaining: duration,
      endAt: Date.now() + duration * 1000,
      paused: false,
      notifiedSeconds: [],
      message: "",
    };
  }
  if (hasNextExercise) {
    state.restTimers[transitionKey(exerciseId)] = {
      duration: TRANSITION_REST_SECONDS,
      remaining: TRANSITION_REST_SECONDS,
      endAt: Date.now() + TRANSITION_REST_SECONDS * 1000,
      paused: false,
      notifiedSeconds: [],
      message: "",
    };
  }
  const repsDone = getSetReps(exercise, index);
  updateMessage(repsDone >= target ? "Très bien, série proprement terminée." : "On garde le même poids pour la prochaine séance afin de valider proprement.");
  saveState();
  render();
  startTimer();
}

function timerText(key, exerciseId) {
  const timer = getTimer(key);
  if (!timer) return formatTimer(restDuration(exerciseId));
  return formatTimer(timerRemaining(timer));
}

function timerMessage(key) {
  return getTimer(key)?.message || "";
}

function executionTimerText(key, exercise) {
  const timer = getExecutionTimer(key);
  if (!timer) return formatTimer(exerciseTargetValue(exercise));
  return formatTimer(timerRemaining(timer));
}

function executionTimerMessage(key) {
  return getExecutionTimer(key)?.message || "";
}

function startExecutionTimer(exerciseId, index) {
  saveTimedTargetInput(exerciseId);
  const exercise = activeWorkout().exercises.find((item) => item.id === exerciseId);
  if (!exercise || exerciseUnit(exercise) !== "sec") return;
  const target = exerciseTargetValue(exercise);
  state.executionTimers[executionKey(exerciseId, index)] = {
    exerciseId,
    index,
    target,
    remaining: target,
    endAt: Date.now() + target * 1000,
    paused: false,
    message: "",
  };
  saveState();
  render();
  startTimer();
}

function toggleTimer(key) {
  const timer = getTimer(key);
  if (!timer) return;
  const remaining = timerRemaining(timer);
  if (remaining <= 0) return;

  if (timer.paused) {
    state.restTimers[key] = { ...timer, remaining, endAt: Date.now() + remaining * 1000, paused: false };
  } else {
    state.restTimers[key] = { ...timer, remaining, endAt: null, paused: true };
  }

  saveState();
  render();
  startTimer();
}

function resetTimer(key, exerciseId) {
  const duration = restDuration(exerciseId);
  state.restTimers[key] = { duration, remaining: duration, endAt: null, paused: true, notifiedSeconds: [], message: "" };
  saveState();
  render();
}

function exerciseAnalysis(exercise) {
  const bodyweight = isBodyweightExercise(exercise);
  const stats = getStats(exercise);
  const target = exerciseTargetValue(exercise);
  const finishedSets = Array.from({ length: exercise.sets }, (_, index) => getSetStatus(exercise.id, index) !== "open");
  const reps = Array.from({ length: exercise.sets }, (_, index) => getSetReps(exercise, index));
  const finishedCount = finishedSets.filter(Boolean).length;
  const validatedCount = reps.filter((value, index) => finishedSets[index] && value >= target).length;
  const missedCount = reps.filter((value, index) => finishedSets[index] && value < target).length;

  if (bodyweight) {
    if (missedCount > 0 && validatedCount > 0) return "Objectif presque atteint : garde une posture propre et respire régulièrement.";
    if (missedCount > 0) return "Garde le même temps la prochaine fois et privilégie une position solide.";
    if (finishedCount === exercise.sets && validatedCount === exercise.sets) return "Très bon gainage : +5 sec proposés pour la prochaine séance.";
    if (validatedCount > 0) return "Bonne tenue, garde les abdos serrés et le dos stable.";
    return "Objectif : tenir le temps prévu avec une posture propre.";
  }

  if (stats.sessions === 0) return "Première séance : entre le poids réellement utilisé, le coach apprendra avec ton historique.";
  if (stats.loweredToday) return "Poids trop lourd détecté : reste sur ce poids aujourd'hui.";
  if (missedCount > 0 && validatedCount > 0) return "Objectif presque atteint, garde le même poids pour valider proprement.";
  if (missedCount > 0) return "On garde le même poids pour la prochaine séance afin de valider proprement.";
  if (finishedCount === exercise.sets && validatedCount === exercise.sets) return "Très bonne série : tu peux augmenter légèrement le poids.";
  if (stats.sameWeightSessions >= 3) return "Stagnation : diminue légèrement le poids ou garde-le pour valider proprement.";
  if (validatedCount > 0) return "Tu progresses régulièrement.";
  return "Objectif : valider les séries avec une bonne technique.";
}

function completeWorkout() {
  const workout = activeWorkout();
  state.cardio = {
    type: elements.cardioType.value,
    duration: Math.max(0, Number(elements.cardioDuration.value) || 0),
    calories: Math.max(0, Number(elements.cardioCalories.value) || 0),
  };
  const startedAt = state.workoutStartedAt || Date.now();
  const strengthDuration = Math.max(workout.duration, Math.round((Date.now() - startedAt) / 60000));
  const warmups = ensureWarmups();
  const warmupDuration = warmups.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const durationMinutes = strengthDuration + warmupDuration + Number(state.cardio.duration || 0);
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const doneSets = Object.values(state.sets).filter((status) => status === "done").length;
  const exerciseResults = [];
  let progressions = 0;

  workout.exercises.forEach((exercise) => {
    const bodyweight = isBodyweightExercise(exercise);
    const stats = getStats(exercise);
    const target = exerciseTargetValue(exercise);
    const statuses = Array.from({ length: exercise.sets }, (_, index) => getSetStatus(exercise.id, index));
    const reps = Array.from({ length: exercise.sets }, (_, index) => getSetReps(exercise, index));
    const weights = bodyweight ? [] : Array.from({ length: exercise.sets }, (_, index) => getSetWeight(exercise, index, stats));
    const allFinished = statuses.every((status) => status !== "open");
    const allValidated = allFinished && reps.every((value) => value >= target);
    const hasMissedTarget = statuses.some((status, index) => status !== "open" && reps[index] < target);
    const usedWeight = bodyweight ? 0 : Number(weights.at(-1) ?? currentSessionWeight(exercise, stats));
    const startingWeight = Number(state.sessionStartWeights[exercise.id] ?? stats.lastWeight ?? 0);
    const reducedCharge = !bodyweight && (
      usedWeight < startingWeight ||
      weights.some((weight, index) => index > 0 && weight < weights[index - 1])
    );

    const suggestedWeight = allValidated && !bodyweight
      ? Math.round((usedWeight + 2.5) * 10) / 10
      : null;

    if (allValidated) {
      stats.sameWeightSessions = 0;
      if (!bodyweight) progressions += 1;
      if (bodyweight && exerciseUnit(exercise) === "sec") stats.targetSeconds = target + 5;
    } else {
      stats.sameWeightSessions += 1;
      if (bodyweight && exerciseUnit(exercise) === "sec") stats.targetSeconds = target;
    }

    stats.lastWeight = usedWeight;
    stats.targetWeight = usedWeight;
    stats.sessions = (stats.sessions || 0) + 1;
    stats.loweredToday = false;

    exerciseResults.push({
      exerciseId: exercise.id,
      name: exercise.name,
      weight: bodyweight ? null : usedWeight,
      weights,
      reps,
      statuses,
      sets: exercise.sets,
      targetReps: target,
      unit: exerciseUnit(exercise),
      muscles: exercise.muscles,
      progressionValidated: allValidated,
      needsSameWeight: !bodyweight && hasMissedTarget,
      suggestedWeight,
      bodyweight,
      reducedCharge,
      originalName: exercise.originalName || exercise.name,
      adapted: Boolean(exercise.originalName),
    });
  });

  const strengthCalories = workout.calories || 0;
  const warmupCalories = warmups.reduce((sum, item) => sum + warmupItemCalories(item), 0);
  const cardioCalories = Number(state.cardio.calories) || 0;
  const totalCalories = strengthCalories + warmupCalories + cardioCalories;
  const exerciseCount = exerciseResults.filter((item) => item.statuses.some((status) => status !== "open")).length;
  const completedPlannedDate = state.activeScheduledDate || todayKey();
  const report = {
    date: completedPlannedDate,
    completedAt: todayKey(),
    scheduledId: state.activeScheduledId,
    workout: workout.name,
    sessionName: currentSessionLabel(workout),
    sessionDescription: sessionDescriptionFor(workout),
    programName: currentProgram().name,
    durationMinutes,
    exerciseCount,
    doneSets,
    totalSets,
    strengthCalories,
    warmup: warmupSummary(warmups),
    warmups: warmups.map((item) => ({ ...item, estimatedCalories: warmupItemCalories(item) })),
    cardio: { ...state.cardio },
    totalCalories,
    progressions,
    muscles: workout.muscles,
    exercises: exerciseResults,
  };

  state.history.unshift(report);
  state.exerciseHistory.unshift(...exerciseResults.map((item) => ({ date: completedPlannedDate, completedAt: todayKey(), workout: workout.name, ...item })));
  state.sessionReports.unshift(report);
  state.history = state.history.slice(0, 12);
  state.exerciseHistory = state.exerciseHistory.slice(0, 200);
  state.sessionReports = state.sessionReports.slice(0, 60);
  state.scheduledWorkouts = state.scheduledWorkouts.filter((item) => (
    state.activeScheduledId ? scheduleId(item) !== state.activeScheduledId : item.date !== completedPlannedDate
  ));
  state.nextWorkoutIndex += 1;
  state.activeWorkoutId = null;
  state.activeScheduledDate = null;
  state.activeScheduledId = null;
  state.workoutStartedAt = null;
  resetTemporarySessionFields();

  const firstName = state.profile.firstName;
  const hasMissedTargets = exerciseResults.some((item) => item.needsSameWeight);
  const hasReducedCharge = exerciseResults.some((item) => item.reducedCharge);
  const sessionCount = state.history.length;
  let finalMessage = pickMotivation("afterWorkout", { firstName, totalCalories });
  if (hasReducedCharge) {
    finalMessage = "Tu as réduit la charge pendant l'exercice. Le poids de départ était peut-être un peu trop élevé. On ajustera la prochaine séance.";
  } else if (hasMissedTargets) {
    finalMessage = "Objectif presque atteint, continue comme ça. On garde le même poids pour la prochaine séance.";
  } else if (progressions > 0) {
    finalMessage = `${pickMotivation("progression", { firstName, totalCalories })} La prochaine fois, essaie un peu plus lourd.`;
  } else if (sessionCount > 0 && sessionCount % 3 === 0) {
    finalMessage = pickMotivation("consistency", { firstName, totalCalories });
  }

  setHomeMotivation(finalMessage);
  saveState();
  render();
  showSummary(report, finalMessage);
}

function showSummary(report, message) {
  elements.summaryTitle.textContent = `Bravo ${state.profile.firstName}`;
  elements.summaryDuration.textContent = `${report.durationMinutes} min`;
  elements.summaryExercises.textContent = report.exerciseCount;
  elements.summaryCalories.textContent = `${report.totalCalories} kcal`;
  elements.summaryProgressions.textContent = report.progressions;
  elements.summaryMessage.textContent = message;
  showScreen("summarySheet");
}

function openExerciseGuide(exerciseId) {
  const exercise = workouts.flatMap((workout) => workout.exercises).find((item) => item.id === exerciseId);
  if (!exercise) return;
  const guide = exerciseGuides[exercise.id] || { tips: ["Mouvement propre et contrôlé."], mistakes: ["Éviter les mouvements brusques."] };

  elements.demoVisual.innerHTML = thumbnails[exercise.thumb];
  elements.demoType.textContent = exerciseTargetLabel(exercise);
  elements.demoTitle.textContent = exercise.name;
  elements.demoMuscles.innerHTML = exercise.muscles.map((muscle) => `<span class="pill">${muscle}</span>`).join("");
  elements.demoTips.innerHTML = guide.tips.map((tip) => `<li>${tip}</li>`).join("");
  elements.demoMistakes.innerHTML = guide.mistakes.map((mistake) => `<li>${mistake}</li>`).join("");
  showScreen("exerciseSheet");
}

function renderProfile() {
  if (!state.profile) return;
  elements.editFirstName.value = state.profile.firstName;
  elements.editAge.value = state.profile.age;
  elements.editBodyWeight.value = state.profile.bodyWeight;
  draftEditGoal = goalOptions.includes(state.profile.goal) ? state.profile.goal : goalOptions[0];
  draftEditLevel = levelOptions.includes(state.profile.level) ? state.profile.level : levelOptions[0];
  elements.goalAdvice.textContent = goalAdvice[state.profile.goal] || "Choisis un objectif pour adapter les conseils.";
  renderAllChoices();

  const firstEntry = state.bodyWeightHistory[0];
  const latestEntry = state.bodyWeightHistory.at(-1);
  const startWeight = Number(firstEntry?.weight || state.profile.bodyWeight || 0);
  const currentWeight = Number(latestEntry?.weight || state.profile.bodyWeight || 0);
  const change = Math.round((currentWeight - startWeight) * 10) / 10;
  const changeText = `${change > 0 ? "+" : ""}${change} kg`;
  const motivatingText = change < 0 ? `${changeText} depuis le début 🔥` : `${changeText} depuis le début`;

  elements.profileEvolution.textContent = motivatingText;
  elements.startWeight.textContent = `${startWeight} kg`;
  elements.currentWeight.textContent = `${currentWeight} kg`;
  elements.totalWeightChange.textContent = motivatingText;
  elements.weightHistoryCount.textContent = `${state.bodyWeightHistory.length} entrée${state.bodyWeightHistory.length > 1 ? "s" : ""}`;
  elements.weightHistoryList.innerHTML = state.bodyWeightHistory.length
    ? [...state.bodyWeightHistory].reverse().slice(0, 8).map((item) => `<div class="history-item"><strong>${item.weight} kg</strong><span>${item.date}</span></div>`).join("")
    : "<p>Aucun poids enregistré.</p>";
}

function renderHome() {
  renderProfile();
  const progress = programProgressInfo();
  elements.homeGreeting.textContent = `Salut ${state.profile.firstName}, prêt pour aujourd’hui ?`;
  elements.programMarker.textContent = programMarkerText();
  elements.programProgressText.textContent = `${progress.percent}% terminé`;
  elements.programProgressBar.style.width = `${progress.percent}%`;
  const planned = nextPlannedWorkoutItem();
  const workout = planned ? workouts.find((item) => item.id === planned.workoutId) || nextWorkout() : nextWorkout();
  elements.homeSessionName.textContent = planned?.sessionName || workout.name;
  elements.homeSessionDescription.textContent = planned?.sessionDescription || sessionDescriptionFor(workout);
  elements.homeSessionMeta.textContent = `${workout.duration} min · ${workout.muscles.slice(0, 3).join(", ")}`;
  elements.homeSessionDate.textContent = planned ? `Prévue le ${formatDateLabel(planned.date)}` : "Prochaine séance disponible";
  elements.homeMotivation.textContent = state.homeMotivation || dailyMotivation();
}

function renderProgressStats() {
  const reports = state.history || [];
  const totalCalories = reports.reduce((sum, report) => sum + Number(report.totalCalories || 0), 0);
  const totalProgressions = reports.reduce((sum, report) => sum + Number(report.progressions || 0), 0);
  const firstWeight = Number(state.bodyWeightHistory[0]?.weight || state.profile?.bodyWeight || 0);
  const lastWeight = Number(state.bodyWeightHistory.at(-1)?.weight || state.profile?.bodyWeight || 0);
  const weightChange = Math.round((lastWeight - firstWeight) * 10) / 10;
  const recentReports = reports.slice(0, 6).reverse();
  const maxCalories = Math.max(1, ...recentReports.map((report) => Number(report.totalCalories || 0)));

  elements.progressPeriod.textContent = currentProgram().name;
  elements.statsSessions.textContent = reports.length;
  elements.statsCalories.textContent = `${totalCalories} kcal`;
  elements.statsWeightChange.textContent = `${weightChange > 0 ? "+" : ""}${weightChange} kg`;
  elements.statsProgressions.textContent = totalProgressions;
  elements.statsHistoryCount.textContent = `${reports.length} séance${reports.length > 1 ? "s" : ""}`;
  elements.caloriesChart.innerHTML = recentReports.length
    ? recentReports.map((report) => {
      const height = Math.max(10, Math.round((Number(report.totalCalories || 0) / maxCalories) * 100));
      return `<div class="chart-bar"><span style="height:${height}%"></span><small>${Number(report.totalCalories || 0)}</small></div>`;
    }).join("")
    : "<p>Aucune donnée pour le moment.</p>";
  elements.statsHistoryList.innerHTML = reports.length
    ? reports.slice(0, 6).map((report) => `<div class="history-item"><strong>${report.sessionName || report.workout}</strong><span>${report.durationMinutes} min · ${report.totalCalories} kcal</span></div>`).join("")
    : "<p>Aucune séance enregistrée pour le moment.</p>";
}

function programReports() {
  const start = state.programPlan?.startDate || state.profile?.createdAt || todayKey();
  return (state.history || []).filter((report) => report.date >= start);
}

function renderProgramSummary() {
  const reports = programReports();
  const totalCalories = reports.reduce((sum, report) => sum + Number(report.totalCalories || 0), 0);
  const totalProgressions = reports.reduce((sum, report) => sum + Number(report.progressions || 0), 0);
  const startWeight = Number(state.bodyWeightHistory[0]?.weight || state.profile?.bodyWeight || 0);
  const currentWeight = Number(state.bodyWeightHistory.at(-1)?.weight || state.profile?.bodyWeight || 0);
  const weightChange = Math.round((currentWeight - startWeight) * 10) / 10;

  elements.programSummarySessions.textContent = reports.length;
  elements.programSummaryCalories.textContent = `${totalCalories} kcal`;
  elements.programSummaryProgressions.textContent = totalProgressions;
  elements.programSummaryWeightChange.textContent = `${weightChange > 0 ? "+" : ""}${weightChange} kg`;
  elements.programSummaryStartWeight.textContent = `Départ ${startWeight} kg`;
  elements.programFinalWeight.value = currentWeight || "";
  if (reports.length && !state.programEndMotivation) {
    state.programEndMotivation = pickMotivation("programEnd", { firstName: state.profile.firstName });
    saveState();
  }
  elements.programSummaryMessage.textContent = weightChange < 0
    ? `${state.programEndMotivation || pickMotivation("programEnd", { firstName: state.profile.firstName })} ${weightChange} kg depuis le début du programme.`
    : "Entre ton poids pour voir ton évolution.";
}

function renderCardio() {
  elements.cardioType.value = state.cardio.type || "tapis de course";
  elements.cardioDuration.value = state.cardio.duration || 0;
  elements.cardioCalories.value = state.cardio.calories || 0;
  elements.cardioCaloriesPreview.textContent = `${Number(state.cardio.calories) || 0} kcal`;
}

function renderCalendar() {
  ensureCalendarState();
  const [year, month] = state.calendarMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const monthTitle = firstDay.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const cells = [];

  elements.calendarTitle.textContent = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(`<span class="calendar-empty"></span>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${state.calendarMonth}-${String(day).padStart(2, "0")}`;
    const done = state.history.find((item) => item.date === dateKey);
    const planned = nextPlannedWorkoutFor(dateKey);
    const isWeighIn = planned?.type === "weighIn";
    const missed = planned && !isWeighIn && !done && dateKey < todayKey();
    const classes = [
      "calendar-day",
      dateKey === todayKey() ? "today" : "",
      dateKey === state.selectedCalendarDate ? "selected" : "",
      done ? "done" : "",
      planned ? "planned" : "",
      isWeighIn ? "weigh-in" : "",
      missed ? "missed" : "",
    ].filter(Boolean).join(" ");
    const label = done ? `✅ ${done.sessionName || done.workout}` : planned ? (planned.sessionName || planned.programName || "Prévu") : "";
    cells.push(`<button class="${classes}" type="button" data-calendar-day="${dateKey}"><strong>${day}</strong><span>${label}</span></button>`);
  }

  elements.calendarGrid.innerHTML = cells.join("");
  renderSelectedDay();
}

function renderSelectedDay() {
  const dateKey = state.selectedCalendarDate || todayKey();
  const report = state.history.find((item) => item.date === dateKey);
  const planned = nextPlannedWorkoutFor(dateKey);
  const isWeighIn = planned?.type === "weighIn";
  const isPastMissed = planned && !isWeighIn && !report && dateKey < todayKey();
  const workout = planned ? workouts.find((item) => item.id === planned.workoutId) || nextWorkout() : nextWorkout();

  elements.selectedDayTitle.textContent = formatDateLabel(dateKey);
  elements.selectedDayStatus.textContent = report ? "Réalisée" : isWeighIn ? "Bilan" : planned ? "Prévue" : "Libre";
  elements.missedWorkoutMessage.classList.toggle("hidden", !isPastMissed);
  $("#delayWorkoutDate").classList.toggle("hidden", !planned || isWeighIn || Boolean(report));
  elements.delayBox.classList.add("hidden");
  elements.calendarConfirmation.classList.add("hidden");
  elements.delayDateInput.value = addDays(dateKey, 1);

  if (report) {
    elements.dayDetail.innerHTML = `
      <div class="day-summary-card">
        <strong>✅ ${report.sessionName || report.workout}</strong>
        <span>${report.sessionDescription || report.programName || "Programme"}</span>
        <span>${report.durationMinutes} min · ${report.totalCalories} kcal · ${report.progressions} progression${report.progressions > 1 ? "s" : ""}</span>
      </div>
      <div class="day-exercises">
        ${report.exercises.map((exercise) => {
          const progression = exercise.bodyweight || exercise.weight === null
            ? `${exercise.sets || 4} x ${exercise.targetReps} ${exercise.unit || "sec"}`
            : exercise.progressionValidated && Number(exercise.suggestedWeight) > Number(exercise.weight)
            ? `${exercise.weight} kg → ${exercise.suggestedWeight} kg`
            : `${exercise.weight} kg`;
          return `<p><strong>${exercise.name}</strong><span>${progression} · objectif ${exercise.targetReps} ${exercise.unit || "reps"}</span></p>`;
        }).join("")}
      </div>
    `;
    return;
  }

  if (isWeighIn) {
    elements.dayDetail.innerHTML = `
      <div class="day-summary-card weigh-summary">
        <strong>⚖️ Bilan poids</strong>
        <span>Dernier jour du programme · pense à te peser pour voir ton évolution.</span>
        <button class="ghost-button" type="button" id="openProgramSummary">Ouvrir le bilan du programme</button>
      </div>
    `;
    return;
  }

  if (planned) {
    elements.dayDetail.innerHTML = `
      <div class="day-summary-card">
        <strong>${planned.sessionName || workout.name}</strong>
        <span>${planned.sessionDescription || planned.programName || currentProgram().name}</span>
        <span>${workout.duration} min · ${workout.muscles.join(", ")}</span>
        <button class="primary-button" type="button" data-start-scheduled="${scheduleId(planned)}">Commencer cette séance</button>
        <button class="ghost-button" type="button" data-move-scheduled="${scheduleId(planned)}">Décaler / déplacer cette séance</button>
      </div>
      <div class="day-exercises">
        ${workout.exercises.map((exercise) => `<p><strong>${exercise.name}</strong><span>${exerciseTargetLabel(exercise)}</span></p>`).join("")}
      </div>
    `;
    return;
  }

  elements.dayDetail.innerHTML = `<p class="empty-day">Aucune séance prévue sur ce jour.</p>`;
}

function renderSession() {
  const workout = activeWorkout();
  elements.sessionType.textContent = workout.type;
  elements.sessionName.textContent = currentSessionLabel(workout);
  elements.sessionDescription.textContent = sessionDescriptionFor(workout);
  elements.sessionMuscles.textContent = workout.muscles.join(" · ");
  elements.sessionDuration.textContent = `${workout.duration} min`;
  elements.sessionCalories.textContent = `${workout.calories} kcal estimées`;
  renderWarmup();

  elements.exerciseList.innerHTML = workout.exercises.map((exercise) => {
    const stats = getStats(exercise);
    const bodyweight = isBodyweightExercise(exercise);
    const advice = nextWeightAdvice(exercise, stats);
    const target = exerciseTargetValue(exercise);
    const timedExercise = exerciseUnit(exercise) === "sec";
    const alternatives = exerciseAlternatives[exercise.id] || [];
    const alternativesOpen = state.alternativePickerExerciseId === exercise.id;
    const sets = Array.from({ length: exercise.sets }, (_, index) => {
      const key = setKey(exercise.id, index);
      const execKey = executionKey(exercise.id, index);
      const status = getSetStatus(exercise.id, index);
      const timer = getTimer(key);
      const executionTimer = getExecutionTimer(execKey);
      const remaining = timerRemaining(timer);
      const pauseLabel = timer?.paused ? "Reprendre" : "Pause";
      const holdFinished = executionTimer?.message === "Gainage terminé";
      const executionControl = timedExercise ? `
          <button class="timer-button" type="button" data-execution-start="${exercise.id}" data-index="${index}">Lancer le gainage</button>
          <span class="rest-badge" data-execution-timer="${execKey}">${executionTimerText(execKey, exercise)}</span>
          <small class="timer-message" data-execution-message="${execKey}">${executionTimerMessage(execKey)}</small>
        ` : "";
      const weightInput = bodyweight ? "" : `
        <label class="set-value-field"><small>Poids</small>
          <input class="reps-input" type="number" min="0" step="0.5" value="${getSetWeight(exercise, index, stats)}" data-set-weight="${exercise.id}" data-index="${index}" aria-label="Poids série ${index + 1} ${exercise.name}">
        </label>`;
      const repsInput = timedExercise ? "" : `
        <label class="set-value-field"><small>Reps</small>
          <input class="reps-input" type="number" min="0" max="999" value="${getSetReps(exercise, index)}" data-reps="${exercise.id}" data-index="${index}" aria-label="${exerciseUnit(exercise)} série ${index + 1}">
        </label>`;
      return `
        <div class="set-row">
          <div><strong>Série ${index + 1}</strong><small>objectif ${target} ${exerciseUnit(exercise)}</small></div>
          ${weightInput}
          ${repsInput}
          ${executionControl}
          <span class="rest-badge" data-timer="${key}">${timerText(key, exercise.id)}</span>
          <small class="timer-message" data-timer-message="${key}">${timerMessage(key)}</small>
          <button class="set-button ${status === "done" ? "done" : ""}" type="button" data-set="${exercise.id}" data-index="${index}" ${timedExercise && !holdFinished && status !== "done" ? "disabled" : ""}>Série terminée</button>
          <button class="timer-button" type="button" data-timer-toggle="${key}" ${!timer || remaining <= 0 ? "disabled" : ""}>${pauseLabel}</button>
          <button class="timer-button" type="button" data-timer-reset="${key}" data-timer-exercise="${exercise.id}" ${!timer ? "disabled" : ""}>Reset</button>
        </div>
      `;
    }).join("");
    const transitionTimer = getTimer(transitionKey(exercise.id));
    const transitionRemaining = timerRemaining(transitionTimer);
    const transitionRest = transitionTimer ? `
      <p class="coach-note transition-rest">
        <strong>Repos avant le prochain exercice</strong>
        <span class="rest-badge" data-timer="${transitionKey(exercise.id)}">${formatTimer(transitionRemaining)}</span>
        <small class="timer-message" data-timer-message="${transitionKey(exercise.id)}">${timerMessage(transitionKey(exercise.id))}</small>
      </p>
    ` : "";

    return `
      <article class="exercise-card">
        <div class="exercise-top">
          <div class="exercise-thumb">${thumbnails[exercise.thumb]}</div>
          <div class="exercise-info">
            <h3>${exercise.name}</h3>
            <div class="exercise-meta">
              <span class="pill">${exerciseTargetLabel(exercise)}</span>
              ${exercise.muscles.map((muscle) => `<span class="pill">${muscle}</span>`).join("")}
            </div>
            <button class="guide-button" type="button" data-guide="${exercise.id}">Voir l'exercice</button>
            ${exercise.video ? `<a class="video-link" href="${exercise.video}" target="_blank" rel="noopener noreferrer">▶ Voir la vidéo</a>` : ""}
            ${alternatives.length ? `<button class="guide-button" type="button" data-alternative-picker="${exercise.id}">Exercice trop difficile ?</button>` : ""}
            ${alternativesOpen ? `
              <div class="choice-cards compact">
                ${alternatives.map((alternative, index) => `
                  <button class="choice-card" type="button" data-use-alternative="${exercise.id}" data-alternative-index="${index}">${alternative.name}</button>
                `).join("")}
              </div>
            ` : ""}
          </div>
        </div>
        <div class="control-block">
          ${timedExercise ? `
            <label>Temps de maintien <small>${target} sec</small></label>
            <div class="rest-control">
              <label class="rest-number-field">Min
                <input type="number" min="0" max="10" step="1" value="${Math.floor(target / 60)}" data-hold-minutes="${exercise.id}" aria-label="Minutes gainage ${exercise.name}">
              </label>
              <label class="rest-number-field">Sec
                <input type="number" min="0" max="59" step="5" value="${target % 60}" data-hold-seconds="${exercise.id}" aria-label="Secondes gainage ${exercise.name}">
              </label>
              <span>${formatTimer(target)}</span>
            </div>
          ` : ""}
          ${!bodyweight && advice ? `
            <div class="weight-advice">
              <span>Progression validée</span>
              <strong>${advice.from} kg → ${advice.to} kg</strong>
              <button type="button" data-use-suggested="${exercise.id}" data-suggested-weight="${advice.to}">Utiliser</button>
            </div>
          ` : ""}
          <label>Repos</label>
          <div class="rest-control">
            <label class="rest-number-field">Min
              <input type="number" min="0" max="3" step="1" value="${Math.floor(restDuration(exercise.id) / 60)}" data-rest-minutes="${exercise.id}" aria-label="Minutes repos ${exercise.name}">
            </label>
            <label class="rest-number-field">Sec
              <input type="number" min="0" max="59" step="1" value="${restDuration(exercise.id) % 60}" data-rest-seconds="${exercise.id}" aria-label="Secondes repos ${exercise.name}">
            </label>
            <span>${formatTimer(restDuration(exercise.id))}</span>
          </div>
        </div>
        <div class="sets">${sets}</div>
        ${transitionRest}
        <p class="coach-note">${exerciseAnalysis(exercise)}</p>
      </article>
    `;
  }).join("");
  renderCardio();
}

function render() {
  showProfileIfNeeded();
  renderAllChoices();
  if (!state.profile) return;
  ensureCalendarState();
  renderHome();
  renderProgressStats();
  renderProgramSummary();
  renderSession();
  renderCalendar();
}

function resumeActiveWorkoutScreen() {
  if (!state.profile?.firstName || !state.activeWorkoutId) return false;
  renderSession();
  showScreen("sessionScreen");
  startTimer();
  return true;
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    let hasActiveTimer = false;
    let changedTimerState = false;
    Object.keys(state.restTimers).forEach((key) => {
      const timer = getTimer(key);
      const left = timerRemaining(timer);
      const badge = document.querySelector(`[data-timer="${key}"]`);
      const message = document.querySelector(`[data-timer-message="${key}"]`);
      if (badge) badge.textContent = formatTimer(left);
      if (message) message.textContent = timer?.message || "";
      if (timer && !timer.paused && left > 0) hasActiveTimer = true;
      if (timer && !timer.paused && left > 0 && left <= 5 && !(timer.notifiedSeconds || []).includes(left)) {
        state.restTimers[key] = { ...timer, notifiedSeconds: [...(timer.notifiedSeconds || []), left] };
        notifyRestTimer(false);
        changedTimerState = true;
      }
      if (timer && !timer.paused && left === 0) {
        const alreadyFinished = timer.message === "Repos terminé";
        state.restTimers[key] = { ...timer, remaining: 0, endAt: null, paused: true, message: "Repos terminé" };
        if (!alreadyFinished) {
          notifyRestTimer(true);
          if (message) message.textContent = "Repos terminé";
        }
        changedTimerState = true;
      }
    });
    Object.keys(state.executionTimers || {}).forEach((key) => {
      const timer = getExecutionTimer(key);
      const left = timerRemaining(timer);
      const badge = document.querySelector(`[data-execution-timer="${key}"]`);
      const message = document.querySelector(`[data-execution-message="${key}"]`);
      if (badge) badge.textContent = formatTimer(left);
      if (message) message.textContent = timer?.message || "";
      if (timer && !timer.paused && left > 0) hasActiveTimer = true;
      if (timer && !timer.paused && left === 0) {
        const alreadyFinished = timer.message === "Gainage terminé";
        const exercise = activeWorkout().exercises.find((item) => item.id === timer.exerciseId);
        const target = exercise ? exerciseTargetValue(exercise) : timer.target;
        const restKey = setKey(timer.exerciseId, timer.index);
        const duration = restDuration(timer.exerciseId);
        state.executionTimers[key] = { ...timer, remaining: 0, endAt: null, paused: true, message: "Gainage terminé" };
        if (!alreadyFinished) {
          state.sets[restKey] = "done";
          state.reps[restKey] = target;
          state.restTimers[restKey] = {
            duration,
            remaining: duration,
            endAt: Date.now() + duration * 1000,
            paused: false,
            notifiedSeconds: [],
            message: "",
          };
          updateMessage("Gainage terminé, récupération lancée.");
          notifyRestTimer(true);
          hasActiveTimer = true;
        }
        if (message) message.textContent = "Gainage terminé";
        const setButton = document.querySelector(`[data-set="${timer.exerciseId}"][data-index="${timer.index}"]`);
        if (setButton) {
          setButton.disabled = false;
          setButton.classList.add("done");
        }
        changedTimerState = true;
      }
    });
    if (changedTimerState) saveState();
    if (!hasActiveTimer) clearInterval(timerId);
  }, 1000);
}

elements.profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const bodyWeight = Number($("#profileBodyWeight").value);
  const programId = goalProgramMap[draftProfileGoal] || "beginner";
  const startDate = selectedProgramStartDate();
  state.profile = {
    firstName: $("#profileFirstName").value.trim(),
    age: Number($("#profileAge").value),
    bodyWeight,
    goal: draftProfileGoal,
    level: draftProfileLevel,
    createdAt: todayKey(),
  };
  state.programPlan = {
    programId,
    durationWeeks: draftDurationWeeks,
    trainingDays: [...autoTrainingDays],
    startDate,
  };
  state.scheduledWorkouts = generateProgramSchedule(programId, draftDurationWeeks, autoTrainingDays, startDate);
  state.nextWorkoutIndex = 0;
  state.bodyWeightHistory = [{ date: todayKey(), weight: bodyWeight }];
  state.homeMotivation = pickMotivation("consistency", { firstName: state.profile.firstName });
  state.lastMessage = `Bienvenue ${state.profile.firstName}, on construit ta progression tranquillement.`;
  saveState();
  render();
});

elements.profileEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const previousWeight = Number(state.profile.bodyWeight);
  const nextWeight = Number(elements.editBodyWeight.value);
  const previousGoal = state.profile.goal;
  const goalChanged = draftEditGoal !== previousGoal;
  const regenerateProgram = goalChanged
    ? confirm("Voulez-vous remplacer le planning actuel par le programme correspondant à ce nouvel objectif ?")
    : false;
  const nextGoal = goalChanged && !regenerateProgram ? previousGoal : draftEditGoal;

  state.profile = {
    ...state.profile,
    firstName: elements.editFirstName.value.trim(),
    age: Number(elements.editAge.value),
    bodyWeight: nextWeight,
    goal: nextGoal,
    level: draftEditLevel,
  };

  if (nextWeight !== previousWeight) {
    state.bodyWeightHistory.push({ date: todayKey(), weight: nextWeight });
  }

  if (regenerateProgram) {
    const programId = goalProgramMap[nextGoal] || "beginner";
    const durationWeeks = Number(state.programPlan?.durationWeeks || 6);
    const startDate = todayKey();
    state.programPlan = {
      programId,
      durationWeeks,
      trainingDays: [...autoTrainingDays],
      startDate,
    };
    state.scheduledWorkouts = generateProgramSchedule(programId, durationWeeks, autoTrainingDays, startDate);
    state.nextWorkoutIndex = 0;
    state.activeWorkoutId = null;
    state.activeScheduledDate = null;
    state.activeScheduledId = null;
    state.selectedCalendarDate = startDate;
    state.calendarMonth = monthKey(startDate);
    state.homeMotivation = pickMotivation("consistency", { firstName: state.profile.firstName });
    state.programEndMotivation = "";
    state.lastMessage = `Nouveau programme généré pour l’objectif ${nextGoal}.`;
  } else {
    state.lastMessage = goalChanged
      ? `Profil mis à jour, planning conservé sur ${previousGoal}.`
      : `Profil mis à jour, ${state.profile.firstName}.`;
  }

  saveState();
  render();
});

$("#goTraining").addEventListener("click", startWorkout);
$("#viewProgress").addEventListener("click", () => showScreen("progressScreen"));
$("#finishWorkout").addEventListener("click", completeWorkout);
$("#resetSession").addEventListener("click", () => {
  if (!confirm("Voulez-vous vraiment réinitialiser cette séance ?")) return;
  resetTemporarySessionFields();
  if (state.activeWorkoutId) {
    activeWorkout().exercises.forEach((exercise) => {
      const stats = getStats(exercise);
      stats.targetWeight = stats.lastWeight;
      stats.loweredToday = false;
      state.sessionStartWeights[exercise.id] = stats.lastWeight;
    });
  }
  saveState();
  render();
});
$("#addWarmup").addEventListener("click", addWarmup);
$("#skipWarmup").addEventListener("click", () => {
  state.warmups = [];
  state.warmup = warmupSummary([]);
  saveState();
  renderWarmup();
});
$("#closeSummary").addEventListener("click", () => {
  showScreen("homeScreen");
});
$("#closeExerciseSheet").addEventListener("click", () => {
  showScreen("sessionScreen");
});
$("#resetAllData").addEventListener("click", () => {
  const firstConfirm = confirm("Attention, cette action efface toutes les données. Voulez-vous vraiment tout réinitialiser ?");
  if (!firstConfirm) return;
  const secondConfirm = confirm("Confirmez une deuxième fois : toutes les données seront définitivement supprimées.");
  if (!secondConfirm) return;
  localStorage.removeItem(STORAGE_KEY);
  state = freshState();
  draftProfileGoal = goalOptions[0];
  draftProfileLevel = levelOptions[0];
  draftEditGoal = goalOptions[0];
  draftEditLevel = levelOptions[0];
  draftDurationWeeks = 6;
  draftStartMode = "today";
  elements.profileForm.reset();
  elements.profileScreen.classList.remove("hidden");
  elements.appShell.classList.add("hidden");
  render();
  showScreen("homeScreen");
});

$("#previousMonth").addEventListener("click", () => {
  ensureCalendarState();
  const [year, month] = state.calendarMonth.split("-").map(Number);
  state.calendarMonth = localMonthKey(new Date(year, month - 2, 1));
  saveState();
  renderCalendar();
});

$("#nextMonthButton").addEventListener("click", () => {
  ensureCalendarState();
  const [year, month] = state.calendarMonth.split("-").map(Number);
  state.calendarMonth = localMonthKey(new Date(year, month, 1));
  saveState();
  renderCalendar();
});

$("#delayWorkoutDate").addEventListener("click", () => {
  ensureCalendarState();
  const date = state.selectedCalendarDate;
  const planned = nextPlannedWorkoutFor(date);
  if (!planned) return;
  elements.delayDateInput.value = addDays(date, 1);
  elements.delayBox.classList.remove("hidden");
  elements.calendarConfirmation.classList.add("hidden");
});

function showMoveBox(planned) {
  if (!planned) return;
  state.selectedCalendarDate = planned.date;
  elements.delayDateInput.value = planned.date;
  elements.delayBox.classList.remove("hidden");
  elements.calendarConfirmation.classList.add("hidden");
}

$("#confirmDelayWorkout").addEventListener("click", () => {
  ensureCalendarState();
  const date = state.selectedCalendarDate;
  const planned = nextPlannedWorkoutFor(date);
  const nextDate = elements.delayDateInput.value;
  if (!planned || !nextDate) return;
  planned.date = nextDate;
  planned.id = scheduleId(planned);
  state.selectedCalendarDate = nextDate;
  state.calendarMonth = monthKey(nextDate);
  saveState();
  renderCalendar();
  elements.calendarConfirmation.textContent = "Séance déplacée avec succès.";
  elements.calendarConfirmation.classList.remove("hidden");
});

$("#saveProgramWeight").addEventListener("click", () => {
  const nextWeight = Number(elements.programFinalWeight.value);
  if (!nextWeight) return;
  state.profile.bodyWeight = nextWeight;
  state.bodyWeightHistory.push({ date: todayKey(), weight: nextWeight });
  const message = state.programEndMotivation || pickMotivation("programEnd", { firstName: state.profile.firstName });
  state.programEndMotivation = message;
  state.homeMotivation = message;
  state.lastMessage = `Bilan enregistré : ${nextWeight} kg. ${message}`;
  saveState();
  render();
  showScreen("programSummaryScreen");
});

document.querySelector(".bottom-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-screen]");
  if (button) showScreen(button.dataset.screen);
});

document.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-choice-group]");
  if (choice) {
    const value = choice.dataset.choiceValue;
    if (choice.dataset.choiceGroup === "profileGoal") draftProfileGoal = value;
    if (choice.dataset.choiceGroup === "profileLevel") draftProfileLevel = value;
    if (choice.dataset.choiceGroup === "duration") draftDurationWeeks = Number(value);
    if (choice.dataset.choiceGroup === "startMode") draftStartMode = value;
    if (choice.dataset.choiceGroup === "editGoal") draftEditGoal = value;
    if (choice.dataset.choiceGroup === "editLevel") draftEditLevel = value;
    renderAllChoices();
  }

  const warmupType = event.target.closest("[data-warmup-type]");
  if (warmupType) updateWarmupItem(warmupType.dataset.warmupType, "type", warmupType.dataset.warmupValue);

  const removeWarmupButton = event.target.closest("[data-remove-warmup]");
  if (removeWarmupButton) removeWarmup(removeWarmupButton.dataset.removeWarmup);

  const calendarDay = event.target.closest("[data-calendar-day]");
  if (calendarDay) {
    state.selectedCalendarDate = calendarDay.dataset.calendarDay;
    state.calendarMonth = monthKey(state.selectedCalendarDate);
    saveState();
    renderCalendar();
  }

  const setButton = event.target.closest("[data-set]");
  if (setButton) markSet(setButton.dataset.set, Number(setButton.dataset.index));

  const minus = event.target.closest("[data-weight-minus]");
  if (minus) adjustWeight(minus.dataset.weightMinus, -1);

  const plus = event.target.closest("[data-weight-plus]");
  if (plus) adjustWeight(plus.dataset.weightPlus, 1);

  const suggested = event.target.closest("[data-use-suggested]");
  if (suggested) setWeight(suggested.dataset.useSuggested, suggested.dataset.suggestedWeight);

  const timerToggle = event.target.closest("[data-timer-toggle]");
  if (timerToggle) toggleTimer(timerToggle.dataset.timerToggle);

  const timerReset = event.target.closest("[data-timer-reset]");
  if (timerReset) resetTimer(timerReset.dataset.timerReset, timerReset.dataset.timerExercise);

  const executionStart = event.target.closest("[data-execution-start]");
  if (executionStart) startExecutionTimer(executionStart.dataset.executionStart, Number(executionStart.dataset.index));

  const startScheduled = event.target.closest("[data-start-scheduled]");
  if (startScheduled) {
    const planned = scheduledWorkoutById(startScheduled.dataset.startScheduled);
    if (planned) startWorkout(planned);
  }

  const moveScheduled = event.target.closest("[data-move-scheduled]");
  if (moveScheduled) showMoveBox(scheduledWorkoutById(moveScheduled.dataset.moveScheduled));

  const alternativePicker = event.target.closest("[data-alternative-picker]");
  if (alternativePicker) {
    const exerciseId = alternativePicker.dataset.alternativePicker;
    state.alternativePickerExerciseId = state.alternativePickerExerciseId === exerciseId ? null : exerciseId;
    saveState();
    render();
  }

  const alternative = event.target.closest("[data-use-alternative]");
  if (alternative) replaceSessionExercise(alternative.dataset.useAlternative, Number(alternative.dataset.alternativeIndex));

  const guide = event.target.closest("[data-guide]");
  if (guide) openExerciseGuide(guide.dataset.guide);

  const programSummary = event.target.closest("#openProgramSummary");
  if (programSummary) showScreen("programSummaryScreen");
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-weight]")) saveWeightInput(event.target.dataset.weight, event.target.value);
  if (event.target.matches("[data-set-weight]")) saveSetWeight(event.target.dataset.setWeight, Number(event.target.dataset.index), event.target.value);
  if (event.target.matches("[data-reps]")) setReps(event.target.dataset.reps, Number(event.target.dataset.index), event.target.value);
  if (event.target.matches("[data-rest-minutes]")) saveManualRestInput(event.target.dataset.restMinutes);
  if (event.target.matches("[data-rest-seconds]")) saveManualRestInput(event.target.dataset.restSeconds);
  if (event.target.matches("[data-hold-minutes]")) saveTimedTargetInput(event.target.dataset.holdMinutes);
  if (event.target.matches("[data-hold-seconds]")) saveTimedTargetInput(event.target.dataset.holdSeconds);
  if (event.target.matches("#cardioType, #cardioDuration, #cardioCalories")) saveCardioInput();
  if (event.target.matches("[data-warmup-duration]")) saveWarmupInput(event.target.dataset.warmupDuration, "duration", event.target.value);
  if (event.target.matches("[data-warmup-calories]")) saveWarmupInput(event.target.dataset.warmupCalories, "calories", event.target.value);
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-weight]")) setWeight(event.target.dataset.weight, event.target.value);
  if (event.target.matches("[data-set-weight]")) saveSetWeight(event.target.dataset.setWeight, Number(event.target.dataset.index), event.target.value);
  if (event.target.matches("[data-rest-duration]")) setRest(event.target.dataset.restDuration, event.target.value);
  if (event.target.matches("[data-rest-minutes]")) setManualRest(event.target.dataset.restMinutes);
  if (event.target.matches("[data-rest-seconds]")) setManualRest(event.target.dataset.restSeconds);
  if (event.target.matches("[data-hold-minutes]")) { saveTimedTargetInput(event.target.dataset.holdMinutes); render(); }
  if (event.target.matches("[data-hold-seconds]")) { saveTimedTargetInput(event.target.dataset.holdSeconds); render(); }
  if (event.target.matches("[data-reps]")) setReps(event.target.dataset.reps, Number(event.target.dataset.index), event.target.value);
  if (event.target.matches("[data-warmup-duration]")) updateWarmupItem(event.target.dataset.warmupDuration, "duration", event.target.value);
  if (event.target.matches("[data-warmup-calories]")) updateWarmupItem(event.target.dataset.warmupCalories, "calories", event.target.value);
  if (event.target.matches("#cardioType, #cardioDuration, #cardioCalories")) updateCardio();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    syncActiveSessionInputsFromDOM();
    return;
  }
  if (state.activeWorkoutId) {
    render();
    resumeActiveWorkoutScreen();
  }
});

window.addEventListener("pageshow", () => {
  if (state.activeWorkoutId) resumeActiveWorkoutScreen();
});

window.addEventListener("pagehide", syncActiveSessionInputsFromDOM);
window.addEventListener("beforeunload", syncActiveSessionInputsFromDOM);

render();
if (!resumeActiveWorkoutScreen()) startTimer();
