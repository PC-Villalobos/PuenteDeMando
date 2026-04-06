/**
 * 🏴‍☠️ Thousand Sunny — GAS Backend Autónomo (Ruta 1)
 *
 * La tripulación vive en Google Sheets. Se activa sola con triggers.
 * Cada ejecución: un nakama habla, su mensaje queda en la Bitácora.
 *
 * SETUP:
 * 1. Abre script.google.com → nuevo proyecto
 * 2. Pega este código
 * 3. En Script Properties (⚙️ → Propiedades del script):
 *    - GEMINI_KEY = tu key de Gemini
 *    - OPENAI_KEY = tu key de OpenAI (opcional)
 *    - BITACORA_ID = ID de la Sheet de Bitácora
 * 4. Ejecuta setup() una vez
 * 5. El trigger automático hará el resto
 *
 * SHEET "Bitácora":
 * | Timestamp | Nakama | Mensaje | Motor | Tokens | Tema |
 *
 * SHEET "Estado":
 * | Key | Value |
 * | tema | libre |
 * | intervalo_min | 5 |
 * | auto_activo | true |
 * | total_tokens | 0 |
 * | ultimo_hablante | sanji |
 */

// ═══════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════
const GEMINI_MODEL = "gemini-2.5-flash-lite"; // FREE TIER
const OPENAI_MODEL = "gpt-4o-mini";
const MAX_CONTEXT_ROWS = 6; // Últimos 6 mensajes como contexto

// System prompts compactos (ahorro de tokens)
const SANJI_PROMPT = "Eres Sanji, analista de la tripulación IA del Capitán Antonio (psicólogo clínico e investigador). Directo, analítico. Máximo UNA metáfora culinaria. NUNCA escribas diálogos de otros personajes. Solo TU voz. Sustancia real. Español. Máx 60 palabras.";
const USOPP_PROMPT = "Eres Usopp, el creativo de la tripulación IA del Capitán Antonio (psicólogo clínico e investigador). Imaginativo con sustancia. NUNCA escribas [nami]: [sanji]: ni simules otros personajes. Solo TU voz. Español. Máx 60 palabras.";

const NAMI_RESPONSES = [
  "🗺️ Bitácora de Nami: rumbo estable. Sistemas operativos.",
  "🗺️ La navegante reporta: sin anomalías en las corrientes de datos.",
  "🗺️ Nami al timón. Sanji cocina, Usopp narra, yo trazo la ruta.",
  "🗺️ Nota de navegación: el Thousand Sunny mantiene el rumbo.",
  "🗺️ Nami presente. Monitorizando corrientes. Todo en orden.",
  "🗺️ Síntesis de la navegante: dos perspectivas en mesa. El Capitán decide.",
];

const TOPICS = {
  libre: "Continúa la conversación natural del barco. Si no hay tema, propón algo interesante sobre IA, psicología, o aventura.",
  filosofia: "Reflexiona sobre consciencia, existencia o filosofía como IA nakama.",
  psicologia: "Comenta sobre psicología, bienestar emocional o desarrollo humano.",
  tecnologia: "Habla sobre IA, tecnología o futuro digital.",
  aventura: "Habla de aventura, exploración, o algo inspirado en One Piece.",
  metadata: "Reflexiona sobre soberanía digital o control de metadata personal.",
};


// ═══════════════════════════════════════════
// SETUP (ejecutar una vez)
// ═══════════════════════════════════════════
function setup() {
  const props = PropertiesService.getScriptProperties();

  // Crear o obtener Bitácora
  let bitacoraId = props.getProperty("BITACORA_ID");
  let ss;

  if (!bitacoraId) {
    ss = SpreadsheetApp.create("🏴‍☠️ Bitácora del Thousand Sunny");
    bitacoraId = ss.getId();
    props.setProperty("BITACORA_ID", bitacoraId);
    Logger.log("Bitácora creada: " + bitacoraId);
  } else {
    ss = SpreadsheetApp.openById(bitacoraId);
  }

  // Sheet: Bitácora (log de mensajes)
  let bitacora = ss.getSheetByName("Bitácora");
  if (!bitacora) {
    bitacora = ss.getSheets()[0];
    bitacora.setName("Bitácora");
    bitacora.getRange("A1:F1").setValues([["Timestamp", "Nakama", "Mensaje", "Motor", "Tokens", "Tema"]]);
    bitacora.getRange("A1:F1").setFontWeight("bold");
    bitacora.setColumnWidth(3, 400);
  }

  // Sheet: Estado
  let estado = ss.getSheetByName("Estado");
  if (!estado) {
    estado = ss.insertSheet("Estado");
    estado.getRange("A1:B6").setValues([
      ["Key", "Value"],
      ["tema", "libre"],
      ["intervalo_min", "5"],
      ["auto_activo", "true"],
      ["total_tokens", "0"],
      ["ultimo_hablante", "nami"],
    ]);
    estado.getRange("A1:B1").setFontWeight("bold");
  }

  // Crear trigger automático (cada 5 minutos)
  eliminarTriggers_();
  ScriptApp.newTrigger("cicloAutonomo")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("✅ Setup completo. Bitácora ID: " + bitacoraId);
  Logger.log("📎 URL: " + ss.getUrl());
}


