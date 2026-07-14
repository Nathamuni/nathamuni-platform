/**
 * Courses — structured learning paths assembled from content that already
 * exists elsewhere on the site (videos, blog posts, book, resume facts).
 * Nothing here is invented; every claim is labeled with where it comes from:
 *
 *   'tested'   — traceable to docs/content-source.md, his own videos, or blog
 *   'research' — an external claim, always carrying a verified {label, url}
 *   'standard' — general established guidance, framed as a starting point
 *
 * See CLAUDE.md / plans for the full brief. lib/courses.test.ts enforces the
 * integrity rules (unique slugs, valid labels, every reference resolves,
 * every videoId/blogSlug actually exists, disclaimers on health courses).
 */

export type CredibilityLabel = 'tested' | 'research' | 'standard'

export interface BlockReference {
  label: string
  url: string
}

export interface Block {
  label: CredibilityLabel
  text: string
  reference?: BlockReference
}

export interface Module {
  title: string
  blocks: Block[]
  actions: string[]
  videoIds?: string[]
  blogSlugs?: string[]
}

export interface Course {
  slug: string
  title: string
  tagline: string
  forWhom: string
  level: 'beginner' | 'intermediate'
  hue: number
  outcomes: string[]
  /** Renders the "not medical advice" disclaimer card at the top of the course. */
  disclaimer?: boolean
  modules: Module[]
}

