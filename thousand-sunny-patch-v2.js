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
  if (/todos|tripulaci|crew|nakama|opinen|qu[eé] opinan|hablen|concluyan/.test(lower)) {
    return ["sanji", "usopp", "nami"];
  }

  // ROBIN: clasificacion, organizacion
  if (/robin|clasif|organiz|categ|orden[^a]|ubic|estructur|donde va|pilar/.test(lower)) {
    return ["robin"];
  }

  // CHOPPER: casos clinicos, patrones
  if (/chopper|caso[s ]|pacient|cl[ií]nic|s[ií]ntoma|diagn[oó]s|salud/.test(lower)) {
    return ["chopper"];
  }

  // SANJI: evaluacion, procesamiento
  if (/sanji|cocin|analiz|eval[uú]a|procesa|revisa|qu[eé] tal|piensas/.test(lower)) {
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
  if (/nami|estado|rumbo|barco|c[oó]mo va|c[oó]mo est[aá]|sistema|progreso|avance/.test(lower)) {
    return ["nami"];
  }

  // Default: Sanji (free tier)
  return ["sanji"];
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
      respuesta = callGemini_(text, PROMPTS.sanji);
      motor = GEMINI_MODEL;
      logBitacora_("telegram", "sanji", respuesta.text, motor, respuesta.tokens);
      enviarTelegram_(chatId, "* Sanji:*\n" + respuesta.text);

    } else if (nakama === "usopp") {
      respuesta = callUsopp_(text);
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
      respuesta = callGemini_(text, PROMPTS.sanji);
      motor = GEMINI_MODEL;
      tokens = respuesta.tokens;
      logBitacora_(ruta, "sanji", respuesta.text, motor, tokens);
      responses.push({
        nakama: "sanji",
        texto: respuesta.text,
        motor: motor,
        tokens: tokens
      });

    } else if (nakama === "usopp") {
      respuesta = callUsopp_(text);
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
