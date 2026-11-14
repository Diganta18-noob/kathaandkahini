import { episodes } from '../app/episodes';

export const videoPaths = episodes.map(episode => '/assets/' + episode.id + '.mp4');

export async function serveVideo(request: Request, assets: Fetcher) {
  const range = request.headers.get('range');
  if (!range || request.method !== 'GET') return assets.fetch(request);
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return assets.fetch(request);

  const full = await assets.fetch(new Request(request.url));
  if (!full.ok) return full;
  const bytes = await full.arrayBuffer();
  const size = bytes.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Content-Type': 'video/mp4',
    'Cache-Control': 'private, no-store',
  });
  if (start >= size || end < start) {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}
