import { supabase } from './js/supabase-client.js';

// ==========================================================
// Utilidades
// ==========================================================
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const money = (n) => `$${Number(n).toLocaleString()} MXN`;

// Toasts accesibles (reemplazan a alert para mensajes no bloqueantes)
export function showToast(message, type = 'info') {
  const region = document.getElementById('toastRegion');
  if (!region) return;
  const icons = { success: '✓', error: '✕', info: '✦' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span><span>${esc(message)}</span>`;
  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ==========================================================
// Catálogo cargado desde Supabase (tabla `perfumes`)
// ==========================================================
let catalogo = [];
let searchQuery = '';

async function cargarCatalogo() {
  try {
    const { data, error } = await supabase
      .from('perfumes')
      .select('*')
      .order('precio', { ascending: false });
    if (error) throw error;
    catalogo = data.map((p) => ({
      id: p.id,
      brand: p.marca,
      name: p.nombre,
      type: p.tipo,
      price: Number(p.precio),
      img: p.imagen,
      badge: p.badge,
      stock: p.stock,
    }));
  } catch (err) {
    console.error('No se pudo cargar el catálogo desde Supabase, usando respaldo local:', err);
    catalogo = typeof products !== 'undefined' ? products : [];
  }
}

function renderSkeletons(count = 8) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-line w-40"></div>
      <div class="skeleton skeleton-line w-70"></div>
      <div class="skeleton skeleton-line w-55"></div>
    </div>
  `).join('');
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const query = searchQuery.trim().toLowerCase();
  const visibles = catalogo
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !query || `${p.brand} ${p.name}`.toLowerCase().includes(query));

  if (visibles.length === 0) {
    grid.innerHTML = `<p class="search-empty">No encontramos perfumes para "<strong>${esc(searchQuery)}</strong>". Intenta con otra marca o nombre.</p>`;
    return;
  }

  grid.innerHTML = visibles.map(({ p, i }) => `
    <article class="product-card reveal${p.stock <= 0 ? ' out-of-stock' : ''}"
      ${p.stock > 0 ? `onclick="addToCart(${i})" tabindex="0" role="button" aria-label="Añadir ${esc(p.brand)} ${esc(p.name)} al carrito"` : ''}>
      ${p.badge ? `<span class="product-badge badge-${esc(p.badge)}">${p.badge === 'sale' ? 'Oferta' : p.badge === 'new' ? 'Nuevo' : 'Popular'}</span>` : ''}
      ${p.stock <= 0 ? '<span class="product-badge badge-sold-out">Agotado</span>' : ''}
      <div class="product-img-wrap">
        <img src="imagenes/${esc(p.img)}" alt="${esc(p.brand)} ${esc(p.name)}" loading="lazy" decoding="async"
          onerror="this.src='https://via.placeholder.com/200'">
      </div>
      <div class="product-info">
        <span class="product-brand">${esc(p.brand)}</span>
        <h3 class="product-name">${esc(p.name)}</h3>
        <span class="product-type">${esc(p.type)}</span>
        <div class="product-bottom">
          <span class="product-price">${money(p.price)}</span>
          ${p.stock > 0
            ? `<button class="product-btn" aria-label="Añadir al carrito">🛒</button>`
            : `<span class="stock-label stock-out">Sin stock</span>`
          }
        </div>
        ${p.stock > 0 && p.stock <= 3 ? `<span class="stock-label stock-low">¡Últimas ${p.stock} unidades!</span>` : ''}
      </div>
    </article>
  `).join('');

  // Entrada escalonada de las tarjetas
  requestAnimationFrame(() => {
    grid.querySelectorAll('.reveal').forEach((card, idx) => {
      card.style.transitionDelay = `${Math.min(idx, 10) * 35}ms`;
      card.classList.add('in-view');
    });
  });

  // Las tarjetas son activables también con teclado (Enter / Espacio)
  grid.querySelectorAll('.product-card[role="button"]').forEach((card) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

// ==========================================================
// Carrito persistente con localStorage
// ==========================================================
let cart = JSON.parse(localStorage.getItem('aromesence_cart') || '[]');
let cartGroups = [];

function saveCart() {
  localStorage.setItem('aromesence_cart', JSON.stringify(cart));
}

// Agrupa las unidades del carrito por producto para mostrarlas con cantidad
function groupCart() {
  const groups = [];
  cart.forEach((item, idx) => {
    const g = groups.find((x) => x.name === item.name && x.brand === item.brand);
    if (g) {
      g.qty += 1;
      g.indices.push(idx);
    } else {
      groups.push({ ...item, qty: 1, indices: [idx] });
    }
  });
  return groups;
}

window.addToCart = (index, { openSidebar = true } = {}) => {
  const product = catalogo[index];
  if (!product || product.stock <= 0) return;

  const inCartCount = cart.filter((item) => item.name === product.name && item.brand === product.brand).length;
  if (inCartCount >= product.stock) {
    showToast(`Solo quedan ${product.stock} unidades de ${product.name}.`, 'error');
    return;
  }

  cart.push({ ...product, productIndex: index });
  saveCart();
  updateCartUI();
  if (openSidebar) openCartSidebar();
};

// Cambia la cantidad de un grupo (+1 / -1) desde los controles del carrito
window.changeQty = (groupIdx, delta) => {
  const group = cartGroups[groupIdx];
  if (!group) return;

  if (delta > 0) {
    const idx = catalogo.findIndex((p) => p.name === group.name && p.brand === group.brand);
    if (idx === -1) return;
    window.addToCart(idx, { openSidebar: false });
  } else {
    const removeIdx = group.indices[group.indices.length - 1];
    cart.splice(removeIdx, 1);
    saveCart();
    updateCartUI();
  }
};

// Elimina todas las unidades de un producto, con animación de salida
window.removeGroup = (groupIdx) => {
  const group = cartGroups[groupIdx];
  if (!group) return;
  const el = document.querySelectorAll('#cartSidebarItems .cart-item')[groupIdx];
  const doRemove = () => {
    cart = cart.filter((item) => !(item.name === group.name && item.brand === group.brand));
    saveCart();
    updateCartUI();
  };
  if (el) {
    el.classList.add('removing');
    setTimeout(doRemove, 220);
  } else {
    doRemove();
  }
};

// Compatibilidad con la firma anterior
window.removeFromCart = (index) => {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
};

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const sidebarItems = document.getElementById('cartSidebarItems');
  const summaryBox = document.getElementById('cartSidebarSummary');

  cartCount.innerText = cart.length;
  cartCount.classList.add('bump');
  setTimeout(() => cartCount.classList.remove('bump'), 300);

  cartGroups = groupCart();

  if (cart.length === 0) {
    sidebarItems.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon" aria-hidden="true">🛒</span>
        <p>Tu carrito está vacío</p>
        <a href="#catalogo-caballero" class="cart-empty-cta" id="cartEmptyCta">Explorar el catálogo</a>
      </div>`;
    summaryBox.innerHTML = `
      <div class="summary-row summary-total">
        <span>Total:</span>
        <span class="amount" id="cartSidebarTotal">$0 MXN</span>
      </div>`;
    const cta = document.getElementById('cartEmptyCta');
    if (cta) cta.addEventListener('click', closeCartSidebar);
    return;
  }

  sidebarItems.innerHTML = cartGroups.map((g, gi) => `
    <div class="cart-item">
      <img src="imagenes/${esc(g.img)}" alt="" class="cart-item-img" onerror="this.src='https://via.placeholder.com/60'">
      <div class="cart-item-info">
        <h4 class="cart-item-name">${esc(g.name)}</h4>
        <span class="cart-item-brand">${esc(g.brand)}</span>
        <div class="cart-item-price">${money(g.price * g.qty)}</div>
      </div>
      <div class="cart-item-qty" aria-label="Cantidad de ${esc(g.name)}">
        <button class="qty-btn" onclick="changeQty(${gi}, -1)" aria-label="Quitar una unidad">−</button>
        <span class="qty-value" aria-live="polite">${g.qty}</span>
        <button class="qty-btn" onclick="changeQty(${gi}, 1)" ${g.qty >= g.stock ? 'disabled' : ''} aria-label="Agregar una unidad">+</button>
      </div>
      <button onclick="removeGroup(${gi})" class="cart-item-remove" aria-label="Eliminar ${esc(g.name)} del carrito">&times;</button>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  summaryBox.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="summary-row"><span>Envío</span><span class="free-shipping">Gratis</span></div>
    <div class="summary-row summary-total">
      <span>Total:</span>
      <span class="amount" id="cartSidebarTotal">${money(subtotal)}</span>
    </div>`;
}

// ==========================================================
// Apertura/cierre de carrito y modal con manejo de foco
// ==========================================================
let lastFocusSidebar = null;
let lastFocusModal = null;

function openCartSidebar() {
  lastFocusSidebar = document.activeElement;
  document.getElementById('cartSidebar').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  document.getElementById('closeCart').focus();
}

function closeCartSidebar() {
  document.getElementById('cartSidebar').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
  if (lastFocusSidebar) lastFocusSidebar.focus();
}

function openCheckoutModal() {
  lastFocusModal = document.activeElement;
  const modal = document.getElementById('checkoutModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  document.getElementById('closeModal').focus();
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('active');
  setTimeout(() => (modal.style.display = 'none'), 350);
  if (lastFocusModal) lastFocusModal.focus();
}

// Mantiene el foco dentro del diálogo activo al navegar con Tab
function trapFocus(container, e) {
  const focusables = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// ==========================================================
// Inicialización
// ==========================================================
document.addEventListener('DOMContentLoaded', async () => {
  // --- Menú móvil ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // --- Sombra del navbar al hacer scroll ---
  const navbar = document.querySelector('.navbar');
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Partículas del hero ---
  const particles = document.querySelector('.hero-particles');
  if (particles) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 6}s`;
      s.style.animationDuration = `${5 + Math.random() * 5}s`;
      particles.appendChild(s);
    }
  }

  // --- Scroll reveal para secciones estáticas ---
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // --- Catálogo: skeletons mientras carga Supabase ---
  renderSkeletons();
  await cargarCatalogo();
  renderProducts();
  updateCartUI();

  // --- Búsqueda en vivo ---
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });

  // --- Carrito: abrir / cerrar ---
  document.getElementById('navCartBtn').addEventListener('click', (e) => {
    e.preventDefault();
    openCartSidebar();
  });
  document.getElementById('closeCart').addEventListener('click', closeCartSidebar);
  document.getElementById('cartOverlay').addEventListener('click', () => {
    closeCartSidebar();
    document.getElementById('checkoutModal').classList.remove('active');
  });

  // --- Cerrar con Escape y atrapar foco en diálogos ---
  document.addEventListener('keydown', (e) => {
    const modalActive = document.getElementById('checkoutModal').classList.contains('active');
    const sidebarActive = document.getElementById('cartSidebar').classList.contains('active');
    if (e.key === 'Escape') {
      if (modalActive) closeCheckoutModal();
      else if (sidebarActive) closeCartSidebar();
    }
    if (e.key === 'Tab') {
      if (modalActive) trapFocus(document.querySelector('#checkoutModal .modal-content'), e);
      else if (sidebarActive) trapFocus(document.getElementById('cartSidebar'), e);
    }
  });

  // --- Proceder al pago (Checkout) ---
  document.getElementById('proceedCheckout').addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Tu carrito está vacío', 'info');
      return;
    }

    closeCartSidebar();

    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');

    cartItemsDiv.innerHTML = groupCart().map((g) => `
      <div class="summary-line">
        <span><span class="line-qty">${g.qty}×</span> ${esc(g.brand)} — ${esc(g.name)}</span>
        <span class="line-price">${money(g.price * g.qty)}</span>
      </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotalSpan.innerText = money(total);

    openCheckoutModal();
  });

  document.getElementById('closeModal').addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if (e.target.id === 'checkoutModal') closeCheckoutModal();
  });

  // ==========================================================
  // Validación en vivo del checkout
  // ==========================================================
  const fieldMessages = {
    checkoutName: 'Ingresa tu nombre completo.',
    checkoutPhone: 'Ingresa tu número de teléfono.',
    checkoutEmail: 'Ingresa un correo válido.',
    checkoutAddress: 'Ingresa tu calle y número.',
    checkoutCP: 'Ingresa un código postal de 5 dígitos.',
    checkoutColonia: 'Selecciona tu colonia.',
    checkoutCity: 'Ingresa tu ciudad o municipio.',
    checkoutState: 'Selecciona tu estado.',
  };

  function setFieldError(field, message) {
    const group = field.closest('.form-group');
    if (!group) return;
    group.classList.toggle('has-error', Boolean(message));
    group.classList.toggle('is-valid', !message && field.value.trim() !== '');
    let errorEl = group.querySelector('.field-error');
    if (message) {
      if (!errorEl) {
        errorEl = document.createElement('small');
        errorEl.className = 'field-error';
        errorEl.id = `${field.id}-error`;
        group.appendChild(errorEl);
      }
      errorEl.textContent = message;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorEl.id);
    } else {
      if (errorEl) errorEl.remove();
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
  }

  function validateField(field) {
    if (field.disabled) return true;
    const valid = field.checkValidity();
    setFieldError(field, valid ? '' : fieldMessages[field.id] || 'Revisa este campo.');
    return valid;
  }

  const checkoutFields = Object.keys(fieldMessages)
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  checkoutFields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form-group')?.classList.contains('has-error')) validateField(field);
    });
    field.addEventListener('change', () => validateField(field));
  });

  function validateCheckout() {
    let firstInvalid = null;
    checkoutFields.forEach((field) => {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    return { isValid: !firstInvalid, firstInvalid };
  }

  // --- 1. CONFIGURACIÓN DE MERCADO PAGO ---
  const mp = new MercadoPago('TEST-288dadf3-dd25-472a-83ec-be6f5f9c4376', {
    locale: 'es-MX'
  });

  // --- 2. DETECCIÓN DE RESULTADO DE PAGO ---
  function verificarResultadoPago() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status') || urlParams.get('collection_status');
    const paymentId = urlParams.get('payment_id');

    if (!status) return;

    window.history.replaceState({}, document.title, window.location.pathname);

    if (status === 'approved') {
      mostrarNotificacionPago(
        '✅ ¡Pago Aprobado!',
        `Tu compra ha sido procesada con éxito. ID de pago: ${paymentId || 'N/A'}. Recibirás la confirmación pronto. ¡Gracias por comprar en Aromesence!`,
        'success'
      );
      cart = [];
      saveCart();
      updateCartUI();
    } else if (status === 'rejected') {
      mostrarNotificacionPago(
        '❌ Pago Fue Rechazado',
        'Tu pago fue rechazado por Mercado Pago. Por favor, intenta con otro método de pago o revisa los fondos de tu tarjeta.',
        'error'
      );
    } else if (status === 'pending' || status === 'in_process') {
      mostrarNotificacionPago(
        '⏳ Pago Pendiente',
        `Tu pago está en proceso de verificación. ID: ${paymentId || 'N/A'}. Te notificaremos por correo una vez aprobado.`,
        'pending'
      );
    }
  }

  function mostrarNotificacionPago(titulo, mensaje, tipo) {
    const existente = document.getElementById('pagoNotificacion');
    if (existente) existente.remove();

    const colores = {
      success: { bg: 'rgba(39, 174, 96, 0.15)', border: '#27ae60', text: '#2ecc71' },
      error: { bg: 'rgba(231, 76, 60, 0.15)', border: '#e74c3c', text: '#e74c3c' },
      pending: { bg: 'rgba(241, 196, 15, 0.15)', border: '#f1c40f', text: '#f1c40f' }
    };
    const color = colores[tipo] || colores.error;

    const notificacion = document.createElement('div');
    notificacion.id = 'pagoNotificacion';
    notificacion.setAttribute('role', 'alertdialog');
    notificacion.setAttribute('aria-modal', 'true');
    notificacion.setAttribute('aria-label', titulo);
    notificacion.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
    `;
    notificacion.innerHTML = `
      <div style="
        background: #1a1625; border: 1px solid ${color.border}; border-radius: 16px;
        padding: 2.5rem; max-width: 480px; width: 90%; text-align: center;
        box-shadow: 0 0 40px ${color.bg};
      ">
        <h2 style="color: ${color.text}; font-size: 1.5rem; margin-bottom: 1rem;">${titulo}</h2>
        <p style="color: #c8c4d4; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">${mensaje}</p>
        <button id="pagoNotificacionOk" style="
          background: ${color.border}; color: #fff; border: none; padding: 0.75rem 2rem;
          border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;
        ">Entendido</button>
      </div>
    `;
    document.body.appendChild(notificacion);
    const okBtn = document.getElementById('pagoNotificacionOk');
    okBtn.addEventListener('click', () => notificacion.remove());
    okBtn.focus();
  }

  verificarResultadoPago();

  // --- 3. GENERAR PREFERENCIA Y RENDERIZAR WALLET BRICK ---
  let brickYaRenderizado = false;
  const submitButton = document.querySelector('.checkout-submit');

  function restaurarBotonConfirmar() {
    submitButton.style.display = '';
    submitButton.disabled = false;
    submitButton.innerHTML = '<span>Confirmar Pedido</span><span class="submit-arrow" aria-hidden="true">→</span>';
  }

  async function pagarConMercadoPago() {
    if (brickYaRenderizado) return;

    try {
      const items = cart.map(item => ({
        title: `${item.brand} - ${item.name}`,
        unit_price: Number(item.price),
        quantity: 1,
        currency_id: 'MXN'
      }));

      // Ruta relativa: funciona en local y desplegado
      const response = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor backend:', response.status, errorData);
        showToast(`Error al conectar con la pasarela de pagos (${response.status}).`, 'error');
        restaurarBotonConfirmar();
        return;
      }

      const preference = await response.json();

      if (!preference.id) {
        showToast('No se pudo generar una orden de pago válida.', 'error');
        restaurarBotonConfirmar();
        return;
      }

      const container = document.getElementById('walletBrick_container');
      if (container) container.innerHTML = '';

      // Botón oficial integrado de Mercado Pago (Wallet Brick)
      await mp.bricks().create("wallet", "walletBrick_container", {
        initialization: {
          preferenceId: preference.id,
        },
        customization: {
          texts: {
            valueProp: 'smart_option',
          },
        },
      });

      brickYaRenderizado = true;
      submitButton.style.display = 'none';
      const brickWrap = document.getElementById('walletBrickWrap');
      brickWrap.hidden = false;
      brickWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      showToast('Pasarela lista: completa tu pago con Mercado Pago.', 'success');

    } catch (error) {
      console.error("Error de red al conectar con /api/crear-preferencia:", error);
      showToast('Error de conexión. Revisa tu internet e intenta de nuevo.', 'error');
      restaurarBotonConfirmar();
    }
  }

  // --- 4. EVENTO DE CONFIRMACIÓN DE PAGO ---
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const validation = validateCheckout();
    if (!validation.isValid) {
      showToast('Revisa los campos marcados en rojo.', 'error');
      validation.firstInvalid.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Preparando pasarela…</span>';

    await pagarConMercadoPago();
  });

  // --- Autocompletado de Código Postal (Zippopotam) ---
  const cpInput = document.getElementById('checkoutCP');
  const coloniaSelect = document.getElementById('checkoutColonia');
  const stateSelect = document.getElementById('checkoutState');

  cpInput.addEventListener('input', async (e) => {
    const cp = e.target.value;

    if (cp.length === 5 && !isNaN(cp)) {
      coloniaSelect.innerHTML = '<option value="">Cargando colonias...</option>';
      stateSelect.innerHTML = '<option value="">Cargando estado...</option>';
      coloniaSelect.disabled = true;
      stateSelect.disabled = true;

      try {
        const response = await fetch(`https://api.zippopotam.us/mx/${cp}`);
        if (!response.ok) throw new Error("CP no encontrado");

        const data = await response.json();
        const estado = data.places[0].state;

        stateSelect.innerHTML = `<option value="${esc(estado)}">${esc(estado)}</option>`;
        stateSelect.disabled = false;

        coloniaSelect.innerHTML = '<option value="">Selecciona tu Colonia</option>';
        data.places.forEach(place => {
          const option = document.createElement('option');
          option.value = place['place name'];
          option.textContent = place['place name'];
          coloniaSelect.appendChild(option);
        });
        coloniaSelect.disabled = false;
        validateField(cpInput);

      } catch (error) {
        coloniaSelect.innerHTML = '<option value="">CP Inválido</option>';
        stateSelect.innerHTML = '<option value="">CP Inválido</option>';
        setFieldError(cpInput, 'No encontramos ese código postal.');
      }
    } else {
      coloniaSelect.innerHTML = '<option value="">Ingresa tu CP primero</option>';
      stateSelect.innerHTML = '<option value="">Ingresa tu CP primero</option>';
      coloniaSelect.disabled = true;
      stateSelect.disabled = true;
    }
  });
});
