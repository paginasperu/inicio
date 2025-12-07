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

        rewardsList.innerHTML = ''; 

        data.forEach(negocio => {
            let urlLogo = (negocio.logo && negocio.logo.trim() !== '') ? negocio.logo : IMAGEN_DEFECTO;

            const cardHTML = `
                <article class="reward-card business-card" 
                    data-category="${negocio.categoria}" 
                    data-name="${negocio.nombre}"
                    data-distrito="${negocio.distrito}"
                    data-depa="${negocio.departamento}"
                    onclick="irANegocio('${negocio.usuario}')"
                    style="align-items: flex-start; padding: 15px;"> 
                    
                    <div class="reward-image" style="width: 110px; height: 110px;">
                        <img src="${urlLogo}" 
                             alt="${negocio.nombre}" 
                             onerror="this.onerror=null; this.src='${IMAGEN_DEFECTO}'"
                             style="border-radius: 8px;">
                    </div>

                    <div class="reward-content" style="padding: 0 0 0 15px; justify-content: space-between;">
                        
                        <h3 class="reward-title" style="font-size: 1.3rem; margin: 0 0 4px 0; line-height: 1.1;">
                            ${negocio.nombre}
                        </h3>

                        <div class="reward-vendor" style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: normal;">
                            ${negocio.categoria}
                        </div>

                        <p class="reward-desc" style="margin-bottom: 12px; font-size: 0.9rem;">
                            ${negocio.distrito} - ${negocio.provincia} - ${negocio.departamento}
                        </p>

                        <div style="
                            background-color: var(--primary); 
                            color: white; 
                            text-align: center; 
                            padding: 8px 12px; 
                            border-radius: 6px; 
                            font-weight: 600; 
                            font-size: 1.1rem;
                            width: 100%;
                            cursor: pointer;
                            transition: background 0.2s;
                        ">
                            Ver premios
                        </div>

                    </div>
                </article>
            `;
            rewardsList.innerHTML += cardHTML;
        });

        llenarFiltroDinamico(data, 'categoria', 'categoryFilter');

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
