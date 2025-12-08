// main.js - VERSIÓN SIN SALTOS (CON LOADER)

// 1. CONFIGURACIÓN
const SHEET_ID = '1ew2qtysq4rwWkL7VU2MTaOv2O3tmD28kFYN5eVHCiUY'; 
const SHEET_NAME = 'negocios'; 
const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`;

// HTML del Loader (Círculo dando vueltas)
const HTML_LOADER = '<div class="mi-loader"></div>';

// Imágenes
const IMAGEN_DEFECTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748b'%3ESin Logo%3C/text%3E%3C/svg%3E";

const container = document.getElementById('rewardsList');
const filtrosContainer = document.getElementById('shortcode-filtros');
const welcomeMsg = document.getElementById('welcomeMessage');

// --- ROUTER ---
function manejarRuta() {
    const ruta = window.location.pathname;
    const usuarioNegocio = ruta.replace(/^\//, '').toLowerCase();

    if (usuarioNegocio && usuarioNegocio !== 'index.html') {
        cargarPerfilNegocio(usuarioNegocio);
    } else {
        cargarDirectorio();
    }
}

function irANegocio(usuario) {
    history.pushState(null, null, `/${usuario}`);
    manejarRuta();
}

window.addEventListener('popstate', manejarRuta);


// --- MODO DIRECTORIO ---
async function cargarDirectorio() {
    if (filtrosContainer) filtrosContainer.style.display = 'block';
    if (welcomeMsg) welcomeMsg.style.display = 'none';
    
    // Muestra el Loader en vez de texto feo
    container.innerHTML = HTML_LOADER;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        container.innerHTML = ''; // Borra el loader

        data.forEach(negocio => {
            let urlLogo = (negocio.logo && negocio.logo.trim() !== '') ? negocio.logo : generarAvatar(negocio.nombre);

            const cardHTML = `
                <article class="reward-card business-card" 
                    data-category="${negocio.categoria}" 
                    data-name="${negocio.nombre}"
                    data-distrito="${negocio.distrito}"
                    data-depa="${negocio.departamento}"
                    onclick="irANegocio('${negocio.usuario}')"
                    style="align-items: flex-start; padding: 15px;">
                    
                    <div class="reward-image" style="width: 110px; height: 110px;">
                        <img src="${urlLogo}" alt="${negocio.nombre}" onerror="this.onerror=null; this.src='${generarAvatar(negocio.nombre)}'" style="border-radius: 8px;">
                    </div>
                    <div class="reward-content" style="padding: 0 0 0 15px; justify-content: space-between;">
                        <h3 class="reward-title" style="font-size: 1.3rem; margin: 0 0 4px 0; line-height: 1.1;">${negocio.nombre}</h3>
                        <div class="reward-vendor" style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: normal;">${negocio.categoria}</div>
                        <p class="reward-desc" style="margin-bottom: 12px; font-size: 0.9rem;">${negocio.distrito} - ${negocio.provincia} - ${negocio.departamento}</p>
                        <div style="background-color: var(--primary); color: white; text-align: center; padding: 8px 12px; border-radius: 6px; font-weight: 600; font-size: 1.1rem; width: 100%; cursor: pointer;">Ver premios</div>
                    </div>
                </article>
            `;
            container.innerHTML += cardHTML;
        });

        if(typeof llenarFiltroDinamico === 'function') {
            llenarFiltroDinamico(data, 'categoria', 'categoryFilter');
        }

    } catch (error) {
        container.innerHTML = '<p style="text-align:center; color:red;">Error cargando directorio.</p>';
    }
}


// --- MODO PERFIL ---
async function cargarPerfilNegocio(usuarioSlug) {
    if (filtrosContainer) filtrosContainer.style.display = 'none';
    
    // Loader inicial del perfil
    container.innerHTML = HTML_LOADER;

    try {
        const response = await fetch(API_URL);
        const negocios = await response.json();
        const negocio = negocios.find(n => n.usuario && n.usuario.toLowerCase() === usuarioSlug);

        if (!negocio) {
            container.innerHTML = '<h2 style="text-align:center; margin-top:50px;">Negocio no encontrado</h2><div style="text-align:center"><button onclick="irANegocio(\'\')" style="padding:10px 20px; margin-top:20px;">Volver</button></div>';
            return;
        }

        const idHojaExterna = negocio.tabla_premios_clientes; 

        if (!idHojaExterna) {
            container.innerHTML = `<h2 style="text-align:center;">${negocio.nombre}</h2><p style="text-align:center;">Sin configuración de premios.</p>`;
            return;
        }

        let urlLogo = negocio.logo || generarAvatar(negocio.nombre);
        
        let headerHTML = `
            <div style="text-align:center; margin-bottom:30px; padding: 20px 0; border-bottom: 1px solid #e2e8f0; animation: aparecerSuave 0.5s ease-out;">
                <img src="${urlLogo}" style="width:100px; height:100px; border-radius:12px; object-fit:cover; margin-bottom:10px;">
                <h1 style="margin:0; font-size:1.8rem; color:var(--text-dark);">${negocio.nombre}</h1>
                <p style="color:var(--text-gray); margin:5px 0;">${negocio.distrito}, ${negocio.departamento}</p>
                
                <div style="max-width:400px; margin:20px auto; display:flex; gap:10px;">
                    <input type="number" id="inputDNI" placeholder="Ingresa tu DNI para ver puntos" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ccc;">
                    <button onclick="consultarPuntos('${idHojaExterna}')" style="background:var(--primary); color:white; border:none; padding:0 20px; border-radius:8px; cursor:pointer; font-weight:600;">Consultar</button>
                </div>
                <div id="resultadoPuntos" style="margin-top:10px; font-weight:bold; color:var(--primary); min-height: 24px;"></div>
            </div>
            
            <h3 style="margin-bottom:15px; padding-left:10px; border-left: 4px solid var(--primary); animation: aparecerSuave 0.6s ease-out;">Catálogo de Premios</h3>
            
            <div id="listaPremiosNegocio" class="rewards-container">
                ${HTML_LOADER} 
            </div>
        `;

        container.innerHTML = headerHTML;

        // Cargar premios
        cargarPremiosDeNegocio(idHojaExterna);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center;">Error cargando perfil.</p>';
    }
}

// --- CARGAR PREMIOS (Lista interna) ---
async function cargarPremiosDeNegocio(sheetId) {
    const urlPremios = `https://opensheet.elk.sh/${sheetId}/premios`;
    const divLista = document.getElementById('listaPremiosNegocio');

    try {
        const res = await fetch(urlPremios);
        const premios = await res.json();

        divLista.innerHTML = ''; // Quitar loader

        if(premios.length === 0) {
            divLista.innerHTML = '<p style="text-align:center; width:100%">No hay premios disponibles.</p>';
            return;
        }

        premios.forEach(premio => {
            // Nota: Aquí usamos la misma clase .reward-card para heredar la animación del CSS
            const card = `
                <article class="reward-card" style="cursor:default;">
                    <div class="reward-image">
                        <img src="${premio.imagen}" onerror="this.src='${IMAGEN_DEFECTO}'">
                    </div>
                    <div class="reward-content">
                        <div class="reward-vendor">${premio.categoria || 'General'}</div>
                        <h3 class="reward-title">${premio.nombre}</h3>
                        <span class="reward-points">${premio.puntos} Puntos</span>
                        <p class="reward-desc">${premio['descripcion_corta'] || premio.descripcion_corta || ''}</p>
                    </div>
                </article>
            `;
            divLista.innerHTML += card;
        });

    } catch (e) {
        divLista.innerHTML = '<p style="color:red">Error cargando premios.</p>';
    }
}

