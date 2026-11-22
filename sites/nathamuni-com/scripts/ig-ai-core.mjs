// Pure prompt builders + renderers for the AI features (/ideas daily pack, /idea live rating).
// Gemini sees a compact summary of the account's real numbers and words — never raw files.

import { median, ageDays, escapeHtml, fmt, WEEKLY_MIX } from './ig-report-core.mjs'

const sc = (url) => (url ?? '').split(/[?#]/)[0].replace(/\/$/, '').split('/').pop()
export const IDEAS_MODEL = 'gemini-3.5-flash'
export const RATE_MODEL = 'gemini-3.5-flash-lite'
export const RATE_DAILY_CAP = 10

/** Compact, factual account summary for the prompt (~2-3k tokens). */
export function accountContext(videos, transcripts, history, today) {
  const recent = videos
    .filter((v) => v.publishedDate && Number.isFinite(v.views))
    .map((v) => ({ ...v, age: ageDays(v.publishedDate, today) }))
    .filter((v) => v.age >= 2 && v.age <= 120)
  const shareRate = (v) => (v.reach ? v.shares / v.reach : 0)
  const line = (v) => {
    const t = transcripts[sc(v.instagramUrl)]
    const said = t?.status === 'ok' ? ` | opened: "${(t.hook ?? '').slice(0, 120)}" | about: "${(t.english ?? '').slice(0, 220)}"` : ''
    return `- [${v.category}] "${v.title}" ${fmt(v.views)} views, ${(shareRate(v) * 100).toFixed(2)}% shared, ${Math.round((v.avgWatchTimeMs ?? 0) / 1000)}s watched${said}`
  }
  const top = [...recent].sort((a, b) => b.views - a.views).slice(0, 10)
  const shared = [...recent].sort((a, b) => shareRate(b) - shareRate(a)).filter((v) => !top.includes(v)).slice(0, 4)
  const weak = [...recent].sort((a, b) => a.views - b.views).slice(0, 4)
  const cats = {}
  for (const v of recent) (cats[v.category] ??= []).push(v.views)
  const catLines = Object.entries(cats)
    .map(([c, vs]) => `- ${c}: median ${fmt(median(vs))} views over ${vs.length} posts`)
    .join('\n')
  const followers = [...history].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.followers
  return `ACCOUNT: @nathamuni_ — Tamil creator from Tamil Nadu, ~${followers ?? '12k'} followers, goal 50k.
Speaks Tanglish. Audience: 60% Tamil, 34% English speakers; mostly 18-34. Follower peak 6-9 pm IST.
What drives growth here: shares and watch time. A calisthenics reel (123k views, ~2k shares) and a Tamil humor reel drove +4.5k followers in 10 days.
Weekly mix target: ${Object.entries(WEEKLY_MIX).map(([c, n]) => `${c} ${n}`).join(', ')}.

CATEGORY MEDIANS (last 120 days):
${catLines}

TOP REELS:
${top.map(line).join('\n')}

MOST SHARED (others):
${shared.map(line).join('\n')}

WEAKEST:
${weak.map(line).join('\n')}`
}

export const IDEAS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    ideas: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          category: { type: 'STRING', enum: Object.keys(WEEKLY_MIX) },
          why: { type: 'STRING' },
          hook_tanglish: { type: 'STRING' },
          hook_english: { type: 'STRING' },
          beats: { type: 'ARRAY', items: { type: 'STRING' } },
          caption: { type: 'STRING' },
          hashtags: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['title', 'category', 'why', 'hook_tanglish', 'hook_english', 'beats', 'caption', 'hashtags'],
      },
    },
  },
  required: ['ideas'],
}

