window.CHAT_CONFIG = {
    // === DISEÑO VISUAL ===
    titulo: "Asistente Dra. Ana",
    colorPrincipal: "#2563eb",
    saludoInicial: "¡Hola! Soy Ana. ¿En qué puedo ayudarte? 🦷",
    placeholder: "Pregunta precios o horarios...",

    // === LÍMITE DE USO (FILTRO DE CORTESÍA DEL CLIENTE) ===
    spamLimit: 30,
    spamDurationMinutes: 60,

    // === LISTA DE CEREBROS (Estrategia: Estabilidad Máxima -> 1.5) ===
    proveedores: [
        {
            // INTENTO 1: Modelo 1.0 Pro (Máxima Compatibilidad).
            // Si este falla, significa que la clave está totalmente bloqueada.
            nombre: "Gemini 1.0 Pro (MAX Compatibilidad)",
            tipo: "google",
            apiKey: "AIzaSyDSv_H9HytUFYDPmCQX8JJflZ7405HczAE", 
            modelo: "gemini-1.0-pro"
        },
        {
            // INTENTO 2: 1.5 Flash (El que deseamos usar a largo plazo)
            nombre: "Gemini 1.5 Flash (Alta Disponibilidad)",
            tipo: "google",
            apiKey: "AIzaSyDSv_H9HytUFYDPmCQX8JJflZ7405HczAE", 
            modelo: "gemini-1.5-flash"
        },
        {
            // INTENTO 3: 1.5 Pro (El de mayor razonamiento)
            nombre: "Gemini 1.5 Pro (Respaldo)",
            tipo: "google",
            apiKey: "AIzaSyDSv_H9HytUFYDPmCQX8JJflZ7405HczAE", 
            modelo: "gemini-1.5-pro"
        },
        {
            // ÚLTIMO RECURSO: DeepSeek (Solo si tienes proxy configurado)
            nombre: "DeepSeek (Emergencia)",
            tipo: "openai-compatible",
            modelo: "deepseek-chat",
            apiKey: "CLAVE_DEEPSEEK_PENDIENTE", 
            proxies: [
                "https://tu-proxy-1.workers.dev/chat/completions"
            ]
        }
    ]
};
