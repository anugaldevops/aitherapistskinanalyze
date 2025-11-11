export interface EmotionalContext {
  primaryEmotion: string;
  secondaryEmotions: string[];
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  complexity: 'simple' | 'mixed' | 'complex';
  vulnerability: 'guarded' | 'open' | 'deeply_vulnerable';
  topic: string;
}

export interface EmpathyResponse {
  depth: 'surface' | 'moderate' | 'deep';
  approach: 'validate' | 'explore' | 'comfort' | 'probe';
  timing: 'immediate' | 'pause' | 'delay';
}

export class EmotionalIntelligence {
  private static readonly PRIMARY_EMOTIONS = {
    joy: ['happy', 'excited', 'joyful', 'delighted', 'content', 'pleased', 'cheerful'],
    sadness: ['sad', 'down', 'depressed', 'dejected', 'melancholy', 'grief', 'sorrow'],
    anger: ['angry', 'furious', 'mad', 'frustrated', 'irritated', 'enraged', 'resentful'],
    fear: ['scared', 'afraid', 'anxious', 'worried', 'terrified', 'nervous', 'panicked'],
    shame: ['ashamed', 'embarrassed', 'humiliated', 'guilty', 'mortified', 'inadequate'],
    hurt: ['hurt', 'wounded', 'betrayed', 'rejected', 'abandoned', 'neglected', 'dismissed']
  };

  private static readonly COMPLEX_EMOTION_MARKERS = [
    'but also',
    'at the same time',
    'mixed feelings',
    'conflicted',
    'torn between',
    'part of me',
    'on one hand',
    'simultaneously'
  ];

  private static readonly VULNERABILITY_MARKERS = {
    high: [
      'never told anyone',
      'first time sharing',
      'hard to admit',
      'ashamed to say',
      'embarrassed to share',
      'afraid to say',
      'scared to tell you'
    ],
    medium: [
      'difficult to talk about',
      'not sure how to say',
      'struggling to explain',
      'hard to put into words'
    ]
  };

  private static readonly WORKPLACE_CONTEXTS = [
    'boss', 'manager', 'supervisor', 'coworker', 'colleague',
    'work', 'job', 'career', 'office', 'professional',
    'workplace', 'employment', 'corporate', 'team member'
  ];

  private static readonly RELATIONSHIP_CONTEXTS = [
    'partner', 'spouse', 'boyfriend', 'girlfriend', 'husband', 'wife',
    'relationship', 'dating', 'marriage', 'romantic'
  ];

  private static readonly FAMILY_CONTEXTS = [
    'mother', 'father', 'mom', 'dad', 'parent', 'sibling',
    'brother', 'sister', 'family', 'child', 'son', 'daughter'
  ];

  static analyzeEmotionalContext(message: string): EmotionalContext {
    const lowerMessage = message.toLowerCase();

    const primaryEmotion = this.identifyPrimaryEmotion(lowerMessage);
    const secondaryEmotions = this.identifySecondaryEmotions(lowerMessage, primaryEmotion);
    const intensity = this.assessIntensity(lowerMessage);
    const complexity = this.assessComplexity(lowerMessage, secondaryEmotions.length);
    const vulnerability = this.assessVulnerability(lowerMessage);
    const topic = this.identifyTopic(lowerMessage);

    return {
      primaryEmotion,
      secondaryEmotions,
      intensity,
      complexity,
      vulnerability,
      topic
    };
  }

  private static identifyPrimaryEmotion(message: string): string {
    const emotionScores: { [key: string]: number } = {};

    for (const [emotion, keywords] of Object.entries(this.PRIMARY_EMOTIONS)) {
      emotionScores[emotion] = keywords.filter(keyword =>
        message.includes(keyword)
      ).length;
    }

    const maxScore = Math.max(...Object.values(emotionScores));
    if (maxScore === 0) return 'neutral';

    const primaryEmotion = Object.keys(emotionScores).find(
      emotion => emotionScores[emotion] === maxScore
    );

    return primaryEmotion || 'neutral';
  }

