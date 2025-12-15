// funciones.js - Lógica de Negocio, Seguridad y Conexión

// IMPORTACIONES MODULARES
import { APP_CONFIG, UI_CONFIG, AI_CONFIG, SEGURIDAD_CONFIG } from './ajustes.js'; 
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js'; 

// === VARIABLES GLOBALES ===
let systemInstruction = ""; 
let conversationHistory = []; 
// Elementos del Chat
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chat-container'); 
const chatInterface = document.getElementById('chat-interface'); 
// Elementos del Acceso
const accessGate = document.getElementById('access-gate'); 
const keyInput = document.getElementById('keyInput');     
const keySubmit = document.getElementById('keySubmit');   
const keyPrompt = document.getElementById('key-prompt');  
const keyError = document.getElementById('keyError');     
// Elementos de Texto (NUEVOS)
const footerText = document.getElementById('footer-text'); 
const headerIconInitials = document.getElementById('header-icon-initials'); 


const WA_LINK = `https://wa.me/${UI_CONFIG.WHATSAPP_NUMERO}`;
const requestTimestamps = []; 
let messageCount = 0;         


// === CONFIGURACIÓN DINÁMICA DEL DOM (PULIDA) ===
function aplicarConfiguracionGlobal() {
    // 1. Título de la pestaña y Meta Descripción (SEO)
    document.title = `${APP_CONFIG.NOMBRE_EMPRESA} ${APP_CONFIG.TITLE_SUFFIX}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", APP_CONFIG.META_DESCRIPTION);

    // 2. Favicon Dinámico
    const linkIcon = document.querySelector("link[rel*='icon']");
    if (linkIcon) {
        linkIcon.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${UI_CONFIG.FAVICON_EMOJI}</text></svg>`;
    }

    // 3. Colores y Textos Visuales
    document.documentElement.style.setProperty('--chat-color', UI_CONFIG.COLOR_PRIMARIO);
    
    // === LÓGICA CONDICIONAL DEL LOGO ===
    if (UI_CONFIG.LOGO_URL && headerIconInitials) {
        // Opción 1: Usar URL de Imagen
        const img = document.createElement('img');
        img.src = UI_CONFIG.LOGO_URL;
        img.alt = APP_CONFIG.NOMBRE_EMPRESA;
        img.className = 'w-full h-full object-contain';
        headerIconInitials.innerHTML = '';
        headerIconInitials.appendChild(img);
    } else if (headerIconInitials) {
        // Opción 2: Usar Iniciales/Emoji
        headerIconInitials.innerText = UI_CONFIG.ICONO_HEADER;
    }
    
    // Header Title (Si está cargando, poner nombre empresa)
    const headerTitle = document.getElementById('header-title');
    if (headerTitle.innerText === "Cargando...") headerTitle.innerText = APP_CONFIG.NOMBRE_EMPRESA;

    // === Textos del Gate y Footer ===
    keyPrompt.innerText = UI_CONFIG.TEXTO_CLAVE_ACCESO;
    keySubmit.innerText = UI_CONFIG.TEXTO_BOTON_ACCESO;
    
    if (footerText) footerText.innerText = UI_CONFIG.FOOTER_TEXTO;
}


// === FUNCIÓN DE CARGA DE CONTEXTO (OPTIMIZADA) ===
async function cargarYAnalizarContexto() {
    try {
        document.getElementById('status-text').innerText = "Cargando sistema...";

        // CAMBIO CRÍTICO: SOLO UNA LLAMADA A CONTEXTO.TXT
        const resContexto = await fetch('./contexto.txt'); 

        if (!resContexto.ok) throw new Error("Error cargando archivo de contexto (contexto.txt)");

        let systemInstruction = await resContexto.text();
        
        // Reemplazo de variables en el CONTEXTO (solo nombre de la empresa)
        systemInstruction = systemInstruction
            .replace(/\[nombre_empresa\]/g, APP_CONFIG.NOMBRE_EMPRESA || 'Empresa');
            // Nota: [whatsapp_link] se mantiene como token para ser devuelto por la IA.

        if (AI_CONFIG.ENABLE_LOGGING) console.log("Contexto IA cargado exitosamente.");
        return systemInstruction;

    } catch (error) {
        if (AI_CONFIG.ENABLE_LOGGING) console.error("Error crítico en carga de contexto:", error);
        return "Error de sistema. Contacte a soporte.";
    }
}