// --- CONSULTAR PUNTOS ---
async function consultarPuntos(sheetId) {
    const dniInput = document.getElementById('inputDNI');
    const resultadoDiv = document.getElementById('resultadoPuntos');
    const dniBuscado = dniInput.value.trim();

    if(!dniBuscado) {
        resultadoDiv.innerHTML = '<span style="color:red">Escribe tu DNI</span>';
        return;
    }

    resultadoDiv.innerHTML = '<span style="color:#64748b">Buscando...</span>'; // Texto sutil mientras busca
    
    const urlClientes = `https://opensheet.elk.sh/${sheetId}/clientes`;

    try {
        const res = await fetch(urlClientes);
        const clientes = await res.json();

        const cliente = clientes.find(c => {
            const valorEnFila = c.dni || c.DNI || c.Dni;
            return String(valorEnFila).trim() === String(dniBuscado);
        });

        if(cliente) {
            const puntos = cliente.puntos || cliente.Puntos || 0;
            resultadoDiv.innerHTML = `✅ El DNI ${dniBuscado} tiene <b>${puntos}</b> Puntos.`;
        } else {
            resultadoDiv.innerHTML = `<span style="color:#64748b">El DNI ${dniBuscado} no tiene puntos aquí.</span>`;
        }

    } catch (e) {
        resultadoDiv.innerHTML = 'Error de conexión.';
    }
}

// --- HELPERS ---
function generarAvatar(nombre) {
    const n = nombre ? nombre.replace(/\s+/g, '+') : 'Negocio';
    return `https://ui-avatars.com/api/?name=${n}&background=random&color=fff&size=150&bold=true`;
}

function llenarFiltroDinamico(datos, col, idSelect) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    const vals = datos.map(i => i[col]);
    const unicos = [...new Set(vals)].filter(v => v).sort();
    while (select.options.length > 1) { select.remove(1); }
    unicos.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        select.appendChild(opt);
    });
}

function filtrarNegocios() {
    const texto = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('categoryFilter').value;
    document.querySelectorAll('.business-card').forEach(c => {
        const nombre = c.getAttribute('data-name').toLowerCase();
        const dist = c.getAttribute('data-distrito').toLowerCase();
        const categ = c.getAttribute('data-category');
        const show = (nombre.includes(texto) || dist.includes(texto)) && (cat === 'all' || categ === cat);
        c.style.display = show ? 'flex' : 'none';
    });
}

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    if (typeof cargarFiltros === "function") cargarFiltros();
    manejarRuta();
});
