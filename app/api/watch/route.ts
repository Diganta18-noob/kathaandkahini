import { env } from '@/lib/runtime';
import { episodes } from '../../episodes';

const playbackIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const progressSteps = [0, 25, 50, 75, 100];

export async function POST(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return new Response(null, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null, { status: 415 });
  const payload = await request.text();
  if (payload.length > 300) return new Response(null, { status: 413 });
  let data;
  try { data = JSON.parse(payload); } catch { return new Response(null, { status: 400 }); }
  if (!data || typeof data.playbackId !== 'string' || !playbackIdPattern.test(data.playbackId)
    || !episodes.some(episode => episode.id === data.episode) || !progressSteps.includes(data.progress)) {
    return new Response(null, { status: 400 });
  }
  if (!env.DB) return new Response(null, { status: 503 });
  await env.DB.prepare(`
    INSERT INTO watches (id, episode, started_at, progress) VALUES (?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET progress = MAX(watches.progress, excluded.progress)
    WHERE watches.episode = excluded.episode
  `).bind(data.playbackId, data.episode, Date.now(), data.progress).run();
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
