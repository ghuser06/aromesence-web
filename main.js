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
    modal.style.display = 'flex'; // Forzamos el display
    setTimeout(() => modal.classList.add('active'), 10); // Permitimos que aplique la animación
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

    // Verificar campos de texto
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field.value || field.value.trim() === '') {
        isValid = false;
        field.style.border = '1px solid #e74c3c'; // Resaltar error en rojo
      } else {
        field.style.border = ''; // Limpiar error
      }
    }

    return { isValid };
  }

  // --- 1. CONFIGURACIÓN DE MERCADO PAGO ---
  // ⚠️ IMPORTANTE: Reemplaza con tu Public Key real de Mercado Pago
  const mp = new MercadoPago("TEST-00000000-0000-0000-0000-000000000000", {
    locale: 'es-MX'
  });

  // Estilos base para los inputs seguros dentro de los iframes de MP
  const mpStyles = {
    color: '#f0ece2',
    fontSize: '14px',
    placeholderColor: '#6b677a'
  };

  // Crear y montar los Secure Fields de Mercado Pago
  const cardNumberElement = mp.fields.create('cardNumber', {
    placeholder: "Número de tarjeta",
    style: mpStyles
  }).mount('form-checkout__cardNumber');

  const expirationDateElement = mp.fields.create('expirationDate', {
    placeholder: "MM/AA",
    style: mpStyles
  }).mount('form-checkout__expirationDate');

  const securityCodeElement = mp.fields.create('securityCode', {
    placeholder: "CVV",
    style: mpStyles
  }).mount('form-checkout__securityCode');

  // Flujo ordenado de cierre de orden
  function finalizeOrder() {
    alert("¡Gracias por tu compra en Aromesence! Tu pedido ha sido procesado con éxito.");
    
    // Limpiar carrito
    cart = [];
    updateCartUI();
    
    // Resetear completamente el formulario
    document.getElementById('checkoutForm').reset();
    
    // Vaciar Secure Fields (limpiar iframes de MP)
    cardNumberElement.unmount();
    cardNumberElement.mount('form-checkout__cardNumber');
    expirationDateElement.unmount();
    expirationDateElement.mount('form-checkout__expirationDate');
    securityCodeElement.unmount();
    securityCodeElement.mount('form-checkout__securityCode');
    
    // Cerrar modal y limpiar bloqueos
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 350);
    document.getElementById('cartOverlay').classList.remove('active');
  }

  // --- 2. EVENTO DE CONFIRMACIÓN DE PAGO ---
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar envío automático y recarga

    // 1. Seguridad: Validación nativa de HTML5 (Dirección, Nombres, etc.)
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
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Procesando pago seguro...";
    
    try {
      // Obtener el titular ingresado
      const cardholderName = document.getElementById('form-checkout__cardholderName').value;

      /* 
       * SIMULACIÓN: Generación de Card Token.
       * En un entorno real con una Public Key válida, usarías:
       * 
       * const token = await mp.fields.createCardToken({
       *   cardholderName,
       *   identificationType: "RFC", // (Opcional según MP)
       * });
       * console.log("Token generado:", token.id);
       */
       
      // Simular tiempo de validación bancaria de Mercado Pago
      setTimeout(() => {
        finalizeOrder();
        submitBtn.innerText = originalText;
      }, 2000);

    } catch (error) {
      console.error("Error al generar el token:", error);
      alert("Hubo un problema al validar la tarjeta. Revisa los datos e intenta de nuevo.");
      submitBtn.innerText = originalText;
    }
  });

  // Autocompletado de Código Postal (UX)
  const cpInput = document.getElementById('checkoutCP');
  const coloniaSelect = document.getElementById('checkoutColonia');
  const stateSelect = document.getElementById('checkoutState');

  cpInput.addEventListener('input', async (e) => {
    const cp = e.target.value;
    
    // Solo consultar la API cuando haya exactamente 5 dígitos
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
        
        // Llenar y habilitar Select de Estado
        stateSelect.innerHTML = `<option value="${estado}">${estado}</option>`;
        stateSelect.disabled = false;
        
        // Llenar y habilitar Select de Colonias
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
      // Si se borran dígitos, regresar al estado bloqueado
      coloniaSelect.innerHTML = '<option value="">Ingresa tu CP primero</option>';
      stateSelect.innerHTML = '<option value="">Ingresa tu CP primero</option>';
      coloniaSelect.disabled = true;
      stateSelect.disabled = true;
    }
  });
});
