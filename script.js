  // Botón "Volver arriba"
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Acordeón de Preguntas Frecuentes
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Horario inteligente del botón de WhatsApp
  // Horario de la tienda: todos los días · 6:00 pm (18h) a 12:00 am medianoche (24h)
  // Hora de Venezuela: America/Caracas (UTC-4), calculada aunque el celular esté en otra zona horaria
  function checkStoreStatus() {
    const waStatus = document.getElementById('waStatus');
    const waStatusText = document.getElementById('waStatusText');
    const waFloat = document.getElementById('waFloat');

    const nowVzla = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const hour = nowVzla.getHours();
    const isOpen = hour >= 18; // abre 6pm y cierra a medianoche (hora 24 = hora 0 del día siguiente)

    if (isOpen) {
      waStatusText.textContent = 'Estamos abiertos, ¡escríbenos!';
      waStatus.classList.remove('closed');
      waFloat.classList.remove('closed');
    } else {
      waStatusText.textContent = 'Cerrado ahora — abrimos hoy a las 6:00 pm';
      waStatus.classList.add('closed');
      waFloat.classList.add('closed');
    }
  }
  checkStoreStatus();
  setInterval(checkStoreStatus, 60000); // revisa cada minuto


  const WHATSAPP_NUMBER = "584269124842";

  // Menú desplegable móvil
  const toggle = document.getElementById('menuToggle');
  const navList = document.getElementById('navList');
  toggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
  navList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navList.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // ==================================================================
  // CARRITO DE COMPRAS
  // Cada producto agregado vive en memoria como { name, price, qty }.
  // El precio se toma directamente del atributo data-price del botón
  // que lo agregó, así que el HTML de cada tarjeta es la única fuente
  // de precios (no hay una tabla aparte que mantener sincronizada).
  // ==================================================================
  let cart = [];

  // Precio de cada ingrediente adicional según el tamaño de la pizza a la
  // que se agrega (coincide con la tabla mostrada en la sección Adicionales)
  const ADICIONAL_PRICE_BY_SIZE = { 'Pequeña': 0.80, 'Mediana': 1.00, 'Grande': 1.50 };
  const ADICIONALES = ['Borde de Tequeños', 'Borde de Queso', 'Pepperoni', 'Champiñón', 'Maíz', 'Otro ingrediente'];

  // Extrae el tamaño de un nombre de producto como "Pizza Pepperoni (Grande)"
  function getPizzaSize(name) {
    const match = name.match(/\((Pequeña|Mediana|Grande)\)$/);
    return match ? match[1] : null;
  }

  function isPizza(name) {
    return name.startsWith('Pizza ') && getPizzaSize(name);
  }

  function addToCart(name, price, noPrice = false) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, qty: 1, noPrice, extras: [] });
    }
    renderCart();
  }

  function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    renderCart();
  }

  function changeQty(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.name !== name);
    }
    renderCart();
  }

  function addExtra(name, extraName) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    if (item.extras.some(e => e.name === extraName)) return; // ya agregado
    const size = getPizzaSize(item.name);
    const price = ADICIONAL_PRICE_BY_SIZE[size] || 0;
    item.extras.push({ name: extraName, price });
    renderCart();
  }

  function removeExtra(name, extraName) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.extras = item.extras.filter(e => e.name !== extraName);
    renderCart();
  }

  // El total suma los productos con precio confirmado + todos los
  // ingredientes extra agregados. Los productos "sin precio" (bebidas)
  // van aparte, se confirman por WhatsApp.
  function cartTotal() {
    return cart.reduce((sum, item) => {
      if (item.noPrice) return sum;
      const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
      return sum + item.price * item.qty + extrasTotal;
    }, 0);
  }

  function cartLineHTML(item) {
    const extrasHTML = item.extras.map(extra => `
      <div class="cart-extra-row">
        <span class="extra-name">+ ${extra.name}</span>
        <span class="extra-price">$${extra.price.toFixed(2)}</span>
        <button type="button" class="extra-remove" data-extra="${extra.name}" aria-label="Quitar ingrediente">✕</button>
      </div>
    `).join('');

    const addExtraHTML = isPizza(item.name) ? `
      <div class="cart-extra-add">
        <select class="extra-select">
          ${ADICIONALES.map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <button type="button" class="extra-add-btn">+ Ingrediente</button>
      </div>
    ` : '';

    return `
      <div class="cart-line" data-name="${item.name}">
        <div class="cart-line-main">
          <div class="cart-line-info">
            <div class="cart-line-name">${item.name}</div>
            <div class="cart-line-price${item.noPrice ? ' no-price' : ''}">${item.noPrice ? 'Precio a confirmar' : `$${item.price.toFixed(2)} c/u`}</div>
          </div>
          <div class="cart-line-qty-ctrl">
            <button type="button" class="cart-qty-btn cart-qty-minus" aria-label="Quitar uno">−</button>
            <span class="cart-line-qty-num">${item.qty}</span>
            <button type="button" class="cart-qty-btn cart-qty-plus" aria-label="Agregar uno">+</button>
          </div>
          <button type="button" class="cart-line-remove" aria-label="Eliminar">✕</button>
        </div>
        ${(extrasHTML || addExtraHTML) ? `<div class="cart-extras">${extrasHTML}${addExtraHTML}</div>` : ''}
      </div>
    `;
  }

  function renderCart() {
    const drawerBody = document.getElementById('cartDrawerBody');
    const checkoutBody = document.getElementById('checkoutCartBody');
    const badge = document.getElementById('cartBadge');
    const drawerTotal = document.getElementById('cartDrawerTotal');
    const totalAmount = document.getElementById('totalAmount');

    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cartTotal();
    const noPriceItems = cart.filter(item => item.noPrice);

    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    const emptyHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Agrega productos desde el menú.</p>';
    const checkoutEmptyHTML = '<p class="cart-empty">Tu carrito está vacío.<br>Agrega productos desde el menú de arriba.</p>';
    const linesHTML = cart.map(cartLineHTML).join('');

    drawerBody.innerHTML = cart.length ? linesHTML : emptyHTML;
    if (checkoutBody) checkoutBody.innerHTML = cart.length ? linesHTML : checkoutEmptyHTML;

    // El total muestra el monto numérico, y si hay bebidas u otros productos
    // sin precio, se agregan al final como "+ nombre, nombre"
    let totalText = `$${total.toFixed(2)}`;
    if (noPriceItems.length) {
      const extras = noPriceItems.map(i => i.qty > 1 ? `${i.qty}x ${i.name}` : i.name).join(', ');
      totalText += ` + ${extras}`;
    }
    drawerTotal.textContent = totalText;
    if (totalAmount) totalAmount.textContent = totalText;
  }

  // Animación: un ícono "vuela" desde el botón presionado hasta el carrito
  function flyToCart(sourceEl) {
    const cartIcon = document.getElementById('cartBtn');
    const startRect = sourceEl.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;
    const dx = endX - startX;
    const dy = endY - startY;

    const flyer = document.createElement('div');
    flyer.className = 'fly-to-cart';
    flyer.textContent = '\u{1F6D2}';
    flyer.style.left = `${startX}px`;
    flyer.style.top = `${startY}px`;
    document.body.appendChild(flyer);

    const animation = flyer.animate([
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 70}px)) scale(0.85)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.25)`, opacity: 0.3, offset: 1 }
    ], { duration: 600, easing: 'ease-in' });

    animation.onfinish = () => {
      flyer.remove();
      cartIcon.classList.add('cart-bump');
      setTimeout(() => cartIcon.classList.remove('cart-bump'), 350);
    };
  }

  // Botones "Agregar al carrito" (productos de precio único)
  document.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const noPrice = btn.dataset.noprice === 'true';
      addToCart(name, price, noPrice);
      flyToCart(btn);
      btn.classList.add('just-added');
      setTimeout(() => btn.classList.remove('just-added'), 700);
    });
  });

  // Botones de tamaño (pizzas: Pequeña / Mediana / Grande)
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const baseName = btn.dataset.name;
      const size = btn.dataset.size;
      const price = parseFloat(btn.dataset.price);
      addToCart(`${baseName} (${size})`, price);
      flyToCart(btn);
      btn.classList.add('just-added');
      setTimeout(() => btn.classList.remove('just-added'), 700);
    });
  });

  // Clicks dentro de las líneas del carrito (sumar, restar, eliminar, ingredientes)
  function handleCartLineClick(e) {
    const line = e.target.closest('.cart-line');
    if (!line) return;
    const name = line.dataset.name;

    if (e.target.classList.contains('cart-qty-plus')) {
      changeQty(name, 1);
    } else if (e.target.classList.contains('cart-qty-minus')) {
      changeQty(name, -1);
    } else if (e.target.classList.contains('cart-line-remove')) {
      removeFromCart(name);
    } else if (e.target.classList.contains('extra-remove')) {
      removeExtra(name, e.target.dataset.extra);
    } else if (e.target.classList.contains('extra-add-btn')) {
      const select = line.querySelector('.extra-select');
      if (select) addExtra(name, select.value);
    }
  }
  document.getElementById('cartDrawerBody').addEventListener('click', handleCartLineClick);
  document.getElementById('checkoutCartBody').addEventListener('click', handleCartLineClick);

  // Abrir / cerrar el panel lateral del carrito
  const cartBtn = document.getElementById('cartBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartDrawerClose = document.getElementById('cartDrawerClose');

  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  }
  cartBtn.addEventListener('click', openCart);
  cartDrawerClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  document.getElementById('cartCheckoutBtn').addEventListener('click', closeCart);

  renderCart(); // estado inicial (carrito vacío al cargar la página)


  // Construir mensaje y abrir WhatsApp
  document.getElementById('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const cartRequiredNote = document.getElementById('cartRequiredNote');
    if (cart.length === 0) {
      cartRequiredNote.classList.remove('hidden');
      document.getElementById('checkoutCartBody').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    cartRequiredNote.classList.add('hidden');

    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const pago = document.getElementById('pago').value;
    const notas = document.getElementById('notas').value.trim();

    const lines = cart.map(item => {
      let line = `• ${item.qty} x ${item.name}`;
      if (item.extras && item.extras.length) {
        const extrasText = item.extras.map(e => `   ↳ + ${e.name} ($${e.price.toFixed(2)})`).join('\n');
        line += `\n${extrasText}`;
      }
      return line;
    }).join('\n');
    const total = cartTotal();
    const noPriceItems = cart.filter(item => item.noPrice);

    let totalLine = `$${total.toFixed(2)}`;
    if (noPriceItems.length) {
      const extras = noPriceItems.map(i => i.qty > 1 ? `${i.qty}x ${i.name}` : i.name).join(', ');
      totalLine += ` + ${extras}`;
    }

    let mensaje = `¡Hola CIAO Pizzería! \u{1F355} Quiero hacer un pedido:\n\n`;
    mensaje += `*Nombre:* ${nombre}\n`;
    mensaje += `*Teléfono:* ${telefono}\n`;
    mensaje += `*Dirección:* ${direccion}\n\n`;
    mensaje += `*Pedido:*\n${lines}\n\n`;
    mensaje += `*Total estimado:* ${totalLine}\n`;
    mensaje += `*Pago:* ${pago}\n`;
    if (notas) mensaje += `*Notas:* ${notas}\n`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

    // Mostrar confirmación visual de que el pedido se armó correctamente
    const confirmOverlay = document.getElementById('confirmOverlay');
    confirmOverlay.classList.add('visible');
    setTimeout(() => {
      confirmOverlay.classList.remove('visible');
    }, 3000);

    // Vaciar el carrito tras enviar el pedido
    cart = [];
    renderCart();
  });

  // Permitir cerrar la confirmación tocando fuera de la tarjeta
  document.getElementById('confirmOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'confirmOverlay') {
      e.currentTarget.classList.remove('visible');
    }
  });
