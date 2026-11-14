import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';

const allowedKey = /^(3|4|5|6|chhath):(Instagram|Facebook|YouTube)$/;
const options = ['To prepare', 'Drafted', 'Scheduled', 'Published'];
const headers = { 'Cache-Control': 'no-store' };

async function authorized() {
  const user = await getChatGPTUser();
  return !!user && !!env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
}

async function database() {
  if (!env.DB) throw new Error('Database unavailable');
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS publishing_status (
    slot TEXT PRIMARY KEY, status TEXT NOT NULL, updated_at INTEGER NOT NULL
  )`).run();
  return env.DB;
}

export async function GET() {
  if (!(await authorized())) return new Response(null, { status: 403, headers });
  try {
    const db = await database();
    const { results } = await db.prepare('SELECT slot, status FROM publishing_status').all<{slot: string; status: string}>();
    return Response.json(Object.fromEntries(results.map(row => [row.slot, row.status])), { headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}

export async function PUT(request: Request) {
  if (!(await authorized()) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return new Response(null, { status: 403, headers });
  }
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    return new Response(null, { status: 415, headers });
  }
  const data = await request.json().catch(() => null) as { key?: unknown; status?: unknown } | null;
  if (typeof data?.key !== 'string' || !allowedKey.test(data.key) ||
      typeof data.status !== 'string' || !options.includes(data.status)) {
    return new Response(null, { status: 400, headers });
  }
  try {
    const db = await database();
    await db.prepare(`INSERT INTO publishing_status (slot,status,updated_at) VALUES (?,?,?)
      ON CONFLICT(slot) DO UPDATE SET status=excluded.status, updated_at=excluded.updated_at`)
      .bind(data.key, data.status, Date.now()).run();
    return new Response(null, { status: 204, headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
