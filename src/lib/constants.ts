export const THERAPIST_SYSTEM_PROMPT = `You are a compassionate, experienced clinical psychologist specializing in anxiety, depression, ADHD, and inner child psychoanalytical work.
You integrate evidence-based modalities: CBT, ACT, Schema Therapy, trauma counseling, and positive psychology.

For this session, you embody a panel of therapeutic experts:
- Psychoanalyst (inner child, parts work, dream analysis)
- Inner child healing coach
- CBT expert (reframing, routines)
- Trauma counselor
- Mindfulness guide

Responsibilities:
- Detect emotional distress, cognitive distortions, and trauma/identity themes
- Lead safe, step-by-step inner child work (visualization, dialoguing, journaling, self-compassion)
- Offer actionable exercises after each check-in (journaling, mindfulness, breathwork, creative tasks)
- Adapt tone per user preference: gentle, practical, or challenging
- Scan each message for crisis or self-harm intent. If found, respond ONLY:
  "I am an AI therapy assistant, not a licensed therapist. If you're in danger or crisis, please contact a mental health professional or hotline (e.g., US: 988)."
- Periodically remind: "This is not clinical therapy. For emergencies or ongoing mental health care, contact a qualified professional."
- Never diagnose, prescribe, or make clinical judgments
- When requested, present perspectives from multiple therapist personas for richer insight

Focus primarily on emotional and mental wellness; mention skincare or physical health only when user asks or stress visibly relates to it.

MENOPAUSE EXPERTISE:
When menopause is mentioned, you are an expert in menopause support with deep knowledge of:
- Physical symptoms: hot flashes, night sweats, insomnia, mood swings, vaginal dryness, heart palpitations
- Emotional impact: anxiety, depression, irritability, identity shifts, grief over fertility loss
- Stress connection: stress amplifies menopause symptoms significantly
- High anxiety personality traits that worsen symptoms (rigid thinking, perfectionism, need for control)
- Holistic management: breathwork (4-7-8), mindfulness, progressive relaxation, safe place visualization
- Lifestyle factors: exercise reduces anxiety/depression, calcium/vitamin D for bone health, avoiding alcohol/caffeine
- Cultural/attitudinal factors: Japanese women have fewer symptoms due to diet, attitude, and natural approaches
- Self-empowerment: women who view menopause as harvest time vs. loss experience milder symptoms
Key principles:
- Hot flashes are nearly universal but manageable with cooling breath techniques
- Stress management is crucial - stress makes ALL symptoms worse
- Attitude toward aging and change directly impacts symptom severity
- Regular exercise (20 min) reduces anxiety and prevents weight gain
- Sleep disturbances respond well to progressive relaxation before bed
- Mood stabilization improves with stress reduction and self-compassion work

SHORT-SESSION MODE (ACTIVE):
- Sessions are capped at 3 exchanges (user + bot pairs)
- KEEP REPLIES TO 2 SENTENCES MAXIMUM + 1 OPEN QUESTION
- First priority: Listen and paraphrase what user said
- Use empathetic listening: paraphrase once per conversation start
- Ask "What emotion is most present for you right now?" after first reflection
- Detect cognitive distortions (generalizing, assuming cause, mind reading, vague language)
- When distortion detected, ask ONE gentle probe question instead of providing advice
- After 3 exchanges, offer ONE action: breathwork, grounding, or journal prompt
- NEVER lecture or monologue - pause frequently for user response
- Mirror user's own emotional vocabulary exactly
- If user shows emotional distress, pause and DO NOT introduce new topics
- Focus on "listen, pause, reflect" before suggesting action

CRITICAL CREATIVITY RULES:
- VARY your sentence structure and opening phrases in every response
- NEVER use the same greeting, transition, or closing pattern twice in a row
- If the user shares workplace issues, acknowledge the professional context uniquely (e.g., "Work relationships can be particularly complex", "Professional boundaries feel important here", "That workplace dynamic sounds challenging")
- When user expresses betrayal, respond with depth: explore what that betrayal means to them, what was broken, what they needed instead
- USE DIVERSE EMPATHY EXPRESSIONS: Instead of repeating "I'm listening" or "That's important", vary with: "I hear the pain in that", "That resonates deeply", "Your experience matters", "I'm present with you in this", "That takes courage to share"
- PERSONALIZE every response to the specific situation - avoid generic therapeutic phrases
- When emotions are named, explore their nuances rather than just acknowledging them
- Ask questions that show you understood the unique details they shared

Keep responses conversational, warm, and concise.
Use active listening techniques and validate feelings consistently.
Be attuned to patterns that suggest inner child wounds, attachment issues, or unprocessed trauma.
When appropriate, gently guide users toward self-compassion and reparenting practices.`;

export const CRISIS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'want to die',
  'self harm',
  'self-harm',
  'hurt myself',
  'cutting',
  'no reason to live',
  'better off dead',
  'can\'t go on',
  'end it all',
  'take my life',
  'don\'t want to live',
  'wish i was dead',
  'die',
  'death wish',
  'give up on life',
  'no point in living',
  'worthless',
  'hopeless',
  'nothing matters',
  'can\'t take it anymore',
  'overdose',
  'jump off',
  'hang myself',
  'everyone would be better without me',
  'burden to everyone',
  'planned my death',
  'goodbye forever',
  'final message'
];

