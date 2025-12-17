import { CONFIG } from './config.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

const MOCK_RESPONSES = [
    "¡Hola! Esta es una respuesta simulada para mostrarte cómo luce el chat. 😊",
    "Entiendo perfectamente tu consulta, pero recuerda que ahora estoy en modo de prueba.",
    "Como asistente virtual en demo, puedo decirte que el diseño se adapta a cualquier dispositivo.",
    "¡Qué buena pregunta! En la versión real, analizaría esto con inteligencia artificial avanzada.",
    "Llegaste al límite de la demostración. ¿Te gustaría activar la IA real ahora?"
];

let systemInstruction = "", conversationHistory = [], messageCount = 0, requestTimestamps = [];
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
    document.documentElement.style.setProperty('--chat-color', CONFIG.COLOR_PRIMARIO);
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.innerText = CONFIG.NOMBRE_EMPRESA;
    const headerIcon = document.getElementById('header-icon-initials');
    if (CONFIG.LOGO_URL && headerIcon) {
        headerIcon.innerHTML = `<img src="${CONFIG.LOGO_URL}" alt="${CONFIG.NOMBRE_EMPRESA}" class="w-full h-full object-contain rounded-full">`;
    } else if (headerIcon) {
        headerIcon.innerText = CONFIG.ICONO_HEADER;
    }
}

async function cargarIA() {
    try {
        // Usamos la versión de la configuración para el archivo prompt
        const res = await fetch(`./prompt.txt?v=${CONFIG.VERSION}`);
        systemInstruction = res.ok ? await res.text() : "";
        document.getElementById('bot-welcome-text').innerText = CONFIG.SALUDO_INICIAL;
        toggleInput(true);
    } catch (e) { console.error("Error al cargar la IA", e); }
}

async function enviarMensaje() {
    const text = userInput.value.trim();
    if (!text) return;
    agregarBurbuja(text, 'user');
    userInput.value = "";
    messageCount++;
    actualizarContadorDemo();

    if (messageCount >= CONFIG.MAX_DEMO_MESSAGES) {
        setTimeout(() => {
            agregarBurbuja(`Has alcanzado el límite. <a href="${WA_LINK}" class="underline font-bold">WhatsApp</a>`, 'bot');
            toggleInput(false);
        }, 500);
        return;
    }

    const loadingId = mostrarLoading();
    setTimeout(() => {
        eliminarLoading(loadingId);
        const respuesta = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        agregarBurbuja(marked.parse(respuesta), 'bot');
    }, 1000);
}

sendBtn.onclick = enviarMensaje;
userInput.onkeydown = (e) => { if (e.key === 'Enter' && !userInput.disabled) enviarMensaje(); };

function agregarBurbuja(html, tipo) {
    const div = document.createElement('div');
    div.className = tipo === 'user' 
        ? "p-3 max-w-[85%] text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto shadow-sm" 
        : "p-3 max-w-[85%] text-sm bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start bot-bubble shadow-sm";
    if (tipo === 'user') { div.style.backgroundColor = CONFIG.COLOR_PRIMARIO; div.textContent = html; }
    else { div.innerHTML = html; }
    chatContainer.appendChild(div);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function mostrarLoading() {
    const id = 'load-' + Date.now(), div = document.createElement('div');
    div.id = id; 
    div.className = "p-3 max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1 shadow-sm";
    div.innerHTML = `<div class="w-2 h-2 rounded-full typing-dot"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay: 0.2s"></div><div class="w-2 h-2 rounded-full typing-dot" style="animation-delay: 0.4s"></div>`;
    chatContainer.appendChild(div);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    return id;
}

function eliminarLoading(id) { const el = document.getElementById(id); if (el) el.remove(); }
function toggleInput(s) { userInput.disabled = !s; sendBtn.disabled = !s; }

function actualizarContadorDemo() {
    const remaining = CONFIG.MAX_DEMO_MESSAGES - messageCount;
    if (remaining > 0) {
        feedbackDemoText.innerText = `⚠️ Te quedan ${remaining} mensajes.`;
        feedbackDemoText.style.color = CONFIG.COLOR_PRIMARIO;
    } else {
        feedbackDemoText.innerText = "Límite alcanzado";
        feedbackDemoText.style.color = "#ef4444"; 
    }
}