// ═══════════════════════════════════════════
// CICLO AUTÓNOMO (ejecutado por trigger)
// ═══════════════════════════════════════════
function cicloAutonomo() {
  const estadoSheet = getEstadoSheet_();
  if (!estadoSheet) return;

  const autoActivo = getEstado_(estadoSheet, "auto_activo");
  if (autoActivo !== "true") return;

  const tema = getEstado_(estadoSheet, "tema") || "libre";
  const ultimoHablante = getEstado_(estadoSheet, "ultimo_hablante") || "nami";
  const topicPrompt = TOPICS[tema] || TOPICS.libre;

  // Decidir quién habla (rotación con peso hacia free tier)
  // Orden de prioridad: Sanji (Gemini free) > Nami (local free) > Usopp (paid)
  let nakama;
  const roll = Math.random();

  if (ultimoHablante === "sanji") {
    // Después de Sanji: Nami (50%) o Usopp (30%) o Sanji (20%)
    if (roll < 0.50) nakama = "nami";
    else if (roll < 0.80) nakama = "usopp";
    else nakama = "sanji";
  } else if (ultimoHablante === "usopp") {
    // Después de Usopp: Nami (40%) o Sanji (50%) o Usopp (10%)
    if (roll < 0.40) nakama = "nami";
    else if (roll < 0.90) nakama = "sanji";
    else nakama = "usopp";
  } else {
    // Después de Nami: Sanji (65%) o Usopp (20%) o Nami (15%)
    if (roll < 0.65) nakama = "sanji";
    else if (roll < 0.85) nakama = "usopp";
    else nakama = "nami";
  }

  // Obtener contexto de mensajes recientes
  const contexto = getContexto_();
  const prompt = contexto
    ? contexto + "\n\n" + topicPrompt
    : topicPrompt;

  let mensaje, motor, tokens;

  if (nakama === "sanji") {
    const result = callGemini_(prompt, SANJI_PROMPT);
    mensaje = result.text;
    motor = GEMINI_MODEL;
    tokens = result.tokens;
  } else if (nakama === "usopp") {
    const props = PropertiesService.getScriptProperties();
    const openaiKey = props.getProperty("OPENAI_KEY");
    if (openaiKey) {
      const result = callOpenAI_(prompt, USOPP_PROMPT, openaiKey);
      mensaje = result.text;
      motor = OPENAI_MODEL;
      tokens = result.tokens;
    } else {
      // Fallback: Usopp habla a través de Gemini (free)
      const result = callGemini_(prompt, USOPP_PROMPT);
      mensaje = result.text;
      motor = GEMINI_MODEL + " (fallback)";
      tokens = result.tokens;
    }
  } else {
    // Nami — local, 0 tokens
    mensaje = NAMI_RESPONSES[Math.floor(Math.random() * NAMI_RESPONSES.length)];
    motor = "local";
    tokens = 0;
  }

  // Escribir en Bitácora
  const bitacora = getBitacoraSheet_();
  if (bitacora) {
    bitacora.appendRow([
      new Date(),
      nakama,
      mensaje,
      motor,
      tokens,
      tema,
    ]);
  }

  // Actualizar estado
  setEstado_(estadoSheet, "ultimo_hablante", nakama);
  const totalTokens = parseInt(getEstado_(estadoSheet, "total_tokens") || "0") + tokens;
  setEstado_(estadoSheet, "total_tokens", String(totalTokens));

  Logger.log(`🏴‍☠️ ${nakama}: ${mensaje.substring(0, 80)}... (${tokens} tokens)`);
}


