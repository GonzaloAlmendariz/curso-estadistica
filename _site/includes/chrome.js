(function () {
  function clean(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function weekTitleFromDocument() {
    const h1Title = document.querySelector("h1.title");
    if (h1Title) return clean(h1Title.textContent);

    const meta = document.querySelector('meta[name="dcterms.title"]')
      || document.querySelector('meta[property="og:title"]');
    if (meta?.content) return clean(meta.content);

    const t = clean(document.title);
    return t ? t.split(" - ")[0].split(" | ")[0].trim() : "Semana";
  }

  function getAllSlideSections() {
    // Reveal usa <div class="slides"> y adentro <section>
    return Array.from(document.querySelectorAll(".reveal .slides section"));
  }

  function currentSlide() {
    return window.Reveal ? Reveal.getCurrentSlide() : null;
  }

  function slideTitle(slide) {
    const h2 = slide?.querySelector("h2");
    const h3 = slide?.querySelector("h3");
    return clean((h2 || h3)?.textContent) || " ";
  }

  function currentUnitH1() {
    const slides = getAllSlideSections();
    const cur = currentSlide();
    if (!cur || !slides.length) return " ";

    const idx = slides.indexOf(cur);
    if (idx < 0) return " ";

    for (let i = idx; i >= 0; i--) {
      const s = slides[i];
      const h1 = s.querySelector("h1:not(.title)");
      if (h1) {
        const txt = clean(h1.textContent);
        if (txt) return txt;
      }
    }
    return " ";
  }

  function progressRatio() {
    if (!window.Reveal) return 0;
    const total = Reveal.getTotalSlides?.() ?? 0;
    const past  = Reveal.getSlidePastCount?.() ?? 0;
    if (!total || total <= 1) return 0;
    return Math.max(0, Math.min(1, past / (total - 1)));
  }

  function update() {
    const weekEl = document.getElementById("deckWeek");
    const titleEl = document.getElementById("deckTitle");
    const unitEl = document.getElementById("deckUnit");
    const fillEl = document.getElementById("deckProgressFill");

    if (weekEl) weekEl.textContent = weekTitleFromDocument();

    const cur = currentSlide();
    if (titleEl) titleEl.textContent = slideTitle(cur);
    if (unitEl) unitEl.textContent = currentUnitH1();

    if (fillEl) {
      const r = progressRatio();
      // RAF para que el browser aplique transición siempre
      requestAnimationFrame(() => {
        fillEl.style.width = `${(r * 100).toFixed(1)}%`;
      });
    }
  }

  function init() {
    if (!window.Reveal) return;

    const hook = () => update();

    Reveal.on("ready", hook);
    Reveal.on("slidechanged", hook);
    Reveal.on("fragmentshown", hook);
    Reveal.on("fragmenthidden", hook);
    Reveal.on("overviewshown", hook);
    Reveal.on("overviewhidden", hook);

    update();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();