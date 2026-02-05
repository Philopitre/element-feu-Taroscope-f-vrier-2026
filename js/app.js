// app.js
import { createInitialState, loadStateSilently } from "./state.js";
import { createRenderer } from "./render.js";

document.addEventListener("DOMContentLoaded", () => {
  // Paramètres du quiz Tarot
  const QUESTIONS_PER_GAME = 5; 

  const $statsRoot = document.getElementById("stats-root");
  const $contentRoot = document.getElementById("content-root");

  if (!$statsRoot || !$contentRoot) {
    console.error("Erreur : Les éléments stats-root ou content-root sont introuvables dans le HTML.");
    return;
  }

  // 1. Initialisation de l'état (State)
  let state = createInitialState();

  // 2. Restauration d'une session précédente si elle existe
  const restored = loadStateSilently();
  if (restored) {
    state = restored;
  }

  // 3. Création du moteur de rendu
  const renderer = createRenderer({
    QUESTIONS_PER_GAME,
    $statsRoot,
    $contentRoot,
    getState: () => state,
    setState: (next) => { state = next; }
  });

  // 4. Lancement du rendu initial
  renderer.render();
});