(function () {
  "use strict";

  const keys = {
    onboarding: "bela-vitta:member:onboarding:v1",
    tracker: "bela-vitta:member:tracker:v1",
    notes: "bela-vitta:member:notes:v1",
    favorite: "bela-vitta:member:favorite:v1"
  };

  function readStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // A área continua funcional mesmo se o armazenamento local estiver bloqueado.
    }
  }

  const onboardingInputs = Array.from(document.querySelectorAll("[data-onboarding-list] input[type=checkbox]"));
  const onboardingValue = readStorage(keys.onboarding, []);
  const savedOnboarding = new Set(Array.isArray(onboardingValue) ? onboardingValue : []);

  function updateOnboarding() {
    const selected = onboardingInputs.filter((input) => input.checked).map((input) => input.value);
    const total = onboardingInputs.length || 1;
    const percent = Math.round((selected.length / total) * 100);
    const percentNode = document.querySelector("[data-onboarding-percent]");
    const copyNode = document.querySelector("[data-onboarding-copy]");
    const progress = document.querySelector("[data-onboarding-progress]");

    if (percentNode) percentNode.textContent = `${percent}%`;
    if (copyNode) copyNode.textContent = `${selected.length} de ${onboardingInputs.length} passos concluídos`;
    if (progress) {
      progress.setAttribute("aria-valuenow", String(percent));
      progress.querySelector("span").style.width = `${percent}%`;
    }
    writeStorage(keys.onboarding, selected);
  }

  onboardingInputs.forEach((input) => {
    input.checked = savedOnboarding.has(input.value);
    input.addEventListener("change", updateOnboarding);
  });
  updateOnboarding();

  const trackerGrid = document.querySelector("[data-tracker-grid]");
  const trackerValue = readStorage(keys.tracker, []);
  const completedDays = new Set((Array.isArray(trackerValue) ? trackerValue : []).map(Number).filter((day) => day >= 1 && day <= 30));

  function updateTracker() {
    const count = completedDays.size;
    const countNode = document.querySelector("[data-tracker-count]");
    const progress = document.querySelector("[data-tracker-progress]");
    if (countNode) countNode.textContent = String(count);
    if (progress) {
      progress.setAttribute("aria-valuenow", String(count));
      progress.querySelector("span").style.width = `${Math.round((count / 30) * 100)}%`;
    }
    trackerGrid?.querySelectorAll("button").forEach((button) => {
      const active = completedDays.has(Number(button.dataset.day));
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `Dia ${button.dataset.day}${active ? ", marcado" : ", não marcado"}`);
    });
    writeStorage(keys.tracker, Array.from(completedDays).sort((a, b) => a - b));
  }

  if (trackerGrid) {
    for (let day = 1; day <= 30; day += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.day = String(day);
      button.textContent = String(day);
      button.addEventListener("click", () => {
        if (completedDays.has(day)) completedDays.delete(day);
        else completedDays.add(day);

        const trackerChecklist = onboardingInputs.find((input) => input.value === "tracker");
        if (trackerChecklist && completedDays.size > 0 && !trackerChecklist.checked) {
          trackerChecklist.checked = true;
          updateOnboarding();
        }
        updateTracker();
      });
      trackerGrid.appendChild(button);
    }
    updateTracker();
  }

  document.querySelector("[data-tracker-reset]")?.addEventListener("click", () => {
    if (!window.confirm("Deseja apagar as marcações deste calendário e começar novamente?")) return;
    completedDays.clear();
    updateTracker();
  });

  const notes = document.querySelector("[data-member-notes]");
  const notesStatus = document.querySelector("[data-notes-status]");
  if (notes) notes.value = readStorage(keys.notes, "");
  document.querySelector("[data-notes-save]")?.addEventListener("click", () => {
    writeStorage(keys.notes, notes ? notes.value : "");
    if (notesStatus) {
      notesStatus.textContent = "Anotações salvas neste dispositivo.";
      window.setTimeout(() => { notesStatus.textContent = ""; }, 3200);
    }
  });

  const favorite = document.querySelector("[data-favorite-variation]");
  if (favorite) {
    favorite.value = readStorage(keys.favorite, "");
    favorite.addEventListener("change", () => writeStorage(keys.favorite, favorite.value));
  }

  const timer = document.querySelector("[data-recipe-timer]");
  if (timer) {
    const output = timer.querySelector("[data-timer-output]");
    const toggle = timer.querySelector("[data-timer-toggle]");
    const reset = timer.querySelector("[data-timer-reset]");
    let remaining = 15 * 60;
    let intervalId;

    function renderTimer() {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      output.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      output.setAttribute("aria-label", `${minutes} minutos e ${seconds} segundos restantes`);
    }

    function stopTimer() {
      window.clearInterval(intervalId);
      intervalId = undefined;
      toggle.textContent = remaining === 0 ? "Concluído" : "Continuar";
      toggle.disabled = remaining === 0;
    }

    toggle.addEventListener("click", () => {
      if (intervalId) {
        stopTimer();
        return;
      }
      toggle.textContent = "Pausar";
      intervalId = window.setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        renderTimer();
        if (remaining === 0) stopTimer();
      }, 1000);
    });

    reset.addEventListener("click", () => {
      window.clearInterval(intervalId);
      intervalId = undefined;
      remaining = 15 * 60;
      toggle.disabled = false;
      toggle.textContent = "Iniciar";
      renderTimer();
    });
    renderTimer();
  }

  const shoppingText = [
    "Lista Bela Vitta para 7 preparações:",
    "- 700 ml de suco integral de uva 100%",
    "- 70 g de sementes de chia",
    "- 1,4 litro de água filtrada",
    "- 2 limões (opcionais)",
    "- Hortelã e gelo a gosto (opcionais)"
  ].join("\n");

  document.querySelector("[data-copy-shopping]")?.addEventListener("click", async () => {
    const status = document.querySelector("[data-shopping-status]");
    try {
      await navigator.clipboard.writeText(shoppingText);
      if (status) status.textContent = "Lista copiada.";
    } catch (_) {
      const temporary = document.createElement("textarea");
      temporary.value = shoppingText;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.appendChild(temporary);
      temporary.select();
      document.execCommand("copy");
      temporary.remove();
      if (status) status.textContent = "Lista copiada.";
    }
    window.setTimeout(() => { if (status) status.textContent = ""; }, 3000);
  });

  const navLinks = Array.from(document.querySelectorAll(".member-nav a[href^='#']"));
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      document.querySelector(`.member-nav a[href="#${visible.target.id}"]`)?.setAttribute("aria-current", "true");
    }, { rootMargin: "-35% 0px -55%", threshold: [0, .25, .6] });
    sections.forEach((section) => observer.observe(section));
  }
})();
