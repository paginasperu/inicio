import { CONFIG } from './config.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

const MOCK_RESPONSES = [
    "¡Hola! Esta es una respuesta simulada para Frankos Chicken. 😊",
    "Nuestros pollos a la brasa son los más crujientes de la zona.",
    "Puedes realizar tu pedido por WhatsApp en cualquier momento.",
    "¿Te gustaría conocer nuestras promociones del día?",
    "Llegaste al límite de la demo. ¡Activa la IA real para conversar más!"
];

let systemInstruction = "", conversationHistory = [], messageCount = 0;
const userInput = document.getElementById('userInput'), 
      sendBtn = document.getElementById('sendBtn'), 
      chatContainer = document.getElementById('chat-container'),
      feedbackDemoText = document.getElementById('feedback-demo-text'), 
      WA_LINK = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}`;

window.onload = () => {
    aplicarConfiguracionGlobal();
    cargarIA();
};

function aplicarConfiguracionGlobal() {
    document.title = CONFIG.NOMBRE_EMPRESA;
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.innerText = CONFIG.NOMBRE_EMPRESA;

    const headerIcon = document.getElementById('header-icon-initials');
    if (CONFIG.LOGO_URL && headerIcon) {
        headerIcon.innerHTML = `<img src="${CONFIG.LOGO_URL}" class="w-full h-full object-cover">`;
    } else if (headerIcon) {
        headerIcon.innerText = CONFIG.ICONO_HEADER;
    }
    userInput.placeholder = CONFIG.PLACEHOLDER_INPUT;
}

// Función Vital: Baja el scroll al final de forma inmediata
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function cargarIA() {
    try {
        const res = await fetch(`./prompt.txt?v=${CONFIG.VERSION}`);
        systemInstruction = res.ok ? await res.text() : "";
        document.getElementById('bot-welcome-text').innerText = CONFIG.SALUDO_INICIAL;
        toggleInput(true);
        scrollToBottom();
    } catch (e) { console.error("Error cargando IA", e); }
}

async function enviarMensaje() {
    const text = userInput.value.trim();
    if (!text) return;

    if (messageCount >= CONFIG.MAX_DEMO_MESSAGES) {
        agregarBurbuja(`Límite alcanzado. <a href="${WA_LINK}" class="underline font-bold">WhatsApp aquí</a>`, 'bot');
        userInput.value = "";
        return;
    }

    agregarBurbuja(text, 'user');
    userInput.value = "";
    messageCount++;
    actualizarContadorDemo();
    scrollToBottom();

    const loadId = mostrarLoading();
    scrollToBottom();

    setTimeout(() => {
        eliminarLoading(loadId);
        const reply = MOCK_RESPONSES[Math.min(messageCount - 1, MOCK_RESPONSES.length - 1)];
        agregarBurbuja(marked.parse(reply), 'bot');
        scrollToBottom(); // Bajamos después de que el bot responde
    }, 1000);
}

sendBtn.onclick = enviarMensaje;
userInput.onkeypress = (e) => { if (e.key === 'Enter') enviarMensaje(); };

// Si el usuario toca el input en móvil, bajamos el scroll tras un breve delay (esperando al teclado)
userInput.onfocus = () => { setTimeout(scrollToBottom, 300); };

function agregarBurbuja(html, tipo) {
    const div = document.createElement('div');
    div.className = tipo === 'user' 
        ? "p-3 max-w-[85%] text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto shadow-md" 
        : "p-3 max-w-[85%] text-sm bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start bot-bubble shadow-sm";
    
    if (tipo === 'user') { 
        div.style.backgroundColor = CONFIG.COLOR_PRIMARIO; 
        div.textContent = html; 
    } else { 
        div.innerHTML = html; 
    }
    chatContainer.appendChild(div);
}

function mostrarLoading() {
    const id = 'load-' + Date.now(), div = document.createElement('div');
    div.id = id; 
    div.className = "p-3 max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1 shadow-sm";
    div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot" style="animation-delay: 0.2s"></div><div class="typing-dot" style="animation-delay: 0.4s"></div>`;
    chatContainer.appendChild(div);
    return id;
}

function eliminarLoading(id) { const el = document.getElementById(id); if (el) el.remove(); }
function toggleInput(s) { userInput.disabled = !s; sendBtn.disabled = !s; }

function actualizarContadorDemo() {
    const remaining = CONFIG.MAX_DEMO_MESSAGES - messageCount;
    feedbackDemoText.innerText = remaining > 0 ? `DEMO: ${remaining} MENSAJES RESTANTES` : "LÍMITE ALCANZADO";
    if (remaining <= 0) feedbackDemoText.classList.replace('text-orange-500', 'text-red-600');
}
