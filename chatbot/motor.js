// MOTOR.JS - Lógica Central + Sistema Multi-IA
// Versión optimizada para Gemini 1.5 Flash con Failover robusto.

// === VARIABLES GLOBALES ===
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const statusText = document.getElementById('status-text');

let pageLoadedAt = Date.now(); // Para evitar bots que cargan y envían al instante
let isProcessing = false; // Semáforo para evitar doble envío
// ==========================

// === INICIO DEL SISTEMA ===
async function iniciarSistema() {
    const config = window.CHAT_CONFIG || {};
    
    // 1. Aplicar Textos (El color lo maneja index.html para evitar parpadeos)
    document.getElementById('header-title').innerText = config.titulo || "Asistente";
    document.getElementById('bot-welcome-text').innerText = config.saludoInicial || "Hola";
    userInput.placeholder = config.placeholder || "Escribe aquí...";

    try {
        // 2. Cargar Archivos de Texto (Contexto del negocio)
        const [resDatos, resInstrucciones] = await Promise.all([
            fetch('datos.txt'),
            fetch('instrucciones.txt')
        ]);

        if (!resDatos.ok || !resInstrucciones.ok) throw new Error("Faltan archivos txt");

        window.CTX_DATOS = await resDatos.text();
        window.CTX_INSTRUCCIONES = await resInstrucciones.text();

        // 3. Activar Chat
        userInput.disabled = false;
        sendBtn.disabled = false;
        statusText.innerText = "En línea";
        statusText.classList.remove('animate-pulse');
        console.log("Sistema cargado y listo.");

        // 4. Detectar tecla ENTER
        userInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                enviarMensaje();
            }
        });

    } catch (error) {
        console.error(error);
        statusText.innerText = "Error Config";
        agregarBurbuja("⚠️ Error: No pude cargar la información del negocio.", 'bot');
    }
}

// === FUNCIÓN AUXILIAR: FETCH CON TIMEOUT ===
// Si la API tarda más de 10s, abortamos para probar el siguiente proveedor
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 10000 } = options; 
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
    });
    clearTimeout(id);
    return response;
}

// === LÓGICA DE REINTENTO (FAILOVER) ===
async function llamarIA(prompt) {
    const proveedores = window.CHAT_CONFIG?.proveedores; 
    if (!proveedores || proveedores.length === 0) {
        throw new Error("No hay proveedores configurados.");
    }

    let ultimoError = null;

    // BUCLE: Recorre los proveedores (1.5 Flash -> 1.5 Pro -> 1.0 Pro)
    for (let i = 0; i < proveedores.length; i++) {
        const prov = proveedores[i];
        console.log(`🤖 Intentando con Proveedor: ${prov.nombre}...`);

        try {
            let respuesta = "";

            if (prov.tipo === "google") {
                // --- LÓGICA GEMINI ---
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${prov.modelo}:generateContent?key=${prov.apiKey}`;
                const res = await fetchWithTimeout(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                    timeout: 10000 // 10s timeout
                });
                
                if (!res.ok) throw new Error(`Gemini Error: ${res.status} (${res.statusText})`);
                const data = await res.json();
                
                // Validación extra por si la respuesta viene vacía
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error("Gemini devolvió una respuesta vacía o bloqueada.");
                }
                
                respuesta = data.candidates[0].content.parts[0].text;

            } else if (prov.tipo === "openai-compatible") {
                // --- LÓGICA COMPATIBLE (DeepSeek/Otros) ---
                const listaProxies = prov.proxies?.length ? prov.proxies : (prov.url ? [prov.url] : []);
                if (listaProxies.length === 0) throw new Error("Sin URLs de proxy configuradas.");

                // Sub-bucle de proxies
                for (let p = 0; p < listaProxies.length; p++) {
                    try {
                        const res = await fetchWithTimeout(listaProxies[p], {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${prov.apiKey}`
                            },
                            body: JSON.stringify({
                                model: prov.modelo,
                                messages: [
                                    { role: "system", content: "Eres un asistente útil." },
                                    { role: "user", content: prompt }
                                ]
                            }),
                            timeout: 12000 
                        });
                        if (!res.ok) throw new Error(`Status ${res.status}`);
                        const data = await res.json();
                        respuesta = data.choices?.[0]?.message?.content;
                        if (respuesta) break; // Éxito con el proxy
                    } catch (e) {
                        console.warn(`   ❌ Proxy falló: ${e.message}`);
                    }
                }
                if (!respuesta) throw new Error("Todos los proxies fallaron.");
            }

            if (respuesta) return respuesta; // Éxito total, retornamos la respuesta

        } catch (e) {
            console.warn(`⚠️ Falló ${prov.nombre}. Saltando al siguiente... Error: ${e.message}`);
            ultimoError = e;
            // El bucle for continúa automáticamente con el siguiente proveedor
        }
    }

    throw ultimoError || new Error("Todos los sistemas fallaron.");
}

