/**
 * Nexus Vault setup helpers for Google Apps Script.
 *
 * Canonical vault: G:\\Mi unidad\\00_BOVEDA_NEXUS
 * This script is intentionally idempotent. It only creates missing folders
 * and empty/template files. It never moves, renames, trashes, or reads source
 * documents, and clinical scaffolds always start as HOLD.
 */

const NEXUS_VAULT_NAME = '00_BOVEDA_NEXUS';

const NEXUS_VAULT_PATHS = [
  ['00_BANDEJA_ENTRADA'],
  ['01_SISTEMA'],
  ['01_SISTEMA', 'CANON'],
  ['02_PROYECTOS'],
  ['02_PROYECTOS', 'NEXUS'],
  ['03_BITACORA'],
  ['03_BITACORA', '00_REGISTRO_N0'],
  ['03_BITACORA', '00_REGISTRO_N0', 'EVENTOS_PERSONALES'],
  ['03_BITACORA', '00_REGISTRO_N0', 'ACTUALIDAD_INTERES'],
  ['03_BITACORA', '00_REGISTRO_N0', 'CASOS_CLINICOS'],
  ['04_ARTEFACTOS_TECNICOS'],
  ['90_RETENIDOS'],
  ['90_RETENIDOS', 'CLINICA_HOLD'],
  ['99_ARCHIVO'],
  ['99_ARCHIVO', 'RAIZ'],
  ['99_ARCHIVO', 'TRONCO'],
  ['99_ARCHIVO', 'FRUTO'],
  ['_meta'],
  ['_meta', 'config'],
  ['_meta', 'nakamas'],
  ['_meta', 'indices'],
  ['_meta', 'manifiestos'],
  ['_plantillas']
];

function setupNexusVault() {
  const vault = ensureChildFolder_(DriveApp.getRootFolder(), NEXUS_VAULT_NAME);
  const created = [];
  const existing = [];

  NEXUS_VAULT_PATHS.forEach(function(path) {
    const result = ensurePath_(vault, path);
    (result.created ? created : existing).push(path.join('/'));
  });

  return {
    ok: true,
    vault: NEXUS_VAULT_NAME,
    created: created,
    existing: existing,
    source_mutations: 0,
    clinical_policy: 'HOLD'
  };
}

function getNexusVaultStatus() {
  const root = DriveApp.getRootFolder();
  const vaultIterator = root.getFoldersByName(NEXUS_VAULT_NAME);

  if (!vaultIterator.hasNext()) {
    return {
      ok: true,
      vault_exists: false,
      missing: NEXUS_VAULT_PATHS.map(function(path) { return path.join('/'); })
    };
  }

  const vault = vaultIterator.next();
  const checked = [];
  const missing = [];

  NEXUS_VAULT_PATHS.forEach(function(path) {
    const exists = pathExists_(vault, path);
    (exists ? checked : missing).push(path.join('/'));
  });

  return {
    ok: true,
    vault_exists: true,
    vault_id: vault.getId(),
    checked: checked,
    missing: missing,
    source_mutations: 0
  };
}

function createCaseScaffold(id) {
  const caseId = sanitizeCaseId_(id);
  if (!caseId) {
    throw new Error('createCaseScaffold(id) requires a non-empty id');
  }

  setupNexusVault();

  const vault = ensureChildFolder_(DriveApp.getRootFolder(), NEXUS_VAULT_NAME);
  const casesRoot = ensurePath_(vault, ['03_BITACORA', '00_REGISTRO_N0', 'CASOS_CLINICOS']).folder;
  const caseFolder = ensureChildFolder_(casesRoot, caseId);

  [
    'CANON',
    'CASO_VIVO',
    'FEEDBACK',
    'CAPA_C',
    'HOLD'
  ].forEach(function(name) {
    ensureChildFolder_(caseFolder, name);
  });

  ensureTemplateFile_(caseFolder, 'ESTADO.json', JSON.stringify({
    id: caseId,
    status: 'HOLD',
    domain: 'CLI',
    clinical_sensitive: true,
    source_mutations: false,
    created_by: 'setupNexusVault.createCaseScaffold',
    notes: 'Scaffold only. Do not ingest clinical content without Captain + Vivi/Chopper approval.'
  }, null, 2));

  return {
    ok: true,
    case_id: caseId,
    status: 'HOLD',
    clinical_sensitive: true,
    folder_id: caseFolder.getId(),
    source_mutations: 0
  };
}

function ensurePath_(baseFolder, segments) {
  let folder = baseFolder;
  let created = false;

  segments.forEach(function(segment) {
    const before = folder;
    const iterator = before.getFoldersByName(segment);
    if (iterator.hasNext()) {
      folder = iterator.next();
    } else {
      folder = before.createFolder(segment);
      created = true;
    }
  });

  return { folder: folder, created: created };
}

function pathExists_(baseFolder, segments) {
  let folder = baseFolder;

  for (let i = 0; i < segments.length; i++) {
    const iterator = folder.getFoldersByName(segments[i]);
    if (!iterator.hasNext()) return false;
    folder = iterator.next();
  }

  return true;
}

function ensureChildFolder_(parent, name) {
  const iterator = parent.getFoldersByName(name);
  return iterator.hasNext() ? iterator.next() : parent.createFolder(name);
}

function ensureTemplateFile_(folder, name, content) {
  const iterator = folder.getFilesByName(name);
  if (iterator.hasNext()) return iterator.next();
  return folder.createFile(name, content, MimeType.PLAIN_TEXT);
}

function sanitizeCaseId_(id) {
  return String(id || '')
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}
