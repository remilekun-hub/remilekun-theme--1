
/* ========================================
   Collection Toolbar
======================================== */

class CollectionToolbar {
  constructor(element) {
    this.element = element;
    this.sortSelect = element.querySelector("[data-collection-sort]");

    this.init();
  }

  init() {
    if (!this.sortSelect) return;

    this.sortSelect.addEventListener("change", () => {
      const url = new URL(window.location.href);

      url.searchParams.set("sort_by", this.sortSelect.value);
      url.searchParams.delete("page");

      window.location.href = url.toString();
    });
  }
}

/* ========================================
   Collection Filters
======================================== */

class CollectionFilters {
  constructor(element) {
    this.element = element;
    this.toggle = element.querySelector("[data-filter-toggle]");
    this.content = element.querySelector("[data-filter-content]");

    this.init();
  }

  init() {
    if (!this.toggle || !this.content) return;

    this.toggle.addEventListener("click", () => {
      const isExpanded =
        this.toggle.getAttribute("aria-expanded") === "true";

      this.toggle.setAttribute("aria-expanded", String(!isExpanded));

      this.content.hidden = isExpanded;
    });

    this.setInitialState();
  }

  setInitialState() {
    const isMobile = window.matchMedia("(max-width: 749px)").matches;

    this.toggle.setAttribute("aria-expanded", String(!isMobile));
    this.content.hidden = isMobile;
  }
}

/* ========================================
   Initialize Collection Components
======================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".collection-toolbar").forEach((toolbar) => {
    if (!toolbar.collectionToolbarInstance) {
      toolbar.collectionToolbarInstance = new CollectionToolbar(toolbar);
    }
  });

  document.querySelectorAll("[data-collection-sidebar]").forEach((sidebar) => {
    if (!sidebar.collectionFiltersInstance) {
      sidebar.collectionFiltersInstance = new CollectionFilters(sidebar);
    }
  });
});
