let cart = [];

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = products.map((p, i) => `
    <article class="product-card" onclick="addToCart(${i})">
      ${p.badge ? `<span class="product-badge badge-${p.badge}">${p.badge === 'sale' ? 'Oferta' : p.badge === 'new' ? 'Nuevo' : 'Popular'}</span>` : ''}
      <div class="product-img-wrap">
        <img src="imagenes/${p.img}" alt="${p.brand} ${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/200'">
      </div>
      <div class="product-info">
        <span class="product-brand">${p.brand}</span>
        <h3 class="product-name">${p.name}</h3>
        <span class="product-type">${p.type}</span>
        <div class="product-bottom">
          <span class="product-price">$${p.price.toLocaleString()} MXN</span>
          <button class="product-btn" aria-label="Añadir al carrito">🛒</button>
        </div>
      </div>
    </article>
  `).join('');
}

window.addToCart = (index) => {
  const product = products[index];
  cart.push(product);
  updateCartUI();
  document.getElementById('cartSidebar').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
};

function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const sidebarItems = document.getElementById('cartSidebarItems');
  const sidebarTotal = document.getElementById('cartSidebarTotal');

  cartCount.innerText = cart.length;

  if (cart.length === 0) {
    sidebarItems.innerHTML = '<div class="cart-empty"><span class="cart-empty-icon">🛒</span><p>Tu carrito está vacío</p></div>';
    sidebarTotal.innerText = '$0 MXN';
    return;
  }

  sidebarItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="imagenes/${item.img}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://via.placeholder.com/60'">
      <div class="cart-item-info">
        <h4 class="cart-item-name">${item.name}</h4>
        <span class="cart-item-brand">${item.brand}</span>
        <div class="cart-item-price">$${item.price.toLocaleString()} MXN</div>
      </div>
      <button onclick="removeFromCart(${index})" class="cart-item-remove">&times;</button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  sidebarTotal.innerText = `$${total.toLocaleString()} MXN`;
}

window.removeFromCart = (index) => {
  cart.splice(index, 1);
  updateCartUI();
};

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();

  // Abrir carrito
  document.getElementById('navCartBtn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
  });

  // Cerrar carrito
  document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
  });

  // Cerrar carrito al hacer clic en el overlay
  document.getElementById('cartOverlay').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('checkoutModal').classList.remove('active');
  });

  // Proceder al pago (Checkout)
  document.getElementById('proceedCheckout').addEventListener('click', () => {
    if (cart.length === 0) return alert("Tu carrito está vacío");

    // Cerrar sidebar y su overlay
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');

    // Llenar resumen
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');

    cartItemsDiv.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>${item.brand} - ${item.name}</span>
            <span>$${item.price.toLocaleString()} MXN</span>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotalSpan.innerText = `$${total.toLocaleString()} MXN`;

    // Mostrar modal
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
  });

  // Cerrar modal con el botón X
  document.getElementById('closeModal').addEventListener('click', () => {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 350);
  });

  // Cerrar modal al hacer clic en el fondo gris
  document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if (e.target.id === 'checkoutModal') {
      const modal = document.getElementById('checkoutModal');
      modal.classList.remove('active');
      setTimeout(() => modal.style.display = 'none', 350);
    }
  });

  // Función de validación de campos obligatorios
  function validateCheckout() {
    const requiredFields = [
      'checkoutName', 'checkoutPhone', 'checkoutAddress',
      'checkoutColonia', 'checkoutCP', 'checkoutCity', 'checkoutState'
    ];
    let isValid = true;

    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field.value || field.value.trim() === '') {
        isValid = false;
        field.style.border = '1px solid #e74c3c';
      } else {
        field.style.border = '';
      }
    }

    return { isValid };
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
        <button onclick="document.getElementById('pagoNotificacion').remove()" style="
          background: ${color.border}; color: #fff; border: none; padding: 0.75rem 2rem;
          border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;
        ">Entendido</button>
      </div>
    `;
    document.body.appendChild(notificacion);
  }

  verificarResultadoPago();

  // --- 3. GENERAR PREFERENCIA Y RENDERIZAR WALLET BRICK ---
  let brickYaRenderizado = false;

  async function pagarConMercadoPago() {
    if (brickYaRenderizado) return;

    try {
      const items = cart.map(item => ({
        title: `${item.brand} - ${item.name}`, // Mejor descripción uniendo marca y nombre
        unit_price: Number(item.price),
        quantity: 1,
        currency_id: 'MXN'
      }));

      // CAMBIO IMPORTANTE: Se usa ruta relativa para que funcione tanto en local como desplegado
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
        alert(`Error al conectar con la pasarela de pagos (${response.status}).`);
        // Volver a mostrar el botón si falla
        document.querySelector('.checkout-submit').style.display = 'block';
        return;
      }

      const preference = await response.json();

      if (!preference.id) {
        alert('No se pudo generar una orden de pago válida.');
        document.querySelector('.checkout-submit').style.display = 'block';
        return;
      }

      // Limpiar contenedor antes de pintar por si acaso
      const container = document.getElementById('walletBrick_container');
      if (container) container.innerHTML = '';

      // Renderizar el botón oficial integrado de Mercado Pago (Wallet Brick)
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

    } catch (error) {
      console.error("Error de red al conectar con /api/crear-preferencia:", error);
      alert("Error de conexión. Asegúrate de tener conexión a internet.");
      document.querySelector('.checkout-submit').style.display = 'block';
    }
  }

  // --- 4. EVENTO DE CONFIRMACIÓN DE PAGO ---
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }

    const validation = validateCheckout();
    if (!validation.isValid) {
      alert("Por favor, revisa que no falten datos obligatorios de dirección.");
      return;
    }

    const submitBtn = document.querySelector('.checkout-submit span');
    if (submitBtn) submitBtn.innerText = "Preparando pasarela...";

    // Llamamos a la creación del brick seguro
    await pagarConMercadoPago();

    // Ocultar botón antiguo para dar paso al botón oficial azul de Mercado Pago
    document.querySelector('.checkout-submit').style.display = 'none';
  });

  // Autocompletado de Código Postal (Zippopotam)
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

        stateSelect.innerHTML = `<option value="${estado}">${estado}</option>`;
        stateSelect.disabled = false;

        coloniaSelect.innerHTML = '<option value="">Selecciona tu Colonia</option>';
        data.places.forEach(place => {
          const option = document.createElement('option');
          option.value = place['place name'];
          option.textContent = place['place name'];
          coloniaSelect.appendChild(option);
        });
        coloniaSelect.disabled = false;

      } catch (error) {
        coloniaSelect.innerHTML = '<option value="">CP Inválido</option>';
        stateSelect.innerHTML = '<option value="">CP Inválido</option>';
      }
    } else {
      coloniaSelect.innerHTML = '<option value="">Ingresa tu CP primero</option>';
      stateSelect.innerHTML = '<option value="">Ingresa tu CP primero</option>';
      coloniaSelect.disabled = true;
      stateSelect.disabled = true;
    }
  });
});