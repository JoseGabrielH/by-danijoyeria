// Asegurar que al abrir, recargar o volver a entrar a la página siempre inicie en la parte superior
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
window.scrollTo(0, 0);
window.addEventListener('pageshow', () => {
  window.scrollTo(0, 0);
});

document.getElementById('anio').textContent = new Date().getFullYear();

const categoriasGrid = document.getElementById('categorias-grid');
const categoriaAbiertaView = document.getElementById('categoria-abierta');
const productosGrid = document.getElementById('productos-grid');
const categoriasTabs = document.getElementById('categorias-tabs');
const btnVolverCategorias = document.getElementById('btn-volver-categorias');
const nombreCategoriaActiva = document.getElementById('nombre-categoria-activa');
const contadorCategoriaActiva = document.getElementById('contador-categoria-activa');
const catalogoTitulo = document.getElementById('catalogo-titulo');
const catalogoSubtexto = document.getElementById('catalogo-subtexto');

let categoriasData = [];
let todosLosProductos = [];
let carruselData = [];
let configNegocio = {
  whatsapp: '',
  instagram: '__by.danijoyeria',
  instagramUrl: 'https://www.instagram.com/__by.danijoyeria?cplk=ZDNlZDc0MzIxNw=='
};
let carrito = JSON.parse(localStorage.getItem('by_danijoyeria_carrito') || '[]');
let indiceCarrusel = 0;
let intervaloCarrusel = null;
let idAnimacionScroll = null;
let timerToast = null;

// Función de desplazamiento suave (scroll con curva easeInOutCubic) para todos los botones
function desplazarSuaveHacia(elementoDestino, duracion = 900) {
  if (!elementoDestino) return;

  if (idAnimacionScroll) {
    cancelAnimationFrame(idAnimacionScroll);
  }

  const header = document.querySelector('.header');
  const altoHeader = header ? header.offsetHeight : 0;
  const posicionInicial = window.pageYOffset || document.documentElement.scrollTop;
  const rectDestino = elementoDestino.getBoundingClientRect().top;
  const posicionFinal = Math.max(0, posicionInicial + rectDestino - altoHeader);
  const distancia = posicionFinal - posicionInicial;

  if (Math.abs(distancia) < 2) return;

  let tiempoInicio = null;

  function curvaSuave(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function pasoScroll(tiempoActual) {
    if (tiempoInicio === null) tiempoInicio = tiempoActual;
    const tiempoTranscurrido = tiempoActual - tiempoInicio;
    const progreso = Math.min(tiempoTranscurrido / duracion, 1);
    const avance = curvaSuave(progreso);

    window.scrollTo(0, posicionInicial + distancia * avance);

    if (tiempoTranscurrido < duracion) {
      idAnimacionScroll = requestAnimationFrame(pasoScroll);
    } else {
      idAnimacionScroll = null;
    }
  }

  idAnimacionScroll = requestAnimationFrame(pasoScroll);
}

// Conectar todos los botones de navegación (Inicio, Categorías/Catálogo, Destacados, Nosotros, Garantía 18K, Contacto y Explorar Categorías)
function configurarScrollSuaveBotones() {
  const enlacesSecciones = document.querySelectorAll('a[href^="#"]');

  enlacesSecciones.forEach(enlace => {
    enlace.addEventListener('click', e => {
      const hash = enlace.getAttribute('href');
      if (!hash || hash === '#') return;

      const seccionDestino = document.querySelector(hash);
      if (!seccionDestino) return;

      e.preventDefault();

      // Actualizar estado visual activo en los botones del menú superior
      if (enlace.closest('.nav-links') || enlace.classList.contains('nav-extra-link')) {
        document.querySelectorAll('.nav-links a, .nav-extra-link').forEach(a => a.classList.remove('active-nav'));
        enlace.classList.add('active-nav');
      }

      desplazarSuaveHacia(seccionDestino, 900);
    });
  });
}

async function cargarCatalogo() {
  try {
    configurarScrollSuaveBotones();

    const res = await fetch('data/productos.json');
    const data = await res.json();

    categoriasData = data.categorias || [];
    todosLosProductos = data.productos || [];
    carruselData = data.carrusel || [];
    if (data.configuracion) {
      configNegocio = { ...configNegocio, ...data.configuracion };
    }

    renderizarTarjetasCategorias();
    renderizarPestanasCategorias();
    iniciarCarrusel();
    configurarEnlacesFooter();
    configurarModalYCarrito();
    actualizarVistaCarrito();
  } catch (err) {
    categoriasGrid.innerHTML = '<p>Error al cargar el catálogo de joyas.</p>';
  }
}

// 1. Renderiza las 5 tarjetas de categorías (Imagen de portada + Nombre debajo)
function renderizarTarjetasCategorias() {
  categoriasGrid.innerHTML = '';

  categoriasData.forEach(cat => {
    const cantidad = todosLosProductos.filter(p => p.categoria === cat.id).length;
    const textoCantidad = cantidad === 1 ? '1 joya disponible' : `${cantidad} joyas disponibles`;

    const card = document.createElement('article');
    card.className = 'category-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Ver categoría ${cat.nombre}`);

    card.innerHTML = `
      <div class="category-img-wrapper">
        <img src="${encodeURI(cat.imagen)}" alt="Categoría ${cat.nombre}" loading="lazy">
      </div>
      <div class="category-card-footer">
        <h3 class="category-card-title">${cat.nombre}</h3>
        <span class="category-card-count">${textoCantidad}</span>
      </div>
    `;

    card.addEventListener('click', () => abrirCategoria(cat.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirCategoria(cat.id);
      }
    });

    categoriasGrid.appendChild(card);
  });
}