export function ideasPrompt(context, today) {
  return `You are a short-form video strategist for this Instagram creator. Today is ${today}.

${context}

Write 5 NEW reel ideas for the next week. Rules:
- Each idea must be filmable by one person with a phone in under 1 hour. No big productions.
- Lean on what already works for THIS account (the top and most-shared reels above), but do not repeat a reel verbatim.
- At least 2 ideas from the category furthest below its weekly target; at least 1 Humor & Tamil.
- Optimise for shares (something people send to a friend) and for watch time (a payoff at the end).
- hook_tanglish: the first sentence he says, in natural Tanglish written in English letters (how he talks). Under 15 words.
- hook_english: the same hook in English.
- beats: 3 short beats (hook → middle → payoff).
- caption: Tamil line + English line, friendly, under 220 characters, ending with a question or a tag-a-friend line.
- hashtags: 5, no # sign, mix Tamil-audience and topic tags.
- why: one sentence pointing to the specific data above that supports the idea.`
}

export const RATING_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER' },
    verdict: { type: 'STRING' },
    why: { type: 'STRING' },
    better_angle: { type: 'STRING' },
    hook_tanglish: { type: 'STRING' },
    hook_english: { type: 'STRING' },
    caption: { type: 'STRING' },
  },
  required: ['score', 'verdict', 'why', 'better_angle', 'hook_tanglish', 'hook_english', 'caption'],
}

export function ratingPrompt(context, idea) {
  return `You are a blunt short-form video strategist for this Instagram creator.

${context}

He is considering this reel idea:
"""${idea.slice(0, 600)}"""

Rate it for THIS account (score 1-10) based on the data above: will it get shares and watch time with his audience?
- verdict: 3-6 words.
- why: 1-2 sentences, cite the data.
- better_angle: one concrete change that would make it stronger.
- hook_tanglish: a better opening line in Tanglish (English letters), under 15 words. hook_english: same in English.
- caption: Tamil line + English line, under 220 characters.`
}

export function renderIdeas(pack) {
  if (!pack?.ideas?.length) return 'No ideas yet — the first pack arrives with the next morning sync.'
  const lines = [`<b>💡 Reel ideas</b> <i>(${escapeHtml(pack.date ?? '')})</i>`]
  pack.ideas.forEach((i, n) => {
    lines.push(
      '',
      `<b>${n + 1}. ${escapeHtml(i.title)}</b> — ${escapeHtml(i.category)}`,
      `🎙 “${escapeHtml(i.hook_tanglish)}”`,
      `   <i>${escapeHtml(i.hook_english)}</i>`,
      `🎬 ${i.beats.map(escapeHtml).join(' → ')}`,
      `📝 ${escapeHtml(i.caption)}`,
      `#️⃣ ${i.hashtags.map((h) => '#' + escapeHtml(h.replace(/^#/, ''))).join(' ')}`,
      `📊 ${escapeHtml(i.why)}`,
    )
  })
  return lines.join('\n')
}

/** One-idea teaser for the morning report / evening nudge. */
export function renderIdeaTeaser(pack) {
  const i = pack?.ideas?.[0]
  if (!i) return null
  return `💡 <b>Idea:</b> ${escapeHtml(i.title)}\n   🎙 “${escapeHtml(i.hook_tanglish)}”\n   /ideas for 4 more`
}

export function renderRating(r, idea) {
  const stars = '★'.repeat(Math.max(0, Math.min(10, r.score))) + '☆'.repeat(10 - Math.max(0, Math.min(10, r.score)))
  return [
    `<b>🧪 ${escapeHtml(idea.slice(0, 80))}</b>`,
    `${stars} <b>${r.score}/10</b> — ${escapeHtml(r.verdict)}`,
    '',
    escapeHtml(r.why),
    '',
    `<b>Make it stronger:</b> ${escapeHtml(r.better_angle)}`,
    `<b>Hook:</b> “${escapeHtml(r.hook_tanglish)}”`,
    `   <i>${escapeHtml(r.hook_english)}</i>`,
    `<b>Caption:</b> ${escapeHtml(r.caption)}`,
  ].join('\n')
}
