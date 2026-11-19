class ProductGallery {
  constructor(element) {
    this.element = element;

    this.slides = [...element.querySelectorAll("[data-gallery-slide]")];
    this.thumbnails = [...element.querySelectorAll("[data-gallery-thumbnail]")];

    this.prevButton = element.querySelector("[data-gallery-prev]");
    this.nextButton = element.querySelector("[data-gallery-next]");

    this.activeIndex = 0;

    this.init();
  }

  init() {
    if (!this.slides.length) return;
    this.element.addEventListener("click", this.handleClick.bind(this));
    this.showImage(this.activeIndex);
  }

  handleClick(event) {
    const thumbnail = event.target.closest("[data-gallery-thumbnail]");
    const prevButton = event.target.closest("[data-gallery-prev]");
    const nextButton = event.target.closest("[data-gallery-next]");

    if (thumbnail) {
      const index = Number(thumbnail.dataset.index);

      this.showImage(index);
      return;
    }

    if (prevButton) {
      this.showImage(this.activeIndex - 1);
      return;
    }

    if (nextButton) {
      this.showImage(this.activeIndex + 1);
    }
  }

  showImage(index) {
    const totalImages = this.slides.length;

    this.activeIndex = (index + totalImages) % totalImages;

    this.slides.forEach((slide, i) => {
      const isActive = i === this.activeIndex;

      slide.classList.toggle("is-active", isActive);
    });

    this.thumbnails.forEach((thumbnail, i) => {
      const isActive = i === this.activeIndex;

      thumbnail.classList.toggle("is-active", isActive);
      thumbnail.setAttribute("aria-pressed", String(isActive));
    });

    this.thumbnails[this.activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }
}

class ProductQuantity {
  constructor(element) {
    this.element = element;

    this.input = element.querySelector("[data-product-quantity]");
    this.minusButton = element.querySelector("[data-quantity-minus]");
    this.plusButton = element.querySelector("[data-quantity-plus]");

    this.init();
  }

  init() {
    if (!this.input) return;

    this.element.addEventListener("click", this.handleClick.bind(this));
    this.input.addEventListener("change", this.handleChange.bind(this));
  }

  handleClick(event) {
    const minusButton = event.target.closest("[data-quantity-minus]");
    const plusButton = event.target.closest("[data-quantity-plus]");

    if (!minusButton && !plusButton) return;

    const currentQuantity = Number(this.input.value) || 1;
    const step = Number(this.input.step) || 1;
    const minimum = Number(this.input.min) || 1;

    const newQuantity = minusButton ? Math.max(minimum, currentQuantity - step) : currentQuantity + step;

    this.input.value = newQuantity;

    this.input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  handleChange() {
    const minimum = Number(this.input.min) || 1;
    const quantity = Math.floor(Number(this.input.value) || minimum);

    this.input.value = Math.max(minimum, quantity);
  }
}

class ProductVariants {
  constructor(element) {
    this.element = element;
    this.select = element.querySelector("[data-variant-select]");
    this.price = element.querySelector("[data-product-price]");
    this.comparePrice = element.querySelector("[data-compare-price]");
    this.sku = element.querySelector("[data-product-sku]");
    this.stock = element.querySelector("[data-product-stock]");
    this.availability = element.querySelector("[data-product-availability]");
    this.addButton = element.querySelector("[data-add-to-cart]");
    this.gallery = element.querySelector("[data-product-gallery]");
    this.init();
  }

  init() {
    if (!this.select) return;

    this.select.addEventListener("change", this.handleChange.bind(this));
  }

  handleChange() {
    const selectedOption = this.select.selectedOptions[0];

    if (!selectedOption) return;

    const { price, comparePrice, comparePriceRaw, sku, available, imageId, inventory } = selectedOption.dataset;

    this.updatePrice(price, comparePrice, comparePriceRaw);
    this.updateSku(sku);
    this.updateAvailability(available);
    this.updateButton(available);
    this.updateStock(inventory, available);

    if (imageId) {
      this.updateImage(imageId);
    }
  }

  updatePrice(price, comparePrice, comparePriceRaw) {
    const selectedOption = this.select.selectedOptions[0];

    const currentPrice = Number(selectedOption.dataset.priceRaw);
    const originalPrice = Number(comparePriceRaw);

    this.price.textContent = price;

    const hasDiscount = originalPrice > currentPrice;

    this.comparePrice.textContent = comparePrice;
    this.comparePrice.hidden = !hasDiscount;
  }

  // getSelectedPriceInCents() {
  //   const selectedOption = this.select.selectedOptions[0];

  //   return selectedOption.dataset.priceRaw;
  // }

  updateSku(sku) {
    this.sku.textContent = sku || "N/A";
  }
  updateStock(inventory, available) {
    if (!this.stock) return;

    if (available !== "true") {
      this.stock.textContent = "Sold out";
      return;
    }

    this.stock.textContent = `${inventory} available`;
  }

  updateAvailability(available) {
    const isAvailable = available === "true";

    this.availability.textContent = isAvailable ? "Available" : "Sold out";
  }

  updateButton(available) {
    const isAvailable = available === "true";

    this.addButton.disabled = !isAvailable;

    this.addButton.textContent = isAvailable ? "Add to cart" : "Sold out";
  }

  updateImage(imageId) {
    if (!this.gallery) return;

    const slides = [...this.gallery.querySelectorAll("[data-gallery-slide]")];

    const imageIndex = slides.findIndex((slide) => slide.dataset.imageId === imageId);

    if (imageIndex !== -1) {
      this.gallery.productGalleryInstance?.showImage(imageIndex);
    }
  }
}

class ProductCart {
  constructor(element) {
    this.element = element;
    this.form = element.querySelector('form[action*="/cart/add"]');
    this.button = element.querySelector("[data-add-to-cart]");
    this.quantity = element.querySelector("[data-product-quantity]");

    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener("submit", this.handleSubmit.bind(this));
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    const originalText = this.button.textContent;

    this.button.disabled = true;
    this.button.textContent = "Adding...";

    try {
      const formData = new FormData(this.form);

      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.description || "Unable to add product.");
      }

      this.button.textContent = "Added to cart";

      await this.updateCartCount();

      console.log("Product added:", result);
    } catch (error) {
      console.error("Add to cart error:", error);
      this.button.textContent = "Unable to add";
    } finally {
      setTimeout(() => {
        this.button.disabled = false;
        this.button.textContent = originalText;
      }, 1500);
    }
  }

  async updateCartCount() {
    try {
      const response = await fetch(`${window.Shopify.routes.root}cart.js`);

      if (!response.ok) {
        throw new Error("Unable to retrieve cart.");
      }

      const cart = await response.json();

      document.querySelectorAll("[data-cart-count]").forEach((element) => {
        element.textContent = cart.item_count;
      });
    } catch (error) {
      console.error("Cart count update failed:", error);
    }
  }
}