// === FUNCIÓN PRINCIPAL DE ENVÍO ===
async function enviarMensaje() {
    
    // 1. BLOQUEO DE SEGURIDAD (Evita doble clic)
    if (isProcessing) return; 
    isProcessing = true;

    // 2. HONEYPOT (Anti-Bot)
    const trampa = document.getElementById('honeypot');
    if (trampa && trampa.value !== "") {
        isProcessing = false; return; 
    } 

    // 3. TIEMPO MÍNIMO (Evita ejecución instantánea al cargar)
    if (Date.now() - pageLoadedAt < 2000) {
        isProcessing = false; return; 
    }

    const pregunta = userInput.value.trim();
    if (!pregunta) {
        isProcessing = false; return;
    }

    // 4. LÍMITE DE SPAM (Cortesía)
    if (!checkSpam()) {
        agregarBurbuja("⏳ Has enviado demasiados mensajes. Por favor espera un poco.", 'bot');
        isProcessing = false; return;
    }

    // --- INTERFAZ: ENVIANDO ---
    agregarBurbuja(pregunta, 'user');
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true; 
    const loadingId = mostrarLoading();

    try {
        const promptFinal = `
            ${window.CTX_INSTRUCCIONES}
            INFORMACIÓN DEL NEGOCIO:
            ${window.CTX_DATOS}
            PREGUNTA DEL USUARIO:
            ${pregunta}
        `;

        const respuestaIA = await llamarIA(promptFinal);
        
        document.getElementById(loadingId)?.remove();
        const contenido = (typeof marked !== 'undefined') ? marked.parse(respuestaIA) : respuestaIA;
        agregarBurbuja(contenido, 'bot');

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        console.error(error);
        agregarBurbuja("😔 Lo siento, tengo problemas de conexión en este momento.", 'bot');
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false; 
        isProcessing = false; // DESBLOQUEAR
        userInput.focus();
    }
}

// === ANTI-SPAM (Memoria + LocalStorage) ===
function checkSpam() {
    const config = window.CHAT_CONFIG || {};
    const LIMITE = config.spamLimit || 30; 
    const TIEMPO = (config.spamDurationMinutes || 60) * 60 * 1000;
    const ahora = Date.now();
    let log = [];

    try {
        const stored = localStorage.getItem('chat_logs');
        if (stored) log = JSON.parse(stored);
    } catch (e) {
        if (!window.tempSpamLog) window.tempSpamLog = [];
        log = window.tempSpamLog;
    }

    log = log.filter(t => ahora - t < TIEMPO);

    if (log.length >= LIMITE) return false;

    log.push(ahora);

    try {
        localStorage.setItem('chat_logs', JSON.stringify(log));
    } catch (e) {
        window.tempSpamLog = log;
    }
    return true;
}

// === INTERFAZ GRÁFICA ===
function agregarBurbuja(html, tipo) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    const colorCliente = window.CHAT_CONFIG?.colorPrincipal || "#2563eb";
    
    if (tipo === 'user') {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto";
        div.style.backgroundColor = colorCliente;
        div.textContent = html;
    } else {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none self-start mr-auto";
        div.innerHTML = html;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function mostrarLoading() {
    const container = document.getElementById('chat-container');
    const id = 'load-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = "p-3 max-w-[85%] shadow-sm bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1";
    div.innerHTML = `
        <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot" style="animation-delay:0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot" style="animation-delay:0.4s"></div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

window.onload = iniciarSistema;
