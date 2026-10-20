(function () {
  "use strict";

  const calculator = document.querySelector("[data-routine-calculator]");
  if (!calculator) return;

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
  const historyKey = "bela-vitta:calculator:history:v1";
  let history = [];

  try {
    history = JSON.parse(window.localStorage.getItem(historyKey) || "[]");
    if (!Array.isArray(history)) history = [];
    history = history.filter((entry) => entry && typeof entry === "object");
  } catch (_) {
    history = [];
  }

  function saveHistory() {
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (_) {
      // A calculadora continua a funcionar sem histórico quando o armazenamento está bloqueado.
    }
  }

  function renderHistory() {
    const list = document.querySelector("[data-calculator-history]");
    const empty = document.querySelector("[data-calculator-history-empty]");
    const clear = document.querySelector("[data-calculator-history-clear]");
    if (!list || !empty || !clear) return;

    list.replaceChildren();
    history.slice(0, 5).forEach((entry) => {
      const item = document.createElement("article");
      const date = new Date(entry.timestamp);
      const dateNode = document.createElement("span");
      const scoreNode = document.createElement("strong");
      dateNode.textContent = Number.isNaN(date.getTime()) ? "Data indisponível" : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
      scoreNode.textContent = `${Math.min(100, Math.max(0, Number(entry.score) || 0))}%`;
      item.append(dateNode, scoreNode);
      list.appendChild(item);
    });
    empty.hidden = history.length > 0;
    clear.hidden = history.length === 0;
  }

  calculator.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(calculator);
    const sleep = clamp(data.get("sleep"), 0, 10);
    const water = clamp(data.get("water"), 0, 12);
    const sunscreen = clamp(data.get("sunscreen"), 0, 7);
    const routine = clamp(data.get("routine"), 0, 7);
    const score = Math.round(
      Math.min(sleep / 8, 1) * 25 +
      Math.min(water / 8, 1) * 25 +
      Math.min(sunscreen / 7, 1) * 25 +
      Math.min(routine / 7, 1) * 25
    );

    let feedback = "Escolha uma meta pequena e possível para praticar com mais regularidade nesta semana.";
    if (score >= 80) {
      feedback = "Sua rotina mostra uma constância alta. Continue observando os hábitos que funcionam melhor para você.";
    } else if (score >= 60) {
      feedback = "Você já tem uma boa base. Um pequeno ajuste de regularidade pode tornar a rotina mais consistente.";
    }

    calculator.querySelector("[data-calculator-score]").textContent = `${score}%`;
    calculator.querySelector("[data-calculator-feedback]").textContent = feedback;
    const result = calculator.querySelector("[data-calculator-result]");
    result.removeAttribute("hidden");
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    history.unshift({ score, timestamp: new Date().toISOString() });
    history = history.slice(0, 5);
    saveHistory();
    renderHistory();
  });

  document.querySelector("[data-calculator-history-clear]")?.addEventListener("click", () => {
    history = [];
    saveHistory();
    renderHistory();
  });

  renderHistory();
})();
