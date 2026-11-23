
class WishlistPage {
  constructor(element) {
    this.element = element;
    this.grid = element.querySelector("[data-wishlist-grid]");
    this.emptyState = element.querySelector("[data-wishlist-empty]");
    this.count = element.querySelector("[data-wishlist-count]");

    this.init();
  }

  async init() {
    await this.render();

    document.addEventListener("wishlist:change", () => {
      this.render();
    });
  }

  async getProduct(handle) {
    try {
      const response = await fetch(`/products/${handle}.js`);

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error("Could not fetch wishlist product:", error);
      return null;
    }
  }

  async render() {
    const items = wishlist.getItems();

    this.count.textContent = `${items.length} items`;

    if (items.length === 0) {
      this.grid.innerHTML = "";
      this.emptyState.hidden = false;
      return;
    }

    this.emptyState.hidden = true;

    const products = await Promise.all(
      items.map((item) => this.getProduct(item.handle))
    );

    const validProducts = products.filter(Boolean);

    this.grid.innerHTML = validProducts
      .map((product) => this.createProductCard(product))
      .join("");

    if (validProducts.length !== items.length) {
      const validIds = new Set(
        validProducts.map((product) => String(product.id))
      );

      const updatedItems = wishlist.getItems().filter(
        (item) => validIds.has(item.id)
      );

      wishlist.save(updatedItems);
    }

    if (validProducts.length === 0) {
      this.emptyState.hidden = false;
    }
  }

  createProductCard(product) {
    const image = product.featured_image || "";

    return `
      <article class="wishlist-card">
        <a href="/products/${product.handle}" class="wishlist-card__link">
          <div class="wishlist-card__media">
            ${
              image
                ? `<img src="${image}" alt="${this.escapeHTML(product.title)}" loading="lazy">`
                : ""
            }
          </div>

          <div class="wishlist-card__content">
            <h3>${this.escapeHTML(product.title)}</h3>
            <p>${this.formatMoney(product.price)}</p>
          </div>
        </a>

        <button
          type="button"
          class="wishlist-card__remove"
          data-remove-wishlist="${product.id}"
          aria-label="Remove ${this.escapeHTML(product.title)} from wishlist"
        >
          Remove
        </button>
      </article>
    `;
  }

  formatMoney(cents) {
    return new Intl.NumberFormat(
      document.documentElement.lang || "en",
      {
        style: "currency",
        currency: window.Shopify.currency.active
      }
    ).format(cents / 100);
  }

  escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const element = document.querySelector("[data-wishlist-page]");

  if (element) {
    new WishlistPage(element);
  }
});
