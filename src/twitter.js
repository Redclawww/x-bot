import { TwitterApi } from 'twitter-api-v2';
import { randomChoice, shuffle } from './utils.js';

function getClient() {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error('Missing Twitter credentials');
  }
  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
}

export async function postTweet(text) {
  const client = getClient();
  const res = await client.v2.tweet(text);
  return res?.data;
}

export async function replyToTweet(tweetId, text) {
  const client = getClient();
  const res = await client.v2.reply(text, tweetId);
  return res?.data;
}

const DEFAULT_QUERIES = [
  'today', 'interesting', 'why', 'because', 'curious', 'disagree', 'agreed',
  'learned', 'story', 'lol', 'hmm', 'idea', 'tip', 'news', 'random', 'thought',
  'tech', 'science', 'art', 'music', 'books', 'writing', 'sports', 'health',
  'startup', 'career', 'life'
];

export async function fetchRandomTweetForReply({
  queries = DEFAULT_QUERIES,
  lang = process.env.BOT_LANG || 'en',
  excludeAuthorHandle = process.env.BOT_USERNAME || '',
  seenIds = []
} = {}) {
  const client = getClient();
  const term = randomChoice(queries);
  const filters = [
    `lang:${lang}`,
    '-is:retweet',
    '-is:reply',
    '-is:quote',
    '-has:hashtags',
    '-has:links'
  ].join(' ');
  const query = `${term} ${filters}`.trim();

  const search = await client.v2.search(query, {
    max_results: 50,
    'tweet.fields': ['lang', 'author_id', 'created_at', 'public_metrics', 'referenced_tweets', 'entities'].join(','),
    expansions: ['author_id'].join(','),
    'user.fields': ['username', 'name', 'public_metrics'].join(',')
  });

  const tweets = [];
  for await (const tweet of search) {
    tweets.push(tweet);
  }

  const usersById = new Map(search?.includes?.users?.map((u) => [u.id, u]) || []);

  const filtered = shuffle(tweets).filter((t) => {
    if (!t || !t.id || !t.text) return false;
    if (seenIds.includes(t.id)) return false;
    const author = usersById.get(t.author_id);
    if (excludeAuthorHandle && author && author.username && author.username.toLowerCase() === excludeAuthorHandle.toLowerCase()) {
      return false;
    }
    // Keep it simple: allow most tweets; further filtering could be added here
    return true;
  });

  const choice = filtered[0];
  if (!choice) return null;

  return {
    id: choice.id,
    text: choice.text,
    authorId: choice.author_id,
    authorUsername: usersById.get(choice.author_id)?.username
  };
} 