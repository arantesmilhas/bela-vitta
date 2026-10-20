(function () {
  "use strict";

  const config = window.BELA_VITTA_CONFIG || {};
  const target = typeof config.memberAreaUrl === "string" ? config.memberAreaUrl.trim() : "";
  const pending = document.querySelector("[data-access-pending]");
  const ready = document.querySelector("[data-access-ready]");
  const support = document.querySelector("[data-support-link]");

  if (support && config.supportUrl) support.href = config.supportUrl;

  if (!target) return;

  try {
    const url = new URL(target);
    if (!/^https?:$/.test(url.protocol)) return;

    document.querySelectorAll("[data-member-area]").forEach((link) => {
      link.href = url.toString();
    });
    pending?.setAttribute("hidden", "");
    ready?.removeAttribute("hidden");
    window.setTimeout(() => window.location.replace(url.toString()), 900);
  } catch (_) {
    // Mantém a tela de revisão se o endereço configurado for inválido.
  }
})();