  private static identifySecondaryEmotions(message: string, primary: string): string[] {
    const secondary: string[] = [];

    for (const [emotion, keywords] of Object.entries(this.PRIMARY_EMOTIONS)) {
      if (emotion === primary) continue;

      const hasEmotion = keywords.some(keyword => message.includes(keyword));
      if (hasEmotion) {
        secondary.push(emotion);
      }
    }

    return secondary.slice(0, 2);
  }

  private static assessIntensity(message: string): 'low' | 'medium' | 'high' | 'extreme' {
    const extremeMarkers = [
      'suicide', 'kill myself', 'end my life', 'can\'t take it',
      'want to die', 'unbearable', 'can\'t go on'
    ];

    const highIntensityMarkers = [
      'devastated', 'destroyed', 'shattered', 'crushed', 'broken',
      'terrified', 'horrified', 'traumatized', 'betrayed', 'furious',
      'enraged', 'hopeless', 'worthless', 'hate myself'
    ];

    const mediumIntensityMarkers = [
      'very', 'really', 'so', 'extremely', 'incredibly',
      'overwhelmed', 'stressed', 'anxious', 'upset', 'hurt'
    ];

    if (extremeMarkers.some(marker => message.includes(marker))) {
      return 'extreme';
    }

    if (highIntensityMarkers.some(marker => message.includes(marker))) {
      return 'high';
    }

    if (mediumIntensityMarkers.some(marker => message.includes(marker))) {
      return 'medium';
    }

    return 'low';
  }

  private static assessComplexity(message: string, secondaryCount: number): 'simple' | 'mixed' | 'complex' {
    const hasComplexMarkers = this.COMPLEX_EMOTION_MARKERS.some(
      marker => message.includes(marker)
    );

    if (hasComplexMarkers || secondaryCount >= 2) {
      return 'complex';
    }

    if (secondaryCount === 1) {
      return 'mixed';
    }

    return 'simple';
  }

  private static assessVulnerability(message: string): 'guarded' | 'open' | 'deeply_vulnerable' {
    const highVulnerability = this.VULNERABILITY_MARKERS.high.some(
      marker => message.includes(marker)
    );

    if (highVulnerability) {
      return 'deeply_vulnerable';
    }

    const mediumVulnerability = this.VULNERABILITY_MARKERS.medium.some(
      marker => message.includes(marker)
    );

    if (mediumVulnerability) {
      return 'open';
    }

    const messageLength = message.split(/\s+/).length;
    if (messageLength < 10) {
      return 'guarded';
    }

    return 'open';
  }

  private static identifyTopic(message: string): string {
    if (this.WORKPLACE_CONTEXTS.some(ctx => message.includes(ctx))) {
      return 'workplace';
    }

    if (this.RELATIONSHIP_CONTEXTS.some(ctx => message.includes(ctx))) {
      return 'relationship';
    }

    if (this.FAMILY_CONTEXTS.some(ctx => message.includes(ctx))) {
      return 'family';
    }

    return 'general';
  }

  static determineEmpathyResponse(context: EmotionalContext): EmpathyResponse {
    let depth: 'surface' | 'moderate' | 'deep' = 'moderate';
    let approach: 'validate' | 'explore' | 'comfort' | 'probe' = 'validate';
    let timing: 'immediate' | 'pause' | 'delay' = 'immediate';

    if (context.intensity === 'extreme') {
      depth = 'deep';
      approach = 'comfort';
      timing = 'immediate';
    } else if (context.intensity === 'high') {
      if (context.vulnerability === 'deeply_vulnerable') {
        depth = 'deep';
        approach = 'validate';
        timing = 'pause';
      } else {
        depth = 'moderate';
        approach = 'explore';
        timing = 'immediate';
      }
    } else if (context.complexity === 'complex') {
      depth = 'moderate';
      approach = 'explore';
      timing = 'pause';
    } else if (context.vulnerability === 'guarded') {
      depth = 'surface';
      approach = 'probe';
      timing = 'immediate';
    }

    return { depth, approach, timing };
  }

