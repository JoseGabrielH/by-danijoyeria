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

async function cargarCatalogo() {
  try {
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
  document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 3. Volver a la vista de las 5 categorías principales
function volverACategorias() {
  categoriaAbiertaView.classList.add('hidden');
  categoriasGrid.classList.remove('hidden');

  catalogoTitulo.textContent = 'Categorías de Joyas';
  catalogoSubtexto.textContent = 'Selecciona una categoría para ver todas sus joyas disponibles';

  document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// 6. Carrusel de 3 imágenes visibles (Izquierda, Centro, Derecha) debajo de Categorías de Joyas
function iniciarCarrusel() {
  const track = document.getElementById('carrusel-track');
  const dotsContainer = document.getElementById('carrusel-dots');
  const btnPrev = document.getElementById('carrusel-prev');
  const btnNext = document.getElementById('carrusel-next');
  const container = document.getElementById('carrusel-container');

  if (!track || !carruselData.length) return;

  dotsContainer.innerHTML = '';

  carruselData.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
    dot.addEventListener('click', () => {
      irASlide(index);
      reiniciarTemporizadorCarrusel();
    });
    dotsContainer.appendChild(dot);
  });

  function renderizarTrio() {
    const total = carruselData.length;
    const idxIzq = (indiceCarrusel - 1 + total) % total;
    const idxCentro = indiceCarrusel % total;
    const idxDer = (indiceCarrusel + 1) % total;

    const visibles = [
      { item: carruselData[idxIzq], pos: 'is-side' },
      { item: carruselData[idxCentro], pos: 'is-center' },
      { item: carruselData[idxDer], pos: 'is-side' }
    ];

    track.innerHTML = visibles
      .map(
        v => `
        <div class="carousel-card ${v.pos}">
          <img src="${encodeURI(v.item.imagen)}" alt="${v.item.titulo || 'Joya By.danijoyeria'}">
        </div>
      `
      )
      .join('');

    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((d, idx) => d.classList.toggle('active', idx === idxCentro));
  }

  function irASlide(nuevoIndice) {
    const total = carruselData.length;
    indiceCarrusel = (nuevoIndice + total) % total;
    renderizarTrio();
  }

  function siguienteSlide() {
    irASlide(indiceCarrusel + 1);
  }

  function anteriorSlide() {
    irASlide(indiceCarrusel - 1);
  }

  function reiniciarTemporizadorCarrusel() {
    if (intervaloCarrusel) clearInterval(intervaloCarrusel);
    intervaloCarrusel = setInterval(siguienteSlide, 3500);
  }

  btnNext.addEventListener('click', () => {
    siguienteSlide();
    reiniciarTemporizadorCarrusel();
  });

  btnPrev.addEventListener('click', () => {
    anteriorSlide();
    reiniciarTemporizadorCarrusel();
  });

  container.addEventListener('mouseenter', () => {
    if (intervaloCarrusel) clearInterval(intervaloCarrusel);
  });
  container.addEventListener('mouseleave', reiniciarTemporizadorCarrusel);

  renderizarTrio();
  reiniciarTemporizadorCarrusel();
}

cargarCatalogo();