// 2. Abre una categoría y muestra los productos que pertenecen a ella
function abrirCategoria(categoriaId) {
  const productosFiltrados = todosLosProductos.filter(p => p.categoria === categoriaId);
  const cantidad = productosFiltrados.length;

  // Ocultar cuadrícula de categorías y mostrar vista de productos de la categoría
  categoriasGrid.classList.add('hidden');
  categoriaAbiertaView.classList.remove('hidden');

  catalogoTitulo.textContent = `Colección de ${categoriaId}`;
  catalogoSubtexto.textContent = 'Oro Laminado 18K • Diseños exclusivos con garantía de brillo';

  nombreCategoriaActiva.textContent = categoriaId;
  contadorCategoriaActiva.textContent = cantidad === 1 ? '1 Producto' : `${cantidad} Productos`;

  // Marcar pestaña activa
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === categoriaId);
  });

  renderizarProductos(productosFiltrados);

  // Desplazar suavemente al inicio de la sección del catálogo
  desplazarSuaveHacia(document.getElementById('catalogo'), 850);
}

// 3. Volver a la vista de las 5 categorías principales
function volverACategorias() {
  categoriaAbiertaView.classList.add('hidden');
  categoriasGrid.classList.remove('hidden');

  catalogoTitulo.textContent = 'Categorías de Joyas';
  catalogoSubtexto.textContent = 'Selecciona una categoría para ver todas sus joyas disponibles';

  desplazarSuaveHacia(document.getElementById('catalogo'), 850);
}

btnVolverCategorias.addEventListener('click', volverACategorias);

// 4. Pestañas rápidas dentro de la vista abierta para cambiar entre las 5 categorías
function renderizarPestanasCategorias() {
  categoriasTabs.innerHTML = '';

  categoriasData.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill-btn';
    btn.dataset.cat = cat.id;
    btn.textContent = cat.nombre;
    btn.addEventListener('click', () => abrirCategoria(cat.id));
    categoriasTabs.appendChild(btn);
  });
}

// 5. Renderiza las tarjetas de productos con formato simétrico, botones de Carrito/Compra y apertura de Ficha en Grande
function obtenerEnlaceCompraDirecta(prod) {
  const mensaje = `Hola By.danijoyeria. Me interesa comprar la joya: *${prod.nombre}* (${prod.categoria} - Oro Laminado 18K). ¿Está disponible?`;
  const numeroLimpio = (configNegocio.whatsapp || '').replace(/\D/g, '');
  if (numeroLimpio && numeroLimpio !== '573000000000') {
    return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
  }
  // Si aún no hay WhatsApp, lleva directo al chat de mensajes (DM) de Instagram de @__by.danijoyeria
  return `https://ig.me/m/${configNegocio.instagram || '__by.danijoyeria'}`;
}

