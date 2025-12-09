/**
 * APP MAESTRA - OFICIAL.PE
 * Versión: 2.0 (Light Edition)
 * Descripción: Versión optimizada para enlaces directos. Sin lógica de Drive.
 */

(function() {
    // ==========================================
    // 1. CARGA DE DEPENDENCIAS
    // ==========================================
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(src);
            script.onerror = () => reject(new Error(`Error cargando ${src}`));
            document.head.appendChild(script);
        });
    }

    // ==========================================
    // 2. ESTILOS Y ASSETS
    // ==========================================
    const head = document.head;

    // Fuentes
    const fontLink = document.createElement('link');
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
    head.appendChild(fontLink);

    // Favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23111111%22/></svg>';
    head.appendChild(favicon);

    // CSS Crítico
    const style = document.createElement('style');
    style.innerHTML = `
        body { font-family: 'Inter', sans-serif; background-color: #F8F9FA; opacity: 0; transition: opacity 0.5s ease; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1); }
    `;
    head.appendChild(style);

    // ==========================================
    // 3. INICIALIZACIÓN
    // ==========================================
    Promise.all([
        loadScript("https://cdn.tailwindcss.com"),
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js")
    ]).then(() => {
        iniciarSistema();
    }).catch(error => {
        console.error("Error:", error);
        document.body.innerHTML = '<h3 style="text-align:center; margin-top:50px;">Error de conexión. Recarga la página.</h3>';
    });

    // ==========================================
    // 4. CONSTRUCCIÓN VISUAL
    // ==========================================
    function construirHTML() {
        const loader = document.getElementById('initial-loader');
        if(loader) loader.remove();

        const config = window.CLIENT_CONFIG;
        if (!config) return; // Validación básica

        document.title = config.nombreNegocio;
        const cleanName = config.nombreNegocio.replace(/ /g, '<span class="text-black/40">.</span>');

        document.body.innerHTML = `
            <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
                <div class="max-w-6xl mx-auto px-4 py-3">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="text-lg font-bold tracking-wide text-gray-900 cursor-pointer uppercase" onclick="window.scrollTo(0,0)">
                            ${cleanName}
                        </div>
                        <div class="relative w-full md:w-80">
                            <input type="text" id="searchInput" class="block w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 outline-none focus:ring-1 focus:ring-black" placeholder="Buscar productos...">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 flex space-x-2 overflow-x-auto hide-scroll pb-1" id="categoryContainer"></div>
                </div>
            </header>

            <main class="max-w-6xl mx-auto px-4 py-8 min-h-screen">
                <div id="loader" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${'<div class="bg-white rounded-2xl p-4 h-80 animate-pulse border border-gray-100"><div class="bg-gray-200 h-48 rounded-xl mb-4"></div><div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div></div>'.repeat(3)}
                </div>
                <div id="productGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 hidden"></div>
                <div id="noResults" class="hidden flex flex-col items-center justify-center py-20 text-center">
                    <p class="text-gray-500 font-medium">No encontramos coincidencias.</p>
                    <button onclick="resetFilters()" class="mt-2 text-sm text-black underline font-semibold">Ver todo</button>
                </div>
            </main>

            <footer class="text-center py-8 text-xs text-gray-400 border-t border-gray-200 mt-8">
                <p>© 2025 ${config.nombreNegocio}. Validado por oficial.pe</p>
            </footer>
        `;
        document.body.style.opacity = "1"; 
    }

    // ==========================================
    // 5. LÓGICA DE NEGOCIO
    // ==========================================
    let allProducts = [];
    let activeCategory = 'all';

    function iniciarSistema() {
        construirHTML();
        
        const searchInput = document.getElementById('searchInput');
        if(searchInput) searchInput.addEventListener('input', (e) => filterProducts(e.target.value, activeCategory));

        const config = window.CLIENT_CONFIG;
        let sheetId = config.sheetUrl;
        const match = config.sheetUrl.match(/\/d\/(.*?)(\/|$)/);
        if (match) sheetId = match[1];

        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.nombrePestana)}`;

        Papa.parse(url, {
            download: true, header: true, skipEmptyLines: true,
            complete: function(results) {
                let valid = results.data.filter(p => p.nombre && p.nombre.trim() !== '');
                allProducts = valid.slice(0, 50); // Límite seguro

                if(allProducts.length > 0) {
                    generateCategories(allProducts);
                    renderProducts(allProducts);
                    document.getElementById('loader')?.classList.add('hidden');
                    document.getElementById('productGrid')?.classList.remove('hidden');
                } else {
                    document.getElementById('loader').innerHTML = '<p class="col-span-3 text-center text-red-500">No hay productos visibles.</p>';
                }
            },
            error: () => {
                document.getElementById('loader').innerHTML = '<p class="col-span-3 text-center text-red-500">Error leyendo Google Sheets.</p>';
            }
        });
    }

    function renderProducts(products) {
        const grid = document.getElementById('productGrid');
        const noRes = document.getElementById('noResults');
        if(!grid) return;

        grid.innerHTML = '';
        
        if (products.length === 0) { 
            grid.classList.add('hidden'); 
            noRes.classList.remove('hidden'); 
            return; 
        } else { 
            grid.classList.remove('hidden'); 
            noRes.classList.add('hidden'); 
        }

        products.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'product-card bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col h-full fade-in';
            card.style.animationDelay = `${i * 30}ms`;
            
            // Precio simple
            let precio = parseFloat((p.precio || '0').replace('S/', '').trim() || 0).toFixed(2);
            
            // Lógica de Imagen SIMPLIFICADA (Sin conversión)
            // Si tiene http, se usa. Si no, placeholder.
            let img = (p.imagen && p.imagen.startsWith('http')) 
                      ? p.imagen 
                      : 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Sin+Imagen';

            card.innerHTML = `
                <div class="relative mb-4 overflow-hidden rounded-xl bg-gray-50 aspect-[4/3] group">
                    <img src="${img}" class="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" loading="lazy">
                    <div class="absolute top-2 left-2">
                        <span class="bg-white/95 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider text-gray-800 border border-gray-100">${p.categoria || 'General'}</span>
                    </div>
                </div>
                <div class="flex-grow flex flex-col justify-between">
                    <div>
                        <h3 class="text-base font-bold text-gray-900 leading-tight mb-1">${p.nombre}</h3>
                        <p class="text-xs text-gray-500 line-clamp-2 mb-3 h-8">${p.descripcion || ''}</p>
                    </div>
                    <div class="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                        <span class="text-lg font-bold text-gray-900">S/ ${precio}</span>
                        <a href="https://wa.me/${window.CLIENT_CONFIG.telefono}?text=Hola,%20interesado%20en:%20${encodeURIComponent(p.nombre)}" target="_blank" class="bg-black text-white hover:bg-gray-800 transition-colors h-9 w-9 flex items-center justify-center rounded-full shadow-lg active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        </a>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function generateCategories(products) {
        const cats = ['all', ...new Set(products.map(p => p.categoria ? p.categoria.trim() : 'Otros'))];
        const cont = document.getElementById('categoryContainer');
        if(!cont) return;
        
        cont.innerHTML = '';
        cats.forEach(c => {
            const btn = document.createElement('button');
            const isActive = c === 'all';
            btn.className = `px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 border border-transparent select-none ${isActive ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`;
            btn.textContent = c === 'all' ? 'Todos' : c;
            
            btn.onclick = () => {
                // Reset visual
                Array.from(cont.children).forEach(b => b.className = b.className.replace('bg-black text-white shadow-md', 'bg-gray-100 text-gray-500 hover:bg-gray-200'));
                btn.className = btn.className.replace('bg-gray-100 text-gray-500 hover:bg-gray-200', 'bg-black text-white shadow-md');
                
                activeCategory = c;
                filterProducts(document.getElementById('searchInput').value, activeCategory);
            };
            cont.appendChild(btn);
        });
    }

    window.filterProducts = function(term, cat) {
        const t = term.toLowerCase();
        const f = allProducts.filter(p => {
            if(!p.nombre) return false;
            return (cat === 'all' || (p.categoria && p.categoria.trim() === cat)) &&
                   (p.nombre.toLowerCase().includes(t) || (p.descripcion && p.descripcion.toLowerCase().includes(t)));
        });
        renderProducts(f);
    };
    
    window.resetFilters = function() {
        document.getElementById('searchInput').value = '';
        const allBtn = document.querySelector('#categoryContainer button');
        if(allBtn) allBtn.click();
    };

})();
