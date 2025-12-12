window.CHAT_CONFIG = {
    // === DISEÑO VISUAL ===
    titulo: "Asistente Dra. Ana",
    colorPrincipal: "#2563eb",
    saludoInicial: "¡Hola! Soy Ana. ¿En qué puedo ayudarte? 🦷",
    placeholder: "Pregunta precios o horarios...",

    // === LISTA DE CEREBROS (Failover Automático) ===
    proveedores: [
        {
            nombre: "Gemini (Gratis)",
            tipo: "google",
            // Pega aquí tu llave de Google
            apiKey: "", 
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
