import dietData from './diet.json'

/**
 * The diet plugin on /diet. lib/diet.json is written by scripts/diet-release.mjs from
 * each zip's own plugin.json + README — do not hand-edit released versions (old
 * download links must keep meaning the same file). Install steps below are hand-written.
 */

export interface DietFile {
  path: string
  bytes: number
}

export interface DietRelease {
  version: string
  date: string
  name: string
  displayName: string
  developerName: string
  shortDescription: string
  description: string
  prompts: string[]
  hasSkill: boolean
  file: string
  bytes: number
  sha256: string
  files: DietFile[]
  notes: { title: string; text: string } | null
}

/** Newest first. */
export function getDietReleases(): DietRelease[] {
  return (dietData as { releases: DietRelease[] }).releases
}

export function getLatestDiet(): DietRelease | null {
  return getDietReleases()[0] ?? null
}

/** The permanent link that always downloads the newest version (worker/diet.mjs). */
export const DIET_LATEST_URL = '/diet/latest.zip'

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDietDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Folder that holds SKILL.md inside the zip, e.g. "skills/nathamuni/" ('' at the root). */
export function skillFolder(release: DietRelease): string {
  const skill = release.files.find((f) => f.path === 'SKILL.md' || f.path.endsWith('/SKILL.md'))
  return skill ? skill.path.slice(0, -'SKILL.md'.length) : ''
}

export interface InstallStep {
  text: string
  /** Screenshot under the step. Files go in public/images/diet/ (crop out private chat titles). */
  shot?: { src: string; alt: string; width: number; height: number }
  /** Text the visitor copies (shown with a Copy button). */
  copy?: string
}

export interface InstallGuide {
  id: 'chatgpt' | 'claude' | 'other'
  label: string
  intro: string
  steps: InstallStep[]
}

/** Install guides. `release` fills in the plugin's real name and file paths. */
export function getInstallGuides(release: DietRelease): InstallGuide[] {
  const name = release.displayName
  const folder = skillFolder(release)
  return [
    {
      id: 'chatgpt',
      label: 'ChatGPT',
      intro: 'Installs as a plugin, so you can call it by name in any chat.',
      steps: [
        { text: 'Download the zip above. Do not unzip it.' },
        { text: 'Open chatgpt.com and click **Plugins** in the left sidebar.' },
        { text: 'Click **Add** at the top right. A **New Plugin** window opens.' },
        {
          text: 'Drag the zip into the box, or click **click to upload** and pick it. Then click **Add plugin**.',
          shot: { src: '/images/diet/chatgpt-add-plugin.webp', alt: 'ChatGPT New Plugin window with the upload box and the Add plugin button', width: 1020, height: 560 },
        },
        {
          text: `When ChatGPT shows “${name} plugin installed”, click **Try in chat**, or tap one of the starter prompts.`,
          shot: { src: '/images/diet/chatgpt-installed.webp', alt: 'ChatGPT plugin page after install, with the Try in chat button and four starter prompts', width: 770, height: 590 },
        },
        {
          text: `In any new chat, type **@${name}** and then your question.`,
          copy: `@${name} ${release.prompts[0] ?? ''}`.trim(),
          shot: { src: '/images/diet/chatgpt-mention.webp', alt: 'ChatGPT message box with the plugin mentioned by name before a question', width: 790, height: 150 },
        },
      ],
    },
    {
      id: 'claude',
      label: 'Claude',
      intro: 'Installs as a plugin. Claude uses it on its own whenever you ask about food or nutrition.',
      steps: [
        { text: 'Download the zip above. Do not unzip it.' },
        { text: 'Open claude.ai and click **Plugins** in the left sidebar.' },
        {
          text: 'Click **Add** at the top right, then **Upload plugin**.',
          shot: { src: '/images/diet/claude-add-menu.webp', alt: 'Claude Plugins page with the Add menu open and Upload plugin at the top', width: 1000, height: 290 },
        },
        {
          text: 'Drag the zip into the **Plugin file** box, or click **browse** and pick it. Then click **Upload**.',
          shot: { src: '/images/diet/claude-upload.webp', alt: 'Claude Upload a plugin page with the Plugin file drop box and Upload button', width: 1000, height: 480 },
        },
        {
          text: `${name} now shows under **Your plugins**. Start a new chat and ask about your diet. You do not need to type a special command.`,
          copy: release.prompts[0],
        },
      ],
    },
    {
      id: 'other',
      label: 'Any other AI',
      intro: 'Gemini, Copilot, Perplexity, or any chat app that accepts file attachments.',
      steps: [
        { text: 'Download the zip above and unzip it.' },
        {
          text: `Start a new chat and attach **${folder}SKILL.md** plus every file in **${folder}references/**.`,
        },
        {
          text: 'Send this as your first message:',
          copy: `Follow the instructions in the attached SKILL.md and its reference files for this whole conversation. You are Nathamuni from ${name}.`,
        },
        {
          text: 'To keep it for every chat, paste the text of SKILL.md into the app’s saved instructions (a Gemini Gem, a Copilot agent, or a project) instead.',
        },
      ],
    },
  ]
}

/** From the plugin README. */
export const DIET_DISCLAIMER =
  'This plugin gives general nutrition education. It is not medical advice and does not diagnose or treat any condition. If you have a medical condition, are pregnant or breastfeeding, or are buying supplements for children, talk to a qualified healthcare professional.'