function renderizarProductos(lista) {
  productosGrid.innerHTML = '';

  lista.forEach(prod => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const linkCompra = obtenerEnlaceCompraDirecta(prod);

    card.innerHTML = `
      <div class="product-img-wrapper product-clickable" title="Ver ficha completa de ${prod.nombre}">
        <span class="product-badge">Oro Laminado 18K</span>
        <img src="${encodeURI(prod.imagen)}" alt="${prod.nombre}" loading="lazy">
        <span class="product-zoom-hint">Ver ficha en grande</span>
      </div>
      <div class="product-info">
        <div class="product-clickable">
          <span class="product-category">${prod.categoria} • By.danijoyeria</span>
          <h4 class="product-title">${prod.nombre}</h4>
          <p class="product-desc">${prod.descripcion}</p>
        </div>
        <ul class="product-specs">
          <li>
            <span class="spec-dot">✦</span>
            <span><strong class="spec-label">Material:</strong> ${prod.material}</span>
          </li>
          <li>
            <span class="spec-dot">✦</span>
            <span><strong class="spec-label">Detalle:</strong> ${prod.detalle}</span>
          </li>
          <li>
            <span class="spec-dot">✦</span>
            <span><strong class="spec-label">Estado:</strong> ${prod.disponibilidad}</span>
          </li>
        </ul>
        <div class="product-actions">
          <button type="button" class="btn-add-cart" data-id="${prod.id}">
            Añadir al carrito
          </button>
          <a href="${linkCompra}" target="_blank" rel="noopener" class="btn-buy-direct">
            Comprar
          </a>
        </div>
      </div>
    `;

    // Al hacer clic en la imagen o descripción, se abre la Ficha en Grande de la joya
    card.querySelectorAll('.product-clickable').forEach(el => {
      el.addEventListener('click', () => abrirModalJoya(prod));
    });

    // Botón de Añadir al Carrito
    const btnCarrito = card.querySelector('.btn-add-cart');
    btnCarrito.addEventListener('click', e => {
      e.stopPropagation();
      agregarAlCarrito(prod);
    });

    productosGrid.appendChild(card);
  });
}

// 7. Modal de Ficha en Grande de la Joya y Sistema de Carrito de Compras
function abrirModalJoya(prod) {
  const modal = document.getElementById('modal-joya');
  const img = document.getElementById('modal-joya-img');
  const cat = document.getElementById('modal-joya-categoria');
  const titulo = document.getElementById('modal-joya-titulo');
  const desc = document.getElementById('modal-joya-desc');
  const specs = document.getElementById('modal-joya-specs');
  const btnCarrito = document.getElementById('modal-btn-carrito');
  const btnComprar = document.getElementById('modal-btn-comprar');

  img.src = encodeURI(prod.imagen);
  img.alt = prod.nombre;
  cat.textContent = `${prod.categoria} • By.danijoyeria`;
  titulo.textContent = prod.nombre;
  desc.textContent = prod.descripcion;

  specs.innerHTML = `
    <li>
      <span class="spec-dot">✦</span>
      <span><strong class="spec-label">Material:</strong> ${prod.material}</span>
    </li>
    <li>
      <span class="spec-dot">✦</span>
      <span><strong class="spec-label">Detalle:</strong> ${prod.detalle}</span>
    </li>
    <li>
      <span class="spec-dot">✦</span>
      <span><strong class="spec-label">Estado:</strong> ${prod.disponibilidad}</span>
    </li>
  `;

  btnComprar.href = obtenerEnlaceCompraDirecta(prod);
  btnCarrito.onclick = () => agregarAlCarrito(prod);

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function cerrarModalJoya() {
  const modal = document.getElementById('modal-joya');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function agregarAlCarrito(prod) {
  const existente = carrito.find(item => item.id === prod.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      categoria: prod.categoria,
      imagen: prod.imagen,
      cantidad: 1
    });
  }

  guardarCarrito();
  actualizarVistaCarrito();
  mostrarNotificacionCarrito(`"${prod.nombre}" añadida al carrito`);
}

