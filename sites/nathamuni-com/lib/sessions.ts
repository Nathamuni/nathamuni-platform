/**
 * Sessions — bounded, guided protocols you RUN, not read.
 *
 * Distinct from courses (which you learn): a session has explicit steps,
 * metrics to track, checkpoints, a start and an end. Same credibility
 * labels used sitewide: 'tested' (☬ tested on himself first), 'research'
 * (research-backed, must carry a live-verified reference), 'standard'
 * (established guidance framed as a starting point — confirm with a
 * professional). Every session page must render the disclaimer:
 * "This is my tested process, not medical advice."
 */

export type CredibilityLabel = 'tested' | 'research' | 'standard'

export interface StepReference {
  label: string
  url: string
}

/** A concrete good/bad contrast for a step, grounded in its real content. */
export interface StepExample {
  good: string
  bad: string
}

export interface Step {
  title: string
  label: CredibilityLabel
  /** 60–140 words, his voice: direct, concrete, zero guru-speak. */
  detail: string
  /** How you know this step is done. */
  checkpoint: string
  reference?: StepReference
  /** Optional good/bad pair, rendered as a two-card contrast under the detail. */
  example?: StepExample
}

export interface Metric {
  name: string
  how: string
  cadence: string
}

/**
 * One block of time on a session's timeline — maps a span of days/weeks
 * onto the step(s) that happen during it. Derived from the steps' own
 * text, never a new claim: every step index must appear in exactly one
 * phase across a session's timeline.
 */
export interface TimelinePhase {
  /** Short phase name, e.g. 'Week 1' or 'Before you start'. */
  phase: string
  /** Small-caps span label, e.g. 'Days 1–7'. */
  span: string
  /** Inclusive 1-indexed calendar-day range this phase covers. Omit for
   *  "ongoing / after every session" phases that have no fixed window. */
  days?: [number, number]
  /** One line: what happens in this phase. */
  focus: string
  /** Zero-based indexes into this session's `steps` covered by this phase. */
  stepIndexes: number[]
}

export interface Session {
  slug: string
  title: string
  /** One line: what running this session gets you. */
  promise: string
  /** e.g. '4 weeks' */
  durationLabel: string
  forWhom: string
  hue: number
  metrics: Metric[]
  steps: Step[]
  /** When each step happens, mapped onto the session's real duration. */
  timeline: TimelinePhase[]
  relatedVideoIds?: string[]
  relatedBlogSlugs?: string[]
  /** Show the BMI + protein "Your numbers" card on this session's page. */
  healthTools?: boolean
}

/** DOM anchor id for a step's card — used by SessionFlow to scroll-link into StepTracker. */
export function stepAnchorId(slug: string, index: number): string {
  return `step-${slug}-${index}`
}

