class CartPage {
  constructor(element) {
    this.element = element;
    this.cartUrl = element.dataset.cartUrl;
    this.sectionId = element.dataset.sectionId;
    this.isUpdating = false;

    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.init();
  }

  init() {
    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("change", this.handleChange);
    this.element.addEventListener("submit", this.handleSubmit);
  }

  handleClick(event) {
    const removeButton = event.target.closest("[data-remove-item]");
    const minusButton = event.target.closest("[data-quantity-minus]");
    const plusButton = event.target.closest("[data-quantity-plus]");

    if (removeButton) {
      event.preventDefault();

      this.changeItem(removeButton.dataset.lineKey, 0);
      return;
    }

    if (minusButton || plusButton) {
      event.preventDefault();

      const control = event.target.closest(".quantity-control");
      const input = control?.querySelector("[data-quantity-input]");

      if (!input) return;

      const currentQuantity = Number(input.value) || 0;
      const step = Number(input.step) || 1;
      const minimum = Number(input.min) || 0;

      const newQuantity = minusButton ? Math.max(minimum, currentQuantity - step) : currentQuantity + step;

      if (newQuantity !== currentQuantity) {
        input.value = newQuantity;

        this.changeItem(input.dataset.lineKey, newQuantity);
      }
    }
  }

  handleChange(event) {
    const quantityInput = event.target.closest("[data-quantity-input]");

    if (quantityInput) {
      const minimum = Number(quantityInput.min) || 0;

      const quantity = Math.max(minimum, Math.floor(Number(quantityInput.value) || 0));

      quantityInput.value = quantity;

      this.changeItem(quantityInput.dataset.lineKey, quantity);

      return;
    }

    const noteInput = event.target.closest("[data-cart-note]");

    if (noteInput) {
      this.saveNote(noteInput.value);
    }
  }

  handleSubmit(event) {
    const form = event.target.closest("[data-cart-form]");

    if (!form) return;

    const submitter = event.submitter;

    // Let Shopify handle checkout normally.
    if (submitter?.name === "checkout") return;

    event.preventDefault();

    if (this.isUpdating) return;

    const updates = {};

    form.querySelectorAll("[data-quantity-input]").forEach((input) => {
      updates[input.dataset.lineKey] = Math.max(0, Math.floor(Number(input.value) || 0));
    });

    this.updateCart(updates);
  }

  async changeItem(lineKey, quantity) {
    if (this.isUpdating) return;

    await this.request("/change.js", {
      id: lineKey,
      quantity: quantity,
    });
  }

  async updateCart(updates) {
    await this.request("/update.js", {
      updates: updates,
    });
  }

  async saveNote(note) {
    await this.request(
      "/update.js",
      {
        note: note,
      },
      false,
    );
  }

  async request(endpoint, body, refresh = true) {
    if (this.isUpdating) return;

    this.setLoading(true);

    try {
      const response = await fetch(`${this.cartUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.description || result.message || "Unable to update your cart.");
      }

      if (refresh) {
        try {
          await this.refreshCart();
        } catch (error) {
          console.error("Cart rendering failed:", error);

          // The cart mutation may already have succeeded.
          window.location.reload();
          return;
        }
      }

      this.showStatus(refresh ? "Cart updated successfully." : "Order note saved.");

      this.element.dispatchEvent(
        new CustomEvent("cart:updated", {
          bubbles: true,
          detail: { cart: result },
        }),
      );
    } catch (error) {
      console.error("Cart update error:", error);
      this.showStatus(error.message || "Something went wrong. Please try again.");
    } finally {
      this.setLoading(false);
    }
  }

  async refreshCart() {
    const url = new URL(window.location.href);

    url.searchParams.set("sections", this.sectionId);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to refresh cart section.");
    }

    const sections = await response.json();
    const html = sections[this.sectionId];

    if (!html) {
      console.error("Cart section response:", sections);
      throw new Error(`Section "${this.sectionId}" was not returned.`);
    }

    const document = new DOMParser().parseFromString(html, "text/html");

    const updatedSection = document.querySelector("[data-cart-section]");

    if (!updatedSection) {
      throw new Error("Updated cart markup was not found.");
    }

    this.element.innerHTML = updatedSection.innerHTML;
  }

  setLoading(loading) {
    this.isUpdating = loading;

    this.element.setAttribute("aria-busy", String(loading));

    this.element.querySelectorAll("button, input, textarea").forEach((control) => {
      control.disabled = loading;
    });
  }

  showStatus(message) {
    const status = this.element.querySelector("[data-cart-status]");

    if (status) {
      status.textContent = message;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-cart-section]").forEach((section) => {
    if (!section.cartPageInstance) {
      section.cartPageInstance = new CartPage(section);
    }
  });
});
