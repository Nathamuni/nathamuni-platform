// Minimal Gemini JSON call, usable from Node (GitHub job) and the Cloudflare Worker (fetch only).
// Free tier: limits are per project and per model, small and unpublished, so callers keep
// their own daily caps. A daily-quota 429 throws an error with .quota = true.

const API = 'https://generativelanguage.googleapis.com/v1beta/models'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function geminiJson({ key, model, prompt, schema, temperature = 0.7, retries = 3 }) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature },
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (res.ok) {
      const text = body.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Gemini returned no content')
      return JSON.parse(text)
    }
    const msg = body.error?.message ?? `HTTP ${res.status}`
    if (res.status === 429 && /per.?day|daily/i.test(JSON.stringify(body))) {
      const e = new Error('Gemini daily limit reached')
      e.quota = true
      throw e
    }
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(Math.min(20000, 3000 * 2 ** attempt))
      continue
    }
    throw new Error(`Gemini: ${msg.slice(0, 160)}`)
  }
}
