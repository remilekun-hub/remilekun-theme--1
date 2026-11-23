class WishlistManager {
  constructor() {
    this.storageKey = "shopify-wishlist";
  }

  getItems() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
    } catch {
      return [];
    }
  }

  has(productId) {
    return this.getItems().some((item) => item.id === String(productId));
  }

  add(product) {
    const items = this.getItems();

    if (this.has(product.id)) return;

    items.push({
      id: String(product.id),
      handle: product.handle,
    });

    this.save(items);
  }

  remove(productId) {
    const items = this.getItems().filter((item) => item.id !== String(productId));

    this.save(items);
  }

  toggle(product) {
    if (this.has(product.id)) {
      this.remove(product.id);
    } else {
      this.add(product);
    }
  }

  save(items) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));

    document.dispatchEvent(
      new CustomEvent("wishlist:change", {
        detail: { items },
      }),
    );
  }
}

window.wishlist = new WishlistManager();

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-wishlist-button]");

  if (!button) return;

  wishlist.toggle({
    id: button.dataset.productId,
    handle: button.dataset.productHandle,
  });
});

function updateWishlistButtons() {
  document.querySelectorAll("[data-wishlist-button]").forEach((button) => {
    const isActive = wishlist.has(button.dataset.productId);

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));

    button.setAttribute("aria-label", isActive ? "Remove from wishlist" : "Add to wishlist");
  });
}

document.addEventListener("DOMContentLoaded", updateWishlistButtons);

document.addEventListener("wishlist:change", updateWishlistButtons);