// === RESTO DE FUNCIONES (SIN CAMBIOS FUNCIONALES) ===
function checkRateLimit() {
    const now = Date.now();
    const windowMs = SEGURIDAD_CONFIG.RATE_LIMIT_WINDOW_SECONDS * 1000;
    
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - windowMs) {
        requestTimestamps.shift();
    }

    if (requestTimestamps.length >= SEGURIDAD_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        if (AI_CONFIG.ENABLE_LOGGING) console.warn("Rate limit activado por IP.");
        return { 
            limitReached: true, 
            retryAfter: Math.ceil((requestTimestamps[0] + windowMs - now) / 1000) 
        };
    }
    
    requestTimestamps.push(now);
    return { limitReached: false };
}

function setupAccessGate() {
    keySubmit.style.backgroundColor = UI_CONFIG.COLOR_PRIMARIO;
    
    const checkKey = () => {
        const input = keyInput.value.trim().toLowerCase();
        const realKey = SEGURIDAD_CONFIG.CLAVE_ACCESO.toLowerCase();

        const isBypassEnabled = realKey === "";
        const isCorrectKey = input === realKey;
        
        if (isCorrectKey || isBypassEnabled) {
            keyError.classList.add('hidden');
            accessGate.classList.add('hidden');
            chatInterface.classList.remove('hidden');
            cargarIA(); 
        } else {
            keyError.classList.remove('hidden');
            keyInput.value = '';
            keyInput.focus();
        }
    };
    
    keySubmit.addEventListener('click', checkKey);
    keyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            checkKey(); 
        }
    });
}

async function cargarIA() {
    systemInstruction = await cargarYAnalizarContexto();
    
    // UI Setup Final
    document.getElementById('header-title').innerText = APP_CONFIG.NOMBRE_EMPRESA || "Chat";
    document.getElementById('bot-welcome-text').innerText = UI_CONFIG.SALUDO_INICIAL || "Hola.";
    document.getElementById('status-text').innerText = "En línea 🟢";
    
    // Input Security Setup
    userInput.setAttribute('maxlength', SEGURIDAD_CONFIG.MAX_LENGTH_INPUT);
    userInput.setAttribute('placeholder', UI_CONFIG.PLACEHOLDER_INPUT);
    
    toggleInput(true);

    sendBtn.addEventListener('click', procesarMensaje);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); procesarMensaje(); }
    });
}

async function iniciarSistema() {
    aplicarConfiguracionGlobal();
    
    if (SEGURIDAD_CONFIG.CLAVE_ACCESO) {
        setupAccessGate();
    } else {
        accessGate.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        cargarIA();
    }
}