  static generateContextualPromptEnhancement(context: EmotionalContext, empathy: EmpathyResponse): string {
    let enhancement = '';

    if (context.topic === 'workplace') {
      enhancement += '\n\nWorkplace Context: The user is discussing a professional relationship. Acknowledge the complexity of workplace dynamics, power imbalances, and the challenge of maintaining boundaries in professional settings.';
    } else if (context.topic === 'relationship') {
      enhancement += '\n\nRelationship Context: The user is discussing an intimate relationship. Be sensitive to attachment patterns, trust issues, and the depth of emotional investment in romantic connections.';
    } else if (context.topic === 'family') {
      enhancement += '\n\nFamily Context: The user is discussing family dynamics. Be aware of childhood wounds, family roles, and the complexity of family relationships that can\'t easily be ended.';
    }

    if (context.vulnerability === 'deeply_vulnerable') {
      enhancement += '\n\nVulnerability Level: HIGH. The user is sharing something very difficult. Respond with extra gentleness, honor their courage in sharing, and create a deeply safe space. Avoid probing questions right now.';
    }

    if (context.intensity === 'high' || context.intensity === 'extreme') {
      enhancement += `\n\nEmotional Intensity: ${context.intensity.toUpperCase()}. The user is in significant distress. Prioritize validation and emotional safety over exploration or problem-solving. Use slow, gentle pacing.`;
    }

    if (context.complexity === 'complex') {
      enhancement += '\n\nEmotional Complexity: The user is experiencing multiple emotions simultaneously. Acknowledge this complexity rather than trying to simplify. Help them hold space for contradictory feelings.';
    }

    if (empathy.approach === 'comfort') {
      enhancement += '\n\nTherapeutic Approach: COMFORT. Focus on soothing, grounding, and creating safety. This is not the time for exploration or challenging.';
    } else if (empathy.approach === 'explore') {
      enhancement += '\n\nTherapeutic Approach: EXPLORE. Gently help the user understand their experience more deeply. Ask open-ended questions that invite reflection.';
    } else if (empathy.approach === 'probe') {
      enhancement += '\n\nTherapeutic Approach: PROBE. The user seems guarded. Gentle probing questions can help them open up, but stay attuned to their comfort level.';
    }

    return enhancement;
  }

  static getEmotionSpecificResponse(emotion: string, intensity: 'low' | 'medium' | 'high' | 'extreme'): string[] {
    const responses: { [key: string]: { [key: string]: string[] } } = {
      hurt: {
        high: [
          'Betrayal cuts deep. What feels most painful about this?',
          'That kind of hurt can shake your sense of trust. What do you need right now?',
          'When someone we care about hurts us, it can feel unbearable. What\'s the hardest part?'
        ],
        medium: [
          'Being hurt by someone you trusted is painful. How are you coping with this?',
          'That sounds like a real wound. What would help you heal?',
          'Hurt feelings deserve attention. What are you needing from this conversation?'
        ]
      },
      anger: {
        high: [
          'That anger makes complete sense. What boundary was crossed?',
          'Rage often protects something vulnerable underneath. What feels threatened?',
          'Your anger is valid information. What is it trying to tell you?'
        ],
        medium: [
          'Frustration is exhausting. What feels most unfair about this?',
          'That would make anyone angry. What do you wish was different?',
          'Your irritation is pointing to something. What needs to change?'
        ]
      },
      fear: {
        high: [
          'Fear can be overwhelming. What feels most threatening right now?',
          'When we\'re terrified, everything narrows. What would help you feel safer?',
          'That anxiety sounds intense. What\'s the worst part of it?'
        ],
        medium: [
          'Worry can be so draining. What are you most concerned about?',
          'Anxiety often points to what matters. What\'s at stake here?',
          'Nervousness makes sense. What would ease your mind?'
        ]
      }
    };

    const emotionResponses = responses[emotion];
    if (!emotionResponses) return [];

    const intensityLevel = intensity === 'extreme' ? 'high' : intensity;
    return emotionResponses[intensityLevel] || [];
  }
}
