// config.js - Configuraciones Globales de Cliente

export const CONFIG_BOT = {
    // === CONFIGURACIÓN DE LA EMPRESA (FRONTEND) ===
    nombre_empresa: "Frankos Chicken & Grill", 
    saludo_inicial: "¡Hola! Bienvenido a Frankos Chicken. ¿En qué puedo ayudarte hoy?", 
    icono_header: "FC", // Texto corto (ej: FC) o una URL de imagen (si el diseño lo permite).
    
    // === PERSONALIDAD DE LA IA (Se usa en el System Prompt) ===
    nombre: "Fedeliza",             // Nombre del asistente IA
    tono: "amable, profesional y directo", // Estilo de respuesta
    idioma: "español peruano",      // Idioma principal
    emoji_principal: "🍗",          // Emoji para usar con moderación
    moneda: "Soles (S/)"            // Moneda mencionada en el prompt
};

export const TECH_CONFIG = {
    // Configuración de la IA
    modelo: "deepseek-chat",            // Modelo de IA a usar.
    temperatura: 0.5,                   // Nivel de creatividad (Bajo para ser preciso).
    max_retries: 3,                     // Reintentos de conexión.

    // Configuración de UI
    color_principal: "#ea580c",          // Color de acento principal.
    whatsapp: "51999999999",            // SOLO NÚMEROS de WhatsApp para soporte.
    placeholder: "Escribe tu consulta...", // Texto del input
    
    // Seguridad (Frontend)
    max_length: 50,                     // Límite físico de caracteres en el input.
    min_input_length: 4,                // Evita consultas vacías o spam.
    
    // Límite de Mensajes para Demostración
    max_demo_messages: 3,               // Contador de mensajes totales para la demo.
    
    // Rate Limiting
    rate_limit_max_requests: 5,         // Máximo 5 mensajes...
    rate_limit_window_seconds: 60,      // ...por minuto.
};
