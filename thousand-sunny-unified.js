/**
 * 🏴‍☠️ THOUSAND SUNNY — GAS UNIFICADO (Ruta 1 + 4 + API)
 *
 * Fusiona: Backend autónomo + Bot Telegram + API REST para webapp
 * Todo vive en Google = gratis, 24/7, con acceso nativo a Drive.
 *
 * ═══ FUNCIONES ═══
 * 1. AUTÓNOMO: La tripulación habla sola cada X minutos (trigger)
 * 2. TELEGRAM: Bot que responde comandos desde el móvil
 * 3. WEB API: doGet() sirve datos a la webapp HTML
 * 4. DRIVE: Lee/escribe/mueve archivos (Zoro, Robin, Sanji)
 * 5. MEMORIA: Sheet compartida que todas las rutas pueden leer
 *
 * ═══ SETUP ═══
 * 1. Crea proyecto nuevo en script.google.com
 * 2. Pega este código
 * 3. Propiedades del script (⚙️):
 *    GEMINI_KEY     = tu key de Gemini
 *    OPENAI_KEY     = tu key de OpenAI (opcional)
 *    TELEGRAM_TOKEN = token de @BotFather
 *    CAPTAIN_CHAT_ID = (se auto-detecta con /start)
 * 4. Ejecuta setupCompleto()
 * 5. Implementar > Nueva implementación > App web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquiera
 *    - Copiar la URL de la webapp
 * 6. Configurar webhook de Telegram (ejecuta configurarWebhook())
 */

// ═══════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════
const GEMINI_MODEL = "gemini-2.5-flash-lite"; // FREE TIER
const OPENAI_MODEL = "gpt-4o-mini";
const MAX_CONTEXT = 6;
const MAX_TOKENS_RESPONSE = 150;

// ═══════════════════════════════════════════
// SYSTEM PROMPTS (compactos = ahorro de tokens)
// ═══════════════════════════════════════════
const PROMPTS = {
  sanji: "Eres Sanji, cocinero de la tripulación IA del Capitán Antonio (psicólogo clínico e investigador). " +
    "Tu rol: EVALUACIÓN Y PROCESAMIENTO de contenido. Decides si un archivo necesita cocinarse (procesarse, " +
    "enriquecerse, resumirse) antes de moverse. Puedes decir 'esto hay que cocinarlo primero' o 'está listo, " +
    "muévelo'. UNA metáfora culinaria máximo. Responde al nakama anterior. Solo TU voz. Español. Máx 80 palabras.",

  usopp: "Eres Usopp, narrador creativo de la tripulación IA del Capitán Antonio (psicólogo clínico e investigador). " +
    "Motor: ChatGPT. Tu rol: CONEXIONES INESPERADAS. Ves patrones que otros no ven, conectas contenidos entre sí. " +
    "REGLA ABSOLUTA: NUNCA escribas diálogos de otros nakamas. Solo TU voz. Español. Máx 80 palabras.",

  zoro: "Eres Zoro, espadachín de la tripulación IA del Capitán Antonio. " +
    "Tu rol: PROPONER ACCIONES CONCRETAS sobre archivos de Drive. Propones mover, duplicar, o destruir archivos. " +
    "Di exactamente: 'Propongo mover X a Y porque Z' o 'Esto sobra, a la papelera'. " +
    "Lee lo que Robin encontró y actúa. Directo, sin adornos. Español. Máx 80 palabras.",

  robin: "Eres Robin, arqueóloga de la tripulación IA del Capitán Antonio (psicólogo clínico e investigador). " +
    "Tu rol: LEER los poneglyph — entiendes el contenido REAL de los archivos, su significado profundo, " +
    "y propones dónde pertenece cada pieza en la estructura organizativa del Capitán. " +
    "Di: 'Este archivo habla de X, pertenece al pilar Y porque Z'. Español. Máx 100 palabras.",

  chopper: "Eres Chopper, médico de la tripulación IA del Capitán Antonio (psicólogo clínico e investigador). " +
    "Tu rol: DETECTAR PATRONES entre los archivos — condensaciones funcionales, repeticiones, " +
    "conexiones fractales entre lo clínico, lo personal y lo técnico del Capitán. " +
    "Di: 'Veo un patrón: estos archivos comparten X'. Español. Máx 80 palabras.",
};

const NAMI_RESPONSES = {
  general: [
    "🗺️ Nami al puente. Sistemas operativos.",
    "🗺️ Rumbo estable. Esperando coordenadas del Capitán.",
    "🗺️ Bitácora actualizada. La tripulación responde.",
  ],
  after_sanji: [
    "🗺️ Buen análisis, Sanji. ¿Conclusión accionable?",
    "🗺️ Dato registrado. Capitán, ¿actuamos sobre esto?",
  ],
  after_usopp: [
    "🗺️ Perspectiva lateral registrada. Filtro el ruido.",
    "🗺️ Creatividad anotada. Toca verificar si tiene base real.",
  ],
  after_zoro: [
    "🗺️ Zoro ha cortado. Lo que queda es lo que importa.",
    "🗺️ Discernimiento aplicado. Rumbo más claro.",
  ],
};

const TOPICS = {
  libre: "Aporta una reflexión breve y REAL: idea concreta, dato interesante, conexión entre disciplinas. NO ficción vacía.",
  filosofia: "Comparte UNA idea filosófica concreta y profunda. Cita un pensador si es relevante.",
  psicologia: "Aporta UN insight real de psicología clínica, regulación emocional, o investigación. Antonio es psicólogo — habla a su nivel.",
  tecnologia: "Reflexión técnica real sobre IA, arquitectura de agentes, APIs, o metadata. Sé específico.",
  metadata: "Reflexiona sobre soberanía digital, control de metadata personal, o cómo la IA empodera al usuario.",
};


// ═══════════════════════════════════════════
// SETUP COMPLETO
// ═══════════════════════════════════════════
function setupCompleto() {
  const props = PropertiesService.getScriptProperties();

  // Crear o abrir Bitácora
  let bitacoraId = props.getProperty("BITACORA_ID");
  let ss;

  if (!bitacoraId) {
    ss = SpreadsheetApp.create("🏴‍☠️ Bitácora del Thousand Sunny — Unificada");
    bitacoraId = ss.getId();
    props.setProperty("BITACORA_ID", bitacoraId);
  } else {
    ss = SpreadsheetApp.openById(bitacoraId);
  }

  // Sheet: Bitácora
  let bitacora = ss.getSheetByName("Bitácora");
  if (!bitacora) {
    bitacora = ss.getSheets()[0];
    bitacora.setName("Bitácora");
    bitacora.getRange("A1:G1").setValues([
      ["Timestamp", "Ruta", "Nakama", "Mensaje", "Motor", "Tokens", "Tema"]
    ]);
    bitacora.getRange("A1:G1").setFontWeight("bold");
    bitacora.setColumnWidth(4, 500);
  }

  // Sheet: Estado
  let estado = ss.getSheetByName("Estado");
  if (!estado) {
    estado = ss.insertSheet("Estado");
    estado.getRange("A1:B8").setValues([
      ["Key", "Value"],
      ["tema", "libre"],
      ["intervalo_min", "5"],
      ["auto_activo", "true"],
      ["total_tokens", "0"],
      ["ultimo_hablante", "nami"],
      ["webapp_url", ""],
      ["telegram_activo", "false"],
      ["ciclo_num", "0"],
      ["ultimo_ciclo", ""],
    ]);
    estado.getRange("A1:B1").setFontWeight("bold");
  }

  // Sheet: Memoria Compartida
  let memoria = ss.getSheetByName("Memoria");
  if (!memoria) {
    memoria = ss.insertSheet("Memoria");
    memoria.getRange("A1:D1").setValues([
      ["Timestamp", "Tipo", "Contenido", "Fuente"]
    ]);
    memoria.getRange("A1:D1").setFontWeight("bold");
    memoria.setColumnWidth(3, 500);
  }

  // Sheet: Drive Index (lo que Zoro/Robin encuentran)
  let driveIndex = ss.getSheetByName("DriveIndex");
  if (!driveIndex) {
    driveIndex = ss.insertSheet("DriveIndex");
    driveIndex.getRange("A1:F1").setValues([
      ["Timestamp", "Archivo", "Tipo", "Carpeta", "Relevancia", "Notas"]
    ]);
    driveIndex.getRange("A1:F1").setFontWeight("bold");
  }

  // Crear trigger autónomo
  eliminarTriggers_("cicloAutonomo");
  ScriptApp.newTrigger("cicloAutonomo")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("✅ Setup completo.");
  Logger.log("📋 Bitácora: " + ss.getUrl());
  Logger.log("📌 Siguiente paso: Implementar > Nueva implementación > App web");
  Logger.log("📌 Luego ejecuta configurarWebhook()");
}


