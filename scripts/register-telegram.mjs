const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret } = process.env;
const webhook = 'https://kathaandkahini.vercel.app/api/telegram';

async function telegram(method, payload) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    if (response.ok && data.ok) return data.result;
  } catch {
    // Avoid printing request URLs, which contain the bot token.
  }
  throw new Error(`Telegram ${method} failed.`);
}

try {
  if (!token || !/^[A-Za-z0-9_-]{32,256}$/.test(secret ?? '')) {
    throw new Error('Set TELEGRAM_BOT_TOKEN and a 32–256 character TELEGRAM_WEBHOOK_SECRET in the local environment.');
  }
  const info = await telegram('getWebhookInfo');
  if (info.url && info.url !== webhook) {
    throw new Error('This bot already has a different webhook. Use a dedicated bot or review its current integration first.');
  }
  await telegram('setWebhook', { url: webhook, secret_token: secret, allowed_updates: ['message'] });
  const registered = await telegram('getWebhookInfo');
  if (registered.url !== webhook) throw new Error('Telegram did not confirm the webhook URL.');
  console.log('Telegram confirmed the Kahini webhook. Send /start to the bot to test replies.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
