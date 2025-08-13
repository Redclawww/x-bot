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

function resolveBlobsOptions() {
  const siteID = process.env.BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.BLOBS_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;
  if (siteID && token) {
    return { siteID, token };
  }
  return undefined;
}

function getBlobsStore() {
  const options = resolveBlobsOptions();
  if (options) return getStore(STORE_NAME, options);
  return getStore(STORE_NAME);
}

export async function loadState() {
  const store = getBlobsStore();
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
  const store = getBlobsStore();
  await store.set(STATE_KEY, JSON.stringify(state), { contentType: 'application/json' });
}

export async function updateState(updater) {
  const current = await loadState();
  const next = await updater(current);
  await saveState(next);
  return next;
} 