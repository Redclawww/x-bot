import { generateOriginalPost, generateReplyForTweet } from './gemini.js';
import { fetchRandomTweetForReply, postTweet, replyToTweet } from './twitter.js';
import { loadState, saveState } from './state.js';
import { minutesSince, sanitizeOutput, todayString } from './utils.js';

const REPLIES_PER_DAY = 10;
const POSTS_PER_DAY = 5;
const COOLDOWN_MINUTES = 20;

function chooseAction(state) {
  const repliesRemaining = Math.max(0, REPLIES_PER_DAY - state.repliesDone);
  const postsRemaining = Math.max(0, POSTS_PER_DAY - state.postsDone);

  if (repliesRemaining <= 0 && postsRemaining <= 0) return 'none';
  if (repliesRemaining > 0 && postsRemaining <= 0) return 'reply';
  if (postsRemaining > 0 && repliesRemaining <= 0) return 'post';

  const total = repliesRemaining + postsRemaining;
  const r = Math.random() * total;
  return r < repliesRemaining ? 'reply' : 'post';
}

export async function runBotNow({ force = false } = {}) {
  const state = await loadState();
  const now = new Date();

  // Cooldown
  if (!force) {
    const mins = minutesSince(state.lastActionAt);
    if (mins < COOLDOWN_MINUTES) {
      return {
        status: 'cooldown',
        minutesSince: mins,
        nextAllowedInMinutes: Math.max(0, COOLDOWN_MINUTES - mins)
      };
    }
  }

  // Daily reset safety (already handled in loadState)
  if (state.date !== todayString()) {
    state.date = todayString();
    state.repliesDone = 0;
    state.postsDone = 0;
    state.seenTweetIds = [];
  }

  const action = chooseAction(state);
  if (action === 'none') {
    return { status: 'done', message: 'Daily quotas already met' };
  }

  try {
    if (action === 'reply') {
      const candidate = await fetchRandomTweetForReply({ seenIds: state.seenTweetIds });
      if (!candidate) {
        // Fallback to post if no tweet found
        const postText = sanitizeOutput(await generateOriginalPost(), 50);
        if (!postText || postText.length < 5) throw new Error('Empty post generated');
        const posted = await postTweet(postText);
        state.postsDone += 1;
        state.lastActionAt = now.toISOString();
        await saveState(state);
        return { status: 'posted', type: 'post', tweetId: posted?.id, text: postText };
      }

      const replyText = sanitizeOutput(await generateReplyForTweet(candidate.text), 50);
      if (!replyText || replyText.length < 5) throw new Error('Empty reply generated');
      const replied = await replyToTweet(candidate.id, replyText);
      state.repliesDone += 1;
      state.seenTweetIds = Array.from(new Set([...(state.seenTweetIds || []), candidate.id])).slice(-500);
      state.lastActionAt = now.toISOString();
      await saveState(state);
      return { status: 'posted', type: 'reply', tweetId: replied?.id, inReplyTo: candidate.id, text: replyText };
    }

    if (action === 'post') {
      const postText = sanitizeOutput(await generateOriginalPost(), 50);
      if (!postText || postText.length < 5) throw new Error('Empty post generated');
      const posted = await postTweet(postText);
      state.postsDone += 1;
      state.lastActionAt = now.toISOString();
      await saveState(state);
      return { status: 'posted', type: 'post', tweetId: posted?.id, text: postText };
    }

    // Should not reach
    return { status: 'noop' };
  } catch (error) {
    console.error('Bot action failed:', error?.message || error, error?.stack);
    return { status: 'error', message: String(error?.message || error) };
  }
} 