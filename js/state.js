// state.js
const STORAGE_KEY = "tarot_quiz_state_v1"; 

export function createInitialState() {
  return {
    currentQuestions: [],
    userAnswers: [],
    totalScore: 0,
    totalAnswered: 0,
    showResults: false
  };
}

export function saveStateSilently(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Erreur save", e);
  }
}

export function loadStateSilently() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}