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
let indiceCarrusel = 0;
let intervaloCarrusel = null;
let idAnimacionScroll = null;

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

    renderizarTarjetasCategorias();
    renderizarPestanasCategorias();
    iniciarCarrusel();
    configurarEnlacesFooter();
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

// 5. Renderiza las tarjetas de productos con formato simétrico y ortografía cuidada
function renderizarProductos(lista) {
  productosGrid.innerHTML = '';

  lista.forEach(prod => {
    const card = document.createElement('article');
    card.className = 'product-card';

    card.innerHTML = `
      <div class="product-img-wrapper">
        <span class="product-badge">Oro Laminado 18K</span>
        <img src="${encodeURI(prod.imagen)}" alt="${prod.nombre}" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-category">${prod.categoria} • By.danijoyeria</span>
        <h4 class="product-title">${prod.nombre}</h4>
        <p class="product-desc">${prod.descripcion}</p>
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
      </div>
    `;

    productosGrid.appendChild(card);
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

// 6. Carrusel de 3 imágenes visibles con desplazamiento simultáneo hacia la izquierda
function iniciarCarrusel() {
  const track = document.getElementById('carrusel-track');
  const dotsContainer = document.getElementById('carrusel-dots');
  const btnPrev = document.getElementById('carrusel-prev');
  const btnNext = document.getElementById('carrusel-next');
  const container = document.getElementById('carrusel-container');

  if (!track || !carruselData.length) return;

  let animando = false;
  track.innerHTML = '';
  dotsContainer.innerHTML = '';

  // Crear las tarjetas en la pista horizontal
  carruselData.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = index;
    card.innerHTML = `<img src="${encodeURI(item.imagen)}" alt="${item.titulo || 'Joya By.danijoyeria'}">`;
    track.appendChild(card);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Imagen ${index + 1}`);
    dot.addEventListener('click', () => {
      if (animando) return;
      deslizarHaciaIzquierda();
      reiniciarTemporizadorCarrusel();
    });
    dotsContainer.appendChild(dot);
  });

  function obtenerPasoDesplazamiento() {
    const primeraTarjeta = track.querySelector('.carousel-card');
    if (!primeraTarjeta) return 0;
    const estilosTrack = window.getComputedStyle(track);
    const gap = parseFloat(estilosTrack.gap || estilosTrack.columnGap || 20);
    return primeraTarjeta.getBoundingClientRect().width + gap;
  }

  function actualizarEstadoCentro() {
    const tarjetas = track.querySelectorAll('.carousel-card');
    tarjetas.forEach((c, idx) => {
      c.classList.toggle('is-center', idx === 1);
    });

    const tarjetaCentral = tarjetas[1];
    const idxActivo = tarjetaCentral ? Number(tarjetaCentral.dataset.index) : 0;
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((d, idx) => d.classList.toggle('active', idx === idxActivo));
  }

  // Mueve todas las imágenes al mismo tiempo hacia la izquierda
  function deslizarHaciaIzquierda() {
    if (animando) return;
    animando = true;

    const paso = obtenerPasoDesplazamiento();
    const tarjetas = track.querySelectorAll('.carousel-card');
    tarjetas.forEach((c, idx) => c.classList.toggle('is-center', idx === 2));

    track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translate3d(-${paso}px, 0, 0)`;

    const alTerminar = () => {
      track.removeEventListener('transitionend', alTerminar);
      track.style.transition = 'none';
      track.appendChild(track.firstElementChild);
      track.style.transform = 'translate3d(0, 0, 0)';
      actualizarEstadoCentro();
      animando = false;
    };

    track.addEventListener('transitionend', alTerminar, { once: true });
  }

  // Mueve hacia la derecha si el usuario presiona la flecha izquierda
  function deslizarHaciaDerecha() {
    if (animando) return;
    animando = true;

    const paso = obtenerPasoDesplazamiento();
    track.style.transition = 'none';
    track.prepend(track.lastElementChild);
    track.style.transform = `translate3d(-${paso}px, 0, 0)`;

    // Forzar reflujo para que el navegador aplique la posición inicial antes de animar
    void track.offsetWidth;

    track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = 'translate3d(0, 0, 0)';
    actualizarEstadoCentro();

    const alTerminar = () => {
      track.removeEventListener('transitionend', alTerminar);
      track.style.transition = 'none';
      animando = false;
    };

    track.addEventListener('transitionend', alTerminar, { once: true });
  }

  function reiniciarTemporizadorCarrusel() {
    if (intervaloCarrusel) clearInterval(intervaloCarrusel);
    intervaloCarrusel = setInterval(deslizarHaciaIzquierda, 3500);
  }

  btnNext.addEventListener('click', () => {
    deslizarHaciaIzquierda();
    reiniciarTemporizadorCarrusel();
  });

  btnPrev.addEventListener('click', () => {
    deslizarHaciaDerecha();
    reiniciarTemporizadorCarrusel();
  });

  container.addEventListener('mouseenter', () => {
    if (intervaloCarrusel) clearInterval(intervaloCarrusel);
  });
  container.addEventListener('mouseleave', reiniciarTemporizadorCarrusel);

  actualizarEstadoCentro();
  reiniciarTemporizadorCarrusel();
}

cargarCatalogo();
