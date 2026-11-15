import { timingSafeEqual } from 'node:crypto';
import { episodes } from '@/app/episodes';

const site = 'https://kathaandkahini.vercel.app/';

type TelegramUpdate = {
  message?: { chat?: { type?: string; id?: number }; text?: string };
};

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });

  const expected = Buffer.from(secret);
  const received = Buffer.from(request.headers.get('x-telegram-bot-api-secret-token') ?? '');
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return new Response(null, { status: 403 });
  }

  const update = await request.json().catch(() => null) as TelegramUpdate | null;
  const message = update?.message;
  if (message?.chat?.type !== 'private' || !Number.isSafeInteger(message.chat.id) ||
      typeof message.text !== 'string') {
    return new Response(null, { status: 204 });
  }

  const command = message.text.trim().split(/\s+/, 1)[0];
  let text: string;
  let url = site;
  switch (command) {
    case '/start':
      text = 'Welcome to Katha & Kahini. Use /latest for our newest story or /watch to open the site.';
      break;
    case '/latest': {
      const episode = episodes[episodes.length - 1];
      text = `${episode.title}\n\n${episode.text}`;
      url = new URL(`#${episode.id}`, site).href;
      break;
    }
    case '/watch':
      text = 'Watch Katha & Kahini on our website.';
      break;
    default:
      return new Response(null, { status: 204 });
  }

  return Response.json({
    method: 'sendMessage',
    chat_id: message.chat.id,
    text,
    reply_markup: { inline_keyboard: [[{ text: 'Watch on the website', url }]] },
  });
}
