(function () {
  "use strict";

  const config = window.BELA_VITTA_CONFIG || {};
  const query = window.location.search;

  function preserveQuery(link) {
    const href = link.getAttribute("href");
    if (!href || !query || href.startsWith("#") || href.startsWith("mailto:")) return;
    try {
      const url = new URL(href, window.location.origin);
      const incoming = new URLSearchParams(query);
      incoming.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      link.href = url.toString();
    } catch (_) {
      // A navegação continua normalmente se o endereço não puder ser interpretado.
    }
  }

  document.querySelectorAll("a[data-preserve-query]").forEach(preserveQuery);

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-offer-price]").forEach((node) => {
    const plan = node.dataset.offerPrice;
    const offer = config.offers && config.offers[plan];
    node.textContent = offer && offer.price ? offer.price : "Preço em breve";
  });

  document.querySelectorAll("[data-legal=privacy]").forEach((link) => {
    if (config.legal && config.legal.privacyUrl) link.href = config.legal.privacyUrl;
  });

  document.querySelectorAll("[data-legal=terms]").forEach((link) => {
    if (config.legal && config.legal.termsUrl) link.href = config.legal.termsUrl;
  });

  document.querySelectorAll("[data-support-link]").forEach((link) => {
    if (config.supportUrl) link.href = config.supportUrl;
  });

  function showNotice(message) {
    let toast = document.querySelector(".review-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "review-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
  }

  document.querySelectorAll("[data-checkout]").forEach((link) => {
    const plan = link.dataset.checkoutPlan;
    const offer = config.offers && config.offers[plan];
    const checkoutUrl = offer && offer.checkoutUrl;
    if (checkoutUrl) {
      link.href = checkoutUrl;
      preserveQuery(link);
      link.removeAttribute("aria-disabled");
      return;
    }
    link.href = "#oferta";
    link.setAttribute("aria-disabled", "true");
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelector("#oferta")?.scrollIntoView({ behavior: "smooth", block: "start" });
      const label = offer && offer.label ? ` do plano de ${offer.label}` : "";
      showNotice(`Prévia em revisão: o checkout${label} será conectado quando o link for enviado.`);
    });
  });

  const playerHost = document.querySelector("[data-vturb-host]");
  if (playerHost) {
    const vturb = config.vturb || {};
    if (vturb.playerId && vturb.scriptUrl) {
      const player = document.createElement("vturb-smartplayer");
      player.id = vturb.playerId;
      player.style.display = "block";
      player.style.margin = "0 auto";
      player.style.width = "100%";

      const placeholder = document.createElement("div");
      placeholder.className = "vturb-player-placeholder";
      placeholder.style.position = "relative";
      placeholder.style.width = "100%";
      placeholder.style.padding = "56.25% 0 0";
      placeholder.style.zIndex = "0";
      placeholder.style.backgroundColor = "black";
      player.appendChild(placeholder);

      playerHost.replaceChildren(player);
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = vturb.scriptUrl;
      script.async = true;
      document.head.appendChild(script);
    }
  }

  const delayed = document.querySelectorAll("[data-delayed-offer]");
  if (delayed.length) {
    const seconds = Number(config.vturb && config.vturb.revealAfterSeconds) || 0;
    const offerStateKey = `bela-vitta:offer-revealed:${config.market || "BR"}`;
    let revealTimer;
    let shortcutHotspot;
    let offerRevealed = false;

    function hasStoredReveal() {
      try {
        return window.sessionStorage.getItem(offerStateKey) === "true";
      } catch (_) {
        return false;
      }
    }

    function storeReveal() {
      try {
        window.sessionStorage.setItem(offerStateKey, "true");
      } catch (_) {
        // O atalho continua a funcionar mesmo se o armazenamento estiver bloqueado.
      }
    }

    function revealOffer(options) {
      if (offerRevealed) return;
      offerRevealed = true;
      window.clearTimeout(revealTimer);
      if (shortcutHotspot) shortcutHotspot.remove();
      delayed.forEach((node) => node.removeAttribute("hidden"));
      if (options && options.persist) storeReveal();
      if (options && options.notify) {
        showNotice("Atalho de revisão ativado: a oferta foi liberada.");
      }
    }

    if (seconds > 0 && !hasStoredReveal()) {
      delayed.forEach((node) => node.setAttribute("hidden", ""));
      revealTimer = window.setTimeout(() => revealOffer(), seconds * 1000);
    } else {
      revealOffer();
    }

    if (playerHost && !offerRevealed) {
      const shortcutWindowMs = 4000;
      let shortcutTouches = [];
      shortcutHotspot = document.createElement("button");
      shortcutHotspot.type = "button";
      shortcutHotspot.className = "review-shortcut";
      shortcutHotspot.tabIndex = -1;
      shortcutHotspot.setAttribute("aria-hidden", "true");
      playerHost.appendChild(shortcutHotspot);

      shortcutHotspot.addEventListener("pointerup", () => {
        const now = Date.now();
        shortcutTouches = shortcutTouches.filter((time) => now - time <= shortcutWindowMs);
        shortcutTouches.push(now);

        if (shortcutTouches.length >= 5) {
          shortcutTouches = [];
          revealOffer({ persist: true, notify: true });
        }
      }, { passive: true });
    }
  }

  const revealButtons = document.querySelectorAll("[data-reveal-more]");
  revealButtons.forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-extra-comment]").forEach((item) => item.removeAttribute("hidden"));
      button.remove();
    });
  });

})();
