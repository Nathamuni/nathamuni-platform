// One-off probe: what does the Instagram-login token return? Prints metric names + numbers only.
import { readFileSync } from 'node:fs'
const T = process.env.IG_ACCESS_TOKEN
const API = 'https://graph.instagram.com/v21.0'
if (!T) { console.log('no token'); process.exit(0) }
const videos = JSON.parse(readFileSync('lib/videos.json', 'utf8'))
const target = videos.find((v) => v.publishedDate === '2026-11-07' && v.mediaType === 'reel' && /Priya/.test(v.title))
const code = target?.instagramUrl.match(/\/(?:reel|p)\/([^/]+)/)?.[1]
console.log('target shortcode:', code)

async function get(path, label) {
  const sep = path.includes('?') ? '&' : '?'
  try {
    const r = await fetch(`${API}${path}${sep}access_token=${T}`)
    const j = await r.json()
    if (j.error) return console.log(`✗ ${label}: ${j.error.code}/${j.error.error_subcode ?? '-'} ${j.error.message}`)
    return j
  } catch (e) { console.log(`✗ ${label}: ${String(e.message).replaceAll(T, '***')}`) }
}
const show = (label, j) => j && console.log(`✓ ${label}:`, JSON.stringify(j.data ?? j).slice(0, 700))

const list = await get('/me/media?fields=id,permalink,timestamp,media_product_type&limit=50', 'media list')
const hit = list?.data?.find((m) => code && m.permalink.includes(code))
console.log('media found:', !!hit, 'timestamp (full):', hit?.timestamp)
if (hit) {
  for (const m of ['reach','views','saved','shares','follows','profile_visits','total_interactions','ig_reels_avg_watch_time','ig_reels_video_view_total_time','profile_activity']) {
    show(`media ${m}`, await get(`/${hit.id}/insights?metric=${m}`, `media ${m}`))
  }
  show('media reach by follow_type', await get(`/${hit.id}/insights?metric=reach&breakdown=follow_type`, 'media reach follow_type'))
  show('media views by follow_type', await get(`/${hit.id}/insights?metric=views&breakdown=follow_type`, 'media views follow_type'))
  show('media views by source', await get(`/${hit.id}/insights?metric=views&breakdown=media_product_type`, 'media views by product'))
}
show('user online_followers', await get('/me/insights?metric=online_followers&period=lifetime', 'online_followers'))
show('user follower_demographics country', await get('/me/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=country', 'demographics country'))
show('user follower_demographics age', await get('/me/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=age', 'demographics age'))
show('user reach by follow_type', await get('/me/insights?metric=reach&period=day&metric_type=total_value&breakdown=follow_type', 'user reach follow_type'))
show('user follows_and_unfollows', await get('/me/insights?metric=follows_and_unfollows&period=day&metric_type=total_value&breakdown=follow_type', 'follows_and_unfollows'))
