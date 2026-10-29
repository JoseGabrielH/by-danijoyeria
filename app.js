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
    configurarCanalesContacto();
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
function renderizarProductos(lista) {
  productosGrid.innerHTML = '';

  lista.forEach(prod => {
    const card = document.createElement('article');
    card.className = 'product-card';

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
          <button type="button" class="btn-buy-direct">
            Comprar
          </button>
        </div>
      </div>
    `;

    // Al hacer clic en la imagen o descripción, se abre la Ficha en Grande de la joya
    card.querySelectorAll('.product-clickable').forEach(el => {
      el.addEventListener('click', () => abrirModalJoya(prod));
    });

    // Botón Comprar: elegir WhatsApp o Instagram con mensaje de la joya
    card.querySelector('.btn-buy-direct').addEventListener('click', e => {
      e.stopPropagation();
      abrirSelectorCanal(mensajeCompraJoya(prod));
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

  btnComprar.onclick = () => abrirSelectorCanal(mensajeCompraJoya(prod));
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

  abrirSelectorCanal(mensaje);
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

// 6. Carrusel paso a paso hacia la izquierda (una imagen por vez, transición rápida)
function iniciarCarrusel() {
  const track = document.getElementById('carrusel-track');
  const btnPrev = document.getElementById('carrusel-prev');
  const btnNext = document.getElementById('carrusel-next');
  const container = document.getElementById('carrusel-container');

  if (!track || !carruselData.length) return;

  const DURACION_TRANSICION = 450; // ms que tarda en deslizarse
  const PAUSA_ENTRE_PASOS = 2200; // ms que se queda quieta cada imagen
  let animando = false;
  let pausado = false;

  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translate3d(0, 0, 0)';

  carruselData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = index;
    card.innerHTML = `<img src="${encodeURI(item.imagen)}" alt="${item.titulo || 'Joya By.danijoyeria'}">`;
    track.appendChild(card);
  });

  // Clic en una imagen del carrusel: se abre en grande con el botón "Me interesa"
  track.addEventListener('click', e => {
    const card = e.target.closest('.carousel-card');
    if (!card) return;
    const item = carruselData[Number(card.dataset.index)];
    if (item) abrirVisorCarrusel(item);
  });

  function obtenerPaso() {
    const primera = track.querySelector('.carousel-card');
    if (!primera) return 0;
    const estilos = window.getComputedStyle(track);
    const gap = parseFloat(estilos.columnGap || estilos.gap || 16) || 16;
    return primera.getBoundingClientRect().width + gap;
  }

  function siguiente() {
    if (animando) return;
    animando = true;
    const paso = obtenerPaso();
    track.style.transition = `transform ${DURACION_TRANSICION}ms ease-in-out`;
    track.style.transform = `translate3d(-${paso}px, 0, 0)`;
    setTimeout(() => {
      track.style.transition = 'none';
      track.appendChild(track.firstElementChild);
      track.style.transform = 'translate3d(0, 0, 0)';
      animando = false;
    }, DURACION_TRANSICION);
  }

  function anterior() {
    if (animando) return;
    animando = true;
    const paso = obtenerPaso();
    track.style.transition = 'none';
    track.prepend(track.lastElementChild);
    track.style.transform = `translate3d(-${paso}px, 0, 0)`;
    void track.offsetWidth;
    track.style.transition = `transform ${DURACION_TRANSICION}ms ease-in-out`;
    track.style.transform = 'translate3d(0, 0, 0)';
    setTimeout(() => {
      track.style.transition = 'none';
      animando = false;
    }, DURACION_TRANSICION);
  }

  function reiniciarTemporizador() {
    if (intervaloCarrusel) clearInterval(intervaloCarrusel);
    intervaloCarrusel = setInterval(() => {
      if (!pausado) siguiente();
    }, PAUSA_ENTRE_PASOS + DURACION_TRANSICION);
  }

  if (btnNext) btnNext.addEventListener('click', () => { siguiente(); reiniciarTemporizador(); });
  if (btnPrev) btnPrev.addEventListener('click', () => { anterior(); reiniciarTemporizador(); });

  if (container) {
    container.addEventListener('mouseenter', () => { pausado = true; });
    container.addEventListener('mouseleave', () => { pausado = false; });
  }

  // Primer movimiento casi inmediato al entrar a la página
  setTimeout(siguiente, 1200);
  reiniciarTemporizador();
}

// 8. Visor en grande de las imágenes del carrusel con botón "Me interesa"
function obtenerUrlAbsoluta(rutaRelativa) {
  return new URL(encodeURI(rutaRelativa), window.location.href).href;
}

function abrirVisorCarrusel(item) {
  const visor = document.getElementById('visor-carrusel');
  const img = document.getElementById('visor-carrusel-img');
  const btn = document.getElementById('visor-btn-interesa');
  if (!visor || !img || !btn) return;

  img.src = encodeURI(item.imagen);
  img.alt = item.titulo || 'Joya By.danijoyeria';

  const mensaje = `Hola By.danijoyeria, me interesa esta: ${item.titulo || ''}\n${obtenerUrlAbsoluta(item.imagen)}`;
  btn.href = enlaceWhatsApp(mensaje);

  visor.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function cerrarVisorCarrusel() {
  const visor = document.getElementById('visor-carrusel');
  if (visor) visor.classList.add('hidden');
  document.body.style.overflow = '';
}

// 9. Selector de canal (WhatsApp o Instagram) con mensaje automático
function enlaceWhatsApp(mensaje) {
  const numero = (configNegocio.whatsapp || '').replace(/\D/g, '');
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

function enlaceInstagramDM() {
  return `https://ig.me/m/${configNegocio.instagram || '__by.danijoyeria'}`;
}

function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(texto).catch(() => {});
  }
  return Promise.resolve();
}