function cambiarCantidadCarrito(id, delta) {
  const item = carrito.find(i => i.id === id);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(i => i.id !== id);
  }
  guardarCarrito();
  actualizarVistaCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(i => i.id !== id);
  guardarCarrito();
  actualizarVistaCarrito();
}

function guardarCarrito() {
  localStorage.setItem('by_danijoyeria_carrito', JSON.stringify(carrito));
}

function actualizarVistaCarrito() {
  const contador = document.getElementById('carrito-contador');
  const listaContenedor = document.getElementById('carrito-items');
  if (!contador || !listaContenedor) return;

  const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  contador.textContent = totalUnidades;

  if (!carrito.length) {
    listaContenedor.innerHTML = '<p class="cart-empty-msg">Tu carrito está vacío. Explora nuestras categorías y añade tus joyas favoritas.</p>';
    return;
  }

  listaContenedor.innerHTML = '';
  carrito.forEach(item => {
    const fila = document.createElement('div');
    fila.className = 'cart-item';
    fila.innerHTML = `
      <img src="${encodeURI(item.imagen)}" alt="${item.nombre}">
      <div>
        <div class="cart-item-cat">${item.categoria}</div>
        <div class="cart-item-title">${item.nombre}</div>
        <div class="cart-qty-controls">
          <button type="button" class="cart-qty-btn" data-accion="restar">-</button>
          <span>${item.cantidad}</span>
          <button type="button" class="cart-qty-btn" data-accion="sumar">+</button>
        </div>
      </div>
      <button type="button" class="cart-remove-btn">Quitar</button>
    `;

    fila.querySelector('[data-accion="restar"]').addEventListener('click', () => cambiarCantidadCarrito(item.id, -1));
    fila.querySelector('[data-accion="sumar"]').addEventListener('click', () => cambiarCantidadCarrito(item.id, 1));
    fila.querySelector('.cart-remove-btn').addEventListener('click', () => eliminarDelCarrito(item.id));

    listaContenedor.appendChild(fila);
  });
}

function enviarPedidoCarrito() {
  if (!carrito.length) {
    mostrarNotificacionCarrito('Añade al menos una joya al carrito primero');
    return;
  }

  const lineas = carrito.map(i => `• ${i.cantidad}x ${i.nombre} (${i.categoria})`).join('\n');
  const mensaje = `Hola By.danijoyeria. Quiero realizar el siguiente pedido de joyas en Oro Laminado 18K:\n\n${lineas}\n\n¿Me confirmas disponibilidad y precio total?`;

  const numeroLimpio = (configNegocio.whatsapp || '').replace(/\D/g, '');
  if (numeroLimpio && numeroLimpio !== '573000000000') {
    window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
    return;
  }

  // Mientras no haya WhatsApp, copiamos el pedido al portapapeles y abrimos el chat directo de Instagram de @__by.danijoyeria
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(mensaje).catch(() => {});
  }
  window.open(`https://ig.me/m/${configNegocio.instagram || '__by.danijoyeria'}`, '_blank', 'noopener');
}

function mostrarNotificacionCarrito(texto) {
  const toast = document.getElementById('toast-carrito');
  if (!toast) return;

  toast.textContent = texto;
  toast.classList.remove('hidden');

  if (timerToast) clearTimeout(timerToast);
  timerToast = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2600);
}