const COURSES: Course[] = [
  // ─────────────────────────────────────────────────────────────────────
  // 1. The Consistency System — Mind & Discipline
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'the-consistency-system',
    title: 'The Consistency System',
    tagline: 'Motivation is weather. Build the infrastructure instead.',
    forWhom:
      'Anyone who keeps starting and keeps stopping — habits that survive a good week but die the first bad one.',
    level: 'beginner',
    hue: 262,
    outcomes: [
      'Replace "I need to feel motivated" with a trigger you can\'t talk yourself out of',
      'Delete the decision points where your day actually falls apart, instead of fighting them daily',
      'Run the same act-before-ready protocol that got a self-organised marathon finished with nobody watching',
    ],
    modules: [
      {
        title: 'Motivation Is Weather, Systems Are Infrastructure',
        blocks: [
          {
            label: 'tested',
            text: 'I finished a marathon that didn\'t exist on paper — no bib number, no start gun, no course marshals, nobody waiting at a finish line. 26.21 kilometres, self-organised, on a route I mapped myself, in 4 hours 38 minutes and 32 seconds. By kilometre 15 there was no motivation left in the tank. My legs weren\'t excited. My mind wasn\'t inspired. My body was actively lobbying to stop. What kept me moving wasn\'t a feeling — it was a structure I\'d already built in training, months earlier: wake, hydrate, stretch, move, don\'t negotiate with the first ten minutes. The race didn\'t need motivation. It needed me to execute a system I\'d already rehearsed a hundred times. That\'s the entire model this course runs on.',
          },
          {
            label: 'research',
            text: 'I didn\'t invent the idea that consistency beats bursts of willpower, and I\'m not pretending I did. A 2010 University College London study tracked ninety-six people building a new daily habit — something tied to an existing routine — and measured how automatic it became over twelve weeks. The number everyone quotes is 66 days, the median time to near-peak automaticity. The number that actually matters is the range: 18 to 254 days, depending on the person and the behaviour. There is no universal deadline where a habit clicks into place. What mattered more than any timeline was consistency of context — doing the thing in the same situation, attached to the same cue, over and over, even when a day got missed entirely.',
            reference: {
              label: 'Lally et al. — "How habits are formed" (European Journal of Social Psychology, 2010), via UCL research summary',
              url: 'https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit',
            },
          },
          {
            label: 'research',
            text: 'Stanford behaviour scientist BJ Fogg frames the same idea more bluntly with what he calls the Fogg Behavior Model: a behaviour only happens when motivation, ability, and a prompt converge at the same moment. Motivation is the least reliable of the three — the one variable you can\'t summon on demand no matter how badly you want to. Ability and prompt, on the other hand, are things you can actually engineer. Make the behaviour small enough that ability is never the bottleneck, anchor it to a rock-solid prompt, and it fires whether or not you feel like it that day. That\'s the entire leverage point this module is built around.',
            reference: {
              label: 'BJ Fogg — The Fogg Behavior Model (Stanford Behavior Design Lab)',
              url: 'https://www.behaviormodel.org/',
            },
          },
          {
            label: 'standard',
            text: 'The practical version, as a starting point: find a moment in your day that already happens without fail — coffee, the walk home, brushing your teeth — and weld the new behaviour directly onto it, with zero gap for a decision to sneak in. This is a generic technique, not something unique to me; anchor habits and implementation intentions show up across most behaviour-change frameworks. Start with one habit, one anchor, one week. Resist the urge to redesign your whole routine at once — that\'s a different problem wearing a productivity costume.',
          },
        ],
        actions: [
          'Pick one habit you keep abandoning after a few good days',
          'Find the moment right before it that already happens without fail, every single day',
          'Attach the new behaviour directly to that moment — no decision allowed in between',
          'Run it for seven days before judging whether it "works"',
        ],
        videoIds: ['build-the-chain-why-systems-beat-motivation'],
        blogSlugs: ['motivation-is-a-feeling-systems-are-infrastructure'],
      },
      {
        title: 'The Discipline of Deletion',
        blocks: [
          {
            label: 'tested',
            text: 'My book, The Silence That Haunts, spends an entire section on what I call the discipline of deletion — the idea that most people try to add more willpower to a broken system instead of removing the friction that\'s breaking it. Deletion over discipline theatre. You don\'t need more resolve to stop scrolling before bed; you need the phone in another room. You don\'t need to "want it more" to train in the morning; you need your clothes laid out the night before so there\'s no decision left to make at 6 a.m. Every deleted decision point is one less place for the day to fall apart.',
          },
          {
            label: 'standard',
            text: 'As a starting point: list every place during your day where you currently have to decide whether to do the habit, and treat each one as a design flaw, not a character flaw. Then delete one of them this week — remove the option itself, not just the temptation to take it. Uninstall the app instead of promising not to open it. Put the snacks somewhere that requires effort to reach instead of relying on restraint at 11 p.m. This is generic environment design, not a personal secret — the leverage is in doing it consistently, not in the specific trick.',
          },
        ],
        actions: [
          'List every decision point standing between you and the habit today',
          'Delete one of those decision points this week — remove the option, not just the urge',
          'Notice which "discipline" problems quietly disappear once the decision is gone',
        ],
      },
      {
        title: 'Action Before Ready — The Inner Liar',
        blocks: [
          {
            label: 'tested',
            text: 'Six months, fifty thinkers\' philosophies, tested against my actual life instead of just read about. The one result I still run today, multiple times a day: separating action from reaction. A reaction is your circumstances pulling a lever you didn\'t know was exposed. An action is you, deciding, with intention, regardless of what just happened to you. My book calls the voice that stops you "the Inner Liar" — the part of your mind that manufactures a reason to wait one more day, dressed up as preparation. Before the experiment I lived most weeks almost entirely in reaction. The filter that changed more of my behaviour than the other forty-nine philosophies combined was one question, asked constantly: am I acting with intention right now, or just reacting to the moment?',
          },
          {
            label: 'standard',
            text: 'As a starting point, treat the excuse your mind offers first as data, not truth. Write it down, verbatim, before you act — "I\'ll do it properly tomorrow," "I need to research this more," "I\'m too tired right now." Then do the smallest real version of the action anyway, today, while the excuse is still sitting there unresolved on the page. This isn\'t a productivity hack unique to me; it\'s the general principle behind most "just start" advice. The value is in actually running it against a real excuse, not in reading about it.',
          },
        ],
        actions: [
          'Before your next attempt, write down the excuse your mind offers first — word for word',
          'Do the smallest possible version of the action anyway, today, before you feel ready',
          'Ask yourself once a day: am I acting with intention, or just reacting to the moment?',
        ],
        videoIds: ['50-thinkers-6-months-separating-action-from-reaction'],
        blogSlugs: ['50-thinkers-6-months-what-survived-contact-with-real-life'],
      },
      {
        title: 'Rebuilding the Chain After It Breaks',
        blocks: [
          {
            label: 'tested',
            text: 'A back injury put me on bed rest for three months. Three months is enough time to lose a program, a rhythm, and most of your confidence in your own body. When I restarted, motivation was nowhere in the room — the first squat felt like a betrayal of what my body used to do. What got me from one rep back to a full session wasn\'t a pep talk. It was re-attaching training to its old anchor point in the day and refusing to renegotiate the trigger, rep by rep, week by week. The chain doesn\'t need you to be strong again immediately. It needs the anchor to hold while the strength quietly comes back on its own schedule.',
          },
          {
            label: 'standard',
            text: 'As a starting point when a habit has completely broken — injury, travel, a bad month, doesn\'t matter why — don\'t try to rebuild the whole system at once. Pick the single link that mattered most, reattach it to its original anchor moment, and run a version of it so small that skipping it would feel absurd. Resist the urge to "make up for lost time" with an aggressive restart; that\'s usually what breaks the chain a second time. Slow and re-anchored beats fast and fragile.',
          },
        ],
        actions: [
          'Identify the last habit that broke completely — don\'t try to rebuild the whole system at once',
          'Reattach just one link to its original anchor moment this week',
          'Refuse to renegotiate the trigger for seven straight days, even if the session is tiny',
        ],
        blogSlugs: ['tendon-patience-why-planche-and-maltese-take-years'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // 2. Full-Body Flexibility — Calisthenics & Fitness (disclaimer)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'full-body-flexibility',
    title: 'Full-Body Flexibility',
    tagline: 'The two-part routine, plus the alignment work nobody bothers to do after.',
    forWhom:
      'Anyone whose back, neck, or hips complain after a day at a desk — or after a hard training session.',
    level: 'beginner',
    hue: 152,
    disclaimer: true,
    outcomes: [
      'Run the same two-part flexibility sequence used to relieve back and neck pain',
      'Progress from the beginner routine to the advanced one without forcing a range you\'re not ready for',
      'Know the exact post-workout alignment routine that keeps hips, groin, and rotator cuff functional',
    ],
    modules: [
      {
        title: 'Part 1 — The Beginner Routine',
        blocks: [
          {
            label: 'tested',
            text: 'This is the full-body flexibility routine I actually use, part one, beginner level — the stretches that make the body functional and mobile again and specifically relieve back pain and neck pain, the two complaints I hear most. It\'s built for whole-body movement, not an isolated stretch here and there: the goal is a body that moves as one connected system instead of a collection of tight parts compensating for each other. If you\'re new to structured mobility work entirely, this is the starting point, not part two.',
          },
          {
            label: 'standard',
            text: 'As a starting point, run this two to three times a week rather than daily at first — connective tissue and joints adapt slower than you\'d like, and consistency matters more than intensity here. Stop short of sharp pain in any stretch; mild tension that eases within the hold is the target, not a fight to go deeper. Once the beginner sequence feels genuinely easy for a couple of weeks running, not just on a good day, that\'s your signal to move to part two.',
          },
        ],
        actions: [
          'Run the beginner sequence twice this week, on non-consecutive days',
          'Note which single stretch feels tightest — that\'s the one to watch, not force',
          'Only move to part two once the beginner routine feels easy for two weeks straight',
        ],
        videoIds: ['run-with-me'],
      },
      {
        title: 'Part 2 — The Advanced Routine',
        blocks: [
          {
            label: 'tested',
            text: 'Part two is the slightly advanced continuation I use to stretch everything and stay functional all over, once the beginner routine stops being a challenge. It\'s the same whole-body philosophy — nothing isolated, nothing that ignores the rest of the chain — just deeper ranges and longer holds than part one asks for. If you\'re arriving here without having actually run part one for a couple of weeks first, go back. The sequence is ordered on purpose: part one earns you the baseline range of motion, part two spends that range on positions that would\'ve been genuinely risky to attempt cold. Skipping ahead doesn\'t save time, it just moves the injury earlier in the timeline.',
          },
          {
            label: 'standard',
            text: 'As a starting point, treat any new sharp or localised pain in this routine as a stop signal, not a "push through it" signal — that distinction matters more in advanced ranges than beginner ones, where the margin for error in a joint position is smaller. Warm up with a few minutes of light movement before going straight into deeper holds, especially in colder weather or first thing in the morning when tissue is stiffer. If a position that used to feel fine in part one suddenly feels tight again, that\'s usually fatigue or a skipped session catching up with you, not a reason to force the advanced range regardless.',
          },
        ],
        actions: [
          'Warm up for two to three minutes before starting the advanced sequence',
          'Hold each position a few seconds longer than the beginner version, not dramatically longer',
          'Stop immediately on any sharp, localised pain — that is not the same signal as normal tension',
        ],
        videoIds: ['thanks-for-visiting'],
      },
      {
        title: 'Post-Workout Alignment & Recovery',
        blocks: [
          {
            label: 'tested',
            text: 'The part nobody does: aligning your body after a strong strength session to keep it functional, plus the relaxation work that follows. This releases the hips, groin, and rotator cuff specifically — the three areas that quietly tighten up after heavy training and that most people never address until something actually hurts. I run this whether I\'m at home or genuinely out of station with zero equipment; alignment work travels, it just needs a floor. Skipping it is exactly how a good training block quietly turns into a shoulder or hip that doesn\'t move right anymore, weeks after the fact, with no single session you can point to as the cause.',
          },
          {
            label: 'research',
            text: 'This work isn\'t just "feels nice," it lines up with what\'s actually understood about how connective tissue adapts. A 2022 systematic review in Sports Medicine, pooling dozens of studies on tendons under mechanical loading, found tendons adapt through two mechanisms — changes to the material itself and an increase in cross-sectional area — with the structural mechanism being slow, sometimes still progressing after four years of consistent loading in young athletes. Tissue that gets loaded hard also needs deliberate, repeated attention afterward, not just a day off; recovery is an active input, not a passive gap in the schedule.',
            reference: {
              label: 'Mechanical, Material and Morphological Adaptations of Healthy Lower Limb Tendons to Mechanical Loading — Systematic Review & Meta-Analysis (Sports Medicine, 2022)',
              url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9474511/',
            },
          },
        ],
        actions: [
          'Run the alignment routine directly after your next strength session, not the day after',
          'Pay specific attention to hips, groin, and rotator cuff — the areas this routine targets',
          'Try it once while travelling with zero equipment, to prove it isn\'t gym-dependent',
        ],
        videoIds: ['workout-anywhere-even-out-of-station'],
        blogSlugs: ['tendon-patience-why-planche-and-maltese-take-years'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // 3. Calisthenics Foundations — Calisthenics & Fitness (disclaimer)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'calisthenics-foundations',
    title: 'Calisthenics Foundations',
    tagline: 'No gym, no equipment, no shortcuts on the tissue that actually limits you.',
    forWhom:
      'Anyone starting from zero equipment — just a floor and a body that\'s about to disagree with you for a few weeks.',
    level: 'beginner',
    hue: 152,
    disclaimer: true,
    outcomes: [
      'Understand why bodyweight training is a legitimate strength system, not a downgrade from weights',
      'Run the five push-up variations that make up my actual daily routine',
      'Know why progressions like planche and Maltese take years, not weeks, and train accordingly',
    ],
    modules: [
      {
        title: 'Why Bodyweight',
        blocks: [
          {
            label: 'tested',
            text: 'No gym. No equipment. Just you and the floor. That\'s not a limitation I train around — it\'s the actual method, and it works because your bodyweight is a fully adjustable load the moment you understand leverage and range of motion. Every progression in calisthenics is really a lever-length problem: move your centre of mass further from the joint doing the work, and the same bodyweight gets dramatically harder. You don\'t need a rack of plates to make a movement brutal. You need to understand the lever you\'re already standing on.',
          },
          {
            label: 'standard',
            text: 'As a starting point, don\'t treat bodyweight training as a "beginner phase" before real training starts — that framing is common but wrong, and it\'s not unique to me to say so. Advanced calisthenics athletes hold positions that outmuscle plenty of weighted lifters, using leverage instead of external load. Start with the basic pattern of a movement — push, pull, squat, hinge — before chasing a specific skill; the skill is just a harder lever applied to a pattern you should already own.',
          },
        ],
        actions: [
          'Do one bodyweight session this week with genuinely zero equipment',
          'Identify which of push, pull, squat, or hinge feels weakest for you right now',
          'Resist adding equipment until that weakest pattern feels solid unweighted',
        ],
        videoIds: ['no-gym-no-equipment-just-you-the-floor'],
      },
      {
        title: 'The Top 5 Push-Ups',
        blocks: [
          {
            label: 'tested',
            text: 'These are the top five push-up variations I actually do — the ones in my daily practice, not a list copied from somewhere else. Each targets a slightly different angle and lever length, which is the entire point: a standard push-up, a variation that shifts load toward the shoulders, one that emphasises the triceps, one that builds toward single-arm strength, and one that trains the core to resist rotation under load. Running all five across a week covers more ground than doing one variation to exhaustion every session.',
          },
          {
            label: 'standard',
            text: 'As a starting point, rotate through two or three of the five per session rather than all five every time — recovery matters as much as volume here, especially for the wrists and elbows carrying the leverage. Master strict form on the basic version before adding the harder variations; a sloppy advanced push-up trains bad mechanics faster than it trains strength. Track reps loosely, not obsessively — the point of rotating variations is exposure to different angles and lever lengths, not a single number climbing every week. If one variation consistently feels worse than the others, that\'s useful information about a weak angle, not a reason to avoid it forever.',
          },
        ],
        actions: [
          'Learn all five push-up variations from the video, one at a time',
          'Pick two to rotate into this week\'s sessions instead of doing all five every time',
          'Check your form on the basic version before adding a harder variation',
        ],
        videoIds: ['top-5-push-ups-that-i-do'],
      },
      {
        title: 'Progression Patience',
        blocks: [
          {
            label: 'tested',
            text: 'Everyone wants to know how long it takes to get a planche. Wrong question — the honest answer depends less on muscle and almost entirely on tendons, tissue most people never think about. My approach changed the day I stopped measuring progress as "can I hold this yet" and started measuring it as "did I load this today without pain tomorrow." Progressions — tuck, advanced tuck, straddle, full — aren\'t steps for your muscles. They\'re steps for your tendons to catch up without getting injured trying to skip ahead.',
          },
          {
            label: 'research',
            text: 'This isn\'t just caution for its own sake. A 2022 systematic review in Sports Medicine, covering dozens of studies on tendons under mechanical loading, found tendon adaptation happens through slow structural remodelling — some studies found continued stiffness adaptation even after four years of consistent loading in young athletes, with no ceiling in sight. Your shoulders can produce the strength to hold an advanced lever long before your tendons can safely absorb the load of holding it. Muscle writes a check connective tissue can\'t yet cash.',
            reference: {
              label: 'Mechanical, Material and Morphological Adaptations of Healthy Lower Limb Tendons to Mechanical Loading — Systematic Review & Meta-Analysis (Sports Medicine, 2022)',
              url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9474511/',
            },
          },
        ],
        actions: [
          'Pick one progression you\'re chasing and identify which step you\'re actually on, honestly',
          'Give that step a minimum of several weeks before testing the next one',
          'Log any localised, next-morning soreness separately from normal training fatigue',
        ],
        blogSlugs: ['tendon-patience-why-planche-and-maltese-take-years'],
      },
      {
        title: 'Injury-Proofing — The Comeback',
        blocks: [
          {
            label: 'tested',
            text: 'A back injury put me on bed rest for three months. That\'s a brutal audit of every shortcut you took getting there. When I came back, I rebuilt from a single bodyweight squat and refused to rush the reintroduction of load, no matter how good a session felt. Tissue that\'s been dormant doesn\'t care that your mind remembers what you used to lift — it has to be re-earned, physically, on its own schedule. That comeback is the actual origin of most of the patience I now apply to every progression, not a philosophy I read somewhere first.',
          },
          {
            label: 'standard',
            text: 'As a starting point after any layoff, restart from a version of the movement so basic it feels almost insulting, and add load or range gradually across weeks, not days. Treat any sharp, localised, next-morning pain as a stop signal distinct from ordinary training soreness. This is general injury-return guidance, not a substitute for an actual assessment if something feels genuinely wrong — see the disclaimer at the top of this course. Resist comparing week one of a comeback to your pre-injury baseline; that comparison is demoralising and useless. The only comparison that matters is this week against last week.',
          },
        ],
        actions: [
          'If returning from any layoff, restart from the most basic version of the movement',
          'Add load or range gradually across weeks, not days',
          'Treat sharp, localised, next-morning pain as a stop signal, not something to train through',
        ],
        blogSlugs: ['motivation-is-a-feeling-systems-are-infrastructure'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // 4. Diet, Tested — Calisthenics & Fitness (disclaimer)
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'diet-tested',
    title: 'Diet, Tested',
    tagline: 'What I actually eat, documented — not a meal plan sold to you.',
    forWhom:
      'Anyone tired of contradictory diet advice who wants one person\'s tested, documented approach.',
    level: 'beginner',
    hue: 38,
    disclaimer: true,
    outcomes: [
      'See the exact diet facts, meal structure, and protein breakdown behind my own training',
      'Understand protein basics as a starting point, not a rigid rulebook',
      'Know the honest limits of a plant-based diet, tested on myself, not theorised about',
    ],
    modules: [
      {
        title: 'My Best Diet Facts',
        blocks: [
          {
            label: 'tested',
            text: 'These are the most important self-experienced diet facts I have, in one place, free — everything here was tested on my own body first before I\'d recommend it to anyone who asks. This isn\'t a summary of what nutrition science says in general; it\'s specifically what held up when I actually tracked it against my own training, energy, and recovery over time. Some of it will overlap with standard advice. Some of it won\'t, because my own results didn\'t match the standard advice in every case.',
          },
        ],
        actions: [
          'Watch the video and write down the two facts that surprised you most',
          'Compare one of those facts against your own current eating pattern this week',
        ],
        videoIds: ['self-experience-facts-free'],
      },
      {
        title: '14 Diet & Body Facts You Should Know',
        blocks: [
          {
            label: 'tested',
            text: 'Fourteen facts about the body and diet — how it actually works, what to eat, and personal tips drawn from my own testing rather than a generic list. This is one of my two best diet videos specifically because it covers the ground people ask about most in comments: what to eat, when, and why a given approach worked or didn\'t work for me over time. Treat it as a checklist to verify against your own body, not a universal prescription.',
          },
        ],
        actions: [
          'Pick three of the fourteen facts most relevant to your current situation',
          'Test one of them for two weeks and note any real change, not just a feeling',
        ],
        videoIds: ['ask-me-for-personal-tips'],
      },
      {
        title: 'Protein & Amino Acids, Broken Down',
        blocks: [
          {
            label: 'tested',
            text: 'My diet, discussed with the technical breakdown: protein requirements as I apply them, amino acid profiles, and the true nature of workout supplements — what to actually add to a diet and why, instead of buying whatever a store shelf pushes hardest. Precise protein tracking has been part of my training for years, alongside plant-based eating, and this breaks down the actual numbers and reasoning behind it rather than a vague "eat more protein" instruction. Most supplement marketing sells complexity where the underlying chemistry is simple; this video is the part-two breakdown of exactly what I take, what I skip, and why the skipped ones aren\'t worth the money for my own goals.',
          },
          {
            label: 'research',
            text: 'For the protein numbers themselves, I lean on the established sports-nutrition literature rather than my own guess. The International Society of Sports Nutrition\'s 2017 position stand on protein and exercise recommends roughly 0.25g of high-quality protein per kilogram of bodyweight per serving, or an absolute dose of 20–40g, spread across meals for exercising individuals, with slightly higher total daily intakes generally supporting muscle-building goals. That range is a research-backed starting point, not a personal secret — apply it against your own bodyweight and adjust from there.',
            reference: {
              label: 'Jäger et al. — International Society of Sports Nutrition Position Stand: Protein and Exercise (JISSN, 2017)',
              url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/',
            },
          },
        ],
        actions: [
          'Calculate your own rough protein target using the 0.25g-per-kg-per-serving guidance',
          'Compare that number against what you actually ate yesterday',
          'Identify one meal where hitting that target would require an actual change',
        ],
        videoIds: ['busy-but-delivered'],
      },
      {
        title: 'My Full Diet On A Tight Work Schedule',
        blocks: [
          {
            label: 'tested',
            text: 'My complete diet inside a tight work schedule — what I actually eat, meal by meal, to keep training while delivering at a full-time job. This is the practical answer to "how do you find time to eat properly," and the honest version involves batching, repetition, and refusing to treat meal planning as a daily decision. It\'s the same systems logic from the Consistency System course applied to food: decide once, execute on autopilot at mealtime. Nobody has extra willpower left over at 8 p.m. after a full workday to improvise a balanced meal from scratch — the schedule only survives because the decision was already made earlier, when I actually had the bandwidth to make it well.',
          },
        ],
        actions: [
          'Write out your actual meals from yesterday, honestly, meal by meal',
          'Identify one meal you could batch or simplify without losing quality',
        ],
        videoIds: ['thanks-for-viewing'],
      },
      {
        title: 'The Limits Of A Plant-Based Diet',
        blocks: [
          {
            label: 'tested',
            text: 'Testing the limits of a plant-based diet across multiple dimensions — flexibility, agility, strength, endurance — all of it, tested on myself, not theorised about from a spreadsheet. A disciplined plant-based diet with precise protein tracking has been part of my training for years, alongside a long-term hybrid of calisthenics and weightlifting. This module is the honest report: what a plant-based approach can genuinely support, and where it demands more deliberate tracking than an omnivorous diet would. I\'m not selling plant-based as universally superior — I\'m reporting what has and hasn\'t held up across years of my own strength and endurance work while eating this way.',
          },
          {
            label: 'standard',
            text: 'As a starting point if you\'re considering a plant-based approach yourself: protein basics matter more here than on a mixed diet, simply because fewer of your food sources deliver a complete amino acid profile per gram. Track total daily protein against your bodyweight rather than assuming it will work out automatically, and vary your protein sources across a week rather than relying on one or two. This is general guidance, not a personal secret — the discipline is in the tracking, not the specific foods.',
          },
        ],
        actions: [
          'If eating plant-based, track your total protein for three days and compare it to your target',
          'Vary your protein sources across the week instead of repeating the same one or two',
        ],
        videoIds: ['hybrid-physic'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  // 5. Local-First AI Starter — AI & Builds
  // ─────────────────────────────────────────────────────────────────────
  {
    slug: 'local-first-ai-starter',
    title: 'Local-First AI Starter',
    tagline: 'Your AI, running on your own hardware — not someone else\'s server.',
    forWhom: 'Developers and tinkerers who want to build with AI without shipping user data to a cloud they don\'t control.',
    level: 'intermediate',
    hue: 192,
    outcomes: [
      'Understand why on-device AI is a different trust model, not a friendlier version of cloud AI',
      'See the actual stack — llama.cpp, GGUF, llama.rn, Ollama — that made BrainBox possible as one engineer with no cloud budget',
      'Know the concrete first steps to build your own local-first AI feature, not just admire the idea',
    ],
    modules: [
      {
        title: 'Why On-Device, Not Cloud',
        blocks: [
          {
            label: 'tested',
            text: 'Most AI apps today have a quiet, unspoken deal built into them: send us your conversations, your habits, your journal entries, and we\'ll process them somewhere in a data centre you\'ll never see. I built BrainBox specifically to break that deal — on-device chat, personas, habit and routine tracking, journaling, where the model runs on your phone, not in my cloud, because there is no cloud in the loop at all. "Privacy-friendly cloud" is a marketing phrase, not an architecture; if your data ever leaves the device, it exists somewhere else, under someone else\'s control.',
          },
          {
            label: 'standard',
            text: 'As a starting point for evaluating any AI feature, ask one question before anything else: where does the data actually go when the user hits send? If the honest answer involves a server you don\'t control, that\'s an architecture decision being made for the user, not by them. There\'s also a practical reason beyond privacy — a model running on-device answers the moment it\'s asked, no round trip, no dependency on signal strength. Offline-first isn\'t a nice-to-have feature bullet; on a train or with the wifi down, it\'s the difference between the app working and the app being furniture.',
          },
        ],
        actions: [
          'Pick one AI feature you use daily and find out where its data actually processes',
          'Decide, for your own next build, whether on-device is viable for at least one feature',
        ],
        videoIds: ['my-local-ai-app-chat-habits-personas'],
        blogSlugs: ['local-first-ai-why-i-run-my-models-on-device'],
      },
      {
        title: 'The BrainBox Story',
        blocks: [
          {
            label: 'tested',
            text: 'BrainBox is a local-first AI lifestyle app — on-device LLM chat, personas, habit and routine tracking, journaling, and a gamified wellness engine rendered at 60fps, all sitting on WatermelonDB for fully offline storage, with computer vision components that never phone home either. It shipped as one person, no cloud budget, no backend team, and it\'s live on Google Play. None of that was possible because I\'m unusually talented at any single one of those pieces — it worked because none of them required a server round-trip to function, which meant one engineer could actually finish it.',
          },
          {
            label: 'standard',
            text: 'As a starting point when scoping your own build: audit which parts of your idea genuinely need a server and which don\'t. Habit tracking doesn\'t need the network. Journaling doesn\'t need the network. Even chat doesn\'t need it if the model lives on the same device as the data it\'s reasoning about. Every piece you can remove from the "needs a backend" column is a piece a small team, or a solo builder, can actually ship without external infrastructure cost.',
          },
        ],
        actions: [
          'List the features in your own project idea and mark which ones truly require a server',
          'Pick the smallest feature that doesn\'t require one and scope it as a first build',
        ],
        videoIds: ['your-phone-just-got-a-brain-upgrade', 'free-app-access-for-testers'],
      },
      {
        title: 'Pick Your Stack',
        blocks: [
          {
            label: 'standard',
            text: 'As a starting point, don\'t design your own inference engine — the open-source ecosystem already solved the hard part. llama.cpp, originally built by Georgi Gerganov, runs large language models efficiently in plain C/C++ across ordinary consumer hardware, no server farm required. GGUF is the compressed, quantized model format that makes a model small enough to actually live on a phone or laptop instead of a rack in a data centre. For mobile specifically, llama.rn wraps that engine for React Native; for desktop experimentation, Ollama handles model management with a simple command-line interface, which is the fastest way to try this before committing to a mobile build.',
          },
          {
            label: 'research',
            text: 'This is real, actively maintained open-source infrastructure, not a toy project — worth checking the repository directly before building on top of it, since the ecosystem moves fast and model support changes often. It\'s the same project underpinning most of the current on-device LLM tooling, including the stack BrainBox runs on. Read the repository\'s own supported-models list before picking a model to experiment with; new architectures land there faster than any third-party summary can track, and a model that isn\'t yet supported will simply fail to load instead of degrading gracefully.',
            reference: {
              label: 'llama.cpp — LLM inference in C/C++ (GGUF format, ggml-org)',
              url: 'https://github.com/ggml-org/llama.cpp',
            },
          },
        ],
        actions: [
          'Install Ollama and run one small open model locally before writing any app code',
          'Pick a GGUF-format model under 4GB to keep the first experiment fast to iterate on',
        ],
      },
      {
        title: 'What To Build First',
        blocks: [
          {
            label: 'standard',
            text: 'As a starting point, don\'t start with "an AI app" as the goal — start with one real, narrow use case you\'d actually use yourself, the same way BrainBox started as a habit tracker with a chat layer, not a general-purpose assistant. Pick a small model that fits your target device\'s memory comfortably rather than the largest one that technically runs; a model that\'s fast and always available beats a bigger one that lags or drains the battery. Ship the smallest working version — one screen, one on-device feature, one clear use case — before adding personas, journaling, or anything else layered on top.',
          },
          {
            label: 'tested',
            text: 'That\'s the actual order BrainBox was built in, not the marketing order it\'s described in now: a narrow habit-and-chat core first, proven to work fully offline, before the wellness engine, the computer vision components, or the gamification layer got added on top. Building it any other way — starting broad and hoping to make it all work offline later — is how most "local-first" projects quietly end up depending on a server anyway, because the hard constraint gets treated as a bolt-on instead of the starting design decision.',
          },
        ],
        actions: [
          'Write down one narrow, real use case you\'d personally use daily',
          'Pick a model size that comfortably fits your target device\'s memory, not the largest available',
          'Ship a one-screen version of just that use case before adding anything else',
        ],
      },
    ],
  },
]

export function getAllCourses(): Course[] {
  return COURSES.slice()
}

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug)
}

export function getModuleCount(course: Course): number {
  return course.modules.length
}

export function getAllCourseVideoIds(module_: Module): string[] {
  return module_.videoIds ?? []
}
