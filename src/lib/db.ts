import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      name       TEXT,
      plan       TEXT NOT NULL DEFAULT 'free',
      minutes_left INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;
  await sql`
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
      created_at      TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      updated_at      TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)
  `;
}

// Initialize schema on first import
let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initSchema();
    initialized = true;
  }
}

/* ── User helpers ── */
export async function createUser(email: string, hashedPassword: string, name: string) {
  await ensureInit();
  const rows = await sql`
    INSERT INTO users (email, password, name)
    VALUES (${email}, ${hashedPassword}, ${name})
    RETURNING id, email, name, plan, minutes_left, created_at
  `;
  return rows[0] as User;
}

export async function getUserByEmail(email: string) {
  await ensureInit();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return rows[0] as UserWithPassword | undefined;
}

export async function getUserById(id: string) {
  await ensureInit();
  const rows = await sql`
    SELECT id, email, name, plan, minutes_left, created_at
    FROM users WHERE id = ${id}
  `;
  return rows[0] as User | undefined;
}

/* ── Job helpers ── */
export async function createJob(params: {
  id:             string;
  userId:         string;
  fileName:       string;
  targetLanguage: string;
  voiceMode:      string;
}) {
  await ensureInit();
  await sql`
    INSERT INTO jobs (id, user_id, file_name, target_language, voice_mode)
    VALUES (${params.id}, ${params.userId}, ${params.fileName},
            ${params.targetLanguage}, ${params.voiceMode})
  `;
}

export async function updateJob(id: string, fields: Partial<{
  status:       string;
  progress:     number;
  current_step: string;
  output_url:   string;
  error:        string;
}>) {
  await ensureInit();
  const entries = Object.entries(fields);
  if (entries.length === 0) return;

  for (const [key, value] of entries) {
    if (key === "status")       await sql`UPDATE jobs SET status       = ${value as string}, updated_at = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') WHERE id = ${id}`;
    if (key === "progress")     await sql`UPDATE jobs SET progress     = ${value as number}, updated_at = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') WHERE id = ${id}`;
    if (key === "current_step") await sql`UPDATE jobs SET current_step = ${value as string}, updated_at = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') WHERE id = ${id}`;
    if (key === "output_url")   await sql`UPDATE jobs SET output_url   = ${value as string}, updated_at = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') WHERE id = ${id}`;
    if (key === "error")        await sql`UPDATE jobs SET error        = ${value as string}, updated_at = to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') WHERE id = ${id}`;
  }
}

export async function getJobsByUser(userId: string): Promise<Job[]> {
  await ensureInit();
  const rows = await sql`
    SELECT * FROM jobs
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows as Job[];
}

export async function getJobById(id: string) {
  await ensureInit();
  const rows = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  return rows[0] as Job | undefined;
}

export async function deductMinutes(userId: string, minutes: number) {
  await ensureInit();
  await sql`
    UPDATE users
    SET minutes_left = GREATEST(0, minutes_left - ${minutes})
    WHERE id = ${userId}
  `;
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