function configurarModalYCarrito() {
  const modal = document.getElementById('modal-joya');
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  const carritoOverlay = document.getElementById('carrito-overlay');
  const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
  const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
  const btnEnviarPedido = document.getElementById('btn-enviar-pedido');
  const btnVaciarCarrito = document.getElementById('btn-vaciar-carrito');

  if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModalJoya);
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) cerrarModalJoya();
    });
  }

  if (btnAbrirCarrito && carritoOverlay) {
    btnAbrirCarrito.addEventListener('click', () => {
      carritoOverlay.classList.remove('hidden');
    });
  }
  if (btnCerrarCarrito && carritoOverlay) {
    btnCerrarCarrito.addEventListener('click', () => {
      carritoOverlay.classList.add('hidden');
    });
  }
  if (carritoOverlay) {
    carritoOverlay.addEventListener('click', e => {
      if (e.target === carritoOverlay) carritoOverlay.classList.add('hidden');
    });
  }

  if (btnEnviarPedido) btnEnviarPedido.addEventListener('click', enviarPedidoCarrito);
  if (btnVaciarCarrito) {
    btnVaciarCarrito.addEventListener('click', () => {
      carrito = [];
      guardarCarrito();
      actualizarVistaCarrito();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cerrarModalJoya();
      if (carritoOverlay) carritoOverlay.classList.add('hidden');
    }
  });
}

function configurarEnlacesFooter() {
  document.querySelectorAll('#footer-categorias a[data-cat]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      abrirCategoria(link.dataset.cat);
    });
  });
}

// 6. Carrusel continuo y constante hacia la izquierda desde el primer instante
function iniciarCarrusel() {
  const track = document.getElementById('carrusel-track');
  const btnPrev = document.getElementById('carrusel-prev');
  const btnNext = document.getElementById('carrusel-next');

  if (!track || !carruselData.length) return;

  if (intervaloCarrusel) {
    cancelAnimationFrame(intervaloCarrusel);
    intervaloCarrusel = null;
  }

  track.innerHTML = '';
  track.style.transition = 'none';

  // Duplicamos la lista para que el desplazamiento continuo hacia la izquierda sea infinito y sin cortes
  const listaContinua = [...carruselData, ...carruselData];

  listaContinua.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = index % carruselData.length;
    card.innerHTML = `<img src="${encodeURI(item.imagen)}" alt="${item.titulo || 'Joya By.danijoyeria'}">`;
    track.appendChild(card);
  });

  let desplazamientoPx = 0;
  let ultimoTiempo = performance.now();
  const velocidadPxPorSegundo = 115; // Velocidad constante y fluida desde el inicio

  function obtenerAnchoPaso() {
    const primeraTarjeta = track.querySelector('.carousel-card');
    if (!primeraTarjeta) return 0;
    const estilosTrack = window.getComputedStyle(track);
    const gap = parseFloat(estilosTrack.gap || estilosTrack.columnGap || 16);
    return primeraTarjeta.getBoundingClientRect().width + gap;
  }

  function animarContinuo(tiempoActual) {
    const deltaSegundos = Math.min((tiempoActual - ultimoTiempo) / 1000, 0.1);
    ultimoTiempo = tiempoActual;

    const anchoPaso = obtenerAnchoPaso();
    const anchoCicloCompleto = anchoPaso * carruselData.length;

    if (anchoCicloCompleto > 0) {
      desplazamientoPx += velocidadPxPorSegundo * deltaSegundos;
      if (desplazamientoPx >= anchoCicloCompleto) {
        desplazamientoPx -= anchoCicloCompleto;
      }
      track.style.transform = `translate3d(-${desplazamientoPx}px, 0, 0)`;
    }

    intervaloCarrusel = requestAnimationFrame(animarContinuo);
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const anchoPaso = obtenerAnchoPaso();
      const anchoCicloCompleto = anchoPaso * carruselData.length;
      if (anchoCicloCompleto > 0) {
        desplazamientoPx = (desplazamientoPx + anchoPaso) % anchoCicloCompleto;
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      const anchoPaso = obtenerAnchoPaso();
      const anchoCicloCompleto = anchoPaso * carruselData.length;
      if (anchoCicloCompleto > 0) {
        desplazamientoPx = (desplazamientoPx - anchoPaso + anchoCicloCompleto) % anchoCicloCompleto;
      }
    });
  }

  intervaloCarrusel = requestAnimationFrame(animarContinuo);
}

cargarCatalogo();