async function procesarMensaje() {
    const textoUsuario = userInput.value.trim();
    
    if (messageCount >= SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
        const demoEndMsg = `🛑 ¡Demo finalizado! Has alcanzado el límite de ${SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES} mensajes. Por favor, contáctanos para continuar.`;
        if (messageCount === SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
             agregarBurbuja(demoEndMsg, 'bot');
             messageCount++;
        }
        userInput.value = '';
        toggleInput(false);
        return;
    }
    
    if (UI_CONFIG.SHOW_REMAINING_MESSAGES && 
        messageCount >= SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES - UI_CONFIG.WARNING_THRESHOLD &&
        messageCount < SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
        
        const remaining = SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES - messageCount;
        agregarBurbuja(`⚠️ Atención: Te quedan ${remaining} mensaje(s) de demostración.`, 'bot');
    }

    if (!textoUsuario) return;
    if (textoUsuario.length < SEGURIDAD_CONFIG.MIN_LENGTH_INPUT || textoUsuario.length > SEGURIDAD_CONFIG.MAX_LENGTH_INPUT) {
        if (AI_CONFIG.ENABLE_LOGGING) console.warn("Input no válido por longitud.");
        userInput.value = ''; 
        return; 
    }

    const limit = checkRateLimit();
    if (limit.limitReached) {
        agregarBurbuja(`⚠️ Demasiadas consultas. Espera ${limit.retryAfter}s.`, 'bot');
        userInput.value = '';
        return;
    }

    agregarBurbuja(textoUsuario, 'user');
    
    conversationHistory.push({ role: "user", content: textoUsuario });
    
    userInput.value = '';
    toggleInput(false);
    const loadingId = mostrarLoading();
    
    try {
        const respuesta = await llamarIA(); 
        document.getElementById(loadingId)?.remove();
        
        conversationHistory.push({ role: "assistant", content: respuesta });

        const whatsappCheck = `[whatsapp_link]`;
        let htmlFinal = "";

        if (respuesta.includes(whatsappCheck)) {
            // Si la IA devuelve el token de falla, separamos el texto (si hay) y adjuntamos el CTA.
            const cleanText = respuesta.replace(whatsappCheck, 'Para más detalles, comunícate por WhatsApp.');
            const btnLink = `<a href="${WA_LINK}?text=${encodeURIComponent('Necesito ayuda con la consulta: ' + textoUsuario)}" target="_blank" class="chat-btn">Contáctanos aquí</a>`;
            htmlFinal = marked.parse(cleanText) + btnLink;
        } else {
            htmlFinal = marked.parse(respuesta);
        }
        
        agregarBurbuja(htmlFinal, 'bot');
        messageCount++;

    } catch (e) {
        document.getElementById(loadingId)?.remove();
        if (AI_CONFIG.ENABLE_LOGGING) console.error("Error en llamada IA:", e);
        agregarBurbuja(`Error de conexión o timeout. <a href="${WA_LINK}" class="chat-btn">WhatsApp</a>`, 'bot');
    } finally {
        if (messageCount >= SEGURIDAD_CONFIG.MAX_DEMO_MESSAGES) {
            toggleInput(false);
        } else {
            toggleInput(true);
            userInput.focus();
        }
    }
}

async function llamarIA() {
    const { MODELO, TEMPERATURA, RETRY_LIMIT, RETRY_DELAY_MS, URL_PROXY, TIMEOUT_MS, MAX_TOKENS_RESPONSE, MAX_CONTEXT_MESSAGES } = AI_CONFIG; 
    let delay = RETRY_DELAY_MS;
    
    let messages = [
        { role: "system", content: systemInstruction }
    ];

    const contextStart = Math.max(0, conversationHistory.length - MAX_CONTEXT_MESSAGES);
    messages = messages.concat(conversationHistory.slice(contextStart));


    for (let i = 0; i < RETRY_LIMIT; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const res = await fetch(URL_PROXY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODELO, 
                    messages: messages, 
                    temperature: TEMPERATURA,
                    max_tokens: MAX_TOKENS_RESPONSE, 
                    stream: false
                }),
                signal: controller.signal 
            });

            clearTimeout(timeoutId); 

            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            const data = await res.json();
            
            return data.choices?.[0]?.message?.content || "No entendí, ¿puedes repetir?";

        } catch (err) {
            if (err.name === 'AbortError') {
                throw new Error("API Timeout");
            }
            if (i === RETRY_LIMIT - 1) throw err;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; 
        }
    }
}

function toggleInput(state) {
    userInput.disabled = !state;
    sendBtn.disabled = !state;
}

function agregarBurbuja(html, tipo) {
    const div = document.createElement('div');
    if (tipo === 'user') {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto";
        div.style.backgroundColor = UI_CONFIG.COLOR_PRIMARIO;
        div.textContent = html; 
    } else {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none self-start mr-auto bot-bubble";
        div.innerHTML = html; 
    }
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function mostrarLoading() {
    const id = 'load-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = "p-3 max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1";
    // CORRECCIÓN: Se asegura w-2 h-2 para que los puntos sean visibles
    div.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.4s"></div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight; 
    return id;
}

window.onload = iniciarSistema;
