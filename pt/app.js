(function () {
  "use strict";

  const config = window.BELA_VITTA_CONFIG || {};
  const query = window.location.search;
  const portugalHost = "naturallvitttamais.astroluz.site";
  const marketBase = window.location.hostname.toLowerCase() === portugalHost ? "" : "/pt";

  document.querySelectorAll("[data-market-route]").forEach((link) => {
    link.href = `${marketBase}${link.dataset.marketRoute}`;
  });

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
    node.textContent = offer && offer.price ? offer.price : "Preço a anunciar";
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
      showNotice(`Pré-visualização: a página de pagamento${label} será ligada assim que recebermos a ligação definitiva.`);
    });
  });

  const playerHost = document.querySelector("[data-vturb-host]");
  if (playerHost) {
    const vturb = config.vturb || {};
    if (vturb.playerId && vturb.scriptUrl) {
      const player = document.createElement("vturb-smartplayer");
      player.id = vturb.playerId;
      player.style.display = "block";
      playerHost.replaceChildren(player);
      const script = document.createElement("script");
      script.src = vturb.scriptUrl;
      script.async = true;
      document.head.appendChild(script);
    }
  }

  const delayed = document.querySelectorAll("[data-delayed-offer]");
  if (delayed.length) {
    const seconds = Number(config.vturb && config.vturb.revealAfterSeconds) || 0;
    const shouldDelay = !config.reviewMode && seconds > 0;
    if (shouldDelay) {
      delayed.forEach((node) => node.setAttribute("hidden", ""));
      window.setTimeout(() => {
        delayed.forEach((node) => node.removeAttribute("hidden"));
      }, seconds * 1000);
    } else {
      delayed.forEach((node) => node.removeAttribute("hidden"));
    }
  }

  document.querySelectorAll("[data-reveal-more]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-extra-comment]").forEach((item) => item.removeAttribute("hidden"));
      button.remove();
    });
  });
})();
