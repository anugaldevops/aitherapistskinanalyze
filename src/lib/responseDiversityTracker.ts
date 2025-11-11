export interface ResponsePattern {
  phrase: string;
  timestamp: string;
  frequency: number;
}

export class ResponseDiversityTracker {
  private usedPhrases: Map<string, ResponsePattern> = new Map();
  private readonly MAX_HISTORY = 50;
  private readonly SIMILARITY_THRESHOLD = 0.7;

  private static readonly COMMON_OPENINGS = [
    'i hear',
    'i\'m listening',
    'that\'s important',
    'thank you for sharing',
    'i appreciate',
    'let\'s explore',
    'tell me more',
    'how are you feeling'
  ];

  private static readonly DIVERSE_OPENINGS = [
    'That resonates deeply',
    'I hear the weight of that',
    'Your experience matters',
    'I\'m present with you in this',
    'That takes real courage to share',
    'There\'s a lot beneath those words',
    'I sense the complexity here',
    'Your feelings make complete sense',
    'What you\'re describing sounds painful',
    'I can feel the impact of that',
    'That\'s a significant realization',
    'The emotions you\'re naming feel important',
    'I\'m honored you\'re trusting me with this',
    'That must be incredibly difficult',
    'Your perspective helps me understand you better'
  ];

  private static readonly DIVERSE_TRANSITIONS = [
    'As I understand it',
    'From what you\'re sharing',
    'It sounds to me like',
    'What I\'m picking up is',
    'If I\'m hearing this right',
    'The way you describe it',
    'What stands out to me is',
    'I\'m noticing that',
    'It seems like',
    'What I\'m sensing is',
    'The picture you\'re painting shows',
    'Based on what you\'ve said'
  ];

  private static readonly EMPATHY_VARIATIONS = [
    'That must feel overwhelming',
    'I can imagine how hard that is',
    'Your pain is valid',
    'That sounds incredibly challenging',
    'Anyone would struggle with that',
    'Your reaction makes perfect sense',
    'That\'s a heavy burden to carry',
    'I understand why that would hurt',
    'Those feelings are completely natural',
    'What you\'re going through matters',
    'That deserves to be acknowledged',
    'Your struggle is real and significant'
  ];

  trackPhrase(phrase: string): void {
    const normalized = this.normalizePhrase(phrase);
    const existing = this.usedPhrases.get(normalized);

    if (existing) {
      existing.frequency++;
      existing.timestamp = new Date().toISOString();
    } else {
      this.usedPhrases.set(normalized, {
        phrase: normalized,
        timestamp: new Date().toISOString(),
        frequency: 1
      });
    }

    if (this.usedPhrases.size > this.MAX_HISTORY) {
      this.pruneOldPhrases();
    }
  }

  isOverused(phrase: string): boolean {
    const normalized = this.normalizePhrase(phrase);
    const pattern = this.usedPhrases.get(normalized);

    if (!pattern) {
      return false;
    }

    if (pattern.frequency >= 2) {
      return true;
    }

    const recentUsage = this.findSimilarRecentPhrases(normalized);
    return recentUsage.length > 0;
  }

  private normalizePhrase(phrase: string): string {
    return phrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join(' ');
  }

  private findSimilarRecentPhrases(phrase: string): string[] {
    const similar: string[] = [];
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    for (const [key, pattern] of this.usedPhrases.entries()) {
      const phraseTime = new Date(pattern.timestamp);

      if (phraseTime > twoMinutesAgo) {
        const similarity = this.calculateSimilarity(phrase, key);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          similar.push(key);
        }
      }
    }

