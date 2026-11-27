"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEYS = {
    cart: "dream-cart-session-v2",
    favorites: "dream-favorites-v2"
  };

  const readStorage = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const normalizeText = (value) => String(value)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const productTitle = document.querySelector(".info-compra h1");
  const productPriceElement = document.querySelector(".preco-bloco .preco");
  const productName = productTitle?.textContent.trim() || "Produto Dream Jóias";
  const productId = "DJ-AN-001";
  const productPrice = Number(
    (productPriceElement?.textContent || "")
      .replace(/[^\d,]/g, "")
      .replace(",", ".")
  ) || 0;

  let cartItems = readStorage(STORAGE_KEYS.cart, []);
  if (!Array.isArray(cartItems)) cartItems = [];

  let favoriteIds = readStorage(STORAGE_KEYS.favorites, []);
  if (!Array.isArray(favoriteIds)) favoriteIds = [];

  let selectedSize = document.querySelector(".opcoes-aro .selecionado")?.textContent.trim() || "";

  const toast = (message) => {
    let container = document.getElementById("dream-toast-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "dream-toast-container";
      Object.assign(container.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: "9999",
        maxWidth: "min(360px, calc(100vw - 40px))"
      });
      document.body.appendChild(container);
    }

    container.replaceChildren();
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    Object.assign(messageElement.style, {
      background: "#3a3640",
      color: "#fff",
      padding: "14px 18px",
      font: "13px Inter, sans-serif",
      lineHeight: "1.5",
      boxShadow: "0 4px 18px rgba(0,0,0,.16)"
    });
    container.appendChild(messageElement);

    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => messageElement.remove(), 2800);
  };

  // Galeria de imagens
  const gallery = document.querySelector(".galeria");
  const mainImage = gallery?.querySelector(".imagem-principal img");
  const mainCaption = gallery?.querySelector(".imagem-principal figcaption");
  const thumbnails = Array.from(gallery?.querySelectorAll(".miniaturas button") || []);

  thumbnails.forEach((button, index) => {
    button.setAttribute("aria-label", `Mostrar imagem ${index + 1} do produto`);
    button.setAttribute("aria-pressed", String(button.classList.contains("ativa")));

    button.addEventListener("click", () => {
      const thumbnailImage = button.querySelector("img");
      if (!mainImage || !thumbnailImage) return;

      mainImage.src = thumbnailImage.src;
      mainImage.alt = thumbnailImage.alt || `Imagem ${index + 1} de ${productName}`;

      thumbnails.forEach((item) => {
        const active = item === button;
        item.classList.toggle("ativa", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (mainCaption) {
        mainCaption.textContent = index === 0
          ? "Ouro 18k · Acabamento polido"
          : `Detalhe ${index + 1} · ${productName}`;
      }
    });
  });

  // Seleção do aro
  const sizeButtons = Array.from(document.querySelectorAll(".opcoes-aro button"));

  sizeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("selecionado")));

    button.addEventListener("click", () => {
      selectedSize = button.textContent.trim();

      sizeButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("selecionado", active);
        item.setAttribute("aria-pressed", String(active));
      });
    });
  });

  // Carrinho
  const cartCount = document.querySelector(".cart-count");
  const cartLink = document.querySelector(".header-actions a[aria-label='Sacola de compras']");

  const getCartQuantity = () => cartItems.reduce(
    (total, item) => total + Math.max(0, Number(item.quantity) || 0),
    0
  );

  const renderCart = () => {
    const quantity = getCartQuantity();
    if (cartCount) cartCount.textContent = String(quantity);
    if (cartLink) {
      cartLink.setAttribute(
        "aria-label",
        `Sacola de compras: ${quantity} ${quantity === 1 ? "item" : "itens"}`
      );
    }
  };

  document.querySelector(".btn-primario")?.addEventListener("click", () => {
    if (!selectedSize) {
      toast("Selecione o tamanho do aro antes de adicionar ao carrinho.");
      return;
    }

    const existingItem = cartItems.find(
      (item) => item.productId === productId && item.size === selectedSize
    );

    if (existingItem) {
      existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
    } else {
      cartItems.push({
        productId,
        name: productName,
        unitPrice: productPrice,
        size: selectedSize,
        quantity: 1
      });
    }

    const saved = writeStorage(STORAGE_KEYS.cart, cartItems);
    renderCart();
    toast(saved
      ? `${productName}, aro ${selectedSize}, adicionado à sacola.`
      : "Item adicionado nesta página, mas não foi possível salvar no navegador.");
  });

  renderCart();

  // Favoritos
  const favoriteButton = document.querySelector(".btn-secundario");

  const renderFavorite = () => {
    if (!favoriteButton) return;
    const isFavorite = favoriteIds.includes(productId);
    favoriteButton.textContent = isFavorite ? "♥ Salvo nos favoritos" : "♡ Salvar nos favoritos";
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.classList.toggle("is-saved", isFavorite);

    if (isFavorite) {
      favoriteButton.style.backgroundColor = "#d32651";
      favoriteButton.style.borderColor = "#d49caa";
      favoriteButton.style.color = "#ffffff";
    } else {
      favoriteButton.style.backgroundColor = "";
      favoriteButton.style.borderColor = "";
      favoriteButton.style.color = "";
    }
  };

  favoriteButton?.addEventListener("click", () => {
    if (favoriteIds.includes(productId)) {
      favoriteIds = favoriteIds.filter((id) => id !== productId);
      toast("Joia removida dos favoritos.");
    } else {
      favoriteIds.push(productId);
      toast("Joia salva nos favoritos.");
    }

    if (!writeStorage(STORAGE_KEYS.favorites, favoriteIds)) {
      toast("Não foi possível salvar os favoritos neste navegador.");
    }
    renderFavorite();
  });

  renderFavorite();

  // Consulta de CEP
  const shippingForm = document.querySelector(".frete");
  const cepInput = document.getElementById("cep");
  const shippingButton = shippingForm?.querySelector("button[type='submit']");

  let shippingFeedback = document.getElementById("shipping-feedback");
  if (shippingForm && !shippingFeedback) {
    shippingFeedback = document.createElement("p");
    shippingFeedback.id = "shipping-feedback";
    shippingFeedback.setAttribute("aria-live", "polite");
    Object.assign(shippingFeedback.style, {
      fontSize: "12px",
      lineHeight: "1.5",
      margin: "0 0 14px",
      color: "#6b6670"
    });
    shippingForm.appendChild(shippingFeedback);
  }

  const normalizeCep = (value) => value.replace(/\D/g, "").slice(0, 8);

  cepInput?.addEventListener("input", () => {
    const digits = normalizeCep(cepInput.value);
    cepInput.value = digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits;
    cepInput.setAttribute("aria-invalid", "false");
    if (shippingFeedback) shippingFeedback.textContent = "";
  });

  shippingForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!cepInput || !shippingButton || !shippingFeedback) return;

    const cep = normalizeCep(cepInput.value);

    if (!/^\d{8}$/.test(cep)) {
      cepInput.setAttribute("aria-invalid", "true");
      shippingFeedback.textContent = "Digite um CEP válido com 8 números.";
      shippingFeedback.style.color = "#a33";
      cepInput.focus();
      return;
    }

    shippingButton.disabled = true;
    shippingButton.textContent = "Consultando...";
    shippingFeedback.textContent = "Consultando o CEP informado...";
    shippingFeedback.style.color = "#6b6670";

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error("Falha na consulta");

      const address = await response.json();
      if (address.erro) {
        cepInput.setAttribute("aria-invalid", "true");
        shippingFeedback.textContent = "CEP não encontrado. Confira os números.";
        shippingFeedback.style.color = "#a33";
        return;
      }

      const location = [
        address.logradouro,
        address.bairro,
        [address.localidade, address.uf].filter(Boolean).join(" - ")
      ].filter(Boolean).join(", ");

      shippingFeedback.textContent =
        `${location || "Endereço localizado"}. O valor e o prazo do frete dependem da transportadora.`;
      shippingFeedback.style.color = "#39734a";
      cepInput.setAttribute("aria-invalid", "false");
    } catch {
      shippingFeedback.textContent = "Não foi possível consultar o CEP. Verifique a conexão e tente novamente.";
      shippingFeedback.style.color = "#a33";
    } finally {
      shippingButton.disabled = false;
      shippingButton.textContent = "Calcular";
    }
  });

  // Abas de informações
  const tabs = Array.from(document.querySelectorAll(".abas-info button"));
  const aboutContent = document.querySelector(".conteudo-sobre");
  const originalAboutHTML = aboutContent?.innerHTML || "";

  const tabContent = {
    "Sobre": originalAboutHTML,
    "Fabricante": `
      <div class="texto-historia">
        <h2>Informações do fabricante</h2>
        <p>Os dados cadastrais do fabricante desta peça não foram informados.</p>
        <p>Consulte o atendimento da Dream Jóias para obter a identificação e os dados do responsável pela fabricação.</p>
      </div>
      <aside class="card-especificacoes">
        <h3>Informação</h3>
        <p class="nota-rodape-spec">A identificação do fabricante deve ser confirmada antes da publicação comercial da página.</p>
      </aside>`,
    "Distribuidora": `
      <div class="texto-historia">
        <h2>Informações da distribuidora</h2>
        <p>Os dados cadastrais da distribuidora não foram informados.</p>
        <p>Consulte o atendimento da Dream Jóias para obter as informações comerciais e de distribuição desta peça.</p>
      </div>
      <aside class="card-especificacoes">
        <h3>Informação</h3>
        <p class="nota-rodape-spec">Os dados da distribuidora precisam ser preenchidos pela equipe responsável pela loja.</p>
      </aside>`
  };

  tabs.forEach((tab, index) => {
    tab.setAttribute("aria-selected", String(index === 0));
    tab.setAttribute("tabindex", index === 0 ? "0" : "-1");

    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("aba-ativa", active);
        item.setAttribute("aria-selected", String(active));
        item.setAttribute("tabindex", active ? "0" : "-1");
      });

      if (aboutContent) {
        const label = tab.textContent.trim();
        aboutContent.innerHTML = tabContent[label] || originalAboutHTML;
      }
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;

      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });

  // Guia de medidas: explica os tamanhos sem inventar conversões.
  const sizeGuideLink = document.querySelector(".tamanhos-topo a");
  sizeGuideLink?.addEventListener("click", (event) => {
    event.preventDefault();
    toast("Escolha o aro medido em uma joalheria ou consulte o atendimento para confirmar a numeração.");
  });

  // Busca dos produtos recomendados
  const searchForm = document.querySelector(".search-bar");
  const searchInput = searchForm?.querySelector("input");
  const productCards = Array.from(document.querySelectorAll(".produto-card"));

  const filterProducts = () => {
    const term = normalizeText(searchInput?.value || "");
    let visibleCount = 0;

    productCards.forEach((card) => {
      const searchable = normalizeText(
        `${card.querySelector("h3")?.textContent || ""} ${card.querySelector(".preco")?.textContent || ""}`
      );
      const matches = !term || searchable.includes(term);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    let emptyMessage = document.getElementById("search-empty");
    if (!emptyMessage && productCards.length) {
      emptyMessage = document.createElement("p");
      emptyMessage.id = "search-empty";
      emptyMessage.textContent = "Nenhum produto recomendado corresponde à sua busca.";
      emptyMessage.style.cssText = "font-size:13px;color:#7a7680;margin-top:20px;";
      document.querySelector(".produtos-grid")?.after(emptyMessage);
    }

    if (emptyMessage) emptyMessage.hidden = !term || visibleCount > 0;

    if (term && normalizeText(productName).includes(term)) {
      document.querySelector(".container-produto")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast("A busca corresponde ao produto exibido nesta página.");
    } else if (term) {
      document.querySelector(".recomendados")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      productCards.forEach((card) => { card.hidden = false; });
    }
  };

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
  });

  searchInput?.addEventListener("input", () => {
    if (!searchInput.value.trim()) filterProducts();
  });
});
