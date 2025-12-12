window.CHAT_CONFIG = {
    // === DISEÑO VISUAL ===
    titulo: "Asistente Frankos",
    colorPrincipal: "#d73618",
    saludoInicial: "¡Hola! Soy Frankos. ¿En qué puedo ayudarte? 🍗",
    placeholder: "Pregunta precios u horarios...",

    // === LÍMITE DE USO (FILTRO DE CORTESÍA DEL CLIENTE) ===
    // 30 mensajes cada 60 minutos. Se aplica por navegador.
    spamLimit: 30,
    spamDurationMinutes: 60,

    // === LISTA DE CEREBROS (Failover Automático) ===
    proveedores: [
        {
            nombre: "Gemini (Gratis)",
            tipo: "google",
            // Pega aquí tu llave de Google
            apiKey: "AIzaSyDSv_H9HytUFYDPmCQX8JJflZ7405HczAE", 
            modelo: "gemini-2.5-flash"
        },
        {
            nombre: "DeepSeek (Proxy Chain)",
            tipo: "openai-compatible",
            modelo: "deepseek-chat",
            // Tu clave de DeepSeek
            apiKey: "sk-TU_CLAVE_DEEPSEEK",
            // LISTA DE PROXIES: El sistema probará uno por uno con timeout
            proxies: [
                "https://worker1.tuapp.workers.dev/chat/completions",
                "https://worker2.tuapp.workers.dev/chat/completions",
                "https://api.deepseek.com/chat/completions" // Directo como último recurso
            ]
        }
    ]
};
