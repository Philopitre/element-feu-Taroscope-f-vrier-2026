// render.js
import { QUESTIONS_LEVEL_1 as QUESTIONS } from "./questions.js";
import { shuffle, allAnswered } from "./utils.js";
import { saveStateSilently, createInitialState } from "./state.js";

export function createRenderer({
  QUESTIONS_PER_GAME,
  $statsRoot,
  $contentRoot,
  getState,
  setState
}) {

  function startNewGame() {
    const indices = Array.from({ length: QUESTIONS.length }, (_, i) => i);
    const picked = shuffle(indices).slice(0, QUESTIONS_PER_GAME);
    
    const currentQuestions = picked.map(i => {
      const q = QUESTIONS[i];
      const mappedOptions = q.options.map((opt, index) => ({ text: opt, isCorrect: index === q.correct }));
      const shuffledOptions = shuffle(mappedOptions);
      return {
        ...q,
        options: shuffledOptions.map(o => o.text),
        correct: shuffledOptions.findIndex(o => o.isCorrect) 
      };
    });

    const nextState = { 
      ...createInitialState(), 
      currentQuestions, 
      userAnswers: new Array(currentQuestions.length).fill(undefined), 
      showResults: false 
    };

    setState(nextState);
    saveStateSilently(nextState);
    render();

    // --- CORRECTION DU SCROLL ---
    // On utilise un timeout de 0 pour laisser le temps au DOM de se vider/remplir
    // Et on force le scroll sur plusieurs cibles pour être sûr
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }, 10);
  }

  function handleAnswer(qIdx, aIdx) {
    const s = getState();
    const newUserAnswers = [...s.userAnswers];
    newUserAnswers[qIdx] = aIdx;
    setState({ ...s, userAnswers: newUserAnswers });
    saveStateSilently(getState());
    render();
  }

  function validateGame() {
    const s = getState();
    
    const unansweredIndices = s.userAnswers
      .map((ans, idx) => (ans === undefined ? idx + 1 : null))
      .filter(n => n !== null);

    if (unansweredIndices.length > 0) {
      alert(`Oups ! Il manque encore une réponse aux questions suivantes : ${unansweredIndices.join(", ")}.`);
      return; 
    }

    let correctCount = 0;
    s.currentQuestions.forEach((q, i) => { if (s.userAnswers[i] === q.correct) correctCount++; });
    
    setState({ 
      ...s, 
      totalScore: (s.totalScore || 0) + correctCount, 
      totalAnswered: (s.totalAnswered || 0) + s.currentQuestions.length, 
      showResults: true 
    });
    
    saveStateSilently(getState());
    render();
    
    // Remonte en haut pour voir le score
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderStats() {
    const s = getState();
    if (!s.totalAnswered) { $statsRoot.innerHTML = ""; return; }
    const percent = Math.round((s.totalScore / s.totalAnswered) * 100);
    $statsRoot.innerHTML = `<div style="text-align:center; margin-bottom:20px; padding:12px; background:rgba(255,255,255,0.15); border-radius:12px; color:white; font-weight:bold;">Score Global : ${s.totalScore}/${s.totalAnswered} (${percent}%)</div>`;
  }

  function renderQuestions() {
    const s = getState();
    $contentRoot.innerHTML = "";
    const container = document.createElement("div");
    
    s.currentQuestions.forEach((q, idx) => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.innerHTML = `<p style="font-size:1.1rem; margin-bottom:15px;"><strong>Question ${idx + 1} :</strong> ${q.question}</p>`;
      const grid = document.createElement("div");
      grid.className = "mcq-grid";
      q.options.forEach((opt, oIdx) => {
        const btn = document.createElement("button");
        btn.className = `btn btnAnswer ${s.userAnswers[idx] === oIdx ? 'selected' : ''}`;
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(idx, oIdx);
        grid.appendChild(btn);
      });
      card.appendChild(grid);
      container.appendChild(card);
    });

    const isComplete = allAnswered(s.userAnswers);
    const valBtn = document.createElement("button");
    valBtn.className = "btn btnPrimary";
    valBtn.style.width = "100%";
    valBtn.style.opacity = isComplete ? "1" : "0.6";
    valBtn.textContent = isComplete ? "Valider mes réponses" : "Répondre à toutes les questions";
    valBtn.onclick = validateGame;
    
    container.appendChild(valBtn);
    $contentRoot.appendChild(container);
  }

  function renderResults() {
    const s = getState();
    $contentRoot.innerHTML = "";
    const container = document.createElement("div");

    let scoreCount = 0;
    s.currentQuestions.forEach((q, i) => { if (s.userAnswers[i] === q.correct) scoreCount++; });
    const total = s.currentQuestions.length;
    const ratio = scoreCount / total;

    let color = "var(--danger)";
    let message = "Prenez le temps de réécouter le tirage pour approfondir ces notions.";
    if (ratio >= 0.8) { color = "var(--success)"; message = "Bravo ! Vous êtes parfaitement aligné avec les énergies du tirage."; }
    else if (ratio >= 0.5) { color = "#ed8936"; message = "Bonne intuition ! Quelques nuances vous ont peut-être échappé."; }

    const scoreHeader = document.createElement("div");
    scoreHeader.style.cssText = `text-align:center; margin-bottom:30px; padding:25px; background:${color}10; border:2px solid ${color}; border-radius:15px;`;
    scoreHeader.innerHTML = `
      <div style="font-size:0.85rem; text-transform:uppercase; letter-spacing:1.5px; color:${color}; font-weight:bold; margin-bottom:5px;">Votre Score</div>
      <div style="font-size:3rem; font-weight:900; color:${color}; line-height:1;">${scoreCount} / ${total}</div>
      <div style="margin-top:15px; font-style:italic; color:var(--text); font-size:0.95rem;">${message}</div>
    `;
    container.appendChild(scoreHeader);

    const titleCorrection = document.createElement("h2");
    titleCorrection.style.cssText = "text-align:center; margin-bottom:25px; font-size:1.4rem; color:var(--secondary);";
    titleCorrection.textContent = "Détail de vos enseignements";
    container.appendChild(titleCorrection);

    s.currentQuestions.forEach((q, idx) => {
      const userIdx = s.userAnswers[idx];
      const isCorrect = userIdx === q.correct;
      const block = document.createElement("div");
      block.className = `correctionBlock ${isCorrect ? "correct" : "wrong"}`;
      block.style.cssText = `border-left: 5px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}; padding: 20px; background: white; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);`;

      block.innerHTML = `
        <p style="margin-top:0; font-size:1.05rem;"><strong>Q${idx + 1} :</strong> ${q.question}</p>
        <p style="margin-bottom:8px;">Votre réponse : <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${q.options[userIdx] || 'Aucune'}</span></p>
        ${!isCorrect ? `<p style="margin-bottom:8px;">La réponse juste : <span style="color:var(--success); font-weight:bold;">${q.options[q.correct]}</span></p>` : ""}
        <div style="margin-top:12px; font-size:0.95rem; color:#4a5568; border-top:1px solid #edf2f7; padding-top:12px;">
          <strong style="color:var(--secondary);">L'essentiel :</strong> ${q.explanation}
        </div>
      `;

      if (q.longExplanation) {
        const detailsBtn = document.createElement("button");
        detailsBtn.style.cssText = "margin-top:15px; font-size:0.85rem; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:600;";
        detailsBtn.innerHTML = "📖 Voir l'explication complète";

        const detailsPanel = document.createElement("div");
        detailsPanel.style.cssText = "display:none; margin-top:15px; padding:20px; background:#f0f7ff; border-radius:10px; border:1px solid #d0e2ff; font-size:0.95rem; line-height:1.6; color: #1e293b;";
        
        const closeBottomBtn = document.createElement("button");
        closeBottomBtn.style.cssText = "margin-top:20px; font-size:0.85rem; background:#cbd5e1; color:#475569; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold; width: 100%;";
        closeBottomBtn.textContent = "✖ Refermer l'explication";

        detailsPanel.innerHTML = `
          <h4 style="margin-top:0; color:#1d4ed8; font-size:1.1rem; border-bottom: 1px solid #d0e2ff; padding-bottom: 10px; margin-bottom:15px;">${q.longExplanation.title}</h4>
          <div>${q.longExplanation.content}</div>
        `;
        detailsPanel.appendChild(closeBottomBtn);

        const toggle = () => {
          const isHidden = detailsPanel.style.display === "none";
          detailsPanel.style.display = isHidden ? "block" : "none";
          detailsBtn.innerHTML = isHidden ? "<span>✖</span> Fermer" : "<span>📖</span> Voir l'explication complète";
          if (!isHidden) {
            block.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };

        detailsBtn.onclick = toggle;
        closeBottomBtn.onclick = toggle;
        block.appendChild(detailsBtn);
        block.appendChild(detailsPanel);
      }
      container.appendChild(block);
    });

    const replayBtn = document.createElement("button");
    replayBtn.className = "btn btnPrimary";
    replayBtn.style.width = "100%";
    replayBtn.innerText = "Rejouer le quiz";
    replayBtn.onclick = startNewGame; 
    container.appendChild(replayBtn);
    $contentRoot.appendChild(container);
  }

  function render() {
    const s = getState();
    renderStats();
    if (s.showResults) renderResults();
    else if (s.currentQuestions?.length > 0) renderQuestions();
    else {
      $contentRoot.innerHTML = `<div style="text-align:center; padding:40px;"><button class="btn btnPrimary" id="startBtn">Commencer le Quiz</button></div>`;
      const btn = $contentRoot.querySelector("#startBtn");
      if(btn) btn.onclick = startNewGame;
    }
  }

  return { render };
}