// ===========================================================================
// Marktplaats Scraper demo logica (vanilla JS, geen build, geen backend)
//
// Wat dit nabouwt van de echte scraper:
//  - live filteren op zoekterm, prijs van-tot, locatie, afstand, conditie
//  - sorteren (nieuwste / prijs / afstand)
//  - een gesimuleerde "nieuwe match"-monitor die periodiek een toast toont,
//    precies zoals de Python-backend nieuwe advertenties oppikt en een
//    melding stuurt (in het echt via Discord / notificatie).
// ===========================================================================

(function () {
  "use strict";

  // Per categorie een emoji + gradient voor de offline thumbnail.
  const CATEGORY_STYLE = {
    telefoon:  { icon: "📱", grad: "linear-gradient(135deg,#667eea,#764ba2)" },
    console:   { icon: "🎮", grad: "linear-gradient(135deg,#f093fb,#f5576c)" },
    laptop:    { icon: "💻", grad: "linear-gradient(135deg,#4facfe,#00f2fe)" },
    fiets:     { icon: "🚲", grad: "linear-gradient(135deg,#43e97b,#38f9d7)" },
    speelgoed: { icon: "🧱", grad: "linear-gradient(135deg,#fa709a,#fee140)" },
    audio:     { icon: "🎧", grad: "linear-gradient(135deg,#30cfd0,#330867)" },
    meubel:    { icon: "🪑", grad: "linear-gradient(135deg,#a8edea,#fed6e3)" },
    camera:    { icon: "📷", grad: "linear-gradient(135deg,#5ee7df,#b490ca)" },
    default:   { icon: "📦", grad: "linear-gradient(135deg,#667eea,#764ba2)" },
  };

  // Werkende kopie van de dataset (nieuwe matches worden hieraan toegevoegd).
  let listings = SAMPLE_LISTINGS.slice();

  // ---- DOM refs ----
  const els = {
    searchTerm: document.getElementById("searchTerm"),
    clearSearch: document.getElementById("clearSearch"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
    location: document.getElementById("location"),
    distance: document.getElementById("distance"),
    condition: document.getElementById("condition"),
    sortBy: document.getElementById("sortBy"),
    excludeBidding: document.getElementById("excludeBidding"),
    resetFilters: document.getElementById("resetFilters"),
    emptyReset: document.getElementById("emptyReset"),
    grid: document.getElementById("resultsGrid"),
    emptyState: document.getElementById("emptyState"),
    summary: document.getElementById("resultSummary"),
    activeFilters: document.getElementById("activeFilters"),
    navResultCount: document.getElementById("navResultCount"),
    statVisible: document.getElementById("statVisible"),
    statNew: document.getElementById("statNew"),
    monitorPill: document.getElementById("monitorPill"),
    monitorPillText: document.getElementById("monitorPillText"),
    monitorToggleBtn: document.getElementById("monitorToggleBtn"),
    monitorStateBadge: document.getElementById("monitorStateBadge"),
    toastStack: document.getElementById("toastStack"),
  };

  let newMatchCount = 0;

  // ---- Helpers ----
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function catStyle(cat) {
    return CATEGORY_STYLE[cat] || CATEGORY_STYLE.default;
  }

  function populateLocations() {
    const locs = [...new Set(SAMPLE_LISTINGS.map((l) => l.location).concat(
      INCOMING_MATCHES.map((l) => l.location)
    ))].sort();
    for (const loc of locs) {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      els.location.appendChild(opt);
    }
  }

  // ---- Filteren + sorteren (kern van de demo) ----
  function getFiltered() {
    const term = els.searchTerm.value.trim().toLowerCase();
    const min = parseFloat(els.minPrice.value);
    const max = parseFloat(els.maxPrice.value);
    const loc = els.location.value;
    const maxDist = parseFloat(els.distance.value);
    const cond = els.condition.value;
    const hideBidding = els.excludeBidding.checked;

    let out = listings.filter((l) => {
      if (term) {
        const haystack = (l.title + " " + l.description).toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (l.biddingOnly && hideBidding) return false;
      // Prijsfilters gelden niet voor "Bieden"-items (prijs onbekend).
      if (!l.biddingOnly) {
        if (!isNaN(min) && l.price < min) return false;
        if (!isNaN(max) && l.price > max) return false;
      } else if (!isNaN(min) || !isNaN(max)) {
        return false; // bij actief prijsfilter vallen bieden-items af
      }
      if (loc && l.location !== loc) return false;
      if (!isNaN(maxDist) && l.distanceKm > maxDist) return false;
      if (cond && l.condition !== cond) return false;
      return true;
    });

    const sort = els.sortBy.value;
    out.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      return a.dateOrder - b.dateOrder; // nieuwste eerst
    });
    return out;
  }

  function renderCard(l) {
    const cs = catStyle(l.category);
    const priceClass = l.price === 0 && !l.biddingOnly ? "result-price free" : "result-price";
    return `
      <article class="result-card">
        <div class="result-thumb" style="background:${cs.grad}">
          ${l.isNew ? '<span class="new-flag">NIEUW</span>' : ""}
          <span>${cs.icon}</span>
          <span class="cat-label">${escapeHtml(l.category)}</span>
        </div>
        <div class="result-body">
          <span class="${priceClass}">${escapeHtml(l.priceText)}</span>
          <h3 class="result-title">${escapeHtml(l.title)}</h3>
          <span class="result-cond">${escapeHtml(l.condition)}</span>
          <div class="result-meta">
            <span>📍 ${escapeHtml(l.location)} · ${l.distanceKm} km</span>
            <span>🕑 ${escapeHtml(l.date)}</span>
          </div>
          <a class="result-link" href="#" onclick="return false" title="Demo, geen echte advertentie">Bekijk advertentie →</a>
        </div>
      </article>`;
  }

  function render() {
    const results = getFiltered();

    els.grid.innerHTML = results.map(renderCard).join("");
    els.emptyState.hidden = results.length !== 0;

    els.summary.textContent =
      results.length === 1 ? "1 advertentie" : `${results.length} advertenties`;
    els.navResultCount.textContent = results.length;
    els.statVisible.textContent = results.length;
    els.statNew.textContent = newMatchCount;

    renderActiveFilters();
    els.clearSearch.hidden = !els.searchTerm.value;
  }

  function renderActiveFilters() {
    const tags = [];
    if (els.searchTerm.value.trim()) tags.push(`🔎 "${els.searchTerm.value.trim()}"`);
    if (els.minPrice.value) tags.push(`≥ €${els.minPrice.value}`);
    if (els.maxPrice.value) tags.push(`≤ €${els.maxPrice.value}`);
    if (els.location.value) tags.push(`📍 ${els.location.value}`);
    if (els.distance.value) tags.push(`≤ ${els.distance.value} km`);
    if (els.condition.value) tags.push(els.condition.value);
    if (els.excludeBidding.checked) tags.push("geen bieden");
    els.activeFilters.innerHTML = tags
      .map((t) => `<span class="filter-tag">${escapeHtml(t)}</span>`)
      .join("");
  }

  function resetFilters() {
    els.searchTerm.value = "";
    els.minPrice.value = "";
    els.maxPrice.value = "";
    els.location.value = "";
    els.distance.value = "";
    els.condition.value = "";
    els.sortBy.value = "date";
    els.excludeBidding.checked = false;
    render();
  }

  // ---- Gesimuleerde monitor + toast ("nieuwe match"-melding) ----
  let monitorOn = false;
  let monitorTimer = null;
  let incomingIdx = 0;

  function setMonitor(on) {
    monitorOn = on;
    els.monitorPill.classList.toggle("on", on);
    els.monitorPillText.textContent = on ? "Monitor actief (checkt elke 6s)" : "Monitor starten";
    els.monitorToggleBtn.classList.toggle("monitor-on", on);
    els.monitorStateBadge.textContent = on ? "aan" : "uit";
    els.monitorStateBadge.classList.toggle("badge--off", !on);

    clearInterval(monitorTimer);
    if (on) {
      // Eerste match snel tonen zodat de demo direct wat laat zien.
      setTimeout(pushNextMatch, 1400);
      monitorTimer = setInterval(pushNextMatch, 6000);
    }
  }

  function pushNextMatch() {
    if (incomingIdx >= INCOMING_MATCHES.length) {
      // Alle voorbeeld-matches gehad: monitor blijft "draaien" maar stil.
      showToast(null);
      return;
    }
    const match = INCOMING_MATCHES[incomingIdx++];
    listings.unshift(match); // verschijnt bovenaan de resultaten
    newMatchCount++;
    render();
    showToast(match);
  }

  function showToast(match) {
    const toast = document.createElement("div");
    toast.className = "toast";

    if (match) {
      toast.innerHTML = `
        <div class="toast__icon">🔔</div>
        <div class="toast__body">
          <div class="toast__title">Nieuwe match gevonden!</div>
          <div class="toast__listing clip">${escapeHtml(match.title)}</div>
          <div class="toast__meta">${escapeHtml(match.priceText)} · ${escapeHtml(match.location)} · ${escapeHtml(match.date)}</div>
        </div>
        <button class="toast__close" aria-label="Sluiten">×</button>`;
    } else {
      toast.innerHTML = `
        <div class="toast__icon">✅</div>
        <div class="toast__body">
          <div class="toast__title">Monitor draait</div>
          <div class="toast__listing">Geen nieuwe advertenties</div>
          <div class="toast__meta">Je krijgt vanzelf bericht bij een nieuwe match.</div>
        </div>
        <button class="toast__close" aria-label="Sluiten">×</button>`;
    }

    els.toastStack.appendChild(toast);
    const remove = () => {
      toast.classList.add("leaving");
      setTimeout(() => toast.remove(), 300);
    };
    toast.querySelector(".toast__close").addEventListener("click", remove);
    setTimeout(remove, 5200);
  }

  // ---- Events ----
  function init() {
    populateLocations();

    const liveInputs = [
      els.searchTerm, els.minPrice, els.maxPrice, els.location,
      els.distance, els.condition, els.sortBy, els.excludeBidding,
    ];
    for (const el of liveInputs) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    }

    els.clearSearch.addEventListener("click", () => {
      els.searchTerm.value = "";
      render();
      els.searchTerm.focus();
    });
    els.resetFilters.addEventListener("click", resetFilters);
    els.emptyReset.addEventListener("click", resetFilters);

    els.monitorPill.addEventListener("click", () => setMonitor(!monitorOn));
    els.monitorToggleBtn.addEventListener("click", () => setMonitor(!monitorOn));

    // Sidebar nav: smooth scroll + active-state.
    document.querySelectorAll(".nav-item[data-scroll]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
        btn.classList.add("active");
        const target = document.getElementById(btn.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    render();

    // Start de monitor automatisch zodat de "nieuwe match"-melding zichzelf
    // toont. Een bezoeker ziet het kernidee zonder iets te hoeven klikken.
    setTimeout(() => setMonitor(true), 2500);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
