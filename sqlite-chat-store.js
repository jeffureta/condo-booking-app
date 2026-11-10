import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_CHAT_DB_PATH =
  process.env.CHAT_DB_PATH ||
  path.join(__dirname, 'data', 'chat_history.db');

export const MAX_SESSION_MESSAGES = 50;

/**
 * Ensures the directory for the SQLite file exists (unless using :memory:)
 * and opens a DatabaseSync instance with schema initialized.
 *
 * @param {string} [dbPath]
 * @returns {DatabaseSync}
 */
function openChatDb(dbPath = DEFAULT_CHAT_DB_PATH) {
  if (dbPath && dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_language TEXT NOT NULL DEFAULT 'en',
      last_register TEXT NOT NULL DEFAULT 'warm',
      entities_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      register TEXT NOT NULL DEFAULT 'warm',
      topic TEXT NOT NULL DEFAULT 'general_help',
      topics_json TEXT NOT NULL DEFAULT '[]',
      confidence REAL NOT NULL DEFAULT 0,
      has_quote INTEGER NOT NULL DEFAULT 0,
      entities_json TEXT NOT NULL DEFAULT '{}',
      booking_action_json TEXT,
      engine TEXT NOT NULL DEFAULT 'deterministic-fallback',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_topic ON chat_messages(role, topic, confidence);
  `);

  return db;
}

/**
 * Initializes the SQLite chat database schema.
 *
 * @param {string} [dbPath]
 * @returns {boolean}
 */
export function initChatDatabase(dbPath = DEFAULT_CHAT_DB_PATH) {
  const db = openChatDb(dbPath);
  db.close();
  return true;
}

/**
 * Merges incoming extracted booking entities with existing session entities.
 *
 * @param {Object} existingEntities
 * @param {Object} incomingEntities
 * @returns {{ startDate: string|null, endDate: string|null, guestCount: number|null }}
 */
export function mergeStoredEntities(existingEntities = {}, incomingEntities = {}) {
  return {
    startDate: incomingEntities?.startDate || existingEntities?.startDate || null,
    endDate: incomingEntities?.endDate || existingEntities?.endDate || null,
    guestCount:
      typeof incomingEntities?.guestCount === 'number' && incomingEntities.guestCount > 0
        ? incomingEntities.guestCount
        : (typeof existingEntities?.guestCount === 'number' ? existingEntities.guestCount : null)
  };
}

/**
 * Saves a user/bot conversation turn, merges multi-turn booking entities,
 * and records NLU telemetry in SQLite.
 *
 * @param {Object} payload
 * @param {string} [dbPath]
 * @returns {Object}
 */
export function saveChatTurn(payload, dbPath = DEFAULT_CHAT_DB_PATH) {
  const sessionId = String(payload?.sessionId || 'default-session');
  const nowIso = new Date().toISOString();
  const language = payload?.language || 'en';
  const register = payload?.register || 'warm';
  const topic = payload?.topic || 'general_help';
  const topics = Array.isArray(payload?.topics) ? payload.topics : [topic];
  const confidence = typeof payload?.confidence === 'number' ? payload.confidence : 0;
  const hasQuote = payload?.hasQuote ? 1 : 0;
  const engine = payload?.engine || 'deterministic-fallback';

  const db = openChatDb(dbPath);
  try {
    const existingSessionStmt = db.prepare(`
      SELECT session_id, entities_json, last_language, last_register
      FROM chat_sessions
      WHERE session_id = ?
    `);
    const existingRow = existingSessionStmt.get(sessionId);

    let prevEntities = {};
    if (existingRow && existingRow.entities_json) {
      try {
        prevEntities = JSON.parse(existingRow.entities_json);
      } catch {
        prevEntities = {};
      }
    }

    const mergedEntities = mergeStoredEntities(prevEntities, payload?.entities || {});
    const entitiesJson = JSON.stringify(mergedEntities);
    const topicsJson = JSON.stringify(topics);
    const bookingActionJson = payload?.bookingAction ? JSON.stringify(payload.bookingAction) : null;

    if (!existingRow) {
      const insertSession = db.prepare(`
        INSERT INTO chat_sessions (
          session_id, created_at, updated_at, last_language, last_register, entities_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'active')
      `);
      insertSession.run(sessionId, nowIso, nowIso, language, register, entitiesJson);
    } else {
      const updateSession = db.prepare(`
        UPDATE chat_sessions
        SET updated_at = ?, last_language = ?, last_register = ?, entities_json = ?, status = 'active'
        WHERE session_id = ?
      `);
      updateSession.run(nowIso, language, register, entitiesJson, sessionId);
    }

    const insertMsg = db.prepare(`
      INSERT INTO chat_messages (
        session_id, role, content, language, register, topic, topics_json,
        confidence, has_quote, entities_json, booking_action_json, engine, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (payload?.userMessage) {
      insertMsg.run(
        sessionId,
        'user',
        String(payload.userMessage),
        language,
        register,
        topic,
        topicsJson,
        confidence,
        hasQuote,
        entitiesJson,
        null,
        engine,
        nowIso
      );
    }

    if (payload?.botReply) {
      insertMsg.run(
        sessionId,
        'bot',
        String(payload.botReply),
        language,
        register,
        topic,
        topicsJson,
        confidence,
        hasQuote,
        entitiesJson,
        bookingActionJson,
        engine,
        nowIso
      );
    }

    return {
      success: true,
      sessionId,
      sessionMemory: {
        startDate: mergedEntities.startDate,
        endDate: mergedEntities.endDate,
        guestCount: mergedEntities.guestCount,
        lastLanguage: language,
        lastRegister: register
      }
    };
  } finally {
    db.close();
  }
}

/**
 * Retrieves a chat session, its multi-turn entity memory, and ordered message history.
 *
 * @param {string} sessionId
 * @param {string} [dbPath]
 * @returns {Object|null}
 */
export function getChatSession(sessionId, dbPath = DEFAULT_CHAT_DB_PATH) {
  if (!sessionId) return null;

  const db = openChatDb(dbPath);
  try {
    const sessStmt = db.prepare(`
      SELECT session_id, created_at, updated_at, last_language, last_register, entities_json, status
      FROM chat_sessions
      WHERE session_id = ?
    `);
    const sess = sessStmt.get(String(sessionId));
    if (!sess) {
      return {
        sessionId: String(sessionId),
        messages: [],
        sessionMemory: {
          startDate: null,
          endDate: null,
          guestCount: null,
          lastLanguage: 'en',
          lastRegister: 'warm'
        }
      };
    }

    let entities = { startDate: null, endDate: null, guestCount: null };
    try {
      entities = { ...entities, ...JSON.parse(sess.entities_json || '{}') };
    } catch {
      // keep defaults
    }

    const msgStmt = db.prepare(`
      SELECT id, role, content, language, register, topic, topics_json,
             confidence, has_quote, booking_action_json, engine, created_at
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY id ASC
      LIMIT ?
    `);
    const rows = msgStmt.all(String(sessionId), MAX_SESSION_MESSAGES);

    const messages = rows.map(row => {
      let bookingAction = null;
      if (row.booking_action_json) {
        try {
          bookingAction = JSON.parse(row.booking_action_json);
        } catch {
          bookingAction = null;
        }
      }
      return {
        id: row.id,
        role: row.role,
        content: row.content,
        language: row.language,
        register: row.register,
        topic: row.topic,
        confidence: row.confidence,
        hasQuote: Boolean(row.has_quote),
        bookingAction,
        engine: row.engine,
        createdAt: row.created_at
      };
    });

    return {
      sessionId: sess.session_id,
      status: sess.status,
      createdAt: sess.created_at,
      updatedAt: sess.updated_at,
      messages,
      sessionMemory: {
        startDate: entities.startDate || null,
        endDate: entities.endDate || null,
        guestCount: entities.guestCount || null,
        lastLanguage: sess.last_language || 'en',
        lastRegister: sess.last_register || 'warm'
      }
    };
  } finally {
    db.close();
  }
}

/**
 * Resets a chat session's messages and entity memory so the guest can start fresh.
 *
 * @param {string} sessionId
 * @param {string} [dbPath]
 * @returns {{ success: boolean, sessionId: string }}
 */
export function resetChatSession(sessionId, dbPath = DEFAULT_CHAT_DB_PATH) {
  const cleanId = String(sessionId || 'default-session');
  const nowIso = new Date().toISOString();

  const db = openChatDb(dbPath);
  try {
    const delMsgs = db.prepare(`DELETE FROM chat_messages WHERE session_id = ?`);
    delMsgs.run(cleanId);

    const resetSess = db.prepare(`
      UPDATE chat_sessions
      SET updated_at = ?, last_language = 'en', last_register = 'warm',
          entities_json = '{"startDate":null,"endDate":null,"guestCount":null}',
          status = 'reset'
      WHERE session_id = ?
    `);
    resetSess.run(nowIso, cleanId);

    return { success: true, sessionId: cleanId };
  } finally {
    db.close();
  }
}

/**
 * Returns unresolved or low-confidence user inquiries (topic = 'general_help' or confidence < 0.35)
 * to help the host expand KNOWLEDGE_BASE_LAYER.
 *
 * @param {{ limit?: number }} [options]
 * @param {string} [dbPath]
 * @returns {Array<Object>}
 */
export function getUnresolvedInquiries(options = {}, dbPath = DEFAULT_CHAT_DB_PATH) {
  const limit = options?.limit || 25;
  const db = openChatDb(dbPath);
  try {
    const stmt = db.prepare(`
      SELECT id, session_id AS sessionId, content, language, register, topic, confidence, created_at AS createdAt
      FROM chat_messages
      WHERE role = 'user' AND (topic = 'general_help' OR confidence < 0.35)
      ORDER BY id DESC
      LIMIT ?
    `);
    return stmt.all(limit).map(r => ({ ...r }));
  } finally {
    db.close();
  }
}

/**
 * Returns an aggregate telemetry summary across all stored chat sessions.
 *
 * @param {string} [dbPath]
 * @returns {Object}
 */
export function getChatAnalyticsSummary(dbPath = DEFAULT_CHAT_DB_PATH) {
  const db = openChatDb(dbPath);
  try {
    const sessCount = db.prepare(`SELECT COUNT(*) AS count FROM chat_sessions`).get();
    const userMsgCount = db.prepare(`SELECT COUNT(*) AS count FROM chat_messages WHERE role = 'user'`).get();
    const unresolvedCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM chat_messages
      WHERE role = 'user' AND (topic = 'general_help' OR confidence < 0.35)
    `).get();

    const langRows = db.prepare(`
      SELECT language, COUNT(*) AS count
      FROM chat_messages
      WHERE role = 'user'
      GROUP BY language
    `).all();

    const languages = { en: 0, tl: 0, taglish: 0 };
    for (const row of langRows) {
      if (row.language) {
        languages[row.language] = Number(row.count);
      }
    }

    const topicRows = db.prepare(`
      SELECT topic, COUNT(*) AS count
      FROM chat_messages
      WHERE role = 'user'
      GROUP BY topic
      ORDER BY count DESC
    `).all();

    const topics = {};
    for (const row of topicRows) {
      if (row.topic) {
        topics[row.topic] = Number(row.count);
      }
    }

    return {
      totalSessions: Number(sessCount?.count || 0),
      totalUserMessages: Number(userMsgCount?.count || 0),
      unresolvedCount: Number(unresolvedCount?.count || 0),
      languages,
      topics
    };
  } finally {
    db.close();
  }
}
