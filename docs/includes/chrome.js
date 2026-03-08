(function () {
  if (window.__deckChromeInitialized) return;
  window.__deckChromeInitialized = true;

  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function weekTitleFromDocument() {
    const h1Title = document.querySelector("h1.title");
    if (h1Title) return clean(h1Title.textContent);

    const meta = document.querySelector('meta[name="dcterms.title"]')
      || document.querySelector('meta[property="og:title"]');
    if (meta?.content) return clean(meta.content);

    const title = clean(document.title);
    return title ? title.split(" - ")[0].split(" | ")[0].trim() : "Semana";
  }

  function getAllSlideSections() {
    return Array.from(document.querySelectorAll(".reveal .slides section"));
  }

  function currentSlide() {
    return window.Reveal ? Reveal.getCurrentSlide() : null;
  }

  function firstDirectChild(slide, selector) {
    if (!slide) return null;
    return Array.from(slide.children).find((node) => node.matches?.(selector)) || null;
  }

  function slideTitle(slide) {
    const h3 = firstDirectChild(slide, "h3");
    const h2 = firstDirectChild(slide, "h2");
    return clean((h3 || h2)?.textContent);
  }

  function getSectionEntries() {
    return getAllSlideSections()
      .map((slide) => {
        const h2 = firstDirectChild(slide, "h2");
        const title = clean(h2?.textContent);
        return title ? { title, slide } : null;
      })
      .filter(Boolean);
  }

  function currentSectionEntry(entries = getSectionEntries()) {
    const slides = getAllSlideSections();
    const slide = currentSlide();
    if (!slide || !slides.length || !entries.length) return null;

    const slideIndex = slides.indexOf(slide);
    if (slideIndex < 0) return entries[0];

    for (let i = slideIndex; i >= 0; i -= 1) {
      const candidate = entries.find((entry) => entry.slide === slides[i]);
      if (candidate) return candidate;
    }

    return entries[0];
  }

  function progressRatio() {
    if (!window.Reveal) return 0;
    const total = Reveal.getTotalSlides?.() ?? 0;
    const past = Reveal.getSlidePastCount?.() ?? 0;
    if (!total || total <= 1) return 0;
    return Math.max(0, Math.min(1, past / (total - 1)));
  }

  function closeSectionMenu() {
    const menu = document.getElementById("deckMenu");
    const button = document.getElementById("deckSectionButton");
    const panel = document.getElementById("deckSectionMenu");

    if (menu) menu.classList.remove("is-open");
    if (button) button.setAttribute("aria-expanded", "false");
    if (panel) panel.hidden = true;
  }

  function openSectionMenu() {
    const menu = document.getElementById("deckMenu");
    const button = document.getElementById("deckSectionButton");
    const panel = document.getElementById("deckSectionMenu");

    if (menu) menu.classList.add("is-open");
    if (button) button.setAttribute("aria-expanded", "true");
    if (panel) panel.hidden = false;
  }

  function toggleSectionMenu() {
    const panel = document.getElementById("deckSectionMenu");
    if (!panel) return;
    if (panel.hidden) {
      openSectionMenu();
    } else {
      closeSectionMenu();
    }
  }

  function jumpToSlide(slide) {
    if (!window.Reveal || !slide) return;
    const indices = Reveal.getIndices?.(slide);
    if (!indices) return;
    Reveal.slide(indices.h ?? 0, indices.v ?? 0, indices.f ?? 0);
  }

  function buildSectionMenu() {
    const panel = document.getElementById("deckSectionMenu");
    if (!panel) return;

    const entries = getSectionEntries();
    const activeEntry = currentSectionEntry(entries);

    panel.innerHTML = "";

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "deck-menu-empty";
      empty.textContent = "No hay secciones";
      panel.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "deck-menu-item";
      item.setAttribute("role", "menuitem");
      item.textContent = entry.title;

      if (activeEntry?.slide === entry.slide) {
        item.classList.add("is-active");
        item.setAttribute("aria-current", "true");
      }

      item.addEventListener("click", () => {
        closeSectionMenu();
        jumpToSlide(entry.slide);
      });

      panel.appendChild(item);
    });
  }

  function update() {
    const weekEl = document.getElementById("deckWeek");
    const titleEl = document.getElementById("deckTitle");
    const sectionLabelEl = document.getElementById("deckSectionLabel");
    const fillEl = document.getElementById("deckProgressFill");

    const entries = getSectionEntries();
    const currentSection = currentSectionEntry(entries);
    const current = currentSlide();
    const currentTitle = slideTitle(current);

    if (weekEl) weekEl.textContent = weekTitleFromDocument();
    if (titleEl) titleEl.textContent = currentTitle || currentSection?.title || " ";
    if (sectionLabelEl) sectionLabelEl.textContent = currentSection?.title || "Sección";

    if (fillEl) {
      const ratio = progressRatio();
      requestAnimationFrame(() => {
        fillEl.style.width = `${(ratio * 100).toFixed(1)}%`;
      });
    }

    buildSectionMenu();
  }

  function bindEvents() {
    const menu = document.getElementById("deckMenu");
    const button = document.getElementById("deckSectionButton");

    if (button) {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleSectionMenu();
      });
    }

    document.addEventListener("click", (event) => {
      if (!menu?.contains(event.target)) {
        closeSectionMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSectionMenu();
    });
  }

  function init() {
    if (!window.Reveal) return;

    bindEvents();

    const hook = () => {
      closeSectionMenu();
      update();
    };

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
