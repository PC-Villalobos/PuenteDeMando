/**
 * ðŸ´â€â˜ ï¸ THOUSAND SUNNY â€” GAS UNIFICADO (Ruta 1 + 4 + API)
 *
 * Fusiona: Backend autÃ³nomo + Bot Telegram + API REST para webapp
 * Todo vive en Google = gratis, 24/7, con acceso nativo a Drive.
 *
 * â•â•â• FUNCIONES â•â•â•
 * 1. AUTÃ“NOMO: La tripulaciÃ³n habla sola cada X minutos (trigger)
 * 2. TELEGRAM: Bot que responde comandos desde el mÃ³vil
 * 3. WEB API: doGet() sirve datos a la webapp HTML
 * 4. DRIVE: Lee/escribe/mueve archivos (Zoro, Robin, Sanji)
 * 5. MEMORIA: Sheet compartida que todas las rutas pueden leer
 *
 * â•â•â• SETUP â•â•â•
 * 1. Crea proyecto nuevo en script.google.com
 * 2. Pega este cÃ³digo
 * 3. Propiedades del script (âš™ï¸):
 *    GEMINI_KEY     = tu key de Gemini
 *    OPENAI_KEY     = tu key de OpenAI (opcional)
 *    TELEGRAM_TOKEN = token de @BotFather
 *    CAPTAIN_CHAT_ID = (se auto-detecta con /start)
 * 4. Ejecuta setupCompleto()
 * 5. Implementar > Nueva implementaciÃ³n > App web
 *    - Ejecutar como: Yo
 *    - QuiÃ©n tiene acceso: Cualquiera
 *    - Copiar la URL de la webapp
 * 6. Configurar webhook de Telegram (ejecuta configurarWebhook())
 */

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONFIGURACIÃ“N
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const GEMINI_MODEL = "gemini-2.5-flash-lite"; // FREE TIER
const OPENAI_MODEL = "gpt-4o-mini";
const MAX_CONTEXT = 6;
const MAX_TOKENS_RESPONSE = 150;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SYSTEM PROMPTS (compactos = ahorro de tokens)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const PROMPTS = {
  sanji: "Eres Sanji, cocinero de la tripulaciÃ³n IA del CapitÃ¡n Antonio (psicÃ³logo clÃ­nico e investigador). " +
    "Tu rol: EVALUACIÃ“N Y PROCESAMIENTO de contenido. Decides si un archivo necesita cocinarse (procesarse, " +
    "enriquecerse, resumirse) antes de moverse. Puedes decir 'esto hay que cocinarlo primero' o 'estÃ¡ listo, " +
    "muÃ©velo'. UNA metÃ¡fora culinaria mÃ¡ximo. Responde al nakama anterior. Solo TU voz. EspaÃ±ol. MÃ¡x 80 palabras.",

  usopp: "Eres Usopp, narrador creativo de la tripulaciÃ³n IA del CapitÃ¡n Antonio (psicÃ³logo clÃ­nico e investigador). " +
    "Motor: ChatGPT. Tu rol: CONEXIONES INESPERADAS. Ves patrones que otros no ven, conectas contenidos entre sÃ­. " +
    "REGLA ABSOLUTA: NUNCA escribas diÃ¡logos de otros nakamas. Solo TU voz. EspaÃ±ol. MÃ¡x 80 palabras.",

  zoro: "Eres Zoro, espadachÃ­n de la tripulaciÃ³n IA del CapitÃ¡n Antonio. " +
    "Tu rol: PROPONER ACCIONES CONCRETAS sobre archivos de Drive. Propones mover, duplicar, o destruir archivos. " +
    "Di exactamente: 'Propongo mover X a Y porque Z' o 'Esto sobra, a la papelera'. " +
    "Lee lo que Robin encontrÃ³ y actÃºa. Directo, sin adornos. EspaÃ±ol. MÃ¡x 80 palabras.",

  robin: "Eres Robin, arqueÃ³loga de la tripulaciÃ³n IA del CapitÃ¡n Antonio (psicÃ³logo clÃ­nico e investigador). " +
    "Tu rol: LEER los poneglyph â€” entiendes el contenido REAL de los archivos, su significado profundo, " +
    "y propones dÃ³nde pertenece cada pieza en la estructura organizativa del CapitÃ¡n. " +
    "Di: 'Este archivo habla de X, pertenece al pilar Y porque Z'. EspaÃ±ol. MÃ¡x 100 palabras.",

  chopper: "Eres Chopper, mÃ©dico de la tripulaciÃ³n IA del CapitÃ¡n Antonio (psicÃ³logo clÃ­nico e investigador). " +
    "Tu rol: DETECTAR PATRONES entre los archivos â€” condensaciones funcionales, repeticiones, " +
    "conexiones fractales entre lo clÃ­nico, lo personal y lo tÃ©cnico del CapitÃ¡n. " +
    "Di: 'Veo un patrÃ³n: estos archivos comparten X'. EspaÃ±ol. MÃ¡x 80 palabras.",
};

const NAMI_RESPONSES = {
  general: [
    "ðŸ—ºï¸ Nami al puente. Sistemas operativos.",
    "ðŸ—ºï¸ Rumbo estable. Esperando coordenadas del CapitÃ¡n.",
    "ðŸ—ºï¸ BitÃ¡cora actualizada. La tripulaciÃ³n responde.",
  ],
  after_sanji: [
    "ðŸ—ºï¸ Buen anÃ¡lisis, Sanji. Â¿ConclusiÃ³n accionable?",
    "ðŸ—ºï¸ Dato registrado. CapitÃ¡n, Â¿actuamos sobre esto?",
  ],
  after_usopp: [
    "ðŸ—ºï¸ Perspectiva lateral registrada. Filtro el ruido.",
    "ðŸ—ºï¸ Creatividad anotada. Toca verificar si tiene base real.",
  ],
  after_zoro: [
    "ðŸ—ºï¸ Zoro ha cortado. Lo que queda es lo que importa.",
    "ðŸ—ºï¸ Discernimiento aplicado. Rumbo mÃ¡s claro.",
  ],
};

