document.getElementById('anio').textContent = new Date().getFullYear();

const grid = document.getElementById('productos-grid');
const filtroContainer = document.getElementById('categorias-filtro');

let todosLosProductos = [];
let telefonoWhatsApp = '573000000000';

// Imagen elegante de respaldo mientras se suben las fotos reales a img/productos/
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="100%" height="100%" fill="#F5F0E6"/>
      <circle cx="250" cy="220" r="70" fill="none" stroke="#C5A059" stroke-width="3"/>
      <polygon points="220,195 280,195 295,215 250,260 205,215" fill="none" stroke="#C5A059" stroke-width="3"/>
      <text x="50%" y="335" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#9B7832">BY.DANIJOYERIA</text>
      <text x="50%" y="362" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" letter-spacing="3" fill="#66625B">ORO LAMINADO 18K</text>
    </svg>
  `);

async function cargarCatalogo() {
  try {
    const res = await fetch('data/productos.json');
    const data = await res.json();

    if (data.configuracion && data.configuracion.whatsapp) {
      telefonoWhatsApp = data.configuracion.whatsapp;
      actualizarEnlacesWhatsApp(telefonoWhatsApp);
    }

    todosLosProductos = data.productos || [];
    renderizarBotonesCategorias(todosLosProductos);
    renderizarProductos(todosLosProductos);
  } catch (err) {
    grid.innerHTML = '<p>Próximamente nuevas joyas disponibles.</p>';
  }
}

function actualizarEnlacesWhatsApp(numero) {
  const waFloat = document.getElementById('wa-float');
  const footerWa = document.getElementById('footer-wa');
  const msg = encodeURIComponent('Hola By.danijoyeria, me gustaría recibir asesoría sobre sus joyas en Oro Laminado 18k ✨');
  if (waFloat) waFloat.href = `https://wa.me/${numero}?text=${msg}`;
  if (footerWa) footerWa.href = `https://wa.me/${numero}?text=${msg}`;
}

function renderizarBotonesCategorias(productos) {
  const categorias = ['Todas', ...new Set(productos.map(p => p.categoria))];
  filtroContainer.innerHTML = '';

  categorias.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = `pill-btn ${idx === 0 ? 'active' : ''}`;
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (cat === 'Todas') {
        renderizarProductos(todosLosProductos);
      } else {
        renderizarProductos(todosLosProductos.filter(p => p.categoria === cat));
      }
    });
    filtroContainer.appendChild(btn);
  });
}

function renderizarProductos(lista) {
  grid.innerHTML = '';

  lista.forEach(prod => {
    const mensajeWA = encodeURIComponent(
      `Hola By.danijoyeria ✨ Me interesa la joya: *${prod.nombre}* (${prod.categoria}). ¿Está disponible?`
    );
    const linkWA = `https://wa.me/${telefonoWhatsApp}?text=${mensajeWA}`;

    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-img-wrapper">
        <span class="product-badge">${prod.estado || 'Disponible'}</span>
        <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">
      </div>
      <div class="product-info">
        <span class="product-category">${prod.categoria}</span>
        <h3 class="product-title">${prod.nombre}</h3>
        <p class="product-desc">${prod.descripcion}</p>
        <div class="product-price">${prod.precio}</div>
        <a href="${linkWA}" target="_blank" rel="noopener" class="btn-buy-wa">
          Pedir por WhatsApp
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

cargarCatalogo();