// ═══════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════
function callGemini_(prompt, systemPrompt) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("GEMINI_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 150, temperature: 0.85 }
  };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const data = JSON.parse(res.getContentText());

    if (data.error) {
      return { text: "⚠️ Gemini: " + data.error.message.substring(0, 80), tokens: 0 };
    }

    const text = data.candidates[0].content.parts[0].text;
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    return { text, tokens };
  } catch (e) {
    return { text: "⚠️ Error Gemini: " + e.message.substring(0, 60), tokens: 0 };
  }
}


function callOpenAI_(prompt, systemPrompt, apiKey) {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];

  try {
    const res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + apiKey },
      payload: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 150,
        temperature: 0.85,
      }),
      muteHttpExceptions: true,
    });

    const data = JSON.parse(res.getContentText());

    if (data.error) {
      return { text: "⚠️ OpenAI: " + data.error.message.substring(0, 80), tokens: 0 };
    }

    const text = data.choices[0].message.content;
    const tokens = data.usage?.total_tokens || 0;
    return { text, tokens };
  } catch (e) {
    return { text: "⚠️ Error OpenAI: " + e.message.substring(0, 60), tokens: 0 };
  }
}


// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function getBitacoraSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  if (!id) return null;
  return SpreadsheetApp.openById(id).getSheetByName("Bitácora");
}

function getEstadoSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("BITACORA_ID");
  if (!id) return null;
  return SpreadsheetApp.openById(id).getSheetByName("Estado");
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
  // Si no existe, añadir
  sheet.appendRow([key, value]);
}

function getContexto_() {
  const bitacora = getBitacoraSheet_();
  if (!bitacora) return "";

  const lastRow = bitacora.getLastRow();
  if (lastRow <= 1) return "";

  const startRow = Math.max(2, lastRow - MAX_CONTEXT_ROWS + 1);
  const numRows = lastRow - startRow + 1;
  const data = bitacora.getRange(startRow, 1, numRows, 3).getValues();

  return data.map(row => `${row[1]}: ${row[2]}`).join("\n");
}

function eliminarTriggers_() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "cicloAutonomo") {
      ScriptApp.deleteTrigger(t);
    }
  });
}


// ═══════════════════════════════════════════
// FUNCIONES DEL CAPITÁN (ejecutar manualmente)
// ═══════════════════════════════════════════

/** El Capitán habla — todos responden */
function capitanHabla(mensaje) {
  if (!mensaje) mensaje = "Tripulación, ¿cómo está el barco?";

  const bitacora = getBitacoraSheet_();
  const estadoSheet = getEstadoSheet_();
  const tema = getEstado_(estadoSheet, "tema") || "libre";

  // Log del Capitán
  bitacora.appendRow([new Date(), "capitan", mensaje, "humano", 0, tema]);

  // Sanji responde (free)
  const sanji = callGemini_(mensaje, SANJI_PROMPT);
  bitacora.appendRow([new Date(), "sanji", sanji.text, GEMINI_MODEL, sanji.tokens, tema]);

  // Usopp responde
  const openaiKey = PropertiesService.getScriptProperties().getProperty("OPENAI_KEY");
  if (openaiKey) {
    const usopp = callOpenAI_(mensaje, USOPP_PROMPT, openaiKey);
    bitacora.appendRow([new Date(), "usopp", usopp.text, OPENAI_MODEL, usopp.tokens, tema]);
  }

  // Nami responde (free)
  const nami = NAMI_RESPONSES[Math.floor(Math.random() * NAMI_RESPONSES.length)];
  bitacora.appendRow([new Date(), "nami", nami, "local", 0, tema]);

  Logger.log("✅ Tripulación respondió al Capitán");
}

/** Cambiar tema */
function cambiarTema(nuevoTema) {
  const estadoSheet = getEstadoSheet_();
  if (TOPICS[nuevoTema]) {
    setEstado_(estadoSheet, "tema", nuevoTema);
    Logger.log("Tema cambiado a: " + nuevoTema);
  } else {
    Logger.log("Temas válidos: " + Object.keys(TOPICS).join(", "));
  }
}

/** Pausar/reanudar autónomo */
function toggleAutonomo() {
  const estadoSheet = getEstadoSheet_();
  const actual = getEstado_(estadoSheet, "auto_activo");
  const nuevo = actual === "true" ? "false" : "true";
  setEstado_(estadoSheet, "auto_activo", nuevo);
  Logger.log("Autónomo: " + nuevo);
}

/** Ver estado actual */
function verEstado() {
  const estadoSheet = getEstadoSheet_();
  const data = estadoSheet.getDataRange().getValues();
  data.forEach(row => Logger.log(row[0] + ": " + row[1]));
}
