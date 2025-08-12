import 'dotenv/config';
import { runBotNow } from '../../src/bot.js';

export async function handler(event, context) {
  const token = process.env.RUN_TOKEN || '';
  const provided = event.headers['x-run-token'] || event.headers['X-Run-Token'];
  if (token && token !== provided) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const force = (event.queryStringParameters?.force || '') === '1';

  try {
    const result = await runBotNow({ force });
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, result })
    };
  } catch (error) {
    console.error('manual-run error:', error);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: String(error?.message || error) })
    };
  }
} 