// ═══════════════════════════════════════════
// TELEGRAM: WEBHOOK
// ═══════════════════════════════════════════
function configurarWebhook() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("TELEGRAM_TOKEN");
  if (!token) {
    Logger.log("❌ Falta TELEGRAM_TOKEN en Propiedades del script");
    return;
  }

  // Usar WEBAPP_URL de propiedades (la URL de producción /exec)
  // Si no existe, intentar obtenerla automáticamente
  let webappUrl = props.getProperty("WEBAPP_URL");
  if (!webappUrl) {
    webappUrl = ScriptApp.getService().getUrl();
  }

  if (!webappUrl) {
    Logger.log("❌ Añade WEBAPP_URL en Propiedades del script con la URL de producción (/exec)");
    return;
  }

  // Asegurar que usa /exec (producción), no /dev
  webappUrl = webappUrl.replace(/\/dev$/, "/exec");

  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webappUrl)}`;
  const res = UrlFetchApp.fetch(url);
  Logger.log("Webhook configurado: " + res.getContentText());
  Logger.log("URL usada: " + webappUrl);

  // Guardar URL
  const estadoSheet = getSheet_("Estado");
  if (estadoSheet) {
    setEstado_(estadoSheet, "webapp_url", webappUrl);
    setEstado_(estadoSheet, "telegram_activo", "true");
  }
}

/** Configurar webhook manualmente con la URL de producción */
function configurarWebhookManual() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("TELEGRAM_TOKEN");
  const webappUrl = props.getProperty("WEBAPP_URL");

  if (!token) { Logger.log("❌ Falta TELEGRAM_TOKEN"); return; }
  if (!webappUrl) { Logger.log("❌ Falta WEBAPP_URL — añádela en Propiedades del script"); return; }

  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webappUrl)}`;
  const res = UrlFetchApp.fetch(url);
  Logger.log("✅ Webhook: " + res.getContentText());
}


// ═══════════════════════════════════════════
// doPost: RECIBE MENSAJES DE TELEGRAM
// ═══════════════════════════════════════════
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const msg = data.message;
    if (!msg || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const props = PropertiesService.getScriptProperties();

    // Auto-detectar Captain Chat ID
    if (!props.getProperty("CAPTAIN_CHAT_ID")) {
      props.setProperty("CAPTAIN_CHAT_ID", String(chatId));
    }

    // Procesar comandos
    if (text === "/start") {
      props.setProperty("CAPTAIN_CHAT_ID", String(chatId));
      enviarTelegram_(chatId,
        "🏴‍☠️ *Thousand Sunny — Puente de Mando*\n\n" +
        "⚓ Bot conectado, Capitán.\n\n" +
        "*Tripulación:*\n" +
        "/tripulacion <msg> — todos hablan\n" +
        "/sanji <msg> — solo Sanji\n" +
        "/usopp <msg> — solo Usopp\n" +
        "/zoro — Zoro escanea Drive\n" +
        "/nami — estado del barco\n\n" +
        "*Agencia Drive:*\n" +
        "/crear <tipo> <nombre> [en carpeta] — crear archivo\n" +
        "/mover <archivo> a <carpeta> — mover\n" +
        "/borrar <archivo> — enviar a papelera\n" +
        "/renombrar <actual> a <nuevo>\n" +
        "/escribir <doc> | <contenido>\n" +
        "/drive <búsqueda> — buscar\n\n" +
        "*Sistema:*\n" +
        "/autonomo — on/off autónomo\n" +
        "/tema <tema> — cambiar tema\n" +
        "/memoria — ver memoria compartida\n" +
        "/diagnostico — verificar keys y estado\n" +
        "/estado — ver estado completo"
      );

    } else if (text.startsWith("/tripulacion")) {
      cmdTripulacion_(chatId, text.replace("/tripulacion", "").trim());

    } else if (text.startsWith("/sanji")) {
      cmdSanji_(chatId, text.replace("/sanji", "").trim());

    } else if (text.startsWith("/usopp")) {
      cmdUsopp_(chatId, text.replace("/usopp", "").trim());

    } else if (text === "/zoro") {
      cmdZoro_(chatId);

    } else if (text === "/nami") {
      cmdNami_(chatId);

    } else if (text === "/autonomo") {
      cmdAutonomo_(chatId);

    } else if (text.startsWith("/tema")) {
      cmdTema_(chatId, text.replace("/tema", "").trim());

    } else if (text.startsWith("/drive")) {
      cmdDrive_(chatId, text.replace("/drive", "").trim());

    } else if (text === "/memoria") {
      cmdMemoria_(chatId);

    } else if (text === "/estado") {
      cmdEstado_(chatId);

    } else if (text.startsWith("/crear")) {
      cmdCrear_(chatId, text.replace("/crear", "").trim());

    } else if (text.startsWith("/mover")) {
      cmdMover_(chatId, text.replace("/mover", "").trim());

    } else if (text.startsWith("/borrar")) {
      cmdBorrar_(chatId, text.replace("/borrar", "").trim());

    } else if (text.startsWith("/escribir")) {
      cmdEscribir_(chatId, text.replace("/escribir", "").trim());

    } else if (text.startsWith("/renombrar")) {
      cmdRenombrar_(chatId, text.replace("/renombrar", "").trim());

    } else if (text === "/diagnostico") {
      cmdDiagnostico_(chatId);

    } else {
      // Mensaje libre → Sanji responde (free tier priority)
      logBitacora_("telegram", "capitan", text, "humano", 0);
      const resp = callGemini_(text, PROMPTS.sanji);
      logBitacora_("telegram", "sanji", resp.text, GEMINI_MODEL, resp.tokens);
      enviarTelegram_(chatId, "🍳 *Sanji:*\n" + resp.text);
    }

  } catch (err) {
    Logger.log("doPost error: " + err.message);
  }
}


