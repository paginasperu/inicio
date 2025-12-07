// filtros.js

function cargarFiltros() {
    // 1. Buscamos el lugar donde quieres poner el "shortcode"
    const contenedor = document.getElementById('shortcode-filtros');

    // Si no existe el contenedor (decidiste no poner filtros), no hacemos nada.
    if (!contenedor) return;

    // 2. Definimos el HTML de tus filtros (copiado de tu código anterior)
    const htmlFiltros = `
        <div class="filters-container">
            <input type="text" id="searchInput" class="search-box" placeholder="Buscar un premio...">
            
            <select id="categoryFilter" class="filter-select">
                <option value="all">Categoría (Todas)</option>
                <option value="tecnologia">Tecnología</option>
                <option value="deporte">Deporte</option>
                <option value="accesorios">Accesorios</option>
                <option value="escolar">Escolar</option>
            </select>
            
            <select id="vendorFilter" class="filter-select">
                <option value="all">Negocio (Todos)</option>
                <option value="nike">Nike Store</option>
                <option value="ishop">iShop</option>
                <option value="sony">Sony Center</option>
                <option value="falabella">Falabella</option>
                <option value="augusto">I.E. Augusto Salazar Bondy</option>
            </select>
        </div>
    `;

    // 3. Inyectamos el HTML dentro del div
    contenedor.innerHTML = htmlFiltros;

    // 4. IMPORTANTE: Ahora que el HTML existe, activamos los "escuchadores" (Listeners)
    // Esto conecta los inputs con tu función de filtrado principal
    document.getElementById('searchInput').addEventListener('input', filterRewards);
    document.getElementById('categoryFilter').addEventListener('change', filterRewards);
    document.getElementById('vendorFilter').addEventListener('change', filterRewards);
    
    console.log("Filtros cargados correctamente.");
}