class ProductCompare {
  constructor(element) {
    this.element = element;
    this.button = element.querySelector("[data-compare]");
    this.storageKey = "shopify-product-compare";

    this.init();
  }

  init() {
    if (!this.button) return;

    this.button.addEventListener("click", this.handleClick.bind(this));

    this.updateButton();
  }

  getProducts() {
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
  }

  saveProducts(products) {
    localStorage.setItem(this.storageKey, JSON.stringify(products));
  }

  handleClick() {
    const products = this.getProducts();
    const productId = this.button.dataset.productId;

    const existingProduct = products.find((product) => product.id === productId);

    let updatedProducts;

    if (existingProduct) {
      updatedProducts = products.filter((product) => product.id !== productId);
    } else {
      if (products.length >= 4) {
        alert("You can compare up to 4 products.");
        return;
      }

      updatedProducts = [
        ...products,
        {
          id: productId,
          title: this.button.dataset.productTitle,
          url: this.button.dataset.productUrl,
          image: this.button.dataset.productImage,
        },
      ];
    }

    this.saveProducts(updatedProducts);
    this.updateButton();

    this.element.dispatchEvent(
      new CustomEvent("compare:updated", {
        bubbles: true,
        detail: { products: updatedProducts },
      }),
    );
  }

  updateButton() {
    const products = this.getProducts();

    const isCompared = products.some((product) => product.id === this.button.dataset.productId);

    this.button.textContent = isCompared ? "✓ Added to Compare" : "⇄ Compare";

    this.button.setAttribute("aria-pressed", String(isCompared));
  }
}

function initializeProductSection(section) {
  const gallery = section.querySelector("[data-product-gallery]");
  const quantity = section.querySelector(".product-quantity");

  if (gallery && !gallery.productGalleryInstance) {
    gallery.productGalleryInstance = new ProductGallery(gallery);
  }

  if (quantity && !quantity.productQuantityInstance) {
    quantity.productQuantityInstance = new ProductQuantity(quantity);
  }

  if (!section.productVariantsInstance) {
    section.productVariantsInstance = new ProductVariants(section);
  }
  if (!section.productCompareInstance) {
    section.productCompareInstance = new ProductCompare(section);
  }
  if (!section.productCartInstance) {
    section.productCartInstance = new ProductCart(section);
  }
}
function initializeProducts() {
  document.querySelectorAll("[data-product-section]").forEach((section) => {
    initializeProductSection(section);
  });
}

document.addEventListener("DOMContentLoaded", initializeProducts);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeProducts);
} else {
  initializeProducts();
}

document.addEventListener("shopify:section:load", initializeProducts);