// Abre Instagram DM; como Instagram no permite mensajes pre-escritos por enlace, se copia el texto para pegarlo
function abrirInstagramConMensaje(mensaje) {
  copiarAlPortapapeles(mensaje);
  window.open(enlaceInstagramDM(), '_blank', 'noopener');
  mostrarNotificacionCarrito('Mensaje copiado. Pégalo en el chat de Instagram');
}

let mensajeCanalPendiente = '';

function abrirSelectorCanal(mensaje) {
  mensajeCanalPendiente = mensaje;
  const selector = document.getElementById('selector-canal');
  const btnWa = document.getElementById('canal-btn-whatsapp');
  if (!selector || !btnWa) return;
  btnWa.href = enlaceWhatsApp(mensaje);
  selector.classList.remove('hidden');
}

function cerrarSelectorCanal() {
  const selector = document.getElementById('selector-canal');
  if (selector) selector.classList.add('hidden');
}

function mensajeCompraJoya(prod) {
  return `Hola By.danijoyeria, me interesa comprar esta joya:\n\nReferencia: ${prod.nombre}\nCategoría: ${prod.categoria}\nDetalle: ${prod.detalle}\n\n${obtenerUrlAbsoluta(prod.imagen)}\n\n¿Está disponible?`;
}

function configurarCanalesContacto() {
  // Selector de canal
  const selector = document.getElementById('selector-canal');
  const btnIg = document.getElementById('canal-btn-instagram');
  const btnWa = document.getElementById('canal-btn-whatsapp');
  const btnCerrarSelector = document.getElementById('btn-cerrar-selector');

  if (btnIg) {
    btnIg.addEventListener('click', () => {
      abrirInstagramConMensaje(mensajeCanalPendiente);
      cerrarSelectorCanal();
    });
  }
  if (btnWa) btnWa.addEventListener('click', () => setTimeout(cerrarSelectorCanal, 200));
  if (btnCerrarSelector) btnCerrarSelector.addEventListener('click', cerrarSelectorCanal);
  if (selector) {
    selector.addEventListener('click', e => {
      if (e.target === selector) cerrarSelectorCanal();
    });
  }

  // Visor del carrusel
  const visor = document.getElementById('visor-carrusel');
  const btnCerrarVisor = document.getElementById('btn-cerrar-visor');
  if (btnCerrarVisor) btnCerrarVisor.addEventListener('click', cerrarVisorCarrusel);
  if (visor) {
    visor.addEventListener('click', e => {
      if (e.target === visor) cerrarVisorCarrusel();
    });
  }

  // Instagram del pie de página (Síguenos) -> chat con mensaje automático
  const igFooter = document.getElementById('footer-instagram');
  if (igFooter) {
    igFooter.addEventListener('click', e => {
      e.preventDefault();
      abrirInstagramConMensaje('Me interesa saber de tu joyería');
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      cerrarSelectorCanal();
      cerrarVisorCarrusel();
    }
  });
}

cargarCatalogo();
