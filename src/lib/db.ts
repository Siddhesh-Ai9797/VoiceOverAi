import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "voiceoverai.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      name       TEXT,
      plan       TEXT NOT NULL DEFAULT 'free',
      minutes_left INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id),
      file_name       TEXT NOT NULL,
      target_language TEXT NOT NULL,
      voice_mode      TEXT NOT NULL DEFAULT 'standard',
      status          TEXT NOT NULL DEFAULT 'queued',
      progress        INTEGER NOT NULL DEFAULT 0,
      current_step    TEXT NOT NULL DEFAULT 'queued',
      output_url      TEXT,
      error           TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
  `);
}

/* ── User helpers ── */
export function createUser(email: string, hashedPassword: string, name: string) {
  const stmt = getDb().prepare(`
    INSERT INTO users (email, password, name)
    VALUES (?, ?, ?)
    RETURNING id, email, name, plan, minutes_left, created_at
  `);
  return stmt.get(email, hashedPassword, name) as User;
}

export function getUserByEmail(email: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as UserWithPassword | undefined;
}

export function getUserById(id: string) {
  return getDb()
    .prepare("SELECT id, email, name, plan, minutes_left, created_at FROM users WHERE id = ?")
    .get(id) as User | undefined;
}

/* ── Job helpers ── */
export function createJob(params: {
  id:             string;
  userId:         string;
  fileName:       string;
  targetLanguage: string;
  voiceMode:      string;
}) {
  getDb().prepare(`
    INSERT INTO jobs (id, user_id, file_name, target_language, voice_mode)
    VALUES (@id, @userId, @fileName, @targetLanguage, @voiceMode)
  `).run(params);
}

export function updateJob(id: string, fields: Partial<{
  status:       string;
  progress:     number;
  current_step: string;
  output_url:   string;
  error:        string;
}>) {
  const sets   = Object.keys(fields).map(k => `${k} = @${k}`).join(", ");
  const params = { id, ...fields };
  getDb().prepare(`
    UPDATE jobs SET ${sets}, updated_at = datetime('now') WHERE id = @id
  `).run(params);
}

export function getJobsByUser(userId: string): Job[] {
  return getDb().prepare(`
    SELECT * FROM jobs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(userId) as Job[];
}

export function getJobById(id: string) {
  return getDb()
    .prepare("SELECT * FROM jobs WHERE id = ?")
    .get(id) as Job | undefined;
}

export function deductMinutes(userId: string, minutes: number) {
  getDb().prepare(`
    UPDATE users
    SET minutes_left = MAX(0, minutes_left - ?)
    WHERE id = ?
  `).run(minutes, userId);
}

/* ── Types ── */
export interface User {
  id:           string;
  email:        string;
  name:         string;
  plan:         string;
  minutes_left: number;
  created_at:   string;
}

export interface UserWithPassword extends User {
  password: string;
}

export interface Job {
  id:              string;
  user_id:         string;
  file_name:       string;
  target_language: string;
  voice_mode:      string;
  status:          string;
  progress:        number;
  current_step:    string;
  output_url:      string | null;
  error:           string | null;
  created_at:      string;
  updated_at:      string;
}
