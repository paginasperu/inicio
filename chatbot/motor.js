// MOTOR.JS - Sistema de Chat con DeepSeek AI

// === 1. CONFIGURACIÓN TÉCNICA (Desarrollador) ===
const TECH_CONFIG = {
    // URL del Proxy (Cloudflare Worker, rara vez cambia)
    deepSeekUrl: "https://deepseek-chat-proxy.precios-com-pe.workers.dev", 
    
    // Configuración de la IA (rara vez cambia)
    modelo: "deepseek-chat",
    temperatura: 0.7,
    
    // Configuraciones de UI y Contacto (Pequeñas, pueden cambiar)
    color_principal: "#ea580c", // Color naranja de Frankos Chicken
    whatsapp: "51999999999",    // WhatsApp de contacto
    placeholder: "Escribe tu consulta (carta, delivery, horario...)",
};

// === 2. VARIABLES GLOBALES ===
let CONFIG = {}; // Contendrá los datos cargados de contexto.txt
let systemInstruction = ""; 
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatContainer = document.getElementById('chat-container'); 

// === 3. LÓGICA DE PARSEO ASÍNCRONO (PARA CONTEXTO.TXT) ===
async function cargarYAnalizarContexto() {
    try {
        document.getElementById('status-text').innerText = "Cargando contexto...";
        const response = await fetch('contexto.txt');
        if (!response.ok) throw new Error("No se pudo cargar contexto.txt");
        const textoContexto = await response.text();
        
        const secciones = {};
        let currentSection = null;
        
        const regexSectionHeader = /^###\s*(\w+)$/; // Match only ###SECTION_NAME
        const regexKeyValue = /^(\w+):\s*(.*)$/; 

        // Primer paso: Separar el texto por bloques y extraer CONFIG
        textoContexto.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#') && !trimmedLine.startsWith('###')) return; // Ignorar comentarios

            let match;
            
            // 1. Identificar nueva sección de datos (###SECCION)
            if (match = trimmedLine.match(regexSectionHeader)) { 
                currentSection = match[1].toLowerCase();
                secciones[currentSection] = [];
            
            // 2. Extraer pares clave-valor SOLO de la sección de personalidad
            } else if (currentSection === 'personalidad_y_data' && (match = trimmedLine.match(regexKeyValue))) { 
                CONFIG[match[1].toLowerCase()] = match[2].trim();
                
            // 3. Si hay una sección de texto libre abierta, añadir la línea a su array
            } else if (currentSection) {
                 secciones[currentSection].push(trimmedLine);
            }
        });

        // 4. Procesamiento de Secciones
        const instruccionesArray = secciones['instrucciones'] || [];
        const conocimientoBaseArray = secciones['conocimiento_base'] || [];

        // 5. Ensamblar la Instrucción del Sistema

        // A. Instrucción base (plantilla)
        let instruccionFinal = instruccionesArray.join('\n');
        
        // Rellenar Placeholders
        instruccionFinal = instruccionFinal.replace(/\[nombre\]/g, CONFIG.nombre || 'Asistente');
        instruccionFinal = instruccionFinal.replace(/\[tono\]/g, CONFIG.tono || 'amable');
        instruccionFinal = instruccionFinal.replace(/\[emoji_principal\]/g, CONFIG.emoji_principal || '');
        instruccionFinal = instruccionFinal.replace(/\[idioma\]/g, CONFIG.idioma || 'español');
        instruccionFinal = instruccionFinal.replace(/\[moneda\]/g, CONFIG.moneda || 'Soles');
        instruccionFinal = instruccionFinal.replace(/\[whatsapp\]/g, TECH_CONFIG.whatsapp);
        instruccionFinal = instruccionFinal.replace(/\[nombre_empresa\]/g, CONFIG.nombre_empresa || 'Empresa');


        // B. Adjuntar la Base de Conocimiento (Puro Texto)
        const conocimientoBase = conocimientoBaseArray.filter(line => line.trim().length > 0).join('\n');
        
        instruccionFinal += `\n\n--- BASE DE CONOCIMIENTO (TEXTO PURO) ---\n`;
        instruccionFinal += `\n${conocimientoBase}`;
        instruccionFinal = instruccionFinal.replace(/\[base_de_conocimiento\]/g, "la BASE DE CONOCIMIENTO"); // Sustituir el placeholder en la plantilla


        return instruccionFinal;

    } catch (error) {
        console.error("Error al cargar o analizar contexto.txt:", error);
        document.getElementById('status-text').innerText = "Error de Contexto ⚠️";
        return `Eres un asistente virtual. No se pudo cargar el archivo de configuración. Por favor, usa el WhatsApp ${TECH_CONFIG.whatsapp} para cualquier consulta.`;
    }
}


