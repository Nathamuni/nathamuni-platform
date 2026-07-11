/**
 * Weekly GitHub public-stats snapshot -> lib/github.json
 * Public API, no token needed. Fails soft: on any API problem the previous
 * committed snapshot stays in place and the site keeps building.
 */
import { writeFileSync } from 'node:fs'

const USER = 'Nathamuni'
const HEADERS = { 'User-Agent': 'nathamuni.com-stats' }

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

try {
  const [user, repos] = await Promise.all([
    getJson(`https://api.github.com/users/${USER}`),
    getJson(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`),
  ])
  if (!user.login || !Array.isArray(repos)) throw new Error('unexpected API shape')

  const own = repos.filter((r) => !r.fork)
  const data = {
    login: user.login,
    url: user.html_url,
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars: own.reduce((a, r) => a + r.stargazers_count, 0),
    topRepos: own
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4)
      .map((r) => ({
        name: r.name,
        stars: r.stargazers_count,
        description: r.description,
        url: r.html_url,
        language: r.language,
      })),
    fetchedAt: new Date().toISOString().slice(0, 10),
  }
  writeFileSync(new URL('../lib/github.json', import.meta.url), JSON.stringify(data, null, 2) + '\n')
  console.log(`github.json updated: ${data.publicRepos} repos, ${data.totalStars} stars, ${data.followers} followers`)
} catch (err) {
  console.warn(`github stats skipped (${err.message}) — keeping previous snapshot`)
}
