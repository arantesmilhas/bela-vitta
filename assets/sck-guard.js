(function () {
  "use strict";

  const parameterName = "sck";
  const protectedLinkSelector = "a[data-preserve-query], a[data-checkout]";
  const clickProtectedLinks = new WeakSet();
  let lockedSck = readSck(window.location.href);
  seedGtmIdentity(lockedSck);
  let syncScheduled = false;

  function normaliseSck(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function readSck(value) {
    try {
      return normaliseSck(new URL(value, window.location.href).searchParams.get(parameterName));
    } catch (_) {
      return "";
    }
  }

  function seedGtmIdentity(value) {
    // Mantém o identificador nativo do GTM alinhado ao SCK recebido da página anterior.
    const match = /^(\d{13})_(\d{13})(\d+)$/.exec(normaliseSck(value));
    if (!match) return false;
    if (
      Object.getOwnPropertyDescriptor(window, "gtmBrowserId") ||
      Object.getOwnPropertyDescriptor(window, "gtmPageLoadId")
    ) return false;

    exposeOnce("gtmBrowserId", match[1]);
    exposeOnce("gtmPageLoadId", match[2]);
    return true;
  }

  function exposeOnce(propertyName, value) {
    const descriptor = Object.getOwnPropertyDescriptor(window, propertyName);
    if (descriptor && !descriptor.configurable) return false;

    Object.defineProperty(window, propertyName, {
      configurable: true,
      enumerable: true,
      get: function () {
        delete window[propertyName];
        return value;
      },
      set: function (nextValue) {
        Object.defineProperty(window, propertyName, {
          configurable: true,
          enumerable: true,
          value: nextValue,
          writable: true,
        });
      },
    });
    return true;
  }

  function lockSck(value) {
    const candidate = normaliseSck(value);
    if (!candidate || lockedSck) return;
    lockedSck = candidate;
    seedGtmIdentity(lockedSck);
    scheduleLinkSync();
  }

  function protectUrl(value, base) {
    try {
      const url = new URL(String(value), base || window.location.href);
      lockSck(url.searchParams.get(parameterName));
      if (lockedSck && (url.protocol === "http:" || url.protocol === "https:")) {
        url.searchParams.set(parameterName, lockedSck);
      }
      return url;
    } catch (_) {
      return null;
    }
  }

  function protectLink(link) {
    if (!lockedSck || !link || !link.matches(protectedLinkSelector)) return;
    if (!clickProtectedLinks.has(link)) {
      clickProtectedLinks.add(link);
      link.addEventListener("click", function () {
        protectLink(link);
      });
    }

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    let currentSck = "";
    try {
      currentSck = new URL(href, window.location.href).searchParams.get(parameterName) || "";
    } catch (_) {
      return;
    }
    const url = protectUrl(href, window.location.href);
    if (!url || currentSck === lockedSck) return;
    link.setAttribute("href", url.toString());
  }

  function syncProtectedLinks(root) {
    if (!lockedSck) return;
    if (root.matches && root.matches(protectedLinkSelector)) protectLink(root);
    if (root.querySelectorAll) root.querySelectorAll(protectedLinkSelector).forEach(protectLink);
  }

  function scheduleLinkSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    const run = function () {
      syncScheduled = false;
      syncProtectedLinks(document);
    };
    if (typeof window.queueMicrotask === "function") window.queueMicrotask(run);
    else Promise.resolve().then(run);
  }

  ["pushState", "replaceState"].forEach(function (methodName) {
    const original = window.history[methodName];
    if (typeof original !== "function") return;

    window.history[methodName] = function (state, title, urlValue) {
      if (urlValue == null) return original.apply(this, arguments);
      const protectedUrl = protectUrl(urlValue, window.location.href);
      return original.call(this, state, title, protectedUrl ? protectedUrl.toString() : urlValue);
    };
  });

  const observer = new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "attributes") {
        protectLink(record.target);
        return;
      }
      record.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) syncProtectedLinks(node);
      });
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["href"],
    childList: true,
    subtree: true,
  });

  window.BELA_VITTA_SCK_GUARD = Object.freeze({
    getSck: function () {
      return lockedSck;
    },
    protect: function (value) {
      const url = protectUrl(value, window.location.href);
      return url ? url.toString() : value;
    },
  });

  scheduleLinkSync();
})();
