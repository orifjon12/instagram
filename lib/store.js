// Upstash Redis (yoki Vercel KV) bilan ishlash — REST orqali
// Env: KV_REST_API_URL/TOKEN yoki UPSTASH_REDIS_REST_URL/TOKEN
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  if (!URL || !TOKEN) {
    throw new Error("Baza sozlanmagan: Vercel'da Upstash Redis ulang va env o'zgaruvchilarni qo'shing");
  }
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

module.exports = { redis };
