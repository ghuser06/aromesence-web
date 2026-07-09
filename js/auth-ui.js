// UI de autenticación: modal de login/registro y estado en la barra de navegación.
import { initAuth, onAuthChange, registrar, iniciarSesion, cerrarSesion, currentUser } from './auth.js';
import { showToast } from '../main.js';

let modoRegistro = false;
let lastFocus = null;

function crearModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'authModal';
  overlay.innerHTML = `
    <div class="modal-content auth-modal-content" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="modal-close" id="closeAuthModal" aria-label="Cerrar">&times;</button>
      <h2 class="modal-title" id="authTitle">Iniciar Sesión</h2>
      <form id="authForm" class="checkout-form auth-form" novalidate>
        <div class="auth-view" id="authView">
          <p class="auth-error" id="authError" role="alert" style="display:none"></p>
          <div class="form-group" id="authNameGroup" style="display:none">
            <label for="authName">Nombre completo</label>
            <input type="text" id="authName" placeholder="Tu nombre" autocomplete="name">
          </div>
          <div class="form-group">
            <label for="authEmail">Email</label>
            <input type="email" id="authEmail" placeholder="correo@ejemplo.com" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="authPassword">Contraseña</label>
            <input type="password" id="authPassword" placeholder="Mínimo 6 caracteres" required minlength="6"
              autocomplete="current-password">
          </div>
          <button type="submit" class="checkout-submit" id="authSubmit">
            <span id="authSubmitText">Entrar</span>
          </button>
          <p class="auth-toggle">
            <a href="#" id="authToggleMode">¿No tienes cuenta? Regístrate</a>
          </p>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function abrirModal() {
  lastFocus = document.activeElement;
  const modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  document.getElementById('authEmail').focus();
}

function cerrarModal() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('active');
  setTimeout(() => (modal.style.display = 'none'), 350);
  if (lastFocus) lastFocus.focus();
}

function mostrarError(mensaje) {
  const errorEl = document.getElementById('authError');
  errorEl.textContent = mensaje;
  errorEl.style.display = mensaje ? 'block' : 'none';
}

function setFieldState(input, message) {
  const group = input.closest('.form-group');
  group.classList.toggle('has-error', Boolean(message));
  group.classList.toggle('is-valid', !message && input.value.trim() !== '');
  let errorEl = group.querySelector('.field-error');
  if (message) {
    if (!errorEl) {
      errorEl = document.createElement('small');
      errorEl.className = 'field-error';
      errorEl.id = `${input.id}-error`;
      group.appendChild(errorEl);
    }
    errorEl.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorEl.id);
  } else {
    if (errorEl) errorEl.remove();
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
}

function validarCampo(input) {
  if (input.id === 'authEmail') {
    const ok = input.checkValidity();
    setFieldState(input, ok ? '' : 'Ingresa un correo válido.');
    return ok;
  }
  if (input.id === 'authPassword') {
    const ok = input.value.length >= 6;
    setFieldState(input, ok ? '' : 'La contraseña debe tener al menos 6 caracteres.');
    return ok;
  }
  return true;
}

function actualizarModo() {
  // Reinicia la animación de entrada al alternar login/registro
  const view = document.getElementById('authView');
  view.classList.remove('auth-view');
  void view.offsetWidth;
  view.classList.add('auth-view');

  mostrarError('');
  document.getElementById('authTitle').innerText = modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión';
  document.getElementById('authSubmitText').innerText = modoRegistro ? 'Registrarme' : 'Entrar';
  document.getElementById('authNameGroup').style.display = modoRegistro ? 'block' : 'none';
  document.getElementById('authPassword').setAttribute('autocomplete', modoRegistro ? 'new-password' : 'current-password');
  document.getElementById('authToggleMode').innerText = modoRegistro
    ? '¿Ya tienes cuenta? Inicia sesión'
    : '¿No tienes cuenta? Regístrate';
}

function crearNavItem() {
  const navLinks = document.querySelector('.nav-links');
  const li = document.createElement('li');
  li.innerHTML = `<a href="#" id="navAuthBtn">Iniciar Sesión</a>`;
  navLinks.appendChild(li);
  return li.querySelector('#navAuthBtn');
}

document.addEventListener('DOMContentLoaded', async () => {
  crearModal();
  const navBtn = crearNavItem();

  onAuthChange((user) => {
    navBtn.innerText = user ? 'Cerrar Sesión' : 'Iniciar Sesión';
  });

  navBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (currentUser) {
      await cerrarSesion();
      showToast('Sesión cerrada. ¡Vuelve pronto!', 'info');
    } else {
      abrirModal();
    }
  });

  document.getElementById('closeAuthModal').addEventListener('click', cerrarModal);
  document.getElementById('authModal').addEventListener('click', (e) => {
    if (e.target.id === 'authModal') cerrarModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('authModal').classList.contains('active')) {
      cerrarModal();
    }
  });

  document.getElementById('authToggleMode').addEventListener('click', (e) => {
    e.preventDefault();
    modoRegistro = !modoRegistro;
    actualizarModo();
  });

  // Validación en vivo
  ['authEmail', 'authPassword'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('blur', () => validarCampo(input));
    input.addEventListener('input', () => {
      if (input.closest('.form-group').classList.contains('has-error')) validarCampo(input);
    });
  });

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarError('');

    const emailInput = document.getElementById('authEmail');
    const passInput = document.getElementById('authPassword');
    const emailOk = validarCampo(emailInput);
    const passOk = validarCampo(passInput);
    if (!emailOk || !passOk) {
      (!emailOk ? emailInput : passInput).focus();
      return;
    }

    const submitBtn = document.getElementById('authSubmit');
    const originalText = document.getElementById('authSubmitText').innerText;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span id="authSubmitText">${modoRegistro ? 'Creando cuenta…' : 'Entrando…'}</span>`;

    try {
      if (modoRegistro) {
        const nombre = document.getElementById('authName').value.trim();
        await registrar(emailInput.value.trim(), passInput.value, nombre);
        cerrarModal();
        showToast('Cuenta creada. Revisa tu correo para confirmarla.', 'success');
      } else {
        await iniciarSesion(emailInput.value.trim(), passInput.value);
        cerrarModal();
        showToast('¡Bienvenido de vuelta!', 'success');
      }
    } catch (err) {
      mostrarError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span id="authSubmitText">${originalText}</span>`;
    }
  });

  await initAuth();
});
