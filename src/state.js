import { getStore } from '@netlify/blobs';
import { todayString } from './utils.js';

const STORE_NAME = 'bot-state-store';
const STATE_KEY = 'state.json';

function defaultState() {
  return {
    date: todayString(),
    repliesDone: 0,
    postsDone: 0,
    seenTweetIds: [],
    lastActionAt: null
  };
}

export async function loadState() {
  const store = getStore(STORE_NAME);
  const state = await store.get(STATE_KEY, { type: 'json' });
  if (!state) return defaultState();
  // Reset if the day changed
  const today = todayString();
  if (state.date !== today) {
    return { ...defaultState(), date: today };
  }
  // Ensure shape
  return {
    ...defaultState(),
    ...state,
    date: today
  };
}

export async function saveState(state) {
  const store = getStore(STORE_NAME);
  await store.set(STATE_KEY, JSON.stringify(state), { contentType: 'application/json' });
}

export async function updateState(updater) {
  const current = await loadState();
  const next = await updater(current);
  await saveState(next);
  return next;
} 