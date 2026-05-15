// Navbar mobile toggle (responsive)
const navToggle = () => {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
};

// Auto-dismiss alerts after 3 seconds
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.style.display = 'none';
    });
}, 3000);

// Confirm delete action
function confirmDelete() {
    return confirm('Are you sure you want to delete this listing?');
}

// Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Favourite hearts toggle
  document.querySelectorAll('.listing-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
      btn.style.color = btn.textContent === '♥' ? 'var(--coral)' : '';
    });
  });

  // Nav active on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.style.color = a.getAttribute('href') === '#'+cur ? 'var(--text)' : '';
    });
  });

  // Smooth nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });
  });
  // ----- MODAL CONTROLS -----
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.querySelector('.nav-auth .nav-cta:first-child');
const signupBtn = document.querySelector('.nav-auth .nav-cta:last-child');

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

function closeAllModals() {
  closeModal(loginModal);
  closeModal(registerModal);
}

// Open login modal
if (loginBtn) {
  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeAllModals();
    openModal(loginModal);
  });
}

// Open register modal
if (signupBtn) {
  signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeAllModals();
    openModal(registerModal);
  });
}

// Close buttons (×)
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    closeAllModals();
  });
});

// Click outside overlay to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAllModals();
  });
});

// Switch between modals
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

if (switchToRegister) {
  switchToRegister.addEventListener('click', () => {
    closeModal(loginModal);
    openModal(registerModal);
  });
}
if (switchToLogin) {
  switchToLogin.addEventListener('click', () => {
    closeModal(registerModal);
    openModal(loginModal);
  });
}

// ----- FORM HANDLERS (demo / replace with your backend) -----
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;
  // TODO: send to your backend
  console.log('Login attempt', { email, password });

});

document.getElementById('registerForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = e.target.querySelector('input[type="text"]').value;
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;
  // TODO: send to your backend
  console.log('Register attempt', { name, email, password });
});
function togglePassword(inputId, iconElement) {
  const input = document.getElementById(inputId);
  
  if (input.type === "password") {
    input.type = "text";
    iconElement.classList.remove("fa-eye");
    iconElement.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    iconElement.classList.remove("fa-eye-slash");
    iconElement.classList.add("fa-eye");
  }
}