    return similar;
  }

  private calculateSimilarity(phrase1: string, phrase2: string): number {
    const words1 = phrase1.split(/\s+/);
    const words2 = phrase2.split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const maxLength = Math.max(words1.length, words2.length);

    return maxLength > 0 ? commonWords.length / maxLength : 0;
  }

  private pruneOldPhrases(): void {
    const entries = Array.from(this.usedPhrases.entries());
    entries.sort((a, b) => {
      const timeA = new Date(a[1].timestamp).getTime();
      const timeB = new Date(b[1].timestamp).getTime();
      return timeA - timeB;
    });

    const toRemove = entries.slice(0, Math.floor(entries.length * 0.3));
    toRemove.forEach(([key]) => this.usedPhrases.delete(key));
  }

  getDiverseOpening(): string {
    const availableOpenings = ResponseDiversityTracker.DIVERSE_OPENINGS.filter(
      opening => !this.isOverused(opening)
    );

    if (availableOpenings.length === 0) {
      return ResponseDiversityTracker.DIVERSE_OPENINGS[
        Math.floor(Math.random() * ResponseDiversityTracker.DIVERSE_OPENINGS.length)
      ];
    }

    return availableOpenings[Math.floor(Math.random() * availableOpenings.length)];
  }

  getDiverseTransition(): string {
    const availableTransitions = ResponseDiversityTracker.DIVERSE_TRANSITIONS.filter(
      transition => !this.isOverused(transition)
    );

    if (availableTransitions.length === 0) {
      return ResponseDiversityTracker.DIVERSE_TRANSITIONS[
        Math.floor(Math.random() * ResponseDiversityTracker.DIVERSE_TRANSITIONS.length)
      ];
    }

    return availableTransitions[Math.floor(Math.random() * availableTransitions.length)];
  }

  getDiverseEmpathy(): string {
    const availableEmpathy = ResponseDiversityTracker.EMPATHY_VARIATIONS.filter(
      empathy => !this.isOverused(empathy)
    );

    if (availableEmpathy.length === 0) {
      return ResponseDiversityTracker.EMPATHY_VARIATIONS[
        Math.floor(Math.random() * ResponseDiversityTracker.EMPATHY_VARIATIONS.length)
      ];
    }

    return availableEmpathy[Math.floor(Math.random() * availableEmpathy.length)];
  }

  enhanceResponse(baseResponse: string, userMessage: string): string {
    const sentences = baseResponse.match(/[^.!?]+[.!?]+/g) || [baseResponse];

    if (sentences.length === 0) {
      return baseResponse;
    }

    const firstSentence = sentences[0].trim().toLowerCase();
    const needsDiverseOpening = ResponseDiversityTracker.COMMON_OPENINGS.some(
      common => firstSentence.startsWith(common)
    );

    if (needsDiverseOpening && this.detectsHighEmotion(userMessage)) {
      const diverseOpening = this.getDiverseOpening();
      this.trackPhrase(diverseOpening);

      if (sentences.length > 1) {
        return `${diverseOpening}. ${sentences.slice(1).join(' ')}`;
      } else {
        return `${diverseOpening}. What's most present for you right now?`;
      }
    }

    return baseResponse;
  }

  private detectsHighEmotion(message: string): boolean {
    const highEmotionWords = [
      'betrayed', 'hurt', 'devastated', 'broken', 'alone', 'worthless',
      'hopeless', 'overwhelmed', 'exhausted', 'terrified', 'abandoned',
      'rejected', 'ashamed', 'guilty', 'angry', 'furious', 'scared'
    ];

    const lowerMessage = message.toLowerCase();
    return highEmotionWords.some(word => lowerMessage.includes(word));
  }

  reset(): void {
    this.usedPhrases.clear();
  }

  getStats(): {
    totalPhrases: number;
    overusedPhrases: number;
    diversityScore: number;
  } {
    const overused = Array.from(this.usedPhrases.values()).filter(
      pattern => pattern.frequency >= 2
    );

    const diversityScore = this.usedPhrases.size > 0
      ? Math.max(0, 1 - (overused.length / this.usedPhrases.size))
      : 1;

    return {
      totalPhrases: this.usedPhrases.size,
      overusedPhrases: overused.length,
      diversityScore: Math.round(diversityScore * 100) / 100
    };
  }
}