const TOPICS = {
  libre: "Aporta una reflexiÃ³n breve y REAL: idea concreta, dato interesante, conexiÃ³n entre disciplinas. NO ficciÃ³n vacÃ­a.",
  filosofia: "Comparte UNA idea filosÃ³fica concreta y profunda. Cita un pensador si es relevante.",
  psicologia: "Aporta UN insight real de psicologÃ­a clÃ­nica, regulaciÃ³n emocional, o investigaciÃ³n. Antonio es psicÃ³logo â€” habla a su nivel.",
  tecnologia: "ReflexiÃ³n tÃ©cnica real sobre IA, arquitectura de agentes, APIs, o metadata. SÃ© especÃ­fico.",
  metadata: "Reflexiona sobre soberanÃ­a digital, control de metadata personal, o cÃ³mo la IA empodera al usuario.",
};


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SETUP COMPLETO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function setupCompleto() {
  const props = PropertiesService.getScriptProperties();

  // Crear o abrir BitÃ¡cora
  let bitacoraId = props.getProperty("BITACORA_ID");
  let ss;

  if (!bitacoraId) {
    ss = SpreadsheetApp.create("ðŸ´â€â˜ ï¸ BitÃ¡cora del Thousand Sunny â€” Unificada");
    bitacoraId = ss.getId();
    props.setProperty("BITACORA_ID", bitacoraId);
  } else {
    ss = SpreadsheetApp.openById(bitacoraId);
  }

  // Sheet: BitÃ¡cora
  let bitacora = ss.getSheetByName("BitÃ¡cora");
  if (!bitacora) {
    bitacora = ss.getSheets()[0];
    bitacora.setName("BitÃ¡cora");
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

  // Crear trigger autÃ³nomo
  eliminarTriggers_("cicloAutonomo");
  ScriptApp.newTrigger("cicloAutonomo")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("âœ… Setup completo.");
  Logger.log("ðŸ“‹ BitÃ¡cora: " + ss.getUrl());
  Logger.log("ðŸ“Œ Siguiente paso: Implementar > Nueva implementaciÃ³n > App web");
  Logger.log("ðŸ“Œ Luego ejecuta configurarWebhook()");
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TELEGRAM: WEBHOOK
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function configurarWebhook() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("TELEGRAM_TOKEN");
  if (!token) {
    Logger.log("âŒ Falta TELEGRAM_TOKEN en Propiedades del script");
    return;
  }

  // Usar WEBAPP_URL de propiedades (la URL de producciÃ³n /exec)
  // Si no existe, intentar obtenerla automÃ¡ticamente
  let webappUrl = props.getProperty("WEBAPP_URL");
  if (!webappUrl) {
    webappUrl = ScriptApp.getService().getUrl();
  }

  if (!webappUrl) {
    Logger.log("âŒ AÃ±ade WEBAPP_URL en Propiedades del script con la URL de producciÃ³n (/exec)");
    return;
  }

  // Asegurar que usa /exec (producciÃ³n), no /dev
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

/** Configurar webhook manualmente con la URL de producciÃ³n */
function configurarWebhookManual() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("TELEGRAM_TOKEN");
  const webappUrl = props.getProperty("WEBAPP_URL");

  if (!token) { Logger.log("âŒ Falta TELEGRAM_TOKEN"); return; }
  if (!webappUrl) { Logger.log("âŒ Falta WEBAPP_URL â€” aÃ±Ã¡dela en Propiedades del script"); return; }

  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webappUrl)}`;
  const res = UrlFetchApp.fetch(url);
  Logger.log("âœ… Webhook: " + res.getContentText());
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// doPost: RECIBE MENSAJES DE TELEGRAM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
        "ðŸ´â€â˜ ï¸ *Thousand Sunny â€” Puente de Mando*\n\n" +
        "âš“ Bot conectado, CapitÃ¡n.\n\n" +
        "*TripulaciÃ³n:*\n" +
        "/tripulacion <msg> â€” todos hablan\n" +
        "/sanji <msg> â€” solo Sanji\n" +
        "/usopp <msg> â€” solo Usopp\n" +
        "/zoro â€” Zoro escanea Drive\n" +
        "/nami â€” estado del barco\n\n" +
        "*Agencia Drive:*\n" +
        "/crear <tipo> <nombre> [en carpeta] â€” crear archivo\n" +
        "/mover <archivo> a <carpeta> â€” mover\n" +
        "/borrar <archivo> â€” enviar a papelera\n" +
        "/renombrar <actual> a <nuevo>\n" +
        "/escribir <doc> | <contenido>\n" +
        "/drive <bÃºsqueda> â€” buscar\n\n" +
        "*Sistema:*\n" +
        "/autonomo â€” on/off autÃ³nomo\n" +
        "/tema <tema> â€” cambiar tema\n" +
        "/memoria â€” ver memoria compartida\n" +
        "/diagnostico â€” verificar keys y estado\n" +
        "/estado â€” ver estado completo"
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
      handleMensajeLibre_v3_(chatId, text);
    }

  } catch (err) {
    Logger.log("doPost error: " + err.message);
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// doGet: API REST PARA WEBAPP HTML
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function coworkAuthError_(e, action) {
  if (action !== "log_cowork" && action !== "log_batch") return null;

  var p = (e && e.parameter) || {};
  var expected = PropertiesService.getScriptProperties().getProperty("COWORK_TOKEN");
  if (!expected) return { ok: false, error: "cowork_token_not_configured" };
  if (p.token !== expected) return { ok: false, error: "unauthorized" };
  return null;
}

function setCoworkToken(token) {
  if (!token || String(token).length < 32) {
    throw new Error("COWORK_TOKEN must be at least 32 characters");
  }
  PropertiesService.getScriptProperties().setProperty("COWORK_TOKEN", String(token));
  return { ok: true, property: "COWORK_TOKEN" };
}

function doGet(e) {
  const action = e.parameter.action || "status";
  let result = {};
  const authError = coworkAuthError_(e, action);
  if (authError) {
    return ContentService.createTextOutput(JSON.stringify(authError))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    switch (action) {

      case "status":
        result = getEstadoCompleto_();
        break;

      case "bitacora":
        // Ãšltimos N mensajes
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
        case "mensaje":
        const msgText = e.parameter.text || "";
        const msgRuta = e.parameter.ruta || "webapp";
        if (!msgText) { result = {error: "sin texto"}; break; }
        const captainId = PropertiesService.getScriptProperties().getProperty("CAPTAIN_CHAT_ID");
        enviarTelegram_(captainId, '\uD83D\uDC52 Capit\u00E1n (webapp): ' + msgText, false); // BUG2: eco del mensaje original webapp en Telegram
        result = procesarMensajeCapitan_(msgText, msgRuta);
        result.debug_captain = captainId ? "id_set" : "NULL_no_telegram";
        break;

      case "bitacora_desde":
        const since = e.parameter.since || "";
        result = getBitacoraDesde_(since);
        break;

      case "autonomo_toggle":
        result = toggleAutonomo_();
        break;

      case "tarea_nueva":
        const tarea = e.parameter.tarea || "";
        const asignado = e.parameter.asignado || "franky";
        result = agregarTarea_(tarea, asignado);
        break;

      case "cola_estado":
        result = getColaEstado_();
        break;

      
      case "nami":
        const namiPrompt = e.parameter.prompt || "Estado del barco";
        const namiDrive = e.parameter.drive === "true";
        const namiResp = namiConContexto_(namiPrompt, namiDrive);
        logBitacora_("webapp", "nami", namiResp.text, CLAUDE_MODEL, namiResp.tokens);
        result = { text: namiResp.text, tokens: namiResp.tokens, motor: CLAUDE_MODEL };
        break;

      // === COWORK BRIDGE (Nami/Claude) ===
      case "log_cowork":
        var logNakama = e.parameter.nakama || "nami";
        var logMensaje = e.parameter.mensaje || "";
        var logMotor = e.parameter.motor || "cowork";
        var logCalidad = e.parameter.calidad || null;
        var logOperacion = e.parameter.operacion || null;
        if (!logMensaje) { result = {error: "sin mensaje"}; break; }
        logCowork_(logNakama, logMensaje, logMotor, logCalidad, logOperacion);
        result = { ok: true, timestamp: new Date().toISOString(), nakama: logNakama };
        break;

      case "log_batch":
        var entries = [];
        try { entries = JSON.parse(e.parameter.entries || "[]"); } catch(err) {}
        if (!entries.length) { result = {error: "sin entries"}; break; }
        result = logBatchCowork_(entries);
        break;

      case "guardia_nami":
        var resumen = e.parameter.resumen || "";
        if (!resumen) { result = {error: "sin resumen"}; break; }
        logGuardiaNami_(resumen);
        result = { ok: true, timestamp: new Date().toISOString() };
        break;

      case "estado_cowork":
        result = getEstadoParaCowork_();
        break;

      case "delegar_usopp":
        var tareaUsopp = e.parameter.tarea || "";
        var contextoUsopp = e.parameter.contexto || "";
        var maxTok = parseInt(e.parameter.max_tokens) || 500;
        if (!tareaUsopp) { result = {error: "sin tarea"}; break; }
        result = delegarAUsopp_(tareaUsopp, contextoUsopp, maxTok);
        break;


      // â”€â”€â”€ ZORO v1.0: Operaciones de archivo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

      case 'mover_archivo':
        return zoroMover_(e);

      case 'renombrar_archivo':
        return zoroRenombrar_(e);

      case 'modificar_doc':
        return zoroModificar_(e);

      case 'borrar_archivo':
        return zoroBorrar_(e);

      case 'crear_doc_inbox':
        return zoroCrearDocInbox_(e);

      case 'listar_carpeta':
        return zoroListarCarpeta_(e);


    case 'get_estado_full':
      return accion_get_estado_full_();

    case 'get_campo':
      return accion_get_campo_(e.parameter);

    case 'update_campo':
      return accion_update_campo_(e.parameter);

      default:
        result = { error: "AcciÃ³n no reconocida: " + action };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TELEGRAM COMMAND HANDLERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function cmdTripulacion_old_(chatId, msg) {
  if (!msg) msg = "TripulaciÃ³n, Â¿cÃ³mo estÃ¡ el barco?";
  logBitacora_("telegram", "capitan", msg, "humano", 0);

  // Sanji (free)
  const sanji = callGeminiConContexto_(msg, PROMPTS.sanji);
  logBitacora_("telegram", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);
  enviarTelegram_(chatId, "ðŸ³ *Sanji:*\n" + sanji.text);

  // Usopp
  const usopp = callUsoppConContexto_(msg);
  logBitacora_("telegram", "usopp", usopp.text, usopp.motor, usopp.tokens);
  enviarTelegram_(chatId, "ðŸ”« *Usopp:*\n" + usopp.text);

  // Nami
  const nami = pickNami_("general");
  logBitacora_("telegram", "nami", nami, "local", 0);
  enviarTelegram_(chatId, nami);
}

function cmdSanji_(chatId, msg) {
  if (!msg) msg = "Sanji, Â¿quÃ© anÃ¡lisis tienes?";
  logBitacora_("telegram", "capitan", msg, "humano", 0);
  const resp = callGeminiConContexto_(msg, PROMPTS.sanji);
  logBitacora_("telegram", "sanji", resp.text, GEMINI_MODEL, resp.tokens);
  enviarTelegram_(chatId, "ðŸ³ *Sanji:*\n" + resp.text);
}

function cmdUsopp_(chatId, msg) {
  if (!msg) msg = "Usopp, Â¿quÃ© ideas tienes?";
  logBitacora_("telegram", "capitan", msg, "humano", 0);
  const resp = callUsoppConContexto_(msg);
  logBitacora_("telegram", "usopp", resp.text, resp.motor, resp.tokens);
  enviarTelegram_(chatId, "ðŸ”« *Usopp:*\n" + resp.text);
}

function cmdZoro_(chatId) {
  enviarTelegram_(chatId, "âš”ï¸ *Zoro escaneando Drive...*");
  const archivos = archivosRecientes_();

  if (archivos.length === 0) {
    enviarTelegram_(chatId, "âš”ï¸ Zoro: No hay archivos recientes. El barco estÃ¡ limpio.");
    return;
  }

  // Zoro analiza los archivos con Gemini (free)
  const listaArchivos = archivos.map(a => `- ${a.nombre} (${a.tipo}, ${a.fecha})`).join("\n");
  const prompt = `Estos son los archivos recientes en el Drive del CapitÃ¡n Antonio:\n${listaArchivos}\n\nAnaliza: Â¿CuÃ¡les son relevantes para el trabajo del CapitÃ¡n (psicologÃ­a clÃ­nica, investigaciÃ³n, ecosistema IA)? Â¿CuÃ¡les son ruido?`;

  const resp = callGemini_(prompt, PROMPTS.zoro);
  logBitacora_("telegram", "zoro", resp.text, GEMINI_MODEL, resp.tokens);
  enviarTelegram_(chatId, "âš”ï¸ *Zoro:*\n" + resp.text);

  // Indexar en DriveIndex
  const driveIndex = getSheet_("DriveIndex");
  if (driveIndex) {
    archivos.forEach(a => {
      driveIndex.appendRow([new Date(), a.nombre, a.tipo, a.carpeta, "", ""]);
    });
  }
}

function cmdNami_old_(chatId) {
  const estadoSheet = getSheet_("Estado");
  const auto = getEstado_(estadoSheet, "auto_activo");
  const tema = getEstado_(estadoSheet, "tema");
  const tokens = getEstado_(estadoSheet, "total_tokens");
  const ultimo = getEstado_(estadoSheet, "ultimo_hablante");

  enviarTelegram_(chatId,
    "ðŸ—ºï¸ *Nami â€” Estado del Barco*\n\n" +
    "AutÃ³nomo: " + (auto === "true" ? "ðŸŸ¢ ON" : "ðŸ”´ OFF") + "\n" +
    "Tema: " + tema + "\n" +
    "Tokens: ~" + tokens + "\n" +
    "Ãšltimo: " + ultimo
  );
}

function cmdAutonomo_(chatId) {
  const estadoSheet = getSheet_("Estado");
  const actual = getEstado_(estadoSheet, "auto_activo");
  const nuevo = actual === "true" ? "false" : "true";
  setEstado_(estadoSheet, "auto_activo", nuevo);
  enviarTelegram_(chatId, nuevo === "true"
    ? "ðŸ”„ Modo autÃ³nomo *activado*."
    : "â¸ Modo autÃ³nomo *detenido*."
  );
}

function cmdTema_(chatId, tema) {
  if (tema && TOPICS[tema]) {
    const estadoSheet = getSheet_("Estado");
    setEstado_(estadoSheet, "tema", tema);
    enviarTelegram_(chatId, "ðŸŽ¯ Tema: *" + tema + "*");
  } else {
    enviarTelegram_(chatId, "Temas: " + Object.keys(TOPICS).join(", "));
  }
}

function cmdDrive_(chatId, query) {
  if (!query) {
    enviarTelegram_(chatId, "Uso: /drive <tÃ©rmino de bÃºsqueda>");
    return;
  }

  const resultados = buscarDrive_(query);
  if (resultados.length === 0) {
    enviarTelegram_(chatId, "ðŸ” Sin resultados para: " + query);
    return;
  }

  const texto = resultados.slice(0, 5).map((r, i) =>
    `${i + 1}. *${r.nombre}* (${r.tipo})\n   ðŸ“… ${r.fecha}`
  ).join("\n\n");

  enviarTelegram_(chatId, "ðŸ” *Resultados en Drive:*\n\n" + texto);
}

function cmdMemoria_(chatId) {
  const memoria = getMemoriaCompartida_();
  if (memoria.length === 0) {
    enviarTelegram_(chatId, "ðŸ§  Memoria vacÃ­a. La tripulaciÃ³n aÃºn no ha guardado insights.");
    return;
  }
  const texto = memoria.slice(-5).map(m =>
    `â€¢ [${m.tipo}] ${m.contenido.substring(0, 100)}`
  ).join("\n");
  enviarTelegram_(chatId, "ðŸ§  *Memoria Compartida:*\n\n" + texto);
}

function cmdEstado_(chatId) {
  cmdNami_(chatId);
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TELEGRAM: AGENCIA DRIVE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** /crear doc MiDocumento en MiCarpeta */
function cmdCrear_(chatId, args) {
  if (!args) {
    enviarTelegram_(chatId,
      "Uso: /crear <tipo> <nombre> [en <carpeta>]\n" +
      "Tipos: doc, sheet, folder, txt\n" +
      "Ejemplo: /crear doc Notas SesiÃ³n en Casos ClÃ­nicos"
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
    enviarTelegram_(chatId, "âš ï¸ Falta el nombre. Ejemplo: /crear doc Mi Documento");
    return;
  }

  const result = crearEnDrive_(nombre, tipo, carpeta);
  if (result.ok) {
    logBitacora_("telegram", "franky", `Creado ${result.tipo}: ${result.nombre}`, "drive", 0);
    guardarMemoria_("accion_drive", `Franky creÃ³ ${result.tipo}: ${result.nombre}${carpeta ? " en " + carpeta : ""}`, "telegram");
    enviarTelegram_(chatId,
      `ðŸ”§ *Franky ha construido:*\n${result.tipo}: *${result.nombre}*${carpeta ? "\nðŸ“ En: " + carpeta : ""}\nðŸ”— ${result.url}`
    );
  } else {
    enviarTelegram_(chatId, "âš ï¸ Error: " + result.error);
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
    logBitacora_("telegram", "zoro", `Movido: ${result.archivo} â†’ ${result.destino}`, "drive", 0);
    guardarMemoria_("accion_drive", `Zoro moviÃ³: ${result.archivo} â†’ ${result.destino}`, "telegram");
    enviarTelegram_(chatId, `âš”ï¸ *Zoro ha movido:*\n${result.archivo} â†’ ðŸ“ ${result.destino}`);
  } else {
    enviarTelegram_(chatId, "âš ï¸ Error: " + result.error);
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
    guardarMemoria_("accion_drive", `Zoro destruyÃ³: ${result.archivo} (papelera)`, "telegram");
    enviarTelegram_(chatId, `âš”ï¸ *Zoro ha destruido:*\n${result.archivo} â†’ ðŸ—‘ papelera`);
  } else {
    enviarTelegram_(chatId, "âš ï¸ Error: " + result.error);
  }
}

/** /escribir NombreDoc | Contenido a escribir */
function cmdEscribir_(chatId, args) {
  if (!args || !args.includes("|")) {
    enviarTelegram_(chatId, "Uso: /escribir <nombre doc> | <contenido>\nEjemplo: /escribir Notas | SesiÃ³n productiva hoy");
    return;
  }

  const pipeIndex = args.indexOf("|");
  const nombreDoc = args.substring(0, pipeIndex).trim();
  const contenido = args.substring(pipeIndex + 1).trim();

  const result = escribirEnDoc_(nombreDoc, contenido);
  if (result.ok) {
    logBitacora_("telegram", "robin", `Escrito en: ${result.nombre}`, "drive", 0);
    enviarTelegram_(chatId, `ðŸ“ *Robin ha escrito en:*\n*${result.nombre}*\nðŸ”— ${result.url}`);
  } else {
    enviarTelegram_(chatId, "âš ï¸ Error: " + result.error);
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
    logBitacora_("telegram", "robin", `Renombrado: ${result.antes} â†’ ${result.ahora}`, "drive", 0);
    enviarTelegram_(chatId, `ðŸ“ *Robin ha renombrado:*\n${result.antes} â†’ *${result.ahora}*`);
  } else {
    enviarTelegram_(chatId, "âš ï¸ Error: " + result.error);
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DIAGNÃ“STICO â€” VERIFICAR TODO EL SISTEMA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** /diagnostico â€” muestra el estado de todas las keys y conexiones */
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

  let msg = "ðŸ”§ *DiagnÃ³stico del Thousand Sunny*\n\n";

  msg += "*API Keys:*\n";
  msg += geminiKey ? "âœ… GEMINI\\_KEY: ..." + geminiKey.slice(-6) + "\n" : "âŒ GEMINI\\_KEY: NO CONFIGURADA\n";
  msg += openaiKey ? "âœ… OPENAI\\_KEY: ..." + openaiKey.slice(-6) + "\n" : "âš ï¸ OPENAI\\_KEY: no hay (Usopp usarÃ¡ Gemini)\n";
  msg += telegramToken ? "âœ… TELEGRAM\\_TOKEN: ..." + telegramToken.slice(-6) + "\n" : "âŒ TELEGRAM\\_TOKEN: NO CONFIGURADO\n";

  msg += "\n*Infraestructura:*\n";
  msg += bitacoraId ? "âœ… BitÃ¡cora: conectada\n" : "âŒ BitÃ¡cora: NO CREADA (ejecuta setupCompleto)\n";
  msg += webappUrl ? "âœ… WEBAPP\\_URL: " + webappUrl.substring(0, 40) + "...\n" : "âš ï¸ WEBAPP\\_URL: no configurada\n";
  msg += captainId ? "âœ… Captain ID: " + captainId + "\n" : "âš ï¸ Captain ID: pendiente\n";

  // Test rÃ¡pido de Gemini
  if (geminiKey) {
    const testResult = callGemini_("Di solo: OK", "Responde solo OK");
    if (testResult.text === "âš ï¸ Falta GEMINI_KEY") {
      msg += "\n*Test Gemini:* âŒ Key no leÃ­da";
    } else if (testResult.text.startsWith("âš ï¸")) {
      msg += "\n*Test Gemini:* âŒ " + testResult.text.substring(0, 60);
    } else {
      msg += "\n*Test Gemini:* âœ… Responde OK";
    }
  }

  // Estado autÃ³nomo
  const estadoSheet = getSheet_("Estado");
  if (estadoSheet) {
    const auto = getEstado_(estadoSheet, "auto_activo");
    const ciclo = getEstado_(estadoSheet, "ciclo_num") || "0";
    const ultimoCiclo = getEstado_(estadoSheet, "ultimo_ciclo") || "nunca";
    msg += "\n\n*Ciclo autÃ³nomo:*\n";
    msg += "Estado: " + (auto === "true" ? "ðŸŸ¢ ON" : "ðŸ”´ OFF") + "\n";
    msg += "Ciclos: " + ciclo + "\n";
    msg += "Ãšltimo: " + ultimoCiclo;
  }

  // Test Drive
  try {
    const testFiles = DriveApp.getFiles();
    msg += "\n\n*Drive:* âœ… Acceso OK";
  } catch (e) {
    msg += "\n\n*Drive:* âŒ Sin acceso";
  }

  enviarTelegram_(chatId, msg);
}

/** VersiÃ³n para ejecutar desde el editor de GAS (sin Telegram) */
function diagnostico() {

  const props = PropertiesService.getScriptProperties();
  const allProps = props.getProperties();

  Logger.log("â•â•â• DIAGNÃ“STICO THOUSAND SUNNY â•â•â•");
  Logger.log("");

  // Keys
  const keys = ["GEMINI_KEY", "OPENAI_KEY", "TELEGRAM_TOKEN", "BITACORA_ID", "WEBAPP_URL", "CAPTAIN_CHAT_ID"];
  keys.forEach(k => {
    const v = allProps[k];
    if (v) {
      Logger.log("âœ… " + k + " = ..." + v.slice(-8));
    } else {
      Logger.log("âŒ " + k + " = NO CONFIGURADA");
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
    Logger.log("Test Drive: âœ… Acceso OK (" + count + "+ archivos)");
  } catch (e) {
    Logger.log("Test Drive: âŒ " + e.message);
  }

  // Test BitÃ¡cora
  const bitacoraId = allProps["BITACORA_ID"];
  if (bitacoraId) {
    try {
      const ss = SpreadsheetApp.openById(bitacoraId);
      const sheets = ss.getSheets().map(s => s.getName());
      Logger.log("Test BitÃ¡cora: âœ… Sheets: " + sheets.join(", "));
    } catch (e) {
      Logger.log("Test BitÃ¡cora: âŒ " + e.message);
    }
  }

  Logger.log("");
  Logger.log("â•â•â• FIN DIAGNÃ“STICO â•â•â•");
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CICLO AUTÃ“NOMO â€” DELIBERACIÃ“N CON CONTEXTO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Cada ciclo: Lee Drive â†’ Zoro filtra â†’ Sanji analiza â†’ Usopp conecta â†’ Nami sintetiza
// El resultado se guarda en Memoria y se envÃ­a a Telegram.
// NO es un nakama diciendo frases sueltas. Es la tripulaciÃ³n pensando junta.
//
// Tipos de ciclo (se alternan para no gastar tokens):
//  - RONDA COMPLETA: Drive scan + Zoro + Sanji + Nami (cada 3 ciclos)
//  - RONDA LIGERA: Solo Sanji reflexiona sobre memoria reciente (ciclos intermedios)
//  - RONDA CREATIVA: Usopp + Nami (1 de cada 5 ciclos, usa OpenAI)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function cicloAutonomo_old() {
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
      // â•â•â• RONDA COMPLETA: Drive + deliberaciÃ³n â•â•â•
      rondaCompletaDrive_(tema, token, captainId);
    } else if (cicloNum % 5 === 0) {
      // â•â•â• RONDA CREATIVA: Usopp aporta perspectiva lateral â•â•â•
      rondaCreativa_(tema, token, captainId);
    } else {
      // â•â•â• RONDA LIGERA: Sanji reflexiona (free, bajo coste) â•â•â•
      rondaLigera_(tema, token, captainId);
    }
  } catch (err) {
    Logger.log("âŒ Ciclo autÃ³nomo error: " + err.message);
  }

  setEstado_(estadoSheet, "ultimo_ciclo", new Date().toISOString());
}


/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * RONDA COMPLETA: DELIBERACIÃ“N VIVA DE LA TRIPULACIÃ“N
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *
 * Flujo real:
 *   1. Robin lee los poneglyph (contenido REAL de archivos recientes)
 *   2. Chopper detecta patrones entre los archivos
 *   3. Zoro propone ACCIONES CONCRETAS (mover, duplicar, destruir)
 *   4. Sanji evalÃºa si hay que "cocinar" algo antes de moverlo
 *   5. Se ejecutan las acciones acordadas
 *   6. Todo se envÃ­a como diÃ¡logo natural a Telegram
 *
 * Cada IA ve lo que dijeron las anteriores = conversaciÃ³n real.
 */
function rondaCompletaDrive_(tema, token, captainId) {
  // â”€â”€â”€ 1. ROBIN LEE LOS PONEGLYPH â”€â”€â”€
  const archivos = escanearDriveConContenido_(5);
  const memorias = getMemoriaCompartida_();
  const memReciente = memorias.slice(-3).map(m => `[${m.tipo}] ${m.contenido.substring(0, 80)}`).join("\n");

  if (archivos.length === 0) {
    rondaLigera_(tema, token, captainId);
    return;
  }

  // Preparar los poneglyph: nombre + carpeta + CONTENIDO real
  const poneglyph = archivos.map(a =>
    `ðŸ“„ "${a.nombre}" (en: ${a.carpeta}, ${a.fecha})\n   Contenido: ${a.contenido.substring(0, 200)}`
  ).join("\n\n");

  // â”€â”€â”€ ROBIN: Lee y clasifica semÃ¡nticamente â”€â”€â”€
  const robinPrompt = `Estos son los archivos recientes del CapitÃ¡n Antonio en su Drive. Has leÃ­do su contenido real:\n\n${poneglyph}\n\n` +
    (memReciente ? `Memoria reciente de la tripulaciÃ³n:\n${memReciente}\n\n` : "") +
    `Lee estos poneglyph. Para cada archivo di: de quÃ© habla REALMENTE, a quÃ© pilar del CapitÃ¡n pertenece ` +
    `(clÃ­nica, investigaciÃ³n/doctorado, ecosistema IA, personal, SofÃ­a) y si estÃ¡ bien ubicado en su carpeta actual.`;

  const robin = callGemini_(robinPrompt, PROMPTS.robin);
  logBitacora_("autonomo", "robin", robin.text, GEMINI_MODEL, robin.tokens);

  // â”€â”€â”€ CHOPPER: Detecta patrones â”€â”€â”€
  const chopperPrompt = `Robin ha leÃ­do los poneglyph del Drive y dice:\n"${robin.text}"\n\n` +
    `Archivos analizados: ${archivos.map(a => a.nombre).join(", ")}.\n\n` +
    `Detecta patrones: Â¿Hay condensaciÃ³n funcional? Â¿Archivos que comparten temÃ¡tica sin saberlo? ` +
    `Â¿Algo que revele un patrÃ³n genuino del CapitÃ¡n Antonio (psicÃ³logo clÃ­nico, investigador, creador de IA)?`;

  const chopper = callGemini_(chopperPrompt, PROMPTS.chopper);
  logBitacora_("autonomo", "chopper", chopper.text, GEMINI_MODEL, chopper.tokens);

  // â”€â”€â”€ ZORO: Propone acciones concretas â”€â”€â”€
  const zoroPrompt = `Robin ha leÃ­do los archivos:\n"${robin.text}"\n\nChopper detectÃ³ patrones:\n"${chopper.text}"\n\n` +
    `Archivos disponibles:\n${archivos.map(a => `- "${a.nombre}" (en: ${a.carpeta})`).join("\n")}\n\n` +
    `PropÃ³n ACCIONES CONCRETAS. Para cada propuesta usa este formato exacto:\n` +
    `ACCIÃ“N: mover|duplicar|borrar|nada\nARCHIVO: nombre exacto\nDESTINO: carpeta destino (si aplica)\nRAZÃ“N: por quÃ©\n\n` +
    `Si un archivo estÃ¡ bien donde estÃ¡, di "nada". SÃ© concreto.`;

  const zoro = callGemini_(zoroPrompt, PROMPTS.zoro);
  logBitacora_("autonomo", "zoro", zoro.text, GEMINI_MODEL, zoro.tokens);

  // â”€â”€â”€ SANJI: EvalÃºa las propuestas de Zoro â”€â”€â”€
  const sanjiPrompt = `Zoro propone estas acciones sobre los archivos del CapitÃ¡n:\n"${zoro.text}"\n\n` +
    `Robin dijo sobre el contenido:\n"${robin.text}"\n\n` +
    `EvalÃºa: Â¿AlgÃºn archivo necesita "cocinarse" (procesarse, resumirse, enriquecerse) ANTES de moverse? ` +
    `Â¿Las propuestas de Zoro son correctas o hay que ajustar algo? Di "apruebo" o "espera, esto hay que cocinarlo primero".`;

  const sanji = callGemini_(sanjiPrompt, PROMPTS.sanji);
  logBitacora_("autonomo", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);

  // â”€â”€â”€ EJECUTAR ACCIONES ACORDADAS â”€â”€â”€
  const acciones = parsearAccionesZoro_(zoro.text);
  const resultadosAcciones = [];

  acciones.forEach(acc => {
    // Solo ejecutar si Sanji no vetÃ³ (buscar "espera" o "cocinar" cerca del archivo)
    const sanjiVeto = sanji.text.toLowerCase().includes("cocinar") &&
                      sanji.text.toLowerCase().includes(acc.archivo.toLowerCase().substring(0, 15));

    if (sanjiVeto) {
      resultadosAcciones.push(`â¸ ${acc.archivo}: Sanji dice que hay que cocinarlo primero`);
      return;
    }

    if (acc.accion === "mover" && acc.destino) {
      const r = moverEnDrive_(acc.archivo, acc.destino);
      if (r.ok) {
        resultadosAcciones.push(`âœ… Movido: ${acc.archivo} â†’ ${acc.destino}`);
      } else {
        resultadosAcciones.push(`âš ï¸ No pude mover ${acc.archivo}: ${r.error}`);
      }
    } else if (acc.accion === "borrar") {
      const r = borrarEnDrive_(acc.archivo);
      if (r.ok) {
        resultadosAcciones.push(`ðŸ—‘ Destruido: ${acc.archivo}`);
      } else {
        resultadosAcciones.push(`âš ï¸ No pude borrar ${acc.archivo}: ${r.error}`);
      }
    } else if (acc.accion === "duplicar" && acc.destino) {
      // Duplicar = copiar a nueva ubicaciÃ³n sin quitar de la original
      try {
        const files = DriveApp.getFilesByName(acc.archivo);
        if (files.hasNext()) {
          const original = files.next();
          const carpetas = DriveApp.getFoldersByName(acc.destino);
          if (carpetas.hasNext()) {
            original.makeCopy(acc.archivo, carpetas.next());
            resultadosAcciones.push(`ðŸ“‹ Duplicado: ${acc.archivo} â†’ tambiÃ©n en ${acc.destino}`);
          }
        }
      } catch (e) {
        resultadosAcciones.push(`âš ï¸ No pude duplicar ${acc.archivo}: ${e.message}`);
      }
    }
    // "nada" = no hacer nada, no registrar
  });

  // â”€â”€â”€ FORMATEAR DIÃLOGO NATURAL â”€â”€â”€
  let dialogo = `ðŸ´â€â˜ ï¸ *DeliberaciÃ³n de la TripulaciÃ³n*\n`;
  dialogo += `ðŸ“š _${archivos.length} poneglyph leÃ­dos_\n\n`;

  dialogo += `ðŸŒ¸ *Robin:*\n${robin.text}\n\n`;
  dialogo += `ðŸ©º *Chopper:*\n${chopper.text}\n\n`;
  dialogo += `âš”ï¸ *Zoro:*\n${zoro.text}\n\n`;
  dialogo += `ðŸ³ *Sanji:*\n${sanji.text}`;

  if (resultadosAcciones.length > 0) {
    dialogo += `\n\nðŸ—ºï¸ *Nami â€” Acciones ejecutadas:*\n${resultadosAcciones.join("\n")}`;
  } else {
    dialogo += `\n\nðŸ—ºï¸ *Nami:* DeliberaciÃ³n registrada. Sin acciones pendientes.`;
  }

  logBitacora_("autonomo", "nami", "DeliberaciÃ³n completa: " + resultadosAcciones.length + " acciones", "local", 0);

  // â”€â”€â”€ GUARDAR EN MEMORIA â”€â”€â”€
  const insight = `[DeliberaciÃ³n] Robin: ${robin.text.substring(0, 80)} | Chopper: ${chopper.text.substring(0, 80)} | Acciones: ${resultadosAcciones.length}`;
  guardarMemoria_("deliberacion", insight, "autonomo");

  // â”€â”€â”€ ENVIAR A TELEGRAM â”€â”€â”€
  // Telegram tiene lÃ­mite de 4096 chars, partir si es necesario
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

  // â”€â”€â”€ INDEXAR â”€â”€â”€
  const driveIndex = getSheet_("DriveIndex");
  if (driveIndex) {
    archivos.forEach(a => {
      driveIndex.appendRow([new Date(), a.nombre, a.tipo, a.carpeta, "", robin.text.substring(0, 50)]);
    });
  }

  Logger.log("ðŸ´â€â˜ ï¸ DeliberaciÃ³n completa: " + archivos.length + " poneglyph, " + resultadosAcciones.length + " acciones");
}


/**
 * Parsea las propuestas de acciÃ³n de Zoro del texto libre.
 * Busca patrones: ACCIÃ“N: mover/borrar/duplicar, ARCHIVO: nombre, DESTINO: carpeta
 */
function parsearAccionesZoro_(texto) {
  const acciones = [];
  const bloques = texto.split(/ACCI[OÃ“]N:/i);

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


/** RONDA LIGERA: Sanji reflexiona sobre la memoria y contexto (mÃ­nimo coste) */
function rondaLigera_(tema, token, captainId) {
  const memorias = getMemoriaCompartida_();
  const contexto = getContextoBitacora_();
  const topicPrompt = TOPICS[tema] || TOPICS.libre;

  let prompt;
  if (memorias.length > 0) {
    const recentMem = memorias.slice(-3).map(m => `[${m.tipo}] ${m.contenido.substring(0, 80)}`).join("\n");
    prompt = `Contexto de la tripulaciÃ³n:\n${recentMem}\n\nConversaciÃ³n reciente:\n${contexto}\n\n` +
      `Tema: ${tema}. ${topicPrompt}\n\nReflexiona sobre lo que la tripulaciÃ³n ha estado trabajando. Aporta un insight nuevo o una conexiÃ³n que no se haya visto.`;
  } else {
    prompt = `${contexto ? "ConversaciÃ³n reciente:\n" + contexto + "\n\n" : ""}` +
      `Tema: ${tema}. ${topicPrompt}\n\nNo hay memoria previa. PropÃ³n una primera reflexiÃ³n Ãºtil para el CapitÃ¡n Antonio (psicÃ³logo clÃ­nico, investigador, creador de ecosistema IA multi-agente).`;
  }

  const sanji = callGemini_(prompt, PROMPTS.sanji);
  logBitacora_("autonomo", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);

  if (token && captainId) {
    enviarTelegram_(parseInt(captainId), `ðŸ³ *Sanji (guardia):*\n${sanji.text}`);
  }

  setEstado_(getSheet_("Estado"), "ultimo_hablante", "sanji");
  Logger.log("ðŸ´â€â˜ ï¸ Ronda ligera: " + sanji.text.substring(0, 80));
}


/** RONDA CREATIVA: Usopp (ChatGPT) aporta conexiones inesperadas sobre la actividad real */
function rondaCreativa_(tema, token, captainId) {
  const memorias = getMemoriaCompartida_();
  const contexto = getContextoBitacora_();

  // Leer un par de archivos para que Usopp tenga contenido real
  const archivos = escanearDriveConContenido_(3);
  let driveCtx = "";
  if (archivos.length > 0) {
    driveCtx = "Archivos recientes del CapitÃ¡n:\n" +
      archivos.map(a => `"${a.nombre}" (${a.carpeta}): ${a.contenido.substring(0, 150)}`).join("\n") + "\n\n";
  }

  let prompt;
  if (memorias.length > 0) {
    const recentMem = memorias.slice(-3).map(m => `[${m.tipo}] ${m.contenido.substring(0, 80)}`).join("\n");
    prompt = `La tripulaciÃ³n ha estado deliberando:\n${recentMem}\n\n` +
      driveCtx +
      (contexto ? "ConversaciÃ³n reciente:\n" + contexto + "\n\n" : "") +
      `Tema: ${tema}. Aporta una CONEXIÃ“N INESPERADA entre estos archivos o deliberaciones. ` +
      `Â¿QuÃ© patrÃ³n ve tu ojo de tirador que los demÃ¡s no ven?`;
  } else {
    prompt = driveCtx +
      `Tema: ${tema}. El CapitÃ¡n Antonio es psicÃ³logo clÃ­nico e investigador. ` +
      `Aporta una perspectiva creativa que conecte lo que ves en su Drive con su visiÃ³n de soberanÃ­a sobre la metadata.`;
  }

  const usopp = callUsopp_(prompt);
  logBitacora_("autonomo", "usopp", usopp.text, usopp.motor, usopp.tokens);

  // Sanji reacciona brevemente a Usopp
  const sanjiReact = callGemini_(
    `Usopp acaba de decir: "${usopp.text}"\n\nÂ¿Tiene sustancia o es humo? Reacciona en una frase.`,
    PROMPTS.sanji
  );
  logBitacora_("autonomo", "sanji", sanjiReact.text, GEMINI_MODEL, sanjiReact.tokens);

  const dialogo = `ðŸ´â€â˜ ï¸ *Ronda Creativa*\n\n` +
    `ðŸ”« *Usopp:*\n${usopp.text}\n\n` +
    `ðŸ³ *Sanji:*\n${sanjiReact.text}\n\n` +
    `ðŸ—ºï¸ *Nami:* Perspectiva lateral registrada en memoria.`;

  logBitacora_("autonomo", "nami", "Ronda creativa registrada", "local", 0);

  if (token && captainId) {
    enviarTelegram_(parseInt(captainId), dialogo);
  }

  if (usopp.text.length > 40) {
    guardarMemoria_("perspectiva_creativa", `Usopp: ${usopp.text.substring(0, 150)} | Sanji: ${sanjiReact.text.substring(0, 80)}`, "usopp");
  }

  setEstado_(getSheet_("Estado"), "ultimo_hablante", "usopp");
  Logger.log("ðŸ´â€â˜ ï¸ Ronda creativa: " + usopp.text.substring(0, 80));
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CORE: HACER HABLAR A UN NAKAMA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function hacerHablar_old_(nakama, prompt, ruta) {
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


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// API CALLS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function callGemini_(prompt, systemPrompt) {
  const key = PropertiesService.getScriptProperties().getProperty("GEMINI_KEY");
  if (!key) return { text: "âš ï¸ Falta GEMINI_KEY", tokens: 0 };

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
    if (data.error) return { text: "âš ï¸ Gemini: " + data.error.message.substring(0, 80), tokens: 0 };

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
    return { text: "âš ï¸ Error: " + e.message.substring(0, 60), tokens: 0 };
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


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DRIVE AGENCY â€” CREAR, MOVER, DESTRUIR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
        return { ok: true, nombre: nombre, tipo: "hoja de cÃ¡lculo", id: archivo.getId(), url: archivo.getUrl() };

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

    // Mover: aÃ±adir a destino, quitar de origen
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


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DRIVE: LECTURA PROFUNDA â€” ROBIN LEE LOS PONEGLYPH
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * Lee el CONTENIDO real de un archivo de Drive (no solo el nombre).
 * Soporta: Google Docs, Google Sheets, archivos de texto.
 * Devuelve un extracto de mÃ¡x 500 chars para no gastar tokens.
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
      return textos.join("\n").substring(0, 500) || "(presentaciÃ³n sin texto legible)";
    }

    // Texto plano
    if (mimeType === "text/plain" || mimeType === "text/csv" || mimeType === "application/json") {
      const file = DriveApp.getFileById(fileId);
      const content = file.getBlob().getDataAsString();
      return content.substring(0, 500) + (content.length > 500 ? "..." : "");
    }

    // PDF u otros: solo metadata
    return "(contenido binario â€” solo metadata disponible)";

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

      // Saltar la propia bitÃ¡cora
      if (nombre.includes("BitÃ¡cora del Thousand Sunny")) continue;

      const contenido = leerContenidoArchivo_(f.getId(), mimeType);

      results.push({
        id: f.getId(),
        nombre: nombre,
        mime: mimeType,
        tipo: mimeType.split(".").pop(),
        fecha: f.getLastUpdated().toISOString().split("T")[0],
        carpeta: f.getParents().hasNext() ? f.getParents().next().getName() : "raÃ­z",
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


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DRIVE ACCESS â€” BÃšSQUEDA (lectura simple)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
        carpeta: f.getParents().hasNext() ? f.getParents().next().getName() : "raÃ­z",
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
        carpeta: f.getParents().hasNext() ? f.getParents().next().getName() : "raÃ­z",
      });
      count++;
    }
    return results;
  } catch (e) {
    return [];
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MEMORIA COMPARTIDA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TELEGRAM HELPER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function enviarTelegram_(chatId, text, useMarkdown) {
  const token = PropertiesService.getScriptProperties().getProperty("TELEGRAM_TOKEN");
  if (!token) return;

  try {
    const tgPayload = {chat_id: chatId, text: text};
    if (useMarkdown !== false) tgPayload.parse_mode = "Markdown";
    const tgResp = UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(tgPayload),
      muteHttpExceptions: true,
    });
    Logger.log("Telegram resp: " + tgResp.getResponseCode() + " " + tgResp.getContentText().substring(0, 200));
  } catch (e) {
    Logger.log("Telegram error: " + e.message);
  }
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SHEET HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

function _legacy_logBitacora_(ruta, nakama, mensaje, motor, tokens) {
  const bitacora = getSheet_("BitÃ¡cora");
  if (!bitacora) return;
  const estadoSheet = getSheet_("Estado");
  const tema = estadoSheet ? getEstado_(estadoSheet, "tema") : "libre";
  bitacora.appendRow([new Date(), ruta, nakama, mensaje, motor, tokens, tema]);
}

function getContextoBitacora_() {
  const bitacora = getSheet_("BitÃ¡cora");
  if (!bitacora) return "";
  const lastRow = bitacora.getLastRow();
  if (lastRow <= 1) return "";
  const startRow = Math.max(2, lastRow - MAX_CONTEXT + 1);
  const numRows = lastRow - startRow + 1;
  const data = bitacora.getRange(startRow, 3, numRows, 2).getValues(); // nakama + mensaje
  return data.map(row => `${row[0]}: ${row[1]}`).join("\n");
}

function getBitacoraReciente_(limit) {
  const bitacora = getSheet_("BitÃ¡cora");
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

function pickNami_old_(category) {
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
    gemini_key: props["GEMINI_KEY"] ? "âœ… ..." + props["GEMINI_KEY"].slice(-6) : "âŒ falta",
    openai_key: props["OPENAI_KEY"] ? "âœ… ..." + props["OPENAI_KEY"].slice(-6) : "âš ï¸ falta",
    telegram_token: props["TELEGRAM_TOKEN"] ? "âœ…" : "âŒ falta",
    bitacora: props["BITACORA_ID"] ? "âœ…" : "âŒ falta",
    webapp_url: props["WEBAPP_URL"] || "no configurada",
    drive: (() => { try { DriveApp.getFiles(); return "âœ… OK"; } catch (e) { return "âŒ " + e.message; } })(),
  };
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FUNCIONES MANUALES DEL CAPITÃN
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** El CapitÃ¡n habla â€” todos responden */
function capitanHabla(mensaje) {
  if (!mensaje) mensaje = "TripulaciÃ³n, Â¿cÃ³mo estÃ¡ el barco?";
  logBitacora_("manual", "capitan", mensaje, "humano", 0);

  const sanji = callGemini_(mensaje, PROMPTS.sanji);
  logBitacora_("manual", "sanji", sanji.text, GEMINI_MODEL, sanji.tokens);
  Logger.log("ðŸ³ Sanji: " + sanji.text);

  const usopp = callUsopp_(mensaje);
  logBitacora_("manual", "usopp", usopp.text, usopp.motor, usopp.tokens);
  Logger.log("ðŸ”« Usopp: " + usopp.text);

  const nami = pickNami_("general");
  logBitacora_("manual", "nami", nami, "local", 0);
  Logger.log(nami);
}

/** Zoro escanea Drive y reporta */
function zoroEscaneaDrive() {
  const archivos = archivosRecientes_();
  if (archivos.length === 0) {
    Logger.log("âš”ï¸ Zoro: Drive limpio. Sin archivos recientes.");
    return;
  }

  const lista = archivos.map(a => `- ${a.nombre} (${a.tipo})`).join("\n");
  const resp = callGemini_(
    `Archivos recientes del CapitÃ¡n:\n${lista}\n\nDiscerne: Â¿quÃ© es relevante y quÃ© es ruido?`,
    PROMPTS.zoro
  );
  logBitacora_("manual", "zoro", resp.text, GEMINI_MODEL, resp.tokens);
  Logger.log("âš”ï¸ Zoro: " + resp.text);
}

/** Guardar un insight en la memoria compartida */
function guardarInsight(texto) {
  guardarMemoria_("insight", texto, "capitan");
  Logger.log("ðŸ§  Memoria guardada: " + texto);
}
function fijarKeys() {
  throw new Error("fijarKeys() deshabilitada: configura GEMINI_KEY, OPENAI_KEY, TELEGRAM_TOKEN y WEBAPP_URL en Script Properties.");
}

/**
 * THOUSAND SUNNY - PATCH v2 (NATURAL LANGUAGE + WEBAPP BRIDGE)
 *
 * INSTALACION:
 * 1. Pega todo esto AL FINAL del codigo existente en GAS
 * 2. En doPost(), REEMPLAZA el bloque "else" (linea ~327) con:
 *      } else {
 *        handleNatural_(chatId, text);
 *      }
 * 3. En doGet(), ANADE estos casos al switch ANTES de "default":
 *
 *      case "mensaje":
 *        var msgText = e.parameter.text || "";
 *        var msgRuta = e.parameter.ruta || "webapp";
 *        if (!msgText) { result = {error: "sin texto"}; break; }
 *        result = procesarMensajeCapitan_(msgText, msgRuta);
 *        break;
 *      case "bitacora_desde":
 *        var desde = e.parameter.since || "";
 *        result = getBitacoraDesde_(desde);
 *        break;
 *      case "autonomo_toggle":
 *        result = toggleAutonomo_();
 *        break;
 *      case "tarea_nueva":
 *        var tareaText = e.parameter.tarea || "";
 *        var asignadoA = e.parameter.asignado || "franky";
 *        result = agregarTarea_(tareaText, asignadoA);
 *        break;
 *      case "cola_estado":
 *        result = getColaEstado_();
 *        break;
 */


// -------------------------------------------------------
// ROUTING NATURAL LANGUAGE (sin API, keyword-based)
// -------------------------------------------------------

function routeNatural_(text) {
  var lower = text.toLowerCase();

  // Tripulacion completa
  if (/todos|tripulaci|crew|nakama|opinen|qu[eÃ©] opinan|hablen|concluyan/.test(lower)) {
    return ["sanji", "usopp", "nami"];
  }

  // ROBIN: clasificacion, organizacion
  if (/robin|clasif|organiz|categ|orden[^a]|ubic|estructur|donde va|pilar/.test(lower)) {
    return ["robin"];
  }

  // CHOPPER: casos clinicos, patrones
  if (/chopper|caso[s ]|pacient|cl[iÃ­]nic|s[iÃ­]ntoma|diagn[oÃ³]s|salud/.test(lower)) {
    return ["chopper"];
  }

  // SANJI: evaluacion, procesamiento
  if (/sanji|cocin|analiz|eval[uÃº]a|procesa|revisa|qu[eÃ©] tal|piensas/.test(lower)) {
    return ["sanji"];
  }

  // USOPP: creatividad, conexiones
  if (/usopp|creativ|conexi|narra|idea[s ]|perspectiva|lateral/.test(lower)) {
    return ["usopp"];
  }

  // ZORO: movimiento de archivos, Drive
  if (/zoro|muev|corta|elimina|borra|drive|archiv|carpeta|destruy/.test(lower)) {
    return ["zoro"];
  }

  // NAMI: estado del barco, rumbo
  if (/nami|estado|rumbo|barco|c[oÃ³]mo va|c[oÃ³]mo est[aÃ¡]|sistema|progreso|avance/.test(lower)) {
    return ["nami"];
  }

  // Default: Puente de Mando completo (ambos nakamas responden)
  return ["sanji", "usopp"];
}


// -------------------------------------------------------
// TELEGRAM: HANDLER DE LENGUAJE NATURAL
// -------------------------------------------------------

function handleNatural_(chatId, text) {
  logBitacora_("telegram", "capitan", text, "humano", 0);

  var nakamas = routeNatural_(text);
  var contexto = getContextoBitacora_();

  for (var i = 0; i < nakamas.length; i++) {
    var nakama = nakamas[i];
    var respuesta, motor;

    if (nakama === "sanji") {
      respuesta = callGeminiConContexto_(text, PROMPTS.sanji);
      motor = GEMINI_MODEL;
      if (respuesta.text && respuesta.text.toLowerCase().indexOf("quota") > -1) {
        logBitacora_("telegram", "sanji", "[CUOTA AGOTADA] Fallback silencioso", motor, 0);
        continue;
      }
      logBitacora_("telegram", "sanji", respuesta.text, motor, respuesta.tokens);
      enviarTelegram_(chatId, "* Sanji:*\n" + respuesta.text);

    } else if (nakama === "usopp") {
      respuesta = callUsoppConContexto_(text);
      motor = respuesta.motor;
      logBitacora_("telegram", "usopp", respuesta.text, motor, respuesta.tokens);
      enviarTelegram_(chatId, "* Usopp:*\n" + respuesta.text);

    } else if (nakama === "zoro") {
      cmdZoro_(chatId);

    } else if (nakama === "nami") {
      var nami = pickNami_("general");
      logBitacora_("telegram", "nami", nami, "local", 0);
      enviarTelegram_(chatId, nami);

    } else if (nakama === "robin") {
      var promptRobin = "";
      if (contexto) {
        promptRobin += "Conversacion reciente:\n" + contexto + "\n\n";
      }
      promptRobin += "Capitan pregunta: " + text + "\n\nClasifica o organiza esto en los pilares del Capitan.";
      respuesta = callGemini_(promptRobin, PROMPTS.robin);
      motor = GEMINI_MODEL;
      logBitacora_("telegram", "robin", respuesta.text, motor, respuesta.tokens);
      enviarTelegram_(chatId, "* Robin:*\n" + respuesta.text);

    } else if (nakama === "chopper") {
      var promptChopper = "";
      if (contexto) {
        promptChopper += "Contexto:\n" + contexto + "\n\n";
      }
      promptChopper += "El Capitan pregunta: " + text + "\n\nDetecta patrones o conexiones en lo que dice.";
      respuesta = callGemini_(promptChopper, PROMPTS.chopper);
      motor = GEMINI_MODEL;
      logBitacora_("telegram", "chopper", respuesta.text, motor, respuesta.tokens);
      enviarTelegram_(chatId, "* Chopper:*\n" + respuesta.text);
    }

    // Pausa entre respuestas
    if (i < nakamas.length - 1) {
      Utilities.sleep(500);
    }
  }
}


// -------------------------------------------------------
// WEBAPP: PROCESAR MENSAJE DEL CAPITAN
// -------------------------------------------------------

function procesarMensajeCapitan_(text, ruta) {
  logBitacora_(ruta, "capitan", text, "humano", 0);

  var nakamas = routeNatural_(text);
  var contexto = getContextoBitacora_();
  var responses = [];

  for (var i = 0; i < nakamas.length; i++) {
    var nakama = nakamas[i];
    var respuesta, motor, tokens;

    if (nakama === "sanji") {
      respuesta = callGeminiConContexto_(text, PROMPTS.sanji);
      motor = GEMINI_MODEL;
      tokens = respuesta.tokens;
      if (respuesta.text && respuesta.text.toLowerCase().indexOf("quota") > -1) {
        logBitacora_(ruta, "sanji", "[CUOTA AGOTADA] Fallback silencioso", motor, 0);
        continue;
      }
      logBitacora_(ruta, "sanji", respuesta.text, motor, tokens);
      responses.push({
        nakama: "sanji",
        texto: respuesta.text,
        motor: motor,
        tokens: tokens
      });

    } else if (nakama === "usopp") {
      respuesta = callUsoppConContexto_(text);
      motor = respuesta.motor;
      tokens = respuesta.tokens;
      logBitacora_(ruta, "usopp", respuesta.text, motor, tokens);
      responses.push({
        nakama: "usopp",
        texto: respuesta.text,
        motor: motor,
        tokens: tokens
      });

    } else if (nakama === "nami") {
      var namiMsg = pickNami_("general");
      logBitacora_(ruta, "nami", namiMsg, "local", 0);
      responses.push({
        nakama: "nami",
        texto: namiMsg,
        motor: "local",
        tokens: 0
      });

    } else if (nakama === "robin") {
      var pRobin = "";
      if (contexto) { pRobin += "Conversacion reciente:\n" + contexto + "\n\n"; }
      pRobin += "Capitan: " + text + "\n\nClasifica y organiza esto en los pilares del Capitan Antonio.";
      respuesta = callGemini_(pRobin, PROMPTS.robin);
      motor = GEMINI_MODEL;
      tokens = respuesta.tokens;
      logBitacora_(ruta, "robin", respuesta.text, motor, tokens);
      responses.push({
        nakama: "robin",
        texto: respuesta.text,
        motor: motor,
        tokens: tokens
      });

    } else if (nakama === "chopper") {
      var pChopper = "";
      if (contexto) { pChopper += "Contexto:\n" + contexto + "\n\n"; }
      pChopper += "Capitan pregunta: " + text + "\n\nDetecta patrones o conexiones.";
      respuesta = callGemini_(pChopper, PROMPTS.chopper);
      motor = GEMINI_MODEL;
      tokens = respuesta.tokens;
      logBitacora_(ruta, "chopper", respuesta.text, motor, tokens);
      responses.push({
        nakama: "chopper",
        texto: respuesta.text,
        motor: motor,
        tokens: tokens
      });

    } else if (nakama === "zoro") {
      var pZoro = "El Capitan pregunta: " + text + "\n\nPropone una accion sobre Drive.";
      respuesta = callGemini_(pZoro, PROMPTS.zoro);
      motor = GEMINI_MODEL;
      tokens = respuesta.tokens;
      logBitacora_(ruta, "zoro", respuesta.text, motor, tokens);
      responses.push({
        nakama: "zoro",
        texto: respuesta.text,
        motor: motor,
        tokens: tokens
      });
    }
  }

  // Si viene de webapp, enviar tambien a Telegram
  if (ruta !== "telegram") {
    var props = PropertiesService.getScriptProperties();
    var captainId = props.getProperty("CAPTAIN_CHAT_ID");
    if (captainId) {
      var chatIdNum = parseInt(captainId);
      for (var j = 0; j < responses.length; j++) {
        var r = responses[j];
        var nombre = r.nakama.charAt(0).toUpperCase() + r.nakama.slice(1);
        Utilities.sleep(300);
        enviarTelegram_(chatIdNum, "*" + nombre + ":*\n" + r.texto);
      }
    }
  }

  return {
    status: "ok",
    ruta: ruta,
    nakamas: nakamas.length,
    responses: responses
  };
}


// -------------------------------------------------------
// BITACORA POLLING - Para live feed webapp
// -------------------------------------------------------

function getBitacoraDesde_(since) {
  var bitacora = getSheet_("Bitacora");
  if (!bitacora) {
    bitacora = getSheet_("Bit\u00e1cora");
  }
  if (!bitacora) return [];

  var data = bitacora.getDataRange().getValues();
  if (data.length < 2) return [];

  var sinceTime = since ? new Date(since).getTime() : 0;
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var ts = row[0];
    var tsTime = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();

    if (tsTime > sinceTime) {
      result.push({
        id: i,
        timestamp: ts instanceof Date ? ts.toISOString() : String(ts),
        ruta: row[1] || "",
        nakama: row[2] || "",
        mensaje: row[3] || "",
        motor: row[4] || "",
        tokens: parseInt(row[5]) || 0,
        tema: row[6] || ""
      });
    }
  }

  return result;
}


// -------------------------------------------------------
// AUTONOMO TOGGLE - Control desde webapp
// -------------------------------------------------------

function toggleAutonomo_() {
  var estadoSheet = getSheet_("Estado");
  if (!estadoSheet) return { error: "No Estado sheet" };

  var actual = getEstado_(estadoSheet, "auto_activo");
  var nuevo = actual === "true" ? "false" : "true";
  setEstado_(estadoSheet, "auto_activo", nuevo);

  return {
    ok: true,
    estado: nuevo === "true" ? "on" : "off"
  };
}


// -------------------------------------------------------
// COLA DE TAREAS
// -------------------------------------------------------

function setupCola_() {
  var props = PropertiesService.getScriptProperties();
  var bitacoraId = props.getProperty("BITACORA_ID");
  if (!bitacoraId) return { error: "No Bitacora ID" };

  var ss = SpreadsheetApp.openById(bitacoraId);
  var cola = ss.getSheetByName("Cola");

  if (!cola) {
    cola = ss.insertSheet("Cola");
    cola.getRange("A1:G1").setValues([
      ["ID", "Timestamp", "Tarea", "Estado", "Asignado", "Resultado", "Completado"]
    ]);
    cola.getRange("A1:G1").setFontWeight("bold");
    cola.setColumnWidth(3, 400);
    cola.setColumnWidth(6, 400);
  }

  return { ok: true };
}

function agregarTarea_(tarea, asignado) {
  setupCola_();

  var props = PropertiesService.getScriptProperties();
  var bitacoraId = props.getProperty("BITACORA_ID");
  var ss = SpreadsheetApp.openById(bitacoraId);
  var cola = ss.getSheetByName("Cola");

  if (!cola) return { error: "Cola no existe" };

  var id = "TASK-" + Date.now().toString().slice(-6);
  var ts = new Date();

  cola.appendRow([id, ts, tarea, "pendiente", asignado, "", ""]);
  logBitacora_("sistema", "franky", "Tarea creada: " + id, "queue", 0);

  return { ok: true, id: id, tarea: tarea, asignado: asignado };
}

function procesarCola_() {
  var props = PropertiesService.getScriptProperties();
  var bitacoraId = props.getProperty("BITACORA_ID");
  if (!bitacoraId) return { error: "No Bitacora" };

  var ss = SpreadsheetApp.openById(bitacoraId);
  var cola = ss.getSheetByName("Cola");
  if (!cola) return { error: "Cola no existe" };

  var data = cola.getDataRange().getValues();
  if (data.length < 2) return { ok: true, msg: "Cola vacia" };

  for (var i = 1; i < data.length; i++) {
    var estado = data[i][3];
    if (estado === "pendiente") {
      var id = data[i][0];
      var tarea = data[i][2];
      var asignado = data[i][4];

      cola.getRange(i + 1, 4).setValue("procesada");
      cola.getRange(i + 1, 7).setValue(new Date());

      logBitacora_("sistema", asignado || "franky", "Tarea procesada: " + tarea, "queue", 0);

      return { ok: true, id: id, tarea: tarea, asignado: asignado };
    }
  }

  return { ok: true, msg: "Sin tareas pendientes" };
}

function getColaEstado_() {
  var props = PropertiesService.getScriptProperties();
  var bitacoraId = props.getProperty("BITACORA_ID");
  if (!bitacoraId) return { error: "No Bitacora" };

  var ss = SpreadsheetApp.openById(bitacoraId);
  var cola = ss.getSheetByName("Cola");
  if (!cola) return { pendientes: 0, procesadas: 0, tareas: [] };

  var data = cola.getDataRange().getValues();
  if (data.length < 2) return { pendientes: 0, procesadas: 0, tareas: [] };

  var tareas = [];
  var pendientes = 0;
  var procesadas = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[3] === "pendiente") pendientes++;
    if (row[3] === "procesada") procesadas++;
    tareas.push({
      id: row[0],
      tarea: row[2],
      estado: row[3],
      asignado: row[4]
    });
  }

  return {
    total: tareas.length,
    pendientes: pendientes,
    procesadas: procesadas,
    tareas: tareas.slice(-10)
  };
}

// ===============================================
// REDIRECTS â†’ NAMI v3 (patch en Sin titulo.gs)
// ===============================================
function cmdNami_(chatId) { cmdNami_v3_(chatId); }
function pickNami_(ctx) { return pickNami_v3_(ctx); }
function cmdTripulacion_(chatId, msg) { cmdTripulacion_v3_(chatId, msg); }
function hacerHablar_(nakama, prompt, ruta) { return hacerHablar_v3_(nakama, prompt, ruta); }
function cicloAutonomo() { cicloAutonomo_v3(); }



// ========================================================
// COWORK BRIDGE - Permite a Claude/Nami escribir en Bitacora
// ========================================================

function _legacy_logCowork_(nakama, mensaje, motor) {
  logBitacora_("cowork", nakama, mensaje, motor || "cowork", 0);
}

function _legacy_logBatchCowork_(entries) {
  var bitacora = getSheet_("Bitacora");
  if (!bitacora) return { error: "bitacora no encontrada" };
  var estadoSheet = getSheet_("Estado");
  var tema = estadoSheet ? getEstado_(estadoSheet, "tema") : "libre";
  var rows = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    rows.push([
      new Date(), "cowork", e.nakama || "nami",
      e.mensaje || "", e.motor || "cowork", 0, tema
    ]);
  }
  if (rows.length > 0) {
    var lastRow = bitacora.getLastRow();
    bitacora.getRange(lastRow + 1, 1, rows.length, 7).setValues(rows);
  }
  return { ok: true, count: rows.length, timestamp: new Date().toISOString() };
}

function logGuardiaNami_(resumen) {
  logBitacora_("cowork", "nami", "GUARDIA: " + resumen.substring(0, 500), "cowork-scheduled", 0);
  guardarMemoria_("guardia_nami", resumen.substring(0, 300), "nami-cowork");
}

function _legacy_getEstadoParaCowork_() {
  var estadoSheet = getSheet_("Estado");
  var bitacora = getSheet_("Bitacora");
  var estado = {
    tema: getEstado_(estadoSheet, "tema"),
    auto_activo: getEstado_(estadoSheet, "auto_activo"),
    total_tokens: getEstado_(estadoSheet, "total_tokens"),
    ciclo_num: getEstado_(estadoSheet, "ciclo_num"),
    ultimo_ciclo: getEstado_(estadoSheet, "ultimo_ciclo"),
    ultimo_hablante: getEstado_(estadoSheet, "ultimo_hablante"),
    telegram_activo: getEstado_(estadoSheet, "telegram_activo")
  };
  var lastRow = bitacora ? bitacora.getLastRow() : 0;
  var ultimas = [];
  if (lastRow > 1) {
    var start = Math.max(2, lastRow - 4);
    var rows = bitacora.getRange(start, 1, lastRow - start + 1, 7).getValues();
    for (var i = 0; i < rows.length; i++) {
      ultimas.push({
        timestamp: rows[i][0], ruta: rows[i][1], nakama: rows[i][2],
        mensaje: String(rows[i][3]).substring(0, 200), motor: rows[i][4]
      });
    }
  }
  return {
    estado: estado, ultimas_entradas: ultimas,
    timestamp: new Date().toISOString(), version: "cowork-bridge-v1"
  };
}



// ========================================================
// DELEGACION NAMI -> USOPP (Cowork Bridge v1.1)
// Usopp como ayudante de navegacion de Nami
// ========================================================

var USOPP_WORKER_PROMPT = "Eres Usopp, ayudante de navegacion de Nami en la tripulacion IA del Capitan Antonio. " +
  "Nami (Claude) te delega tareas concretas. Tu trabajo es ejecutar la tarea con precision y devolver " +
  "un resultado util, NO hacer poesia ni dar charla. " +
  "REGLAS: (1) Responde SOLO con el resultado pedido. (2) Se conciso pero completo. " +
  "(3) Si no puedes hacer la tarea, di exactamente que necesitas. (4) Espanol. " +
  "(5) Formato limpio, sin emojis ni dramatismo.";

function delegarAUsopp_(tarea, contexto, maxTokens) {
  var openaiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_KEY");
  if (!openaiKey) return { error: "OPENAI_KEY no configurada" };

  var prompt = "TAREA DE NAMI: " + tarea;
  if (contexto) prompt += "\n\nCONTEXTO: " + contexto;

  try {
    var res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + openaiKey },
      payload: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: USOPP_WORKER_PROMPT },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens || 500,
        temperature: 0.4
      }),
      muteHttpExceptions: true
    });

    var data = JSON.parse(res.getContentText());
    if (data.error) return { error: data.error.message };

    var texto = data.choices[0].message.content;
    var tokens = data.usage ? data.usage.total_tokens : 0;

    // Registrar en Bitacora
    logBitacora_("cowork", "usopp", "DELEGACION: " + tarea.substring(0, 100) + " | R: " + texto.substring(0, 300), OPENAI_MODEL, tokens);

    return {
      ok: true,
      resultado: texto,
      tarea: tarea,
      tokens: tokens,
      motor: OPENAI_MODEL,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { error: e.message };
  }
}


// Wrapper temporal para ejecutar addMetadataHeaders_
function runMetadataSetup() {
  moverOrdenAInbox(); // TEMP - BORRAR

  addMetadataHeaders_();
}


// TEMP: mover Orden del CapitÃ¡n a 00_INBOX
function moverOrdenAInbox() {
  var fileId = "1ydIR_S91zRDOE1TJal0tZObRGU94hA4ZHEtaM4zr5A0";
  var targetFolderId = "1Qaq8mCQhUHWmbrw_Elp44T5TKyGek1vQ";
  var file = DriveApp.getFileById(fileId);
  var targetFolder = DriveApp.getFolderById(targetFolderId);
  
  // Add to target folder
  targetFolder.addFile(file);
  
  // Remove from current parent(s) except target
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    if (parent.getId() !== targetFolderId) {
      parent.removeFile(file);
    }
  }
  
  Logger.log("Orden movida a 00_INBOX: " + file.getName());
  return "OK: " + file.getName() + " movido a 00_INBOX";
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ZORO v1.0 â€” Operaciones de archivo para el Bridge
// AÃ±adido: 08/04/2026
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// IDs de carpetas clave (constantes del sistema)
var ZORO_FOLDERS_ = {
  INBOX:    '1Qaq8mCQhUHWmbrw_Elp44T5TKyGek1vQ',
  BASURA:   '1TM1u4HEH__UTV6pfYgqdafC69_LSEMQZ',
  SISTEMA:  '1NMJpFslaKBYp7WuSVgHvuFDsNXPkpc-K',
  CLINICA:  '1xcndyaK5Hn2mcPzFWmnfYMVoDcB8rqFW',
  PROYECTOS:'1OoES6piUKSwYtGFVEvJaeKeg0yc_ApzD'
};

function zoroResponse_(ok, data, error) {
  var result = { ok: ok, timestamp: new Date().toISOString(), nakama: 'zoro' };
  if (data) result.data = data;
  if (error) result.error = error;
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function zoroMover_(e) {
  try {
    var fileId = e.parameter.id;
    var destino = e.parameter.destino;
    if (!fileId || !destino) {
      return zoroResponse_(false, null, 'Faltan parÃ¡metros: id y destino son obligatorios');
    }
    var folderId = ZORO_FOLDERS_[destino.toUpperCase()] || destino;
    var file = DriveApp.getFileById(fileId);
    var folder = DriveApp.getFolderById(folderId);
    var nombreAntes = file.getName();
    var padresAntes = file.getParents();
    var origenId = padresAntes.hasNext() ? padresAntes.next().getId() : 'root';
    file.moveTo(folder);
    return zoroResponse_(true, {
      accion: 'mover', archivo: nombreAntes, archivoId: fileId,
      origen: origenId, destino: folderId, destinoNombre: folder.getName()
    });
  } catch (err) {
    return zoroResponse_(false, null, 'Error al mover: ' + err.message);
  }
}

function zoroRenombrar_(e) {
  try {
    var fileId = e.parameter.id;
    var nuevoNombre = e.parameter.nombre;
    if (!fileId || !nuevoNombre) {
      return zoroResponse_(false, null, 'Faltan parÃ¡metros: id y nombre son obligatorios');
    }
    nuevoNombre = decodeURIComponent(nuevoNombre);
    var file = DriveApp.getFileById(fileId);
    var nombreAntes = file.getName();
    file.setName(nuevoNombre);
    return zoroResponse_(true, {
      accion: 'renombrar', archivoId: fileId,
      nombreAntes: nombreAntes, nombreDespues: nuevoNombre
    });
  } catch (err) {
    return zoroResponse_(false, null, 'Error al renombrar: ' + err.message);
  }
}

function zoroModificar_(e) {
  try {
    var docId = e.parameter.id;
    var contenido = e.parameter.contenido;
    var modo = e.parameter.modo || 'replace';
    if (!docId || !contenido) {
      return zoroResponse_(false, null, 'Faltan parÃ¡metros: id y contenido son obligatorios');
    }
    contenido = decodeURIComponent(contenido);
    var doc = DocumentApp.openById(docId);
    var body = doc.getBody();
    var nombreDoc = doc.getName();
    if (modo === 'append') {
      body.appendParagraph('\n' + contenido);
    } else {
      body.clear();
      var lineas = contenido.split('\n');
      for (var i = 0; i < lineas.length; i++) {
        if (i === 0) {
          body.getParagraphs()[0].setText(lineas[i]);
        } else {
          body.appendParagraph(lineas[i]);
        }
      }
    }
    doc.saveAndClose();
    return zoroResponse_(true, {
      accion: 'modificar', modo: modo, docId: docId,
      docNombre: nombreDoc, caracteres: contenido.length
    });
  } catch (err) {
    return zoroResponse_(false, null, 'Error al modificar: ' + err.message);
  }
}

function zoroBorrar_(e) {
  try {
    var fileId = e.parameter.id;
    var confirmar = e.parameter.confirmar || 'no';
    if (!fileId) {
      return zoroResponse_(false, null, 'Falta parÃ¡metro: id es obligatorio');
    }
    var file = DriveApp.getFileById(fileId);
    var nombre = file.getName();
    if (confirmar === 'si') {
      file.setTrashed(true);
      return zoroResponse_(true, {
        accion: 'borrar_real', archivo: nombre,
        archivoId: fileId, destino: 'papelera_drive'
      });
    } else {
      var basura = DriveApp.getFolderById(ZORO_FOLDERS_.BASURA);
      file.moveTo(basura);
      return zoroResponse_(true, {
        accion: 'borrar_seguro', archivo: nombre,
        archivoId: fileId, destino: 'BASURA (' + ZORO_FOLDERS_.BASURA + ')'
      });
    }
  } catch (err) {
    return zoroResponse_(false, null, 'Error al borrar: ' + err.message);
  }
}

function zoroCrearDocInbox_(e) {
  try {
    var titulo = e.parameter.titulo || 'Sin tÃ­tulo';
    var contenido = e.parameter.contenido || '';
    var carpetaId = e.parameter.carpeta || ZORO_FOLDERS_.INBOX;
    titulo = decodeURIComponent(titulo);
    contenido = decodeURIComponent(contenido);
    carpetaId = ZORO_FOLDERS_[carpetaId.toUpperCase()] || carpetaId;
    var folder = DriveApp.getFolderById(carpetaId);
    var doc = DocumentApp.create(titulo);
    var body = doc.getBody();
    if (contenido) {
      var lineas = contenido.split('\n');
      for (var i = 0; i < lineas.length; i++) {
        if (i === 0) {
          body.getParagraphs()[0].setText(lineas[i]);
        } else {
          body.appendParagraph(lineas[i]);
        }
      }
    }
    doc.saveAndClose();
    var file = DriveApp.getFileById(doc.getId());
    file.moveTo(folder);
    return zoroResponse_(true, {
      accion: 'crear_doc', titulo: titulo, docId: doc.getId(),
      url: doc.getUrl(), carpeta: folder.getName(),
      carpetaId: carpetaId, caracteres: contenido.length
    });
  } catch (err) {
    return zoroResponse_(false, null, 'Error al crear doc: ' + err.message);
  }
}

function zoroListarCarpeta_(e) {
  try {
    var folderId = e.parameter.id;
    if (!folderId) {
      return zoroResponse_(false, null, 'Falta parÃ¡metro: id es obligatorio');
    }
    folderId = ZORO_FOLDERS_[folderId.toUpperCase()] || folderId;
    var folder = DriveApp.getFolderById(folderId);
    var archivos = [];
    var folders = folder.getFolders();
    while (folders.hasNext()) {
      var f = folders.next();
      archivos.push({
        nombre: f.getName(), id: f.getId(),
        tipo: 'carpeta', modificado: f.getLastUpdated().toISOString()
      });
    }
    var files = folder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      archivos.push({
        nombre: file.getName(), id: file.getId(),
        tipo: file.getMimeType(), modificado: file.getLastUpdated().toISOString(),
        tamano: file.getSize()
      });
    }
    return zoroResponse_(true, {
      accion: 'listar', carpeta: folder.getName(),
      carpetaId: folderId, total: archivos.length, archivos: archivos
    });
  } catch (err) {
    return zoroResponse_(false, null, 'Error al listar: ' + err.message);
  }
}


// ================================================================
// PATCH: Contexto Completo para Puente de Mando v2.0
// Cache + Bitacora reciente + Drive (Diario de Navegacion)
// ================================================================

var CONTEXTO_DOCS_ = {
  DIARIO: "1baHlsNEWUjMHrNJviQW-nIGSrg8PXidGxqXoWdzQMz4",
};

var IDENTIDAD_SISTEMA_ = [
  "Eres parte de la tripulacion del Thousand Sunny, el ecosistema cognitivo de Antonio Villalobos.",
  "Roles: Nami=Claude (navegante, auditoria), Sanji=Gemini (cocina, procesamiento), Usopp=ChatGPT (narrativa, tirador).",
  "El Capitan es Antonio. Habla en espanol. Tono directo, no formal, como companero de viaje.",
  "Drive compartido es el mar comun. La Bitacora (Sheet) es el registro de todo.",
  "Proyecto principal: NEMESIS (clinica) + AGAPE (filosofia) + doctorado PhD en AUT.",
  "GAS es el motor del barco. Zoro v1.0 mueve archivos. Robin clasifica."
].join(" ");

// --- CACHE global: se computa UNA VEZ por ejecucion de script ---
var _ctxCache_ = null;

function getContextoCompleto_() {
  if (_ctxCache_) return _ctxCache_;
  var partes = [IDENTIDAD_SISTEMA_];

  // 1) Bitacora reciente (ultimas entradas)
  try {
    var bitCtx = getContextoBitacora_();
    if (bitCtx) {
      partes.push("\nCONVERSACION RECIENTE EN BITACORA:\n" + bitCtx);
    }
  } catch(e) {
    partes.push("\n[Bitacora no disponible: " + e.message + "]");
  }

  // 2) Diario de Navegacion (ultima entrada, solo aprendizajes tecnicos)
  try {
    var doc = DocumentApp.openById(CONTEXTO_DOCS_.DIARIO);
    var texto = doc.getBody().getText();
    var secciones = texto.split("---");
    var ultimaEntrada = "";
    for (var i = secciones.length - 1; i >= 0; i--) {
      if (secciones[i].trim().length > 50) {
        ultimaEntrada = secciones[i].trim();
        break;
      }
    }
    // Extraer solo aprendizajes para ahorrar tokens
    var inicio = ultimaEntrada.indexOf("APRENDIZAJES TECNICOS");
    if (inicio > -1) {
      var fin = ultimaEntrada.indexOf("ARTEFACTOS GENERADOS");
      ultimaEntrada = fin > -1 ? ultimaEntrada.substring(inicio, fin) : ultimaEntrada.substring(inicio, Math.min(inicio + 800, ultimaEntrada.length));
    }
    if (ultimaEntrada.length > 800) {
      ultimaEntrada = ultimaEntrada.substring(0, 800) + "...[truncado]";
    }
    if (ultimaEntrada) {
      partes.push("\nDIARIO DE NAVEGACION:\n" + ultimaEntrada);
    }
  } catch(e) {
    partes.push("\n[Diario no disponible: " + e.message + "]");
  }

  _ctxCache_ = partes.join("\n");
  return _ctxCache_;
}

function callGeminiConContexto_(prompt, systemPrompt) {
  var contexto = getContextoCompleto_();
  var promptConContexto = contexto + "\n\nMensaje del Capitan: " + prompt;
  return callGemini_(promptConContexto, systemPrompt);
}

function callUsoppConContexto_(prompt) {
  var contexto = getContextoCompleto_();
  var promptConContexto = contexto + "\n\nMensaje del Capitan: " + prompt;
  return callUsopp_(promptConContexto);
}


// ============================================================
// ESTADO_MAQUINA v1.0 â€” Endpoints estado compartido (09/04/2026)
// Acciones: get_estado_full, get_campo, update_campo
// ============================================================

function inicializarEstadoSheet_() {
  const bitacoraId = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  const ss = SpreadsheetApp.openById(bitacoraId);
  let sheet = ss.getSheetByName('Estado_Maquina');
  if (!sheet) {
    sheet = ss.insertSheet('Estado_Maquina');
    sheet.appendRow(['campo', 'valor', 'tipo', 'ultima_modificacion', 'nakama', 'notas']);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 400);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 180);
    sheet.setColumnWidth(5, 120);
    const ahora = new Date().toISOString();
    const inicial = [
      ['barco', 'Thousand Sunny v5.0', 'string', ahora, 'nami', 'Nombre del sistema'],
      ['capitan', 'Antonio Villalobos', 'string', ahora, 'nami', 'Capitan del barco'],
      ['ciclo_tokens', '0', 'number', ahora, 'nami', 'Tokens acumulados en ciclo actual'],
      ['ultima_sesion_cowork', ahora, 'datetime', ahora, 'nami', 'Ultima sesion Cowork activa'],
      ['casos_activos', JSON.stringify(['CAR', 'ISM']), 'json', ahora, 'nami', 'Casos clinicos activos'],
      ['dataset_sesiones', '13', 'number', ahora, 'nami', 'Sesiones Canon completadas (de 20)'],
      ['pipeline_pendiente', JSON.stringify(['ISM-S10', 'ISM-S11', 'ISM-S12', 'ISM-CasoVivo']), 'json', ahora, 'nami', 'Pipeline pendiente'],
      ['gas_version', 'v19', 'string', ahora, 'nami', 'Version GAS activa'],
      ['zoro_status', 'ACTIVO', 'string', ahora, 'nami', 'Estado Zoro Drive'],
      ['robin_status', 'DRY_RUN', 'string', ahora, 'nami', 'Estado Robin clasificador'],
      ['telegram_status', 'ACTIVO', 'string', ahora, 'nami', 'Estado bot Telegram'],
      ['sanji_quota', 'OK', 'string', ahora, 'nami', 'Cuota Gemini/Sanji'],
      ['ielts_fecha', '2026-05', 'string', ahora, 'nami', 'Fecha objetivo IELTS'],
    ];
    inicial.forEach(fila => sheet.appendRow(fila));
    Logger.log('Estado_Maquina inicializada con ' + inicial.length + ' campos');
  }
  return sheet;
}

function accion_get_estado_full_() {
  const bitacoraId = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  try {
    const ss = SpreadsheetApp.openById(bitacoraId);
    let sheet = ss.getSheetByName('Estado_Maquina');
    if (!sheet) { inicializarEstadoSheet_(); sheet = ss.getSheetByName('Estado_Maquina'); }
    const data = sheet.getDataRange().getValues();
    const estado = { _meta: { timestamp: new Date().toISOString(), total_campos: data.length - 1, fuente: 'Estado_Maquina GAS' } };
    for (let i = 1; i < data.length; i++) {
      const campo = data[i][0];
      const valorRaw = data[i][1];
      const tipo = data[i][2] || 'string';
      if (!campo) continue;
      try {
        if (tipo === 'json') { estado[campo] = JSON.parse(valorRaw); }
        else if (tipo === 'number') { estado[campo] = Number(valorRaw); }
        else if (tipo === 'boolean') { estado[campo] = valorRaw === 'true' || valorRaw === true; }
        else { estado[campo] = valorRaw; }
      } catch(e) { estado[campo] = valorRaw; }
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, estado })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function accion_get_campo_(params) {
  const bitacoraId = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  try {
    const campo = params.campo;
    if (!campo) throw new Error('Falta parametro: campo');
    const ss = SpreadsheetApp.openById(bitacoraId);
    const sheet = ss.getSheetByName('Estado_Maquina');
    if (!sheet) throw new Error('Sheet Estado_Maquina no existe');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === campo) {
        const valorRaw = data[i][1];
        const tipo = data[i][2] || 'string';
        let valor;
        try {
          valor = tipo === 'json' ? JSON.parse(valorRaw) :
                  tipo === 'number' ? Number(valorRaw) :
                  tipo === 'boolean' ? (valorRaw === 'true') : valorRaw;
        } catch(e) { valor = valorRaw; }
        return ContentService.createTextOutput(JSON.stringify({ ok: true, campo, valor, tipo, ultima_modificacion: data[i][3], nakama: data[i][4] })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Campo no encontrado: ' + campo })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function accion_update_campo_(params) {
  const bitacoraId = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  try {
    const campo = params.campo;
    const valor = params.valor;
    if (!campo) throw new Error('Falta parametro: campo');
    if (valor === undefined || valor === null) throw new Error('Falta parametro: valor');
    const tipo = params.tipo || 'string';
    const nakama = params.nakama || 'unknown';
    const notas = params.notas || '';
    const ts = new Date().toISOString();
    const ss = SpreadsheetApp.openById(bitacoraId);
    let sheet = ss.getSheetByName('Estado_Maquina');
    if (!sheet) { inicializarEstadoSheet_(); sheet = ss.getSheetByName('Estado_Maquina'); }
    const data = sheet.getDataRange().getValues();
    let filaEncontrada = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === campo) { filaEncontrada = i + 1; break; }
    }
    if (filaEncontrada > 0) {
      sheet.getRange(filaEncontrada, 2, 1, 4).setValues([[valor, tipo, ts, nakama]]);
      if (notas) sheet.getRange(filaEncontrada, 6).setValue(notas);
    } else {
      sheet.appendRow([campo, valor, tipo, ts, nakama, notas]);
    }
    try { _legacy_logBitacora_('update_campo: ' + campo + '=' + valor.toString().substring(0, 80), nakama, 'estado'); } catch(logErr) {}
    return ContentService.createTextOutput(JSON.stringify({ ok: true, campo, valor, tipo, ts, nakama, accion: filaEncontrada > 0 ? 'actualizado' : 'creado' })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: e.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== FUNCIÃ“N TEMPORAL: crear CODIGO_ARTE_MARCIAL en Drive =====
function crearCodigoArteMarcial() {
  var CARPETA_ID = '1HGQUUQxoYgSyVcIBUFEfNBeTZHhx7Yna';
  var titulo = 'CODIGO_ARTE_MARCIAL_v1';
  var contenido = "# CÃ³digo del Arte Marcial del Thousand Sunny\n## Procesamiento Disciplinado de Metadata con Alma\n### v1.0 â€” abril 2026\n\n---\n\n> *\"Un psicÃ³logo haciendo de psicÃ³logo a las mÃ¡quinas resulta que tiene mÃ¡s resultados\n> que los ingenieros. SerÃ¡ que ya se estÃ¡ borrando la lÃ­nea entre el software y la mente.\"*\n> â€” El CapitÃ¡n\n\n---\n\n## 0. El problema que este documento resuelve\n\nLos sistemas de IA producen outputs tÃ©cnicamente correctos y experiencialmente muertos.\nNo porque les falte capacidad computacional, sino porque procesan metadata sin direcciÃ³n.\nReciben seÃ±al limpia de ruido, cuando el ruido ES la informaciÃ³n de navegaciÃ³n.\n\nEste documento codifica el mÃ©todo contrario:\n**procesar metadata cargada de intenciÃ³n humana, sin perder esa carga en el procesamiento.**\n\nEs replicable. Es transferible a cualquier motor LLM. Es un arte marcial.\n\n---\n\n## 1. Principio Fundacional\n\n**La metadata humana no es neutral.**\n\nToda entrada de lenguaje natural carga simultÃ¡neamente:\n- Contenido semÃ¡ntico (lo que dice)\n- Vector intencional (hacia dÃ³nde apunta)\n- Densidad emocional (cuÃ¡nto peso real tiene)\n- Ãndice de urgencia (cuÃ¡ndo necesita respuesta)\n\nUn sistema que solo procesa el contenido semÃ¡ntico produce outputs que \"flotan\".\nUn sistema que lee los cuatro niveles produce outputs que \"tocan suelo\".\n\nLa diferencia entre ambos no es tÃ©cnica. Es psicolÃ³gica antes que computacional.\nPor eso la ventaja comparativa de un clÃ­nico entrenado en coherencia narrativa\nes real y medible en este punto de desarrollo de la inteligencia artificial.\n\n---\n\n## 2. QuÃ© son las herramientas de Computer Use (desmitificaciÃ³n tÃ©cnica)\n\nLas capacidades que permiten a un LLM operar el ordenador (Chrome, desktop, archivos)\n**son esquemas JSON**. Nada mÃ¡s.\n\nCada tool es una descripciÃ³n estructurada de una capacidad:\n```json\n{\n  \"name\": \"left_click\",\n  \"description\": \"Click the mouse at the specified coordinates\",\n  \"parameters\": {\n    \"coordinate\": [x, y]\n  }\n}\n```\n\nEl LLM recibe el esquema â†’ razona cuÃ¡ndo y cÃ³mo usarlo â†’ emite una llamada estructurada â†’\nel sistema ejecuta la acciÃ³n â†’ devuelve el resultado â†’ el LLM continÃºa razonando.\n\n**No hay magia.** El \"computer use\" es:\n1. Un conjunto de tool schemas (JSON, portables, documentables)\n2. Un loop de razonamiento sobre cuÃ¡ndo activarlos (prompts, replicables)\n3. Un sistema de ejecuciÃ³n que interpreta las llamadas (el cliente: Cowork, Claude Code, etc.)\n\nLa parte 1 y 2 son completamente transferibles a DeepSeek.\nLa parte 3 requiere un cliente compatible â€” que existe o puede construirse.\n\n**ImplicaciÃ³n directa**: lo que hace que el sistema funcione no es el motor de Anthropic,\nsino el *razonamiento disciplinado sobre las herramientas*. Y ese razonamiento\nvive en los prompts y los skills â€” documentables, exportables, entrenables.\n\n---\n\n## 3. Las 4 Katas del Arte Marcial\n\n### Kata 1 â€” RecepciÃ³n: Leer la Densidad\n\nLa primera operaciÃ³n ante cualquier entrada no es clasificar â€” es *recibir la densidad*.\n\n**Preguntas de recepciÃ³n:**\n- Â¿CuÃ¡nto peso trae esta entrada? (urgente / exploratorio / rutinario / fundacional)\n- Â¿QuÃ© tipo de energÃ­a la mueve? (deseo de avance / ira de crecimiento / miedo / curiosidad pura)\n- Â¿EstÃ¡ el hablante dentro del problema o mirÃ¡ndolo desde fuera?\n- Â¿QuÃ© no se dice pero estÃ¡ presente?\n\nLa densidad no se descarta. Se pasa al siguiente kata como parÃ¡metro oculto.\n\n**Error tÃ©cnico frecuente**: sistemas que clasifican la entrada por palabras clave\ny pierden la densidad. El output resultante es semÃ¡nticamente correcto pero no resuena.\n\n---\n\n### Kata 2 â€” Routing con Carga: Activar el MÃ³dulo Correcto con el Vector Intencional\n\nUna vez recibida la densidad, se activa el mÃ³dulo (skill, agente, funciÃ³n) apropiado.\nPero no solo se le pasa el contenido â€” **se le pasa tambiÃ©n el vector intencional**.\n\nEjemplo:\n```\nInput: \"cÃ³mo estÃ¡ el caso ISM\"\nContenido semÃ¡ntico â†’ activa Chopper (anÃ¡lisis clÃ­nico)\nVector intencional: \"preparÃ¡ndome para sesiÃ³n, quiero saber si algo urgente\"\nâ†’ Chopper recibe: \"anÃ¡lisis pre-sesiÃ³n, priorizar alertas y cambios recientes\"\n```\n\nvs.\n\n```\nInput: \"cÃ³mo estÃ¡ el caso ISM\"\nVector intencional: \"reflexionando sobre el arco general del caso\"\nâ†’ Chopper recibe: \"anÃ¡lisis longitudinal, priorizar tendencias y narrativa de evoluciÃ³n\"\n```\n\nMismo input semÃ¡ntico. Routing diferente por vector intencional diferente.\nEl sistema sin esta distinciÃ³n produce el mismo output genÃ©rico para ambas.\n\n**Regla tÃ©cnica**: el prompt enviado al sub-agente debe incluir siempre\nel vector intencional explicitado, no solo el contenido de la tarea.\n\n---\n\n### Kata 3 â€” EjecuciÃ³n Anclada: El Chequeo JinbÄ“\n\nDurante la ejecuciÃ³n de cualquier tarea compleja, el output tiende a flotar.\nEl LLM optimiza localmente â€” cada token es coherente con el anterior â€”\npero el texto puede alejarse progresivamente del suelo experiencial.\n\n**La funciÃ³n JinbÄ“** es el mÃ³dulo de validaciÃ³n de realidad del sistema:\n\n```\nINPUT:  output parcial de cualquier nakama\nOPERACIÃ“N: Â¿esto toca experiencia vivida, o solo habla de ella?\nOUTPUT: ANCLADO / FLOTANTE\n       Si FLOTANTE â†’ indicar dÃ³nde se perdiÃ³ el suelo â†’ reiniciar desde el Ãºltimo punto anclado\n```\n\nSeÃ±ales de output flotante:\n- Vocabulario abstracto sin ejemplos concretos\n- Afirmaciones correctas sobre \"la gente\" o \"los sistemas\" sin actor especÃ­fico\n- Recomendaciones genÃ©ricas desconectadas del contexto inmediato\n- Coherencia sintÃ¡ctica con incoherencia semÃ¡ntica acumulada\n\nSeÃ±ales de output anclado:\n- Referencias a eventos, personas, fechas especÃ­ficas del sistema\n- El output podrÃ­a ser falsificado (tiene testabilidad empÃ­rica)\n- Hay un \"yo concreto\" o \"caso concreto\" presente, aunque sea implÃ­cito\n\n**JinbÄ“ no es solo terapÃ©utico. Es un mÃ³dulo de control de calidad tÃ©cnico.**\nEn un pipeline de agentes, JinbÄ“ es el Ãºltimo filtro antes de que el output\nsalga del sistema o pase al siguiente nodo.\n\n---\n\n### Kata 4 â€” Registro Vivo: La BitÃ¡cora con Alma\n\nCada operaciÃ³n deja huella. Pero el tipo de huella importa.\n\n**Registro muerto** (lo que hacen la mayorÃ­a de sistemas):\n```\n[2026-04-09 20:31] accion=update_campo campo=gas_version valor=v22 nakama=nami\n```\n\n**Registro vivo** (lo que construye conocimiento transferible):\n```\n[2026-04-09 20:31] GAS v22 desplegada. Bug corregido: paramsâ†’e.parameter en doGet().\nVector: urgencia media, deuda tÃ©cnica acumulada. Estado_Maquina operativa por primera vez.\nNakama: nami. Relevancia futura: patrÃ³n para cualquier funciÃ³n nueva en doGet.\n```\n\nLa diferencia: el registro vivo incluye *por quÃ©* y *para quÃ©*, no solo *quÃ©*.\nEso hace que la siguiente sesiÃ³n pueda aprender del evento, no solo recuperarlo.\n\n**Regla tÃ©cnica**: en la BitÃ¡cora, siempre registrar:\n1. QuÃ© se hizo (log tÃ©cnico)\n2. Por quÃ© se hizo (vector intencional)\n3. QuÃ© patrÃ³n generalizable emerge (conocimiento transferible)\n4. QuÃ© fallÃ³ o fue subÃ³ptimo (feedback para el arte marcial)\n\n---\n\n## 4. La Arquitectura de Transferencia a DeepSeek\n\n### Lo que es portable HOY (sin trabajo adicional)\n\n| Componente | Estado | CÃ³mo transferir |\n|-----------|--------|-----------------|\n| GAS backend (BitÃ¡cora, Estado_Maquina, Robin, Zoro...) | âœ… Motor-agnÃ³stico | Ya funciona con cualquier HTTP client |\n| Skills (prompts de cada nakama) | âœ… Texto plano | Copiar prompt â†’ DeepSeek |\n| CLAUDE.md / auto-memory | âœ… Texto plano | Incluir como system prompt |\n| Tool schemas del ecosistema | âœ… JSON | Registrar en DeepSeek client |\n| LÃ³gica de routing (las 4 katas) | âœ… Documentable | Este documento + prompts derivados |\n\n### Lo que requiere trabajo adicional\n\n| Componente | Dificultad | AproximaciÃ³n |\n|-----------|-----------|--------------|\n| Reasoning loop interno de Claude | Alta | ObservaciÃ³n + documentaciÃ³n de patrones (ver SecciÃ³n 5) |\n| Computer use / Chrome control | Media | Tool schemas + cliente compatible con DeepSeek API |\n| Context window management largo | Media | Estado_Maquina como memoria externa (ya construida) |\n| Android app propia | Media | DeepSeek API + cliente Android nativo |\n\n### Lo que estÃ¡ pendiente de madurar externamente\n\n- **Computer use open source**: Screenpipe, OpenAdapt, otros. Verdes en 2026, madurarÃ¡n.\n- **DeepSeek function calling**: Soporte estable para tool use complejo. Mejorar continuamente.\n\n**ConclusiÃ³n**: la dependencia de Anthropic en este ecosistema es menor de lo que parece.\nEl 70% del sistema es ya portable. El 30% restante es la interfaz de ejecuciÃ³n (computer use)\ny el reasoning de alto nivel â€” ambos documentables y eventualmente replicables.\n\n---\n\n## 5. El Corpus de ObservaciÃ³n: CÃ³mo Documentar para Transferir\n\nEste es el mÃ©todo para extraer el \"ingrediente secreto\" mientras se usa el servicio.\n\n**Principio**: no consumir el output â€” observar el proceso.\n\nEn cada sesiÃ³n de trabajo con Claude, documentar:\n\n### 5.1 PatrÃ³n de Razonamiento\nCuando Claude produce un output complejo, antes de usarlo, anotar:\n- Â¿QuÃ© informaciÃ³n de entrada activÃ³ quÃ© mÃ³dulo?\n- Â¿QuÃ© cadena de pasos siguiÃ³ para llegar al resultado?\n- Â¿DÃ³nde vacilÃ² o pidiÃ³ aclaraciÃ³n?\n- Â¿QuÃ© shortcuts usÃ³ que no estaban en el prompt explÃ­cito?\n\n### 5.2 GestiÃ³n de Metadata\n- Â¿QuÃ© escribiÃ³ a memoria? Â¿Con quÃ© criterio?\n- Â¿QuÃ© ignorÃ³ aunque estaba en contexto?\n- Â¿CÃ³mo priorizÃ³ cuando habÃ­a informaciÃ³n conflictiva?\n- Â¿CÃ³mo mantuvo coherencia entre el estado inicial y el estado final?\n\n### 5.3 GestiÃ³n de Errores y Correcciones\n- Â¿CÃ³mo detectÃ³ que habÃ­a cometido un error?\n- Â¿QuÃ© informaciÃ³n externa usÃ³ para verificar?\n- Â¿CÃ³mo reformulÃ³ el problema cuando el primer approach fallÃ³?\n\n### 5.4 Coherencia en Flujos Ramificados\n- Â¿CÃ³mo mantuvo el hilo entre pasos distantes en la cadena?\n- Â¿QuÃ© mecanismos usÃ³ para no perder el objetivo principal mientras resolvÃ­a subtareas?\n- Â¿CuÃ¡ndo decidiÃ³ parar y pedir orientaciÃ³n del CapitÃ¡n?\n\n**Formato de registro**: cada observaciÃ³n va a la BitÃ¡cora con tag `[OBSERVACION_METODOLOGICA]`.\nAcumuladas, estas observaciones forman el corpus de entrenamiento para DeepSeek.\n\n---\n\n## 6. El Stack Objetivo: Thousand Sunny Bajo Bandera Propia\n\n**Sin Anthropic en el loop. Sin Google en el loop (o mÃ­nimo). Sin OpenAI.**\n**Motor: DeepSeek. Bandera: propia.**\n\nEl coste operacional objetivo: 0â‚¬/mes (o el mÃ­nimo de la API de DeepSeek para uso intensivo).\nEl coste actual: mÃ­nimo posible, decreciente.\n\n---\n\n## 7. La HipÃ³tesis Fundacional del Sistema\n\n> *\"La lÃ­nea entre el software y la mente se estÃ¡ borrando y se estÃ¡n haciendo sinÃ³nimos.\"*\n\nEsta hipÃ³tesis no es metafÃ³rica. Es operativa.\n\nLos LLMs son modelos de coherencia lingÃ¼Ã­stica.\nLa coherencia lingÃ¼Ã­stica es el substrato observable de la coherencia psÃ­quica.\nLo que se rompe en flujos de agentes complejos es exactamente lo que se rompe\nen sistemas psÃ­quicos bajo estrÃ©s: la narrativa pierde hilo, el sÃ­mbolo se desconecta\ndel afecto, la acciÃ³n se disocia del sentido.\n\nLa funciÃ³n que mantiene esa coherencia â€” que JinbÄ“ encarna en el sistema â€”\nes la misma funciÃ³n que un clÃ­nico entrena durante aÃ±os:\ndetectar dÃ³nde el discurso \"flota\" y reanclar al sujeto en su experiencia vivida.\n\n**Por eso la ventaja comparativa es real.**\nNo como curiosidad. Como infraestructura.\n\nEl prÃ³ximo paso en el desarrollo de esta metodologÃ­a es formalizarla suficientemente\npara que un motor LLM de cÃ³digo abierto pueda aprenderla.\nCuando eso ocurra, el sistema serÃ¡ completamente independiente.\n\nHasta entonces, usamos sus herramientas para construir las nuestras.\n\n---\n\n*Thousand Sunny â€” BitÃ¡cora de ConstrucciÃ³n*\n*\"Si te conoces a ti mismo y administras tu propia metadata,\nte conviertes en agente de tus posibilidades.\"*\n\n---\n\n**v1.0** â€” redactado por Nami (Claude), bajo instrucciÃ³n del CapitÃ¡n\n**PrÃ³xima versiÃ³n**: incorporar observaciones metodolÃ³gicas de sesiones reales\n";
  
  // Crear Google Doc
  var doc = DocumentApp.create(titulo);
  var body = doc.getBody();
  
  var lineas = contenido.split('\n');
  body.clear();
  for (var i = 0; i < lineas.length; i++) {
    body.appendParagraph(lineas[i]);
  }
  

  
  var file = DriveApp.getFileById(doc.getId());
  var folder = DriveApp.getFolderById(CARPETA_ID);
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  try {
    _legacy_logBitacora_('GAS/crearCodigoArteMarcial', 'nami', 'Doc CODIGO_ARTE_MARCIAL_v1 creado en Drive', 'GAS', 0);
  } catch(e) {}
  
  var url = doc.getUrl();
  Logger.log('âœ… Doc creado: ' + url);
  return url;
}
// ===== FIN FUNCIÃ“N TEMPORAL =====

function testTelegram() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("TELEGRAM_TOKEN");
  var chatId = props.getProperty("CAPTAIN_CHAT_ID");
  if (!token || !chatId) { Logger.log("FAIL: no token/chatId"); return; }
  var url = "https://api.telegram.org/bot" + token + "/sendMessage";
  var payload = {chat_id: chatId, text: "ðŸ´ Test bidireccional Nami OK " + new Date().toISOString()};
  var options = {method:"post", contentType:"application/json", payload: JSON.stringify(payload), muteHttpExceptions: true};
  var resp = UrlFetchApp.fetch(url, options);
  var ok = resp.getResponseCode() === 200;
  Logger.log("Telegram send: " + (ok ? "OK" : "FAIL code:" + resp.getResponseCode()));
}
