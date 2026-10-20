(function () {
  "use strict";

  const calculator = document.querySelector("[data-routine-calculator]");
  if (!calculator) return;

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));

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
  });
})();