const SESSIONS: Session[] = [
  {
    slug: 'diet-reset',
    title: 'Diet Reset',
    promise: 'Stop guessing what to eat. Get a number, then hit it, every day, for a month.',
    durationLabel: '4 weeks',
    healthTools: true,
    forWhom: 'Anyone starting from zero on food. No diet history, no baseline, just guesswork.',
    hue: 38,
    metrics: [
      {
        name: 'Bodyweight',
        how: 'Same scale, same time. First thing after waking, before food or water.',
        cadence: 'Daily, morning',
      },
      {
        name: 'Protein (grams)',
        how: "Log every meal in an app or notebook; add it up at the day's end.",
        cadence: 'Daily',
      },
      {
        name: 'Sleep hours',
        how: 'Time from lights-off to alarm, tracked by phone or a watch.',
        cadence: 'Daily',
      },
      {
        name: 'Training sessions',
        how: 'Any session that raised your heart rate on purpose counts.',
        cadence: 'Weekly',
      },
    ],
    steps: [
      {
        title: 'Get a Baseline Blood Panel',
        label: 'standard',
        detail:
          "Before you change a single meal, get a number. Request a standard panel: CBC, lipid profile, fasting glucose or HbA1c, vitamin D, and B12. This isn't a diagnosis. It's a snapshot of where your body actually stands before you start pushing it around. Book it with a GP or a diagnostic lab; most run under a day. If anything sits outside the reference range, bring the results to a doctor. Don't self-interpret a flagged number into a diagnosis yourself. Skip this step and every later decision about protein, calories, and training load is a guess dressed up as a plan.",
        checkpoint: "The panel's back and you've read every number, flagged or not.",
        example: {
          good: 'Panel booked this week, every number read, flagged or not.',
          bad: "I'll get bloodwork done once things calm down.",
        },
      },
      {
        title: 'Log a Week, Change Nothing',
        label: 'standard',
        detail:
          "For seven days, eat exactly like you normally do. Same food, same timing, same portions. Just write it down: every meal, every snack, roughly what and how much. Don't reach for 'healthier' options because you're being watched by yourself. That defeats the point. This week isn't about improvement. It's about evidence. Most people who think they eat badly don't actually know what they eat. They know what they remember eating, and that's a kinder, less accurate dataset. Get the real one before you touch anything, or you'll end up optimizing a diet that never existed.",
        checkpoint: 'Seven full days are logged, including the days that felt embarrassing to write down.',
        example: {
          good: 'Wrote down the 9pm biryani and the missed breakfast, no edits.',
          bad: 'Logged the salad, skipped the ice cream because it felt embarrassing.',
        },
      },
      {
        title: 'Set a Protein Target, Swap Real Food',
        label: 'tested',
        detail:
          "Take your logged week and find your actual protein gap. Most people eating normally land far under target. I run a plant-based diet with precise protein tracking, and the fix was never supplements first. It was food: lentils, tofu, paneer, soy chunks, sprouted legumes, dairy if it fits you. Set a target around 1.6–2.2g per kg of bodyweight if you're training, and hit it with whole food before you reach for a powder. Swap one low-protein staple a day for a higher-protein one, same meal slot, different ingredient. This is the step people skip. Then they wonder why nothing changed.",
        checkpoint: "You've hit your protein number on at least 5 of 7 days this week.",
        example: {
          good: '70g protein hit by dinner, logged in 20 seconds.',
          bad: "I'll try to eat healthier this week.",
        },
      },
      {
        title: 'Run Weekly Checkpoints',
        label: 'tested',
        detail:
          "Every seven days, sit down for five minutes and check three things: where your bodyweight is trending, how your energy feels through the day, and whether your training performance moved up, down, or flat. Not a mood check. A numbers check. This is the same discipline I run on every long progression: don't judge a system by one good or one bad day. Judge it by the trend line across a full week. If two of three are flat or dropping past week two, that's your signal to adjust the target, not to panic and overhaul the whole plan.",
        checkpoint: "You've completed four consecutive weekly checkpoints, logged, not just remembered.",
        example: {
          good: 'Bodyweight flat, energy up, one more heavy set done. Kept the plan as is.',
          bad: 'Felt great Tuesday, terrible Thursday, called the whole week a failure.',
        },
      },
      {
        title: 'Re-Test What Matters',
        label: 'standard',
        detail:
          "After 8–12 weeks of consistent tracking, go back and re-test whatever was off in your baseline panel: vitamin D, lipids, glucose, whichever number needed attention. This closes the loop. You didn't just feel different, you can show a number moved. Bring both panels to a professional and let them read the trend, especially anything touching blood sugar or lipids. That's not a call to make alone off a spreadsheet. If nothing was flagged originally, re-testing is optional, but the bodyweight and protein logs you've kept are still your proof either way.",
        checkpoint: 'You have a second panel (or 12 weeks of logs) to compare against day one.',
        example: {
          good: 'Second panel booked for week 10, same lab, same time of day as the first.',
          bad: 'Assumed it worked because the scale looked different.',
        },
      },
    ],
    timeline: [
      {
        phase: 'Before you start',
        span: 'Day 0',
        days: [1, 1],
        focus: 'Get the baseline blood panel booked and read.',
        stepIndexes: [0],
      },
      {
        phase: 'Week 1',
        span: 'Week 1',
        days: [2, 8],
        focus: 'Log exactly what you already eat. Change nothing yet.',
        stepIndexes: [1],
      },
      {
        phase: 'Weeks 2–4',
        span: 'Weeks 2–4',
        days: [9, 28],
        focus: 'Hit your protein target and run the weekly checkpoint.',
        stepIndexes: [2, 3],
      },
      {
        phase: 'After the reset',
        span: 'Weeks 8–12',
        days: [50, 84],
        focus: 'Re-test what was flagged and compare against day one.',
        stepIndexes: [4],
      },
    ],
    relatedVideoIds: [
      'self-experience-facts-free',
      'ask-me-for-personal-tips',
      'thanks-for-viewing',
      'busy-but-delivered',
    ],
  },
  {
    slug: 'unlock-your-body',
    title: 'Unlock Your Body',
    promise: 'Fifteen minutes a day makes your body functional again. Not flexible for show. Flexible for life.',
    durationLabel: '3 weeks',
    forWhom: "Anyone stiff from sitting, lifting, or ignoring their own body for years.",
    hue: 152,
    metrics: [
      {
        name: 'Morning stiffness',
        how: 'Rate 1–10 the second you get out of bed, before moving around.',
        cadence: 'Daily, on waking',
      },
      {
        name: 'Toe-touch distance',
        how: 'Stand, reach for your toes, measure the gap (or overlap) in cm.',
        cadence: 'Weekly',
      },
      {
        name: 'Sitting hours',
        how: 'Rough tally of hours spent seated: desk, commute, couch.',
        cadence: 'Daily',
      },
    ],
    steps: [
      {
        title: 'Run the Daily 15-Minute Protocol (Part 1)',
        label: 'tested',
        detail:
          "Start with my Part 1 flexibility routine, the beginner full-body sequence built to relieve back pain, neck pain, and general stiffness from a body that's been sitting still too long. Fifteen minutes, same time each day, ideally right after waking or right before you'd otherwise sit down for hours. Don't force any stretch into pain. Functional range comes from repetition, not from forcing a position on day one. Weeks one and two are just this: show up daily, don't chase a deeper stretch every session. The routine does the work if you stop skipping it.",
        checkpoint: "You've run Part 1 daily for 14 straight days, even on the days you didn't feel stiff.",
        example: {
          good: 'Ran the 15 minutes Tuesday even though nothing felt stiff that morning.',
          bad: "Skipped it because I wasn't stiff today.",
        },
      },
      {
        title: 'Add Part 2 in Week Three',
        label: 'tested',
        detail:
          "Once the beginner routine feels automatic, layer in Part 2, the more advanced full-body sequence, for the final week. This doesn't replace Part 1. It extends the same daily 15 minutes into a slightly harder range now that your tissue has two weeks of consistent exposure behind it. Keep the same time slot, same non-negotiable daily habit, just a longer or deeper sequence. If a specific area still fights you, hips, hamstrings, shoulders, spend an extra minute there instead of rushing evenly through the whole flow.",
        checkpoint: 'Part 2 is folded into your daily routine for all seven days of week three.',
        example: {
          good: 'Layered Part 2 in on day 15, same 15-minute slot, nothing extra carved out.',
          bad: 'Jumped straight to Part 2 on day one because Part 1 felt too easy.',
        },
      },
      {
        title: 'Run the Post-Training Alignment Routine',
        label: 'tested',
        detail:
          "After any real strength session, run the alignment routine. It's the part almost nobody does. It targets hips, groin, and rotator cuff specifically, the joints that take the most compounding stress from lifting or calisthenics and get the least deliberate attention afterward. This isn't a feel-good cooldown. It's maintenance that keeps you training pain-free years from now instead of managing an old injury later. Run it directly after training, while the tissue is warm, not the next morning as an afterthought. This one habit alone prevented most of the joint issues I used to carry.",
        checkpoint: "Alignment work follows every training session this week, not just the ones where something already hurt.",
        example: {
          good: 'Ran hip and rotator cuff work straight after the lifting session, tissue still warm.',
          bad: "Skipped it because nothing hurt that day, again.",
        },
      },
      {
        title: 'Understand Why This Takes Weeks, Not Days',
        label: 'research',
        detail:
          "Flexibility work changes two different things on two different clocks. Range of motion, what you feel week to week, moves fast, often within days. The tendon and connective tissue underneath it moves far slower. A 2022 systematic review in Sports Medicine, pooling studies on tendon adaptation under load, found meaningful structural changes taking months, with some studies showing continued adaptation years into consistent training. That's the same tissue logic behind slow calisthenics progressions like the planche. Don't judge this protocol's daily flexibility gains against a tendon timeline. They're different systems moving at different speeds, and both are real.",
        checkpoint: "You can explain to someone else why day-3 looseness and month-3 mobility aren't the same thing.",
        reference: {
          label:
            'Mechanical, Material and Morphological Adaptations of Healthy Lower Limb Tendons to Mechanical Loading — Systematic Review & Meta-Analysis (Sports Medicine, 2022)',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9474511/',
        },
        example: {
          good: 'Kept training through the week-three plateau because the tendon clock runs slower than the stretch clock.',
          bad: "Quit on day ten because flexibility wasn't visibly better yet.",
        },
      },
    ],
    timeline: [
      {
        phase: 'Weeks 1–2',
        span: 'Weeks 1–2',
        days: [1, 14],
        focus: 'Run the daily 15-minute Part 1 routine, every day, no exceptions.',
        stepIndexes: [0],
      },
      {
        phase: 'Week 3',
        span: 'Week 3',
        days: [15, 21],
        focus: 'Layer in Part 2 on top of the same daily 15 minutes.',
        stepIndexes: [1],
      },
      {
        phase: 'Throughout',
        span: 'After every session',
        focus: 'Run the post-training alignment routine while tissue is still warm.',
        stepIndexes: [2],
      },
      {
        phase: 'After week 3',
        span: 'Ongoing',
        focus: "Understand why range of motion and tendon adaptation move on different clocks.",
        stepIndexes: [3],
      },
    ],
    relatedVideoIds: ['run-with-me', 'thanks-for-visiting', 'workout-anywhere-even-out-of-station'],
    relatedBlogSlugs: ['tendon-patience-why-planche-and-maltese-take-years'],
  },
  {
    slug: 'the-7-day-reset',
    title: 'The 7-Day Reset',
    promise: "One week. One deletion. One daily action you can't skip. That's the whole reset.",
    durationLabel: '1 week',
    healthTools: true,
    forWhom: 'Anyone whose life feels noisy and directionless and needs a hard restart, not a new app.',
    hue: 270,
    metrics: [
      {
        name: 'Streak days',
        how: 'Count consecutive days you completed the daily action, no gaps.',
        cadence: 'Daily',
      },
      {
        name: 'Daily action done (Y/N)',
        how: "One yes/no mark at the day's end. No partial credit.",
        cadence: 'Daily',
      },
      {
        name: 'Energy note',
        how: 'One line, evening, on how you actually felt. No essay.',
        cadence: 'Daily, evening',
      },
    ],
    steps: [
      {
        title: 'Make One Deletion',
        label: 'tested',
        detail:
          "Day one: remove one source of friction or noise from your life. A notification, an app, a habit that's quietly draining you, a person or feed that adds nothing. Not everything, one thing. The book's first-week concept starts here, because addition without subtraction just builds clutter on top of clutter. Pick the loudest source of noise you can name right now, and delete it: uninstall it, mute it, block it, whatever 'delete' means for that specific thing. Don't negotiate a smaller version of the deletion. The point of week one is proving you can remove something and survive it.",
        checkpoint: "The thing is actually gone. Not muted 'for now', not paused. Gone.",
        example: {
          good: 'Uninstalled the app Tuesday morning. Still uninstalled Friday.',
          bad: "Muted it 'for now' and reopened it by lunch.",
        },
      },
      {
        title: 'Pick One Non-Negotiable Daily Action',
        label: 'tested',
        detail:
          "Choose exactly one action you will do every single day of this week, no matter what. Make it small enough that skipping it has no excuse. Not a workout plan, not a full routine: one action. A walk, ten push-ups, ten pages, one cold shower, whatever matters to you right now. This is the book's core move: action before you feel ready, proven on a scale small enough that 'I don't feel like it' stops being a valid reason to skip. The size of the action matters less than the fact that it happens every day without negotiation.",
        checkpoint: 'The same one action has been done seven days running, same action, no substitutions.',
        example: {
          good: 'One rule: no phone until the first task is done.',
          bad: "I'll be more disciplined from now on.",
        },
      },
      {
        title: 'Run the Evening 2-Line Log',
        label: 'tested',
        detail:
          "Every evening, write exactly two lines: what you did today that mattered, and how you actually felt, not how you think you should have felt. This isn't a journal. It's an audit trail, short on purpose so you'll actually do it every night instead of skipping when you're tired. The two lines are what let you look back at day seven and see a week instead of a blur. Keep it in one place, a notes app or a physical notebook, so the seven entries sit together and the pattern is visible, not scattered.",
        checkpoint: 'Seven evenings, two lines each, sitting in one place you can scroll back through.',
        example: {
          good: 'Two lines, every night, even the night nothing went right.',
          bad: 'Skipped the log on the hard days, kept it only on the good ones.',
        },
      },
      {
        title: "Understand Why Day 7 Isn't 'Done'",
        label: 'research',
        detail:
          "A week won't make anything automatic. The research is clear on that. A widely cited 2010 study out of UCL tracked people building new habits and found it took a median of 66 days to reach near-automatic behaviour, with a range stretching from 18 to 254 days depending on the person and the habit. Seven days is a proof-of-concept, not a finish line. What matters is that this week shows the deletion didn't break anything and the daily action is survivable. That's proof you can carry into week two, not evidence you're now 'fixed'. Expect to keep going long after day seven.",
        checkpoint: "You've decided, in writing, what the daily action becomes starting day 8.",
        reference: {
          label:
            "Lally et al. — 'How habits are formed' (European Journal of Social Psychology, 2010), via UCL research summary",
          url: 'https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit',
        },
        example: {
          good: 'Wrote down what the action becomes on day 8 before day 7 even ended.',
          bad: 'Called it done on day 7 and let the habit quietly drop by day 9.',
        },
      },
    ],
    timeline: [
      {
        phase: 'Day 1',
        span: 'Day 1',
        days: [1, 1],
        focus: 'Make the one deletion. Gone, not paused.',
        stepIndexes: [0],
      },
      {
        phase: 'Days 1–7',
        span: 'Days 1–7',
        days: [2, 7],
        focus: 'Run the one daily action and the evening 2-line log, every day.',
        stepIndexes: [1, 2],
      },
      {
        phase: 'Day 7',
        span: 'Day 7',
        days: [7, 7],
        focus: 'Decide, in writing, what the daily action becomes on day 8.',
        stepIndexes: [3],
      },
    ],
    relatedBlogSlugs: ['motivation-is-a-feeling-systems-are-infrastructure'],
  },
  {
    slug: 'ship-local-ai-in-a-weekend',
    title: 'Ship Local AI in a Weekend',
    promise: 'Two days. One offline AI tool that actually does something for you. Not a tech demo.',
    durationLabel: '2 days',
    forWhom: 'Builders who want to try local AI hands-on without renting a GPU or trusting a cloud API.',
    hue: 192,
    metrics: [
      {
        name: 'Model size',
        how: 'Note the parameter count and quantization of the model you pulled (e.g. 3B, Q4).',
        cadence: 'Once, at setup',
      },
      {
        name: 'Tokens/sec observed',
        how: 'Watch the terminal or app output while it generates; note the rate.',
        cadence: 'Per test run',
      },
      {
        name: 'Shipped use case',
        how: 'One sentence describing the real thing it now does for you.',
        cadence: 'Once, at the end',
      },
    ],
    steps: [
      {
        title: 'Install Ollama, Pull a Small Model',
        label: 'standard',
        detail:
          "Install Ollama on whatever machine you have. A laptop is fine, no GPU required for a small model. Pull a small model to start: something in the 3B–8B range runs on modest hardware without melting your fan. This is the common starting setup most people use to get a first local model talking, nothing custom yet. If Ollama doesn't fit your stack, llama.cpp directly is the same idea with more control and more setup. Either way, the goal of day one morning is this: type a prompt, get a response, entirely on your own machine, no API key, no cloud call.",
        checkpoint: "You've run one prompt through a local model and gotten a real response, no internet required.",
        reference: {
          label: 'llama.cpp — LLM inference in C/C++ (GGUF format, ggml-org)',
          url: 'https://github.com/ggml-org/llama.cpp',
        },
        example: {
          good: 'One prompt, one real response, wifi off, before lunch on day one.',
          bad: 'Spent the whole morning comparing seven models before running any of them.',
        },
      },
      {
        title: 'Pick ONE Real Personal Use Case',
        label: 'tested',
        detail:
          "Don't build a demo. Pick one specific, boring, real thing you'd actually use: summarizing your own notes, drafting a reply, answering questions about a document you already have on disk. This is the exact philosophy behind BrainBox: useful beats impressive, every time. A local AI tool nobody uses because it was built to look clever in a screenshot is a wasted weekend. Write the use case down in one sentence before you touch any code. If you can't state it in one sentence, it's not specific enough yet to build against.",
        checkpoint: "You've written one sentence describing exactly what this tool will do for you, specifically.",
        example: {
          good: 'One sentence: summarize my meeting notes into three bullet points.',
          bad: 'Built a general-purpose assistant that does a bit of everything.',
        },
      },
      {
        title: 'Build the Smallest Loop That Works',
        label: 'tested',
        detail:
          "Build the thinnest possible version that actually completes your use case end to end: input goes in, the model runs, output comes back, done. No UI polish, no extra features, no 'while I'm at it' additions. This is the same discipline behind every system I've shipped: get one full loop working before you improve any single piece of it. A working ugly loop beats a half-built beautiful one every time. Only the working loop tells you whether the idea was worth building in the first place.",
        checkpoint: 'You can run the loop start to finish, on your own real input, and get a usable answer out.',
        example: {
          good: 'Ugly script, one file, input to output, working end to end by Saturday night.',
          bad: 'Spent Saturday designing a settings screen nobody had used yet.',
        },
      },
      {
        title: 'Run It Fully Offline, Note Latency and Quality',
        label: 'standard',
        detail:
          "Turn off your wifi, or physically disconnect, and run the loop again. If it works exactly the same with no network, day two's job is done. While you're at it, note two things honestly: how fast it felt (tokens per second, or just a gut 'fast enough' or 'too slow') and how good the output actually was for your specific use case, not compared to a giant cloud model. Small local models trade some raw capability for full offline control. This is where you find out, on your own use case, whether that trade was worth it for you.",
        checkpoint: "The tool ran fully offline and you've written down both the speed and the honest quality verdict.",
        example: {
          good: 'Wifi off, same result, tokens per second written down honestly.',
          bad: 'Assumed it was offline-ready without ever testing without wifi.',
        },
      },
    ],
    timeline: [
      {
        phase: 'Saturday AM',
        span: 'Saturday morning',
        days: [1, 1],
        focus: 'Install Ollama, pull a small model, and pick one real use case.',
        stepIndexes: [0, 1],
      },
      {
        phase: 'Saturday PM',
        span: 'Saturday afternoon',
        days: [1, 1],
        focus: 'Build the thinnest possible loop that completes the use case end to end.',
        stepIndexes: [2],
      },
      {
        phase: 'Sunday',
        span: 'Sunday',
        days: [2, 2],
        focus: 'Run it fully offline and write down the honest speed and quality verdict.',
        stepIndexes: [3],
      },
    ],
    relatedVideoIds: ['my-local-ai-app-chat-habits-personas'],
    relatedBlogSlugs: ['local-first-ai-why-i-run-my-models-on-device'],
  },
]

export function getAllSessions(): Session[] {
  return SESSIONS.slice()
}

export function getSessionBySlug(slug: string): Session | undefined {
  return SESSIONS.find((session) => session.slug === slug)
}