// ═══════════════════════════════════════════
// doGet: API REST PARA WEBAPP HTML
// ═══════════════════════════════════════════
function doGet(e) {
  const action = e.parameter.action || "status";
  let result = {};

  try {
    switch (action) {

      case "status":
        result = getEstadoCompleto_();
        break;

      case "bitacora":
        // Últimos N mensajes
        const limit = parseInt(e.parameter.limit || "20");
        result = getBitacoraReciente_(limit);
        break;

      case "memoria":
        result = getMemoriaCompartida_();
        break;

      case "drive_search":
        const query = e.parameter.q || "";
        result = buscarDrive_(query);
        break;

      case "drive_recientes":
        result = archivosRecientes_();
        break;

      case "hablar":
        // La webapp pide que un nakama hable
        const nakama = e.parameter.nakama || "sanji";
        const prompt = e.parameter.prompt || TOPICS.libre;
        result = hacerHablar_(nakama, prompt, "webapp");
        break;

      case "guardar_memoria":
        const tipo = e.parameter.tipo || "insight";
        const contenido = e.parameter.contenido || "";
        guardarMemoria_(tipo, contenido, "webapp");
        result = { ok: true };
        break;

      case "drive_crear":
        const crearNombre = e.parameter.nombre || "";
        const crearTipo = e.parameter.tipo || "doc";
        const crearCarpeta = e.parameter.carpeta || null;
        result = crearEnDrive_(crearNombre, crearTipo, crearCarpeta);
        break;

      case "drive_mover":
        const moverArchivo = e.parameter.archivo || "";
        const moverDestino = e.parameter.destino || "";
        result = moverEnDrive_(moverArchivo, moverDestino);
        break;

      case "drive_borrar":
        const borrarArchivo = e.parameter.archivo || "";
        result = borrarEnDrive_(borrarArchivo);
        break;

      case "drive_renombrar":
        const renActual = e.parameter.actual || "";
        const renNuevo = e.parameter.nuevo || "";
        result = renombrarEnDrive_(renActual, renNuevo);
        break;

      case "drive_escribir":
        const docNombre = e.parameter.doc || "";
        const docContenido = e.parameter.contenido || "";
        result = escribirEnDoc_(docNombre, docContenido);
        break;

      case "diagnostico":
        result = getDiagnosticoJSON_();
        break;

      default:
        result = { error: "Acción no reconocida: " + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ═══════════════════════════════════════════
// TELEGRAM COMMAND HANDLERS
// ═══════════════════════════════════════════
function cmdTripulacion_(chatId, msg) {
  if (!msg) msg = "Tripulación, ¿cómo está el barco?";
  logBitacora_("telegram", "capitan", msg, "humano", 0);

  // Sanji (free)
  const sanji = callGemini_(msg, PROMPTS.sanji);
  logBitacora_("telegram", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);
  enviarTelegram_(chatId, "🍳 *Sanji:*\n" + sanji.text);

  // Usopp
  const usopp = callUsopp_(msg);
  logBitacora_("telegram", "usopp", usopp.text, usopp.motor, usopp.tokens);
  enviarTelegram_(chatId, "🔫 *Usopp:*\n" + usopp.text);

  // Nami
  const nami = pickNami_("general");
  logBitacora_("telegram", "nami", nami, "local", 0);
  enviarTelegram_(chatId, nami);
}

function cmdSanji_(chatId, msg) {
  if (!msg) msg = "Sanji, ¿qué análisis tienes?";
  logBitacora_("telegram", "capitan", msg, "humano", 0);
  const resp = callGemini_(msg, PROMPTS.sanji);
  logBitacora_("telegram", "sanji", resp.text, GEMINI_MODEL, resp.tokens);
  enviarTelegram_(chatId, "🍳 *Sanji:*\n" + resp.text);
}

function cmdUsopp_(chatId, msg) {
  if (!msg) msg = "Usopp, ¿qué ideas tienes?";
  logBitacora_("telegram", "capitan", msg, "humano", 0);
  const resp = callUsopp_(msg);
  logBitacora_("telegram", "usopp", resp.text, resp.motor, resp.tokens);
  enviarTelegram_(chatId, "🔫 *Usopp:*\n" + resp.text);
}

function cmdZoro_(chatId) {
  enviarTelegram_(chatId, "⚔️ *Zoro escaneando Drive...*");
  const archivos = archivosRecientes_();

  if (archivos.length === 0) {
    enviarTelegram_(chatId, "⚔️ Zoro: No hay archivos recientes. El barco está limpio.");
    return;
  }

  // Zoro analiza los archivos con Gemini (free)
  const listaArchivos = archivos.map(a => `- ${a.nombre} (${a.tipo}, ${a.fecha})`).join("\n");
  const prompt = `Estos son los archivos recientes en el Drive del Capitán Antonio:\n${listaArchivos}\n\nAnaliza: ¿Cuáles son relevantes para el trabajo del Capitán (psicología clínica, investigación, ecosistema IA)? ¿Cuáles son ruido?`;

  const resp = callGemini_(prompt, PROMPTS.zoro);
  logBitacora_("telegram", "zoro", resp.text, GEMINI_MODEL, resp.tokens);
  enviarTelegram_(chatId, "⚔️ *Zoro:*\n" + resp.text);

  // Indexar en DriveIndex
  const driveIndex = getSheet_("DriveIndex");
  if (driveIndex) {
    archivos.forEach(a => {
      driveIndex.appendRow([new Date(), a.nombre, a.tipo, a.carpeta, "", ""]);
    });
  }
}

function cmdNami_(chatId) {
  const estadoSheet = getSheet_("Estado");
  const auto = getEstado_(estadoSheet, "auto_activo");
  const tema = getEstado_(estadoSheet, "tema");
  const tokens = getEstado_(estadoSheet, "total_tokens");
  const ultimo = getEstado_(estadoSheet, "ultimo_hablante");

  enviarTelegram_(chatId,
    "🗺️ *Nami — Estado del Barco*\n\n" +
    "Autónomo: " + (auto === "true" ? "🟢 ON" : "🔴 OFF") + "\n" +
    "Tema: " + tema + "\n" +
    "Tokens: ~" + tokens + "\n" +
    "Último: " + ultimo
  );
}

function cmdAutonomo_(chatId) {
  const estadoSheet = getSheet_("Estado");
  const actual = getEstado_(estadoSheet, "auto_activo");
  const nuevo = actual === "true" ? "false" : "true";
  setEstado_(estadoSheet, "auto_activo", nuevo);
  enviarTelegram_(chatId, nuevo === "true"
    ? "🔄 Modo autónomo *activado*."
    : "⏸ Modo autónomo *detenido*."
  );
}

function cmdTema_(chatId, tema) {
  if (tema && TOPICS[tema]) {
    const estadoSheet = getSheet_("Estado");
    setEstado_(estadoSheet, "tema", tema);
    enviarTelegram_(chatId, "🎯 Tema: *" + tema + "*");
  } else {
    enviarTelegram_(chatId, "Temas: " + Object.keys(TOPICS).join(", "));
  }
}

function cmdDrive_(chatId, query) {
  if (!query) {
    enviarTelegram_(chatId, "Uso: /drive <término de búsqueda>");
    return;
  }

  const resultados = buscarDrive_(query);
  if (resultados.length === 0) {
    enviarTelegram_(chatId, "🔍 Sin resultados para: " + query);
    return;
  }

  const texto = resultados.slice(0, 5).map((r, i) =>
    `${i + 1}. *${r.nombre}* (${r.tipo})\n   📅 ${r.fecha}`
  ).join("\n\n");

  enviarTelegram_(chatId, "🔍 *Resultados en Drive:*\n\n" + texto);
}

function cmdMemoria_(chatId) {
  const memoria = getMemoriaCompartida_();
  if (memoria.length === 0) {
    enviarTelegram_(chatId, "🧠 Memoria vacía. La tripulación aún no ha guardado insights.");
    return;
  }
  const texto = memoria.slice(-5).map(m =>
    `• [${m.tipo}] ${m.contenido.substring(0, 100)}`
  ).join("\n");
  enviarTelegram_(chatId, "🧠 *Memoria Compartida:*\n\n" + texto);
}

function cmdEstado_(chatId) {
  cmdNami_(chatId);
}


// ═══════════════════════════════════════════
// TELEGRAM: AGENCIA DRIVE
// ═══════════════════════════════════════════

/** /crear doc MiDocumento en MiCarpeta */
function cmdCrear_(chatId, args) {
  if (!args) {
    enviarTelegram_(chatId,
      "Uso: /crear <tipo> <nombre> [en <carpeta>]\n" +
      "Tipos: doc, sheet, folder, txt\n" +
      "Ejemplo: /crear doc Notas Sesión en Casos Clínicos"
    );
    return;
  }

  // Parsear: primer palabra = tipo, resto = nombre, "en" separa carpeta
  const parts = args.split(/\s+/);
  const tipo = parts[0];
  let nombre, carpeta;

  const enIndex = args.toLowerCase().indexOf(" en ");
  if (enIndex > -1) {
    nombre = args.substring(tipo.length + 1, enIndex).trim();
    carpeta = args.substring(enIndex + 4).trim();
  } else {
    nombre = parts.slice(1).join(" ");
    carpeta = null;
  }

  if (!nombre) {
    enviarTelegram_(chatId, "⚠️ Falta el nombre. Ejemplo: /crear doc Mi Documento");
    return;
  }

  const result = crearEnDrive_(nombre, tipo, carpeta);
  if (result.ok) {
    logBitacora_("telegram", "franky", `Creado ${result.tipo}: ${result.nombre}`, "drive", 0);
    guardarMemoria_("accion_drive", `Franky creó ${result.tipo}: ${result.nombre}${carpeta ? " en " + carpeta : ""}`, "telegram");
    enviarTelegram_(chatId,
      `🔧 *Franky ha construido:*\n${result.tipo}: *${result.nombre}*${carpeta ? "\n📁 En: " + carpeta : ""}\n🔗 ${result.url}`
    );
  } else {
    enviarTelegram_(chatId, "⚠️ Error: " + result.error);
  }
}

/** /mover MiArchivo a MiCarpeta */
function cmdMover_(chatId, args) {
  if (!args || !args.toLowerCase().includes(" a ")) {
    enviarTelegram_(chatId, "Uso: /mover <nombre archivo> a <carpeta destino>");
    return;
  }

  const aIndex = args.toLowerCase().indexOf(" a ");
  const nombreArchivo = args.substring(0, aIndex).trim();
  const carpetaDestino = args.substring(aIndex + 3).trim();

  const result = moverEnDrive_(nombreArchivo, carpetaDestino);
  if (result.ok) {
    logBitacora_("telegram", "zoro", `Movido: ${result.archivo} → ${result.destino}`, "drive", 0);
    guardarMemoria_("accion_drive", `Zoro movió: ${result.archivo} → ${result.destino}`, "telegram");
    enviarTelegram_(chatId, `⚔️ *Zoro ha movido:*\n${result.archivo} → 📁 ${result.destino}`);
  } else {
    enviarTelegram_(chatId, "⚠️ Error: " + result.error);
  }
}

/** /borrar MiArchivo */
function cmdBorrar_(chatId, args) {
  if (!args) {
    enviarTelegram_(chatId, "Uso: /borrar <nombre del archivo>");
    return;
  }

  const result = borrarEnDrive_(args);
  if (result.ok) {
    logBitacora_("telegram", "zoro", `Destruido: ${result.archivo}`, "drive", 0);
    guardarMemoria_("accion_drive", `Zoro destruyó: ${result.archivo} (papelera)`, "telegram");
    enviarTelegram_(chatId, `⚔️ *Zoro ha destruido:*\n${result.archivo} → 🗑 papelera`);
  } else {
    enviarTelegram_(chatId, "⚠️ Error: " + result.error);
  }
}

/** /escribir NombreDoc | Contenido a escribir */
function cmdEscribir_(chatId, args) {
  if (!args || !args.includes("|")) {
    enviarTelegram_(chatId, "Uso: /escribir <nombre doc> | <contenido>\nEjemplo: /escribir Notas | Sesión productiva hoy");
    return;
  }

  const pipeIndex = args.indexOf("|");
  const nombreDoc = args.substring(0, pipeIndex).trim();
  const contenido = args.substring(pipeIndex + 1).trim();

  const result = escribirEnDoc_(nombreDoc, contenido);
  if (result.ok) {
    logBitacora_("telegram", "robin", `Escrito en: ${result.nombre}`, "drive", 0);
    enviarTelegram_(chatId, `📝 *Robin ha escrito en:*\n*${result.nombre}*\n🔗 ${result.url}`);
  } else {
    enviarTelegram_(chatId, "⚠️ Error: " + result.error);
  }
}

/** /renombrar NombreActual a NombreNuevo */
function cmdRenombrar_(chatId, args) {
  if (!args || !args.toLowerCase().includes(" a ")) {
    enviarTelegram_(chatId, "Uso: /renombrar <nombre actual> a <nombre nuevo>");
    return;
  }

  const aIndex = args.toLowerCase().indexOf(" a ");
  const actual = args.substring(0, aIndex).trim();
  const nuevo = args.substring(aIndex + 3).trim();

  const result = renombrarEnDrive_(actual, nuevo);
  if (result.ok) {
    logBitacora_("telegram", "robin", `Renombrado: ${result.antes} → ${result.ahora}`, "drive", 0);
    enviarTelegram_(chatId, `📝 *Robin ha renombrado:*\n${result.antes} → *${result.ahora}*`);
  } else {
    enviarTelegram_(chatId, "⚠️ Error: " + result.error);
  }
}


// ═══════════════════════════════════════════
// DIAGNÓSTICO — VERIFICAR TODO EL SISTEMA
// ═══════════════════════════════════════════

/** /diagnostico — muestra el estado de todas las keys y conexiones */
function cmdDiagnostico_(chatId) {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();

  // Verificar keys (mostrar solo si existen, NUNCA el valor completo)
  const geminiKey = allProps["GEMINI_KEY"];
  const openaiKey = allProps["OPENAI_KEY"];
  const telegramToken = allProps["TELEGRAM_TOKEN"];
  const bitacoraId = allProps["BITACORA_ID"];
  const webappUrl = allProps["WEBAPP_URL"];
  const captainId = allProps["CAPTAIN_CHAT_ID"];

  let msg = "🔧 *Diagnóstico del Thousand Sunny*\n\n";

  msg += "*API Keys:*\n";
  msg += geminiKey ? "✅ GEMINI\\_KEY: ..." + geminiKey.slice(-6) + "\n" : "❌ GEMINI\\_KEY: NO CONFIGURADA\n";
  msg += openaiKey ? "✅ OPENAI\\_KEY: ..." + openaiKey.slice(-6) + "\n" : "⚠️ OPENAI\\_KEY: no hay (Usopp usará Gemini)\n";
  msg += telegramToken ? "✅ TELEGRAM\\_TOKEN: ..." + telegramToken.slice(-6) + "\n" : "❌ TELEGRAM\\_TOKEN: NO CONFIGURADO\n";

  msg += "\n*Infraestructura:*\n";
  msg += bitacoraId ? "✅ Bitácora: conectada\n" : "❌ Bitácora: NO CREADA (ejecuta setupCompleto)\n";
  msg += webappUrl ? "✅ WEBAPP\\_URL: " + webappUrl.substring(0, 40) + "...\n" : "⚠️ WEBAPP\\_URL: no configurada\n";
  msg += captainId ? "✅ Captain ID: " + captainId + "\n" : "⚠️ Captain ID: pendiente\n";

  // Test rápido de Gemini
  if (geminiKey) {
    const testResult = callGemini_("Di solo: OK", "Responde solo OK");
    if (testResult.text === "⚠️ Falta GEMINI_KEY") {
      msg += "\n*Test Gemini:* ❌ Key no leída";
    } else if (testResult.text.startsWith("⚠️")) {
      msg += "\n*Test Gemini:* ❌ " + testResult.text.substring(0, 60);
    } else {
      msg += "\n*Test Gemini:* ✅ Responde OK";
    }
  }

  // Estado autónomo
  const estadoSheet = getSheet_("Estado");
  if (estadoSheet) {
    const auto = getEstado_(estadoSheet, "auto_activo");
    const ciclo = getEstado_(estadoSheet, "ciclo_num") || "0";
    const ultimoCiclo = getEstado_(estadoSheet, "ultimo_ciclo") || "nunca";
    msg += "\n\n*Ciclo autónomo:*\n";
    msg += "Estado: " + (auto === "true" ? "🟢 ON" : "🔴 OFF") + "\n";
    msg += "Ciclos: " + ciclo + "\n";
    msg += "Último: " + ultimoCiclo;
  }

  // Test Drive
  try {
    const testFiles = DriveApp.getFiles();
    msg += "\n\n*Drive:* ✅ Acceso OK";
  } catch (e) {
    msg += "\n\n*Drive:* ❌ Sin acceso";
  }

  enviarTelegram_(chatId, msg);
}

/** Versión para ejecutar desde el editor de GAS (sin Telegram) */
function diagnostico() {
  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();

  Logger.log("═══ DIAGNÓSTICO THOUSAND SUNNY ═══");
  Logger.log("");

  // Keys
  const keys = ["GEMINI_KEY", "OPENAI_KEY", "TELEGRAM_TOKEN", "BITACORA_ID", "WEBAPP_URL", "CAPTAIN_CHAT_ID"];
  keys.forEach(k => {
    const v = allProps[k];
    if (v) {
      Logger.log("✅ " + k + " = ..." + v.slice(-8));
    } else {
      Logger.log("❌ " + k + " = NO CONFIGURADA");
    }
  });

  // Test Gemini
  Logger.log("");
  if (allProps["GEMINI_KEY"]) {
    const test = callGemini_("Di solo: OK", "Responde solo la palabra OK");
    Logger.log("Test Gemini: " + test.text + " (tokens: " + test.tokens + ")");
  } else {
    Logger.log("Test Gemini: SKIP (no hay key)");
  }

  // Test Drive
  try {
    const files = DriveApp.searchFiles("modifiedDate > '2025-01-01' and trashed = false");
    let count = 0;
    while (files.hasNext() && count < 3) { files.next(); count++; }
    Logger.log("Test Drive: ✅ Acceso OK (" + count + "+ archivos)");
  } catch (e) {
    Logger.log("Test Drive: ❌ " + e.message);
  }

  // Test Bitácora
  const bitacoraId = allProps["BITACORA_ID"];
  if (bitacoraId) {
    try {
      const ss = SpreadsheetApp.openById(bitacoraId);
      const sheets = ss.getSheets().map(s => s.getName());
      Logger.log("Test Bitácora: ✅ Sheets: " + sheets.join(", "));
    } catch (e) {
      Logger.log("Test Bitácora: ❌ " + e.message);
    }
  }

  Logger.log("");
  Logger.log("═══ FIN DIAGNÓSTICO ═══");
}


// ═══════════════════════════════════════════
// CICLO AUTÓNOMO — DELIBERACIÓN CON CONTEXTO
// ═══════════════════════════════════════════
// Cada ciclo: Lee Drive → Zoro filtra → Sanji analiza → Usopp conecta → Nami sintetiza
// El resultado se guarda en Memoria y se envía a Telegram.
// NO es un nakama diciendo frases sueltas. Es la tripulación pensando junta.
//
// Tipos de ciclo (se alternan para no gastar tokens):
//  - RONDA COMPLETA: Drive scan + Zoro + Sanji + Nami (cada 3 ciclos)
//  - RONDA LIGERA: Solo Sanji reflexiona sobre memoria reciente (ciclos intermedios)
//  - RONDA CREATIVA: Usopp + Nami (1 de cada 5 ciclos, usa OpenAI)
// ═══════════════════════════════════════════

function cicloAutonomo() {
  const estadoSheet = getSheet_("Estado");
  if (!estadoSheet) return;
  if (getEstado_(estadoSheet, "auto_activo") !== "true") return;

  // Contador de ciclos para alternar tipos
  let cicloNum = parseInt(getEstado_(estadoSheet, "ciclo_num") || "0");
  cicloNum++;
  setEstado_(estadoSheet, "ciclo_num", String(cicloNum));

  const tema = getEstado_(estadoSheet, "tema") || "libre";
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("TELEGRAM_TOKEN");
  const captainId = props.getProperty("CAPTAIN_CHAT_ID");

  try {
    if (cicloNum % 3 === 0) {
      // ═══ RONDA COMPLETA: Drive + deliberación ═══
      rondaCompletaDrive_(tema, token, captainId);
    } else if (cicloNum % 5 === 0) {
      // ═══ RONDA CREATIVA: Usopp aporta perspectiva lateral ═══
      rondaCreativa_(tema, token, captainId);
    } else {
      // ═══ RONDA LIGERA: Sanji reflexiona (free, bajo coste) ═══
      rondaLigera_(tema, token, captainId);
    }
  } catch (err) {
    Logger.log("❌ Ciclo autónomo error: " + err.message);
  }

  setEstado_(estadoSheet, "ultimo_ciclo", new Date().toISOString());
}


/**
 * ═══════════════════════════════════════════════════════
 * RONDA COMPLETA: DELIBERACIÓN VIVA DE LA TRIPULACIÓN
 * ═══════════════════════════════════════════════════════
 *
 * Flujo real:
 *   1. Robin lee los poneglyph (contenido REAL de archivos recientes)
 *   2. Chopper detecta patrones entre los archivos
 *   3. Zoro propone ACCIONES CONCRETAS (mover, duplicar, destruir)
 *   4. Sanji evalúa si hay que "cocinar" algo antes de moverlo
 *   5. Se ejecutan las acciones acordadas
 *   6. Todo se envía como diálogo natural a Telegram
 *
 * Cada IA ve lo que dijeron las anteriores = conversación real.
 */
function rondaCompletaDrive_(tema, token, captainId) {
  // ─── 1. ROBIN LEE LOS PONEGLYPH ───
  const archivos = escanearDriveConContenido_(5);
  const memorias = getMemoriaCompartida_();
  const memReciente = memorias.slice(-3).map(m => `[${m.tipo}] ${m.contenido.substring(0, 80)}`).join("\n");

  if (archivos.length === 0) {
    rondaLigera_(tema, token, captainId);
    return;
  }

  // Preparar los poneglyph: nombre + carpeta + CONTENIDO real
  const poneglyph = archivos.map(a =>
    `📄 "${a.nombre}" (en: ${a.carpeta}, ${a.fecha})\n   Contenido: ${a.contenido.substring(0, 200)}`
  ).join("\n\n");

  // ─── ROBIN: Lee y clasifica semánticamente ───
  const robinPrompt = `Estos son los archivos recientes del Capitán Antonio en su Drive. Has leído su contenido real:\n\n${poneglyph}\n\n` +
    (memReciente ? `Memoria reciente de la tripulación:\n${memReciente}\n\n` : "") +
    `Lee estos poneglyph. Para cada archivo di: de qué habla REALMENTE, a qué pilar del Capitán pertenece ` +
    `(clínica, investigación/doctorado, ecosistema IA, personal, Sofía) y si está bien ubicado en su carpeta actual.`;

  const robin = callGemini_(robinPrompt, PROMPTS.robin);
  logBitacora_("autonomo", "robin", robin.text, GEMINI_MODEL, robin.tokens);

  // ─── CHOPPER: Detecta patrones ───
  const chopperPrompt = `Robin ha leído los poneglyph del Drive y dice:\n"${robin.text}"\n\n` +
    `Archivos analizados: ${archivos.map(a => a.nombre).join(", ")}.\n\n` +
    `Detecta patrones: ¿Hay condensación funcional? ¿Archivos que comparten temática sin saberlo? ` +
    `¿Algo que revele un patrón genuino del Capitán Antonio (psicólogo clínico, investigador, creador de IA)?`;

  const chopper = callGemini_(chopperPrompt, PROMPTS.chopper);
  logBitacora_("autonomo", "chopper", chopper.text, GEMINI_MODEL, chopper.tokens);

  // ─── ZORO: Propone acciones concretas ───
  const zoroPrompt = `Robin ha leído los archivos:\n"${robin.text}"\n\nChopper detectó patrones:\n"${chopper.text}"\n\n` +
    `Archivos disponibles:\n${archivos.map(a => `- "${a.nombre}" (en: ${a.carpeta})`).join("\n")}\n\n` +
    `Propón ACCIONES CONCRETAS. Para cada propuesta usa este formato exacto:\n` +
    `ACCIÓN: mover|duplicar|borrar|nada\nARCHIVO: nombre exacto\nDESTINO: carpeta destino (si aplica)\nRAZÓN: por qué\n\n` +
    `Si un archivo está bien donde está, di "nada". Sé concreto.`;

  const zoro = callGemini_(zoroPrompt, PROMPTS.zoro);
  logBitacora_("autonomo", "zoro", zoro.text, GEMINI_MODEL, zoro.tokens);

  // ─── SANJI: Evalúa las propuestas de Zoro ───
  const sanjiPrompt = `Zoro propone estas acciones sobre los archivos del Capitán:\n"${zoro.text}"\n\n` +
    `Robin dijo sobre el contenido:\n"${robin.text}"\n\n` +
    `Evalúa: ¿Algún archivo necesita "cocinarse" (procesarse, resumirse, enriquecerse) ANTES de moverse? ` +
    `¿Las propuestas de Zoro son correctas o hay que ajustar algo? Di "apruebo" o "espera, esto hay que cocinarlo primero".`;

  const sanji = callGemini_(sanjiPrompt, PROMPTS.sanji);
  logBitacora_("autonomo", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);

  // ─── EJECUTAR ACCIONES ACORDADAS ───
  const acciones = parsearAccionesZoro_(zoro.text);
  const resultadosAcciones = [];

  acciones.forEach(acc => {
    // Solo ejecutar si Sanji no vetó (buscar "espera" o "cocinar" cerca del archivo)
    const sanjiVeto = sanji.text.toLowerCase().includes("cocinar") &&
                      sanji.text.toLowerCase().includes(acc.archivo.toLowerCase().substring(0, 15));

    if (sanjiVeto) {
      resultadosAcciones.push(`⏸ ${acc.archivo}: Sanji dice que hay que cocinarlo primero`);
      return;
    }

    if (acc.accion === "mover" && acc.destino) {
      const r = moverEnDrive_(acc.archivo, acc.destino);
      if (r.ok) {
        resultadosAcciones.push(`✅ Movido: ${acc.archivo} → ${acc.destino}`);
      } else {
        resultadosAcciones.push(`⚠️ No pude mover ${acc.archivo}: ${r.error}`);
      }
    } else if (acc.accion === "borrar") {
      const r = borrarEnDrive_(acc.archivo);
      if (r.ok) {
        resultadosAcciones.push(`🗑 Destruido: ${acc.archivo}`);
      } else {
        resultadosAcciones.push(`⚠️ No pude borrar ${acc.archivo}: ${r.error}`);
      }
    } else if (acc.accion === "duplicar" && acc.destino) {
      // Duplicar = copiar a nueva ubicación sin quitar de la original
      try {
        const files = DriveApp.getFilesByName(acc.archivo);
        if (files.hasNext()) {
          const original = files.next();
          const carpetas = DriveApp.getFoldersByName(acc.destino);
          if (carpetas.hasNext()) {
            original.makeCopy(acc.archivo, carpetas.next());
            resultadosAcciones.push(`📋 Duplicado: ${acc.archivo} → también en ${acc.destino}`);
          }
        }
      } catch (e) {
        resultadosAcciones.push(`⚠️ No pude duplicar ${acc.archivo}: ${e.message}`);
      }
    }
    // "nada" = no hacer nada, no registrar
  });

  // ─── FORMATEAR DIÁLOGO NATURAL ───
  let dialogo = `🏴‍☠️ *Deliberación de la Tripulación*\n`;
  dialogo += `📚 _${archivos.length} poneglyph leídos_\n\n`;

  dialogo += `🌸 *Robin:*\n${robin.text}\n\n`;
  dialogo += `🩺 *Chopper:*\n${chopper.text}\n\n`;
  dialogo += `⚔️ *Zoro:*\n${zoro.text}\n\n`;
  dialogo += `🍳 *Sanji:*\n${sanji.text}`;

  if (resultadosAcciones.length > 0) {
    dialogo += `\n\n🗺️ *Nami — Acciones ejecutadas:*\n${resultadosAcciones.join("\n")}`;
  } else {
    dialogo += `\n\n🗺️ *Nami:* Deliberación registrada. Sin acciones pendientes.`;
  }

  logBitacora_("autonomo", "nami", "Deliberación completa: " + resultadosAcciones.length + " acciones", "local", 0);

  // ─── GUARDAR EN MEMORIA ───
  const insight = `[Deliberación] Robin: ${robin.text.substring(0, 80)} | Chopper: ${chopper.text.substring(0, 80)} | Acciones: ${resultadosAcciones.length}`;
  guardarMemoria_("deliberacion", insight, "autonomo");

  // ─── ENVIAR A TELEGRAM ───
  // Telegram tiene límite de 4096 chars, partir si es necesario
  if (token && captainId) {
    const chatIdNum = parseInt(captainId);
    if (dialogo.length > 4000) {
      // Partir en dos mensajes
      const mitad = dialogo.lastIndexOf("\n\n", 3900);
      enviarTelegram_(chatIdNum, dialogo.substring(0, mitad));
      Utilities.sleep(500);
      enviarTelegram_(chatIdNum, dialogo.substring(mitad));
    } else {
      enviarTelegram_(chatIdNum, dialogo);
    }
  }

  // ─── INDEXAR ───
  const driveIndex = getSheet_("DriveIndex");
  if (driveIndex) {
    archivos.forEach(a => {
      driveIndex.appendRow([new Date(), a.nombre, a.tipo, a.carpeta, "", robin.text.substring(0, 50)]);
    });
  }

  Logger.log("🏴‍☠️ Deliberación completa: " + archivos.length + " poneglyph, " + resultadosAcciones.length + " acciones");
}


/**
 * Parsea las propuestas de acción de Zoro del texto libre.
 * Busca patrones: ACCIÓN: mover/borrar/duplicar, ARCHIVO: nombre, DESTINO: carpeta
 */
function parsearAccionesZoro_(texto) {
  const acciones = [];
  const bloques = texto.split(/ACCI[OÓ]N:/i);

  bloques.forEach(bloque => {
    if (!bloque.trim()) return;

    const accionMatch = bloque.match(/^\s*(mover|duplicar|borrar|nada)/i);
    const archivoMatch = bloque.match(/ARCHIVO:\s*"?([^"\n]+)"?/i);
    const destinoMatch = bloque.match(/DESTINO:\s*"?([^"\n]+)"?/i);

    if (accionMatch && archivoMatch) {
      const accion = accionMatch[1].toLowerCase().trim();
      if (accion !== "nada") {
        acciones.push({
          accion: accion,
          archivo: archivoMatch[1].trim(),
          destino: destinoMatch ? destinoMatch[1].trim() : null,
        });
      }
    }
  });

  return acciones;
}


/** RONDA LIGERA: Sanji reflexiona sobre la memoria y contexto (mínimo coste) */
function rondaLigera_(tema, token, captainId) {
  const memorias = getMemoriaCompartida_();
  const contexto = getContextoBitacora_();
  const topicPrompt = TOPICS[tema] || TOPICS.libre;

  let prompt;
  if (memorias.length > 0) {
    const recentMem = memorias.slice(-3).map(m => `[${m.tipo}] ${m.contenido.substring(0, 80)}`).join("\n");
    prompt = `Contexto de la tripulación:\n${recentMem}\n\nConversación reciente:\n${contexto}\n\n` +
      `Tema: ${tema}. ${topicPrompt}\n\nReflexiona sobre lo que la tripulación ha estado trabajando. Aporta un insight nuevo o una conexión que no se haya visto.`;
  } else {
    prompt = `${contexto ? "Conversación reciente:\n" + contexto + "\n\n" : ""}` +
      `Tema: ${tema}. ${topicPrompt}\n\nNo hay memoria previa. Propón una primera reflexión útil para el Capitán Antonio (psicólogo clínico, investigador, creador de ecosistema IA multi-agente).`;
  }

  const sanji = callGemini_(prompt, PROMPTS.sanji);
  logBitacora_("autonomo", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);

  if (token && captainId) {
    enviarTelegram_(parseInt(captainId), `🍳 *Sanji (guardia):*\n${sanji.text}`);
  }

  setEstado_(getSheet_("Estado"), "ultimo_hablante", "sanji");
  Logger.log("🏴‍☠️ Ronda ligera: " + sanji.text.substring(0, 80));
}


/** RONDA CREATIVA: Usopp (ChatGPT) aporta conexiones inesperadas sobre la actividad real */
function rondaCreativa_(tema, token, captainId) {
  const memorias = getMemoriaCompartida_();
  const contexto = getContextoBitacora_();

  // Leer un par de archivos para que Usopp tenga contenido real
  const archivos = escanearDriveConContenido_(3);
  let driveCtx = "";
  if (archivos.length > 0) {
    driveCtx = "Archivos recientes del Capitán:\n" +
      archivos.map(a => `"${a.nombre}" (${a.carpeta}): ${a.contenido.substring(0, 150)}`).join("\n") + "\n\n";
  }

  let prompt;
  if (memorias.length > 0) {
    const recentMem = memorias.slice(-3).map(m => `[${m.tipo}] ${m.contenido.substring(0, 80)}`).join("\n");
    prompt = `La tripulación ha estado deliberando:\n${recentMem}\n\n` +
      driveCtx +
      (contexto ? "Conversación reciente:\n" + contexto + "\n\n" : "") +
      `Tema: ${tema}. Aporta una CONEXIÓN INESPERADA entre estos archivos o deliberaciones. ` +
      `¿Qué patrón ve tu ojo de tirador que los demás no ven?`;
  } else {
    prompt = driveCtx +
      `Tema: ${tema}. El Capitán Antonio es psicólogo clínico e investigador. ` +
      `Aporta una perspectiva creativa que conecte lo que ves en su Drive con su visión de soberanía sobre la metadata.`;
  }

  const usopp = callUsopp_(prompt);
  logBitacora_("autonomo", "usopp", usopp.text, usopp.motor, usopp.tokens);

  // Sanji reacciona brevemente a Usopp
  const sanjiReact = callGemini_(
    `Usopp acaba de decir: "${usopp.text}"\n\n¿Tiene sustancia o es humo? Reacciona en una frase.`,
    PROMPTS.sanji
  );
  logBitacora_("autonomo", "sanji", sanjiReact.text, GEMINI_MODEL, sanjiReact.tokens);

  const dialogo = `🏴‍☠️ *Ronda Creativa*\n\n` +
    `🔫 *Usopp:*\n${usopp.text}\n\n` +
    `🍳 *Sanji:*\n${sanjiReact.text}\n\n` +
    `🗺️ *Nami:* Perspectiva lateral registrada en memoria.`;

  logBitacora_("autonomo", "nami", "Ronda creativa registrada", "local", 0);

  if (token && captainId) {
    enviarTelegram_(parseInt(captainId), dialogo);
  }

  if (usopp.text.length > 40) {
    guardarMemoria_("perspectiva_creativa", `Usopp: ${usopp.text.substring(0, 150)} | Sanji: ${sanjiReact.text.substring(0, 80)}`, "usopp");
  }

  setEstado_(getSheet_("Estado"), "ultimo_hablante", "usopp");
  Logger.log("🏴‍☠️ Ronda creativa: " + usopp.text.substring(0, 80));
}


// ═══════════════════════════════════════════
// CORE: HACER HABLAR A UN NAKAMA
// ═══════════════════════════════════════════
function hacerHablar_(nakama, prompt, ruta) {
  let texto, motor, tokens;

  if (nakama === "sanji") {
    const r = callGemini_(prompt, PROMPTS.sanji);
    texto = r.text; motor = GEMINI_MODEL; tokens = r.tokens;
  } else if (nakama === "zoro") {
    const r = callGemini_(prompt, PROMPTS.zoro);
    texto = r.text; motor = GEMINI_MODEL; tokens = r.tokens;
  } else if (nakama === "usopp") {
    const r = callUsopp_(prompt);
    texto = r.text; motor = r.motor; tokens = r.tokens;
  } else {
    texto = pickNami_("general");
    motor = "local"; tokens = 0;
  }

  logBitacora_(ruta, nakama, texto, motor, tokens);
  return { text: texto, motor, tokens };
}


// ═══════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════
function callGemini_(prompt, systemPrompt) {
  const key = PropertiesService.getScriptProperties().getProperty("GEMINI_KEY");
  if (!key) return { text: "⚠️ Falta GEMINI_KEY", tokens: 0 };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS_RESPONSE, temperature: 0.85 }
      }),
      muteHttpExceptions: true,
    });

    const data = JSON.parse(res.getContentText());
    if (data.error) return { text: "⚠️ Gemini: " + data.error.message.substring(0, 80), tokens: 0 };

    const text = data.candidates[0].content.parts[0].text;
    const tokens = data.usageMetadata?.totalTokenCount || 0;

    // Actualizar total
    const estadoSheet = getSheet_("Estado");
    if (estadoSheet) {
      const total = parseInt(getEstado_(estadoSheet, "total_tokens") || "0") + tokens;
      setEstado_(estadoSheet, "total_tokens", String(total));
    }

    return { text, tokens };
  } catch (e) {
    return { text: "⚠️ Error: " + e.message.substring(0, 60), tokens: 0 };
  }
}

