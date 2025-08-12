import { runBotNow } from '../../src/bot.js';

export async function handler(event, context) {
  try {
    const result = await runBotNow({ force: false });
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, result })
    };
  } catch (error) {
    console.error('bot-scheduler error:', error);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: String(error?.message || error) })
    };
  }
} 