#!/usr/bin/env node
/**
 * Build-time thumbnail optimisation.
 *
 * Source of truth is assets/thumbnails/<shortcode>.jpg — full-resolution originals
 * written by scripts/instagram-sync.mjs. Those are git-tracked but NOT deployed.
 *
 * This emits into public/images/thumbnails/ (gitignored, regenerated each build):
 *   <shortcode>.webp  540w  — what browsers actually download
 *   <shortcode>.jpg   540w  — OG/JSON-LD + ancient-browser fallback
 *
 * Why both: lib/videos.json stores `/images/thumbnails/<sc>.jpg` and that path is
 * used for openGraph images and VideoObject.thumbnailUrl. Social scrapers handle
 * WebP inconsistently (LinkedIn especially), so the JPEG must keep existing at the
 * recorded path. Modern browsers take the WebP via <picture>, so the JPEG costs
 * deploy space but ~zero user bytes.
 *
 * Cards render at ~270px CSS wide at most (4-col grid inside max-w-6xl), so 540w
 * covers 2x DPR with no visible loss. Originals run up to 1440w — measured 17.7MB
 * total, down to ~5MB of WebP after this.
 *
 * Incremental: skips regeneration when the output is newer than its source.
 */
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(SITE_ROOT, 'assets', 'thumbnails')
const OUT_DIR = path.join(SITE_ROOT, 'public', 'images', 'thumbnails')
// Story posters can't move out of public/ — the .mp4 they sit beside must stay
// served — so WebP siblings are written in place and gitignored.
const STORIES_DIR = path.join(SITE_ROOT, 'public', 'stories')

const WIDTH = 540
const WEBP_QUALITY = 76
const JPEG_QUALITY = 78

function isStale(src, out) {
  if (!fs.existsSync(out)) return true
  return fs.statSync(src).mtimeMs > fs.statSync(out).mtimeMs
}

async function main() {
  // public/images/thumbnails/ is generated, so if this script cannot do its job the
  // build MUST fail rather than emit a site with no thumbnails. A failed build is
  // safe — Cloudflare keeps serving the previous successful deploy.
  if (!fs.existsSync(SRC_DIR)) {
    console.error(
      `optimize-thumbnails: source dir missing: ${SRC_DIR}\n` +
        'Originals are git-tracked; restore with: git checkout -- assets/thumbnails'
    )
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const sources = fs.readdirSync(SRC_DIR).filter((f) => /\.jpe?g$/i.test(f))
  if (sources.length === 0) {
    console.error('optimize-thumbnails: no source thumbnails found in assets/thumbnails/')
    process.exit(1)
  }

  let built = 0
  let skipped = 0
  let failed = 0
  let bytesIn = 0
  let bytesOut = 0

  for (const file of sources) {
    const shortcode = file.replace(/\.jpe?g$/i, '')
    const src = path.join(SRC_DIR, file)
    const webpOut = path.join(OUT_DIR, `${shortcode}.webp`)
    const jpegOut = path.join(OUT_DIR, `${shortcode}.jpg`)

    bytesIn += fs.statSync(src).size

    if (!isStale(src, webpOut) && !isStale(src, jpegOut)) {
      skipped++
      bytesOut += fs.statSync(webpOut).size + fs.statSync(jpegOut).size
      continue
    }

    try {
      const resized = () => sharp(src).resize({ width: WIDTH, withoutEnlargement: true })
      await resized().webp({ quality: WEBP_QUALITY }).toFile(webpOut)
      await resized().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(jpegOut)
      bytesOut += fs.statSync(webpOut).size + fs.statSync(jpegOut).size
      built++
    } catch (err) {
      // A single corrupt source must not fail the whole build; the card falls back
      // to PlaceholderArt when the file is absent.
      console.error(`optimize-thumbnails: FAILED ${file}: ${err.message}`)
      failed++
    }
  }

  const mb = (n) => (n / 1048576).toFixed(1)
  console.log(
    `optimize-thumbnails: ${built} built, ${skipped} cached, ${failed} failed — ` +
      `${mb(bytesIn)}MB source -> ${mb(bytesOut)}MB emitted`
  )

  // Any failure means at least one card would render a broken image. Fail the build.
  if (failed > 0) {
    console.error(`optimize-thumbnails: ${failed} thumbnail(s) failed — refusing to build.`)
    process.exit(1)
  }

  // Every source must have produced both outputs, or the deploy is incomplete.
  const emitted = fs.readdirSync(OUT_DIR)
  const webpCount = emitted.filter((f) => f.endsWith('.webp')).length
  if (webpCount < sources.length) {
    console.error(
      `optimize-thumbnails: expected ${sources.length} .webp, found ${webpCount} — refusing to build.`
    )
    process.exit(1)
  }

  await optimiseStoryPosters()
}

/**
 * Story posters are what /moments and the homepage strip actually download
 * (the .mp4 beside them is preload="none", so it never transfers until tapped).
 * Emits <id>.webp next to the existing <id>.jpg, leaving the JPEG authoritative
 * for lib/stories.json and the <video poster> attribute.
 */
async function optimiseStoryPosters() {
  if (!fs.existsSync(STORIES_DIR)) return

  const posters = fs.readdirSync(STORIES_DIR).filter((f) => /\.jpe?g$/i.test(f))
  let built = 0
  let skipped = 0
  let failed = 0
  let bytesIn = 0
  let bytesOut = 0

  for (const file of posters) {
    const src = path.join(STORIES_DIR, file)
    const out = path.join(STORIES_DIR, file.replace(/\.jpe?g$/i, '.webp'))
    bytesIn += fs.statSync(src).size

    if (!isStale(src, out)) {
      skipped++
      bytesOut += fs.statSync(out).size
      continue
    }
    try {
      await sharp(src)
        .resize({ width: WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(out)
      bytesOut += fs.statSync(out).size
      built++
    } catch (err) {
      console.error(`optimize-thumbnails: FAILED poster ${file}: ${err.message}`)
      failed++
    }
  }

  const mb = (n) => (n / 1048576).toFixed(1)
  console.log(
    `optimize-thumbnails: story posters — ${built} built, ${skipped} cached, ${failed} failed — ` +
      `${mb(bytesIn)}MB source -> ${mb(bytesOut)}MB emitted`
  )

  // Thumbnail advertises the derived .webp unconditionally, so a silently skipped
  // poster would ship a <source> pointing at a file that does not exist.
  if (failed > 0) {
    console.error(`optimize-thumbnails: ${failed} story poster(s) failed — refusing to build.`)
    process.exit(1)
  }
}

await main()