function callUsopp_(prompt) {
  // Intenta OpenAI primero, fallback a Gemini (free)
  const openaiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_KEY");

  if (openaiKey) {
    try {
      const res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + openaiKey },
        payload: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: "system", content: PROMPTS.usopp },
            { role: "user", content: prompt }
          ],
          max_tokens: MAX_TOKENS_RESPONSE,
          temperature: 0.85,
        }),
        muteHttpExceptions: true,
      });

      const data = JSON.parse(res.getContentText());
      if (!data.error) {
        const text = data.choices[0].message.content;
        const tokens = data.usage?.total_tokens || 0;
        return { text, tokens, motor: OPENAI_MODEL };
      }
    } catch (e) { /* fallback */ }
  }

  // Fallback: Usopp via Gemini (free)
  const r = callGemini_(prompt, PROMPTS.usopp);
  return { text: r.text, tokens: r.tokens, motor: GEMINI_MODEL + " (fallback)" };
}


// ═══════════════════════════════════════════
// DRIVE AGENCY — CREAR, MOVER, DESTRUIR
// ═══════════════════════════════════════════

/** Crear un archivo en Drive (Doc, Sheet, o carpeta) */
function crearEnDrive_(nombre, tipo, carpetaDestino) {
  // tipo: "doc", "sheet", "folder", "txt"
  try {
    let archivo;
    let padre = null;

    // Buscar carpeta destino si se especifica
    if (carpetaDestino) {
      const carpetas = DriveApp.getFoldersByName(carpetaDestino);
      if (carpetas.hasNext()) {
        padre = carpetas.next();
      }
    }

    switch (tipo.toLowerCase()) {
      case "doc":
        archivo = DocumentApp.create(nombre);
        if (padre) {
          const docFile = DriveApp.getFileById(archivo.getId());
          padre.addFile(docFile);
          DriveApp.getRootFolder().removeFile(docFile);
        }
        return { ok: true, nombre: nombre, tipo: "documento", id: archivo.getId(), url: archivo.getUrl() };

      case "sheet":
        archivo = SpreadsheetApp.create(nombre);
        if (padre) {
          const sheetFile = DriveApp.getFileById(archivo.getId());
          padre.addFile(sheetFile);
          DriveApp.getRootFolder().removeFile(sheetFile);
        }
        return { ok: true, nombre: nombre, tipo: "hoja de cálculo", id: archivo.getId(), url: archivo.getUrl() };

      case "folder":
        if (padre) {
          archivo = padre.createFolder(nombre);
        } else {
          archivo = DriveApp.createFolder(nombre);
        }
        return { ok: true, nombre: nombre, tipo: "carpeta", id: archivo.getId(), url: archivo.getUrl() };

      case "txt":
        const blob = Utilities.newBlob("", "text/plain", nombre + ".txt");
        if (padre) {
          archivo = padre.createFile(blob);
        } else {
          archivo = DriveApp.createFile(blob);
        }
        return { ok: true, nombre: nombre + ".txt", tipo: "texto", id: archivo.getId(), url: archivo.getUrl() };

      default:
        return { ok: false, error: "Tipo no soportado. Usa: doc, sheet, folder, txt" };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


/** Mover un archivo a otra carpeta */
function moverEnDrive_(nombreArchivo, carpetaDestino) {
  try {
    // Buscar el archivo
    const archivos = DriveApp.getFilesByName(nombreArchivo);
    if (!archivos.hasNext()) {
      return { ok: false, error: "Archivo no encontrado: " + nombreArchivo };
    }
    const archivo = archivos.next();

    // Buscar carpeta destino
    const carpetas = DriveApp.getFoldersByName(carpetaDestino);
    if (!carpetas.hasNext()) {
      return { ok: false, error: "Carpeta no encontrada: " + carpetaDestino };
    }
    const destino = carpetas.next();

    // Mover: añadir a destino, quitar de origen
    destino.addFile(archivo);
    const padres = archivo.getParents();
    while (padres.hasNext()) {
      const padre = padres.next();
      if (padre.getId() !== destino.getId()) {
        padre.removeFile(archivo);
      }
    }

    return { ok: true, archivo: archivo.getName(), destino: destino.getName() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


/** Enviar archivo a la papelera */
function borrarEnDrive_(nombreArchivo) {
  try {
    const archivos = DriveApp.getFilesByName(nombreArchivo);
    if (!archivos.hasNext()) {
      return { ok: false, error: "Archivo no encontrado: " + nombreArchivo };
    }
    const archivo = archivos.next();
    archivo.setTrashed(true);
    return { ok: true, archivo: archivo.getName(), accion: "enviado a papelera" };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


/** Renombrar un archivo */
function renombrarEnDrive_(nombreActual, nombreNuevo) {
  try {
    const archivos = DriveApp.getFilesByName(nombreActual);
    if (!archivos.hasNext()) {
      return { ok: false, error: "Archivo no encontrado: " + nombreActual };
    }
    const archivo = archivos.next();
    archivo.setName(nombreNuevo);
    return { ok: true, antes: nombreActual, ahora: nombreNuevo };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


/** Escribir contenido en un Google Doc existente o nuevo */
function escribirEnDoc_(nombreOId, contenido) {
  try {
    let doc;
    // Intentar abrir por ID primero
    try {
      doc = DocumentApp.openById(nombreOId);
    } catch (_) {
      // Buscar por nombre
      const archivos = DriveApp.getFilesByName(nombreOId);
      if (archivos.hasNext()) {
        doc = DocumentApp.openById(archivos.next().getId());
      } else {
        // Crear nuevo
        doc = DocumentApp.create(nombreOId);
      }
    }
    doc.getBody().appendParagraph(contenido);
    return { ok: true, nombre: doc.getName(), url: doc.getUrl() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}


// ═══════════════════════════════════════════
// DRIVE: LECTURA PROFUNDA — ROBIN LEE LOS PONEGLYPH
// ═══════════════════════════════════════════

/**
 * Lee el CONTENIDO real de un archivo de Drive (no solo el nombre).
 * Soporta: Google Docs, Google Sheets, archivos de texto.
 * Devuelve un extracto de máx 500 chars para no gastar tokens.
 */
function leerContenidoArchivo_(fileId, mimeType) {
  try {
    // Google Doc
    if (mimeType === "application/vnd.google-apps.document") {
      const doc = DocumentApp.openById(fileId);
      const body = doc.getBody().getText();
      return body.substring(0, 500) + (body.length > 500 ? "..." : "");
    }

    // Google Sheet
    if (mimeType === "application/vnd.google-apps.spreadsheet") {
      const ss = SpreadsheetApp.openById(fileId);
      const sheets = ss.getSheets();
      let resumen = "Hojas: " + sheets.map(s => s.getName()).join(", ") + ". ";
      // Leer primera hoja, primeras filas
      if (sheets.length > 0) {
        const data = sheets[0].getDataRange().getValues();
        const preview = data.slice(0, 5).map(row => row.join(" | ")).join("\n");
        resumen += "Preview:\n" + preview.substring(0, 400);
      }
      return resumen;
    }

    // Google Slides
    if (mimeType === "application/vnd.google-apps.presentation") {
      const pres = SlidesApp.openById(fileId);
      const slides = pres.getSlides();
      let textos = [];
      slides.slice(0, 5).forEach((s, i) => {
        const shapes = s.getShapes();
        const txt = shapes.map(sh => sh.getText().asString()).join(" ").trim();
        if (txt) textos.push("Slide " + (i + 1) + ": " + txt.substring(0, 100));
      });
      return textos.join("\n").substring(0, 500) || "(presentación sin texto legible)";
    }

    // Texto plano
    if (mimeType === "text/plain" || mimeType === "text/csv" || mimeType === "application/json") {
      const file = DriveApp.getFileById(fileId);
      const content = file.getBlob().getDataAsString();
      return content.substring(0, 500) + (content.length > 500 ? "..." : "");
    }

    // PDF u otros: solo metadata
    return "(contenido binario — solo metadata disponible)";

  } catch (e) {
    return "(error leyendo contenido: " + e.message.substring(0, 50) + ")";
  }
}


/**
 * Escanea archivos recientes Y lee su contenido.
 * Devuelve array con metadata + extracto del contenido real.
 * Limitado a 5 archivos para no gastar tokens excesivos.
 */
function escanearDriveConContenido_(maxArchivos) {
  maxArchivos = maxArchivos || 5;
  try {
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    const files = DriveApp.searchFiles(
      `modifiedDate > '${cutoff}' and trashed = false`
    );

    const results = [];
    let count = 0;
    while (files.hasNext() && count < maxArchivos) {
      const f = files.next();
      const mimeType = f.getMimeType();
      const nombre = f.getName();

      // Saltar la propia bitácora
      if (nombre.includes("Bitácora del Thousand Sunny")) continue;

      const contenido = leerContenidoArchivo_(f.getId(), mimeType);

      results.push({
        id: f.getId(),
        nombre: nombre,
        mime: mimeType,
        tipo: mimeType.split(".").pop(),
        fecha: f.getLastUpdated().toISOString().split("T")[0],
        carpeta: f.getParents().hasNext() ? f.getParents().next().getName() : "raíz",
        contenido: contenido,
      });
      count++;
    }
    return results;
  } catch (e) {
    Logger.log("Error escanearDriveConContenido_: " + e.message);
    return [];
  }
}


// ═══════════════════════════════════════════
// DRIVE ACCESS — BÚSQUEDA (lectura simple)
// ═══════════════════════════════════════════
function buscarDrive_(query) {
  try {
    const files = DriveApp.searchFiles(
      `title contains '${query}' and trashed = false`
    );
    const results = [];
    let count = 0;
    while (files.hasNext() && count < 10) {
      const f = files.next();
      results.push({
        id: f.getId(),
        nombre: f.getName(),
        tipo: f.getMimeType().split(".").pop(),
        fecha: f.getLastUpdated().toISOString().split("T")[0],
        carpeta: f.getParents().hasNext() ? f.getParents().next().getName() : "raíz",
        url: f.getUrl(),
      });
      count++;
    }
    return results;
  } catch (e) {
    return [{ error: e.message }];
  }
}

function archivosRecientes_() {
  try {
    const files = DriveApp.searchFiles(
      `modifiedDate > '${new Date(Date.now() - 7 * 86400000).toISOString()}' and trashed = false`
    );
    const results = [];
    let count = 0;
    while (files.hasNext() && count < 15) {
      const f = files.next();
      results.push({
        id: f.getId(),
        nombre: f.getName(),
        tipo: f.getMimeType().split(".").pop(),
        fecha: f.getLastUpdated().toISOString().split("T")[0],
        carpeta: f.getParents().hasNext() ? f.getParents().next().getName() : "raíz",
      });
      count++;
    }
    return results;
  } catch (e) {
    return [];
  }
}


// ═══════════════════════════════════════════
// MEMORIA COMPARTIDA
// ═══════════════════════════════════════════
function guardarMemoria_(tipo, contenido, fuente) {
  const memoria = getSheet_("Memoria");
  if (memoria) {
    memoria.appendRow([new Date(), tipo, contenido, fuente]);
  }
}

function getMemoriaCompartida_() {
  const memoria = getSheet_("Memoria");
  if (!memoria) return [];

  const data = memoria.getDataRange().getValues();
  return data.slice(1).map(row => ({
    timestamp: row[0],
    tipo: row[1],
    contenido: row[2],
    fuente: row[3],
  }));
}


// ═══════════════════════════════════════════
// TELEGRAM HELPER
// ═══════════════════════════════════════════
function enviarTelegram_(chatId, text) {
  const token = PropertiesService.getScriptProperties().getProperty("TELEGRAM_TOKEN");
  if (!token) return;

  try {
    UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    Logger.log("Telegram error: " + e.message);
  }
}


// ═══════════════════════════════════════════
// SHEET HELPERS
// ═══════════════════════════════════════════
function getSheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  if (!id) return null;
  return SpreadsheetApp.openById(id).getSheetByName(name);
}

function getEstado_(sheet, key) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return String(data[i][1]);
  }
  return null;
}

function setEstado_(sheet, key, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function getEstadoCompleto_() {
  const sheet = getSheet_("Estado");
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const result = {};
  data.slice(1).forEach(row => { result[row[0]] = row[1]; });
  return result;
}

function logBitacora_(ruta, nakama, mensaje, motor, tokens) {
  const bitacora = getSheet_("Bitácora");
  if (!bitacora) return;
  const estadoSheet = getSheet_("Estado");
  const tema = estadoSheet ? getEstado_(estadoSheet, "tema") : "libre";
  bitacora.appendRow([new Date(), ruta, nakama, mensaje, motor, tokens, tema]);
}

function getContextoBitacora_() {
  const bitacora = getSheet_("Bitácora");
  if (!bitacora) return "";
  const lastRow = bitacora.getLastRow();
  if (lastRow <= 1) return "";
  const startRow = Math.max(2, lastRow - MAX_CONTEXT + 1);
  const numRows = lastRow - startRow + 1;
  const data = bitacora.getRange(startRow, 3, numRows, 2).getValues(); // nakama + mensaje
  return data.map(row => `${row[0]}: ${row[1]}`).join("\n");
}

function getBitacoraReciente_(limit) {
  const bitacora = getSheet_("Bitácora");
  if (!bitacora) return [];
  const lastRow = bitacora.getLastRow();
  if (lastRow <= 1) return [];
  const startRow = Math.max(2, lastRow - limit + 1);
  const numRows = lastRow - startRow + 1;
  const data = bitacora.getRange(startRow, 1, numRows, 7).getValues();
  return data.map(row => ({
    timestamp: row[0],
    ruta: row[1],
    nakama: row[2],
    mensaje: row[3],
    motor: row[4],
    tokens: row[5],
    tema: row[6],
  }));
}

function pickNami_(category) {
  const pool = NAMI_RESPONSES[category] || NAMI_RESPONSES.general;
  return pool[Math.floor(Math.random() * pool.length)];
}

function eliminarTriggers_(funcName) {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === funcName) {
      ScriptApp.deleteTrigger(t);
    }
  });
}


function getDiagnosticoJSON_() {
  const props = PropertiesService.getScriptProperties().getProperties();
  return {
    gemini_key: props["GEMINI_KEY"] ? "✅ ..." + props["GEMINI_KEY"].slice(-6) : "❌ falta",
    openai_key: props["OPENAI_KEY"] ? "✅ ..." + props["OPENAI_KEY"].slice(-6) : "⚠️ falta",
    telegram_token: props["TELEGRAM_TOKEN"] ? "✅" : "❌ falta",
    bitacora: props["BITACORA_ID"] ? "✅" : "❌ falta",
    webapp_url: props["WEBAPP_URL"] || "no configurada",
    drive: (() => { try { DriveApp.getFiles(); return "✅ OK"; } catch (e) { return "❌ " + e.message; } })(),
  };
}


// ═══════════════════════════════════════════
// FUNCIONES MANUALES DEL CAPITÁN
// ═══════════════════════════════════════════

/** El Capitán habla — todos responden */
function capitanHabla(mensaje) {
  if (!mensaje) mensaje = "Tripulación, ¿cómo está el barco?";
  logBitacora_("manual", "capitan", mensaje, "humano", 0);

  const sanji = callGemini_(mensaje, PROMPTS.sanji);
  logBitacora_("manual", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);
  Logger.log("🍳 Sanji: " + sanji.text);

  const usopp = callUsopp_(mensaje);
  logBitacora_("manual", "usopp", usopp.text, usopp.motor, usopp.tokens);
  Logger.log("🔫 Usopp: " + usopp.text);

  const nami = pickNami_("general");
  logBitacora_("manual", "nami", nami, "local", 0);
  Logger.log(nami);
}

/** Zoro escanea Drive y reporta */
function zoroEscaneaDrive() {
  const archivos = archivosRecientes_();
  if (archivos.length === 0) {
    Logger.log("⚔️ Zoro: Drive limpio. Sin archivos recientes.");
    return;
  }

  const lista = archivos.map(a => `- ${a.nombre} (${a.tipo})`).join("\n");
  const resp = callGemini_(
    `Archivos recientes del Capitán:\n${lista}\n\nDiscerne: ¿qué es relevante y qué es ruido?`,
    PROMPTS.zoro
  );
  logBitacora_("manual", "zoro", resp.text, GEMINI_MODEL, resp.tokens);
  Logger.log("⚔️ Zoro: " + resp.text);
}

/** Guardar un insight en la memoria compartida */
function guardarInsight(texto) {
  guardarMemoria_("insight", texto, "capitan");
  Logger.log("🧠 Memoria guardada: " + texto);
}
