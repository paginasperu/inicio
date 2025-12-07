// main.js - VERSIÓN DINÁMICA

// 1. CONFIGURACIÓN
const SHEET_ID = '1ew2qtysq4rwWkL7VU2MTaOv2O3tmD28kFYN5eVHCiUY'; // <--- PEGA TU ID
const SHEET_NAME = 'negocios'; // <--- Nombre exacto de tu pestaña en Excel
const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

const rewardsList = document.getElementById('rewardsList');

// --- FUNCIÓN PRINCIPAL: CARGAR NEGOCIOS ---
async function cargarNegocios() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // 1. Limpiamos la lista visual
        rewardsList.innerHTML = '';

        // 2. Dibujamos las tarjetas de negocio
        data.forEach(negocio => {
            const cardHTML = `
                <article class="reward-card business-card" 
                    data-category="${negocio.categoria}" 
                    data-name="${negocio.nombre}"
                    data-distrito="${negocio.distrito}"
                    data-depa="${negocio.departamento}"
                    onclick="irANegocio('${negocio.usuario}')">
                    
                    <div class="reward-image">
                        <img src="${negocio.logo}" alt="${negocio.nombre}" onerror="this.src='https://via.placeholder.com/150'">
                    </div>
                    <div class="reward-content">
                        <div class="reward-vendor">${negocio.categoria}</div>
                        <h3 class="reward-title">${negocio.nombre}</h3>
                        <p class="reward-desc">
                            📍 ${negocio.distrito} - ${negocio.departamento}
                        </p>
                        <span class="reward-points" style="background:#f1f5f9; color:#64748b; margin-top:5px; font-size:0.8rem;">
                            Ver premios →
                        </span>
                    </div>
                </article>
            `;
            rewardsList.innerHTML += cardHTML;
        });

        // 3. ¡AQUÍ ESTÁ LA MAGIA! Llenamos el filtro dinámicamente
        // Pasamos toda la data y el nombre exacto de la columna en tu Excel ('categoria')
        llenarFiltroDinamico(data, 'categoria', 'categoryFilter');
        
        // (Opcional) Si quieres que el Departamento también sea dinámico:
        // llenarFiltroDinamico(data, 'departamento', 'depaFilter');

    } catch (error) {
        console.error('Error:', error);
        rewardsList.innerHTML = '<p style="text-align:center; color:red;">Error cargando negocios.</p>';
    }
}

// --- FUNCIÓN INTELIGENTE PARA LLENAR SELECTS ---
function llenarFiltroDinamico(datos, columnaExcel, idSelectHTML) {
    const select = document.getElementById(idSelectHTML);
    if (!select) return;

    // A. Extraemos todos las categorías (ej: ["Salud", "Deporte", "Salud", "Moda"])
    const todosLosValores = datos.map(item => item[columnaExcel]);

    // B. Quitamos duplicados usando 'Set' y limpiamos vacíos
    const valoresUnicos = [...new Set(todosLosValores)].filter(val => val);

    // C. Ordenamos alfabéticamente
    valoresUnicos.sort();

    // D. Creamos las opciones en el HTML
    valoresUnicos.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor; // El valor para el código
        option.textContent = valor; // Lo que ve el usuario
        select.appendChild(option);
    });
}

// --- FUNCIÓN DE FILTRADO (Conecta los inputs con las tarjetas) ---
function filtrarNegocios() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const depaFilter = document.getElementById('depaFilter');

    // Si los filtros aún no existen, no hacemos nada
    if (!searchInput) return;

    const texto = searchInput.value.toLowerCase();
    const catSeleccionada = categoryFilter.value;
    const depaSeleccionado = depaFilter ? depaFilter.value : 'all';
    
    const cards = document.querySelectorAll('.business-card');

    cards.forEach(card => {
        // Obtenemos los datos guardados en la tarjeta
        const nombre = card.getAttribute('data-name').toLowerCase();
        const distrito = card.getAttribute('data-distrito').toLowerCase();
        
        // Cuidado: obtenemos la categoría tal cual está escrita para comparar exacto
        const categoria = card.getAttribute('data-category'); 
        const departamento = card.getAttribute('data-depa');

        // Lógica de coincidencias
        const matchTexto = nombre.includes(texto) || distrito.includes(texto);
        const matchCat = catSeleccionada === 'all' || categoria === catSeleccionada;
        const matchDepa = depaSeleccionado === 'all' || departamento === depaSeleccionado;

        // Mostrar u Ocultar
        card.style.display = (matchTexto && matchCat && matchDepa) ? 'flex' : 'none';
    });
}

// --- NAVEGACIÓN ---
function irANegocio(usuario) {
    window.location.hash = `/${usuario}`;
}

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Dibujar estructura de filtros
    if (typeof cargarFiltros === "function") cargarFiltros();
    
    // 2. Traer datos y llenar todo
    cargarNegocios();
});
