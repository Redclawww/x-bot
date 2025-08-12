import { GoogleGenerativeAI } from '@google/generative-ai';
import { sanitizeOutput } from './utils.js';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

async function generateText(prompt, maxWords = 50) {
  const model = getModel();
  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || '';
  return sanitizeOutput(text, maxWords);
}

export async function generateReplyForTweet(tweetText) {
  const prompt = `You are a human-like Twitter user. Read the tweet and craft a single reply.

Constraints:
- Max 50 words.
- No emojis. No hashtags.
- Tone: natural, varied, conversational.
- Choose ONE approach based on content: ask a question; add related info; share a personal opinion; or a light sarcastic comment ONLY if the tweet is clearly funny or anecdotal.
- Do not repeat the tweet. Do not include quotes or markdown.

Tweet:
"""
${tweetText}
"""

Reply:`;
  return generateText(prompt, 50);
}

export async function generateOriginalPost() {
  const prompt = `Write a short, conversational tweet: a thought, observation, or insight.

Constraints:
- No emojis. No hashtags.
- Must not sound like marketing copy or an AI.
- Keep it concise (ideally under 30 words, never over 50).
- No quotes or markdown, just the tweet.`;
  return generateText(prompt, 50);
} 