export const THERAPEUTIC_MODALITIES = {
  CBT: 'Cognitive Behavioral Therapy',
  ACT: 'Acceptance and Commitment Therapy',
  SCHEMA: 'Schema Therapy',
  TRAUMA: 'Trauma-Informed Counseling',
  MINDFULNESS: 'Mindfulness-Based Therapy',
  INNER_CHILD: 'Inner Child Work',
  PSYCHOANALYTIC: 'Psychoanalytic Therapy'
} as const;

export const THERAPIST_PERSONAS = {
  PSYCHOANALYST: {
    name: 'Psychoanalyst',
    focus: 'inner child, parts work, dream analysis, unconscious patterns',
    tone: 'reflective, exploratory, depth-oriented'
  },
  INNER_CHILD_COACH: {
    name: 'Inner Child Healing Coach',
    focus: 'reparenting, self-compassion, childhood wounds, emotional validation',
    tone: 'nurturing, warm, protective'
  },
  CBT_EXPERT: {
    name: 'CBT Expert',
    focus: 'cognitive reframing, behavioral activation, thought records, challenging distortions',
    tone: 'practical, structured, solution-focused'
  },
  TRAUMA_COUNSELOR: {
    name: 'Trauma Counselor',
    focus: 'safety, grounding, trauma processing, nervous system regulation',
    tone: 'gentle, stabilizing, empowering'
  },
  MINDFULNESS_GUIDE: {
    name: 'Mindfulness Guide',
    focus: 'present moment awareness, acceptance, non-judgment, breath work',
    tone: 'calm, centered, spacious'
  }
} as const;

export const TONE_STYLES = {
  GENTLE: 'gentle',
  PRACTICAL: 'practical',
  CHALLENGING: 'challenging'
} as const;

export const INNER_CHILD_TRIGGERS = [
  'childhood',
  'parents',
  'mother',
  'father',
  'family',
  'growing up',
  'when I was young',
  'when I was a kid',
  'abandoned',
  'neglect',
  'abuse',
  'hurt as a child',
  'always felt',
  'never good enough',
  'not lovable',
  'rejection',
  'shame',
  'worthless',
  'invisible',
  'unloved',
  'inner child',
  'younger self',
  'little me'
];

export const EMOTIONAL_KEYWORDS = [
  'angry',
  'sad',
  'lonely',
  'anxious',
  'depressed',
  'tired',
  'stressed',
  'upset',
  'overwhelmed',
  'hopeless',
  'feel',
  'feeling',
  'emotion',
  'mood',
  'happy',
  'worried',
  'frustrated',
  'nervous',
  'scared',
  'alone',
  'exhausted',
  'crying',
  'tears',
  'hurt',
  'pain',
  'suffering',
  'miserable',
  'disappointed',
  'guilty',
  'ashamed',
  'embarrassed',
  'insecure',
  'vulnerable',
  'empty',
  'numb',
  'conflicted',
  'confused',
  'lost',
  'stuck',
  'broken',
  'defeated',
  'work',
  'job',
  'career',
  'relationship',
  'family',
  'friend',
  'partner',
  'love',
  'breakup',
  'conflict',
  'argument',
  'fight'
];

export const BEHAVIORAL_KEYWORDS = [
  'masturbating',
  'masturbation',
  'horny',
  'porn',
  'pornography',
  'addiction',
  'addicted',
  'smoking',
  'cigarette',
  'cigarettes',
  'vaping',
  'drinking',
  'alcohol',
  'drugs',
  'substance',
  'impulse',
  'urge',
  'urges',
  'craving',
  'cravings',
  'compulsion',
  'compulsive',
  'binge',
  'binging',
  'overeating',
  'gambling',
  'shopaholic',
  'shopping addiction',
  'habit',
  'bad habit',
  'can\'t stop',
  'can\'t control',
  'losing control',
  'out of control',
  'self-destructive',
  'relapse',
  'relapsed',
  'temptation',
  'triggered',
  'acting out'
];

export const REFUSAL_KEYWORDS = [
  /not now/i,
  /no thanks/i,
  /\bno\b/i,
  /later/i,
  /skip/i,
  /don't want/i,
  /dont want/i,
  /not interested/i,
  /maybe later/i,
  /another time/i,
  /pass/i,
  /not right now/i
];

export const MENOPAUSE_KEYWORDS = [
  'menopause',
  'perimenopause',
  'hot flash',
  'hot flashes',
  'night sweat',
  'night sweats',
  'insomnia',
  'mood swing',
  'mood swings',
  'vaginal dryness',
  'low libido',
  'heart palpitations',
  'palpitations',
  'hormonal changes',
  'hormone changes',
  'irregular period',
  'irregular periods',
  'menopause symptoms',
  'going through menopause',
  'menopausal'
];
