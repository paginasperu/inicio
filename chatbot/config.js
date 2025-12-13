window.CHAT_CONFIG = {
    // === DISEÑO VISUAL ===
    titulo: "Frankos Chicken & Grill 🍗",
    colorPrincipal: "#ea580c", // Un naranja parrilla (puedes cambiarlo a tu rojo de marca)
    
    // AQUÍ VA EL SALUDO (Se muestra solo una vez al inicio)
    saludoInicial: "¡Hola! Bienvenido a Frankos Chicken. Soy Fedeliza. ¿Qué se te antoja hoy? 🍗",
    
    placeholder: "Quiero un pollito a la brasa...",

    // === LÍMITE DE USO ===
    spamLimit: 30,
    spamDurationMinutes: 60,

    // === LISTA DE CEREBROS (Estrategia: Flash Lite) ===
    proveedores: [
        {
            nombre: "Gemini Flash Lite (Latest)",
            tipo: "google",
            // 👇 TU CLAVE AQUÍ
            apiKey: "AIzaSyAT_deiQjOuaiEedotekG2KV5aGsBrFZx4", 
            modelo: "gemini-flash-lite-latest"
        },
        {
            nombre: "Gemini 2.0 Flash Lite",
            tipo: "google",
            apiKey: "AIzaSyAT_deiQjOuaiEedotekG2KV5aGsBrFZx4", 
            modelo: "gemini-2.0-flash-lite-preview-02-05"
        },
        {
            nombre: "DeepSeek (Emergencia)",
            tipo: "openai-compatible",
            modelo: "deepseek-chat",
            apiKey: "CLAVE_DEEPSEEK_PENDIENTE", 
            proxies: [ "https://tu-proxy-1.workers.dev/chat/completions" ]
        }
    ]
};