// === 4. INICIO DEL SISTEMA ===
async function iniciarSistema() {
    // 0. Cargar el contexto (Asíncrono)
    systemInstruction = await cargarYAnalizarContexto();
    
    // 1. Aplicar Estilos y Configuración (Usando CONFIG y TECH_CONFIG)
    document.documentElement.style.setProperty('--chat-color', TECH_CONFIG.color_principal);
    document.getElementById('header-title').innerText = CONFIG.nombre_empresa || "Chat AI";
    document.getElementById('bot-welcome-text').innerText = CONFIG.saludo_inicial || "Hola. ¿En qué puedo ayudarte?";
    document.getElementById('status-text').innerText = "Conectado. Asistente IA 🤖";
    
    toggleInput(true);

    // 2. Eventos
    sendBtn.addEventListener('click', procesarMensaje);
    userInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            procesarMensaje();
        }
    });
}


// === 5. CEREBRO PRINCIPAL (Lógica IA) ===
async function procesarMensaje() {
    const textoUsuario = userInput.value.trim();
    if (!textoUsuario) return;

    agregarBurbuja(textoUsuario, 'user');
    userInput.value = '';
    toggleInput(false);
    
    const loadingId = mostrarLoading();
    
    try {
        const respuestaIA = await generarRespuestaIA(textoUsuario);
        
        document.getElementById(loadingId)?.remove();
        
        let contenidoHTML;
        
        if (respuestaIA.includes("Chatear por WhatsApp")) {
            contenidoHTML = respuestaIA;
        } else {
            contenidoHTML = marked.parse(respuestaIA);
        }
        
        agregarBurbuja(contenidoHTML, 'bot');
        
    } catch (error) {
        console.error("Error al llamar a la IA de DeepSeek:", error);
        document.getElementById(loadingId)?.remove();
        
        const linkWsp = `https://wa.me/${TECH_CONFIG.whatsapp}?text=${encodeURIComponent("Hola, tuve un problema con el chat IA sobre: " + textoUsuario)}`;
        const errorHtml = `
            ⚠️ Lo siento, no pude comunicarme con el asistente.
            <a href="${linkWsp}" class="chat-btn">Chatear por WhatsApp 🟢</a>
        `;
        agregarBurbuja(errorHtml, 'bot');
    } finally {
        toggleInput(true);
        userInput.focus();
    }
}

// Implementación del API de DeepSeek
async function generarRespuestaIA(textoUsuario) {
    const maxRetries = 3;
    let delay = 1000;

    const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: textoUsuario }
    ];
    
    const payload = {
        model: TECH_CONFIG.modelo, 
        messages: messages,
        temperature: TECH_CONFIG.temperatura,
        stream: false
    };
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(TECH_CONFIG.deepSeekUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error(`Error en la solicitud al Proxy! Código: ${response.status}`);
            
            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;
            
            if (content) return content;
            
            const fraseFail = `Lo siento, el modelo IA no pudo procesar tu solicitud. ¿Podrías reformular tu pregunta? 🧐`;
            const linkWsp = `https://wa.me/${TECH_CONFIG.whatsapp}?text=${encodeURIComponent("Consulta no respondida: " + textoUsuario)}`;
                
            return `${fraseFail}\n<a href="${linkWsp}" class="chat-btn">Chatear por WhatsApp 🟢</a>`;

        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
        }
    }
}


// === 6. UTILIDADES DE UI ===
function toggleInput(estado) {
    userInput.disabled = !estado;
    sendBtn.disabled = !estado;
    if (estado) setTimeout(() => userInput.focus(), 10);
}

function agregarBurbuja(html, tipo) {
    const container = chatContainer; 
    const div = document.createElement('div');
    const colorCliente = TECH_CONFIG.color_principal; 
    
    if (tipo === 'user') {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm text-white rounded-2xl rounded-tr-none self-end ml-auto";
        div.style.backgroundColor = colorCliente;
        div.textContent = html;
    } else {
        div.className = "p-3 max-w-[85%] shadow-sm text-sm bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none self-start mr-auto bot-bubble";
        div.innerHTML = html;
        const links = div.getElementsByTagName('a');
        for(let link of links) link.target = "_blank";
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function mostrarLoading() {
    const container = chatContainer;
    const id = 'load-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = "p-3 max-w-[85%] shadow-sm bg-white border border-gray-200 rounded-2xl rounded-tl-none self-start flex gap-1";
    div.innerHTML = `
        <div class="w-2 h-2 rounded-full typing-dot"></div>
        <div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.2s"></div>
        <div class="w-2 h-2 rounded-full typing-dot" style="animation-delay:0.4s"></div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

// Se ejecuta al cargar la ventana
window.onload = iniciarSistema;
