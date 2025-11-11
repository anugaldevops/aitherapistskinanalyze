export class ParaphraseGenerator {
  private static readonly REFLECTION_PREFIXES = [
    "It sounds like",
    "I'm hearing that",
    "What I'm understanding is",
    "It seems like",
    "If I'm hearing you correctly",
    "From what you're sharing",
    "The way you describe it",
    "What I'm picking up is",
    "As I understand it",
    "What stands out to me is",
    "I'm sensing that",
    "The picture you're painting shows",
    "What you're expressing is",
    "I'm noticing that",
    "Based on what you've said",
    "What I hear beneath that is",
    "The feeling I'm getting is",
    "It strikes me that"
  ];

  private static readonly VALIDATION_PREFIXES = [
    "That makes complete sense",
    "Your feelings are valid",
    "I understand why that would feel",
    "Anyone would feel that way",
    "Your reaction is natural given",
    "It's understandable to feel",
    "That's a normal response to",
    "Of course you'd feel that way when"
  ];

  private static readonly CLARIFICATION_PREFIXES = [
    "Help me understand",
    "I want to make sure I'm following",
    "Can you say more about",
    "I'm curious about",
    "What does it feel like when",
    "Tell me more about what you mean by",
    "I'd like to understand better",
    "Walk me through"
  ];

  private static readonly EMOTIONAL_MIRRORING = [
    "I hear the pain in that",
    "That sounds incredibly difficult",
    "I can sense the weight of that",
    "That must be so hard",
    "I feel the heaviness in your words",
    "The hurt comes through clearly",
    "That's a lot to carry",
    "I can imagine how challenging that is"
  ];

  private static readonly EMOTION_WORDS = [
    'anxious', 'worried', 'stressed', 'overwhelmed', 'sad', 'depressed',
    'happy', 'excited', 'calm', 'frustrated', 'angry', 'tired', 'exhausted',
    'confused', 'scared', 'afraid', 'hopeful', 'content', 'lonely', 'isolated',
    'guilty', 'ashamed', 'proud', 'confident', 'nervous', 'uncertain',
    'disappointed', 'hurt', 'betrayed', 'relieved', 'grateful'
  ];

  private static readonly FILLER_WORDS = [
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'been', 'be', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'very', 'really', 'just', 'so', 'too'
  ];

  static generateParaphrase(userMessage: string, style: 'reflection' | 'validation' | 'clarification' | 'emotional' = 'reflection'): string | null {
    if (!userMessage || userMessage.trim().length < 10) {
      return null;
    }

    const keyPhrases = this.extractKeyPhrases(userMessage);
    if (keyPhrases.length === 0) {
      return null;
    }

    let prefix: string;
    let content: string;

    switch (style) {
      case 'validation':
        prefix = this.VALIDATION_PREFIXES[
          Math.floor(Math.random() * this.VALIDATION_PREFIXES.length)
        ];
        content = this.extractValidationContent(userMessage);
        break;
      case 'clarification':
        prefix = this.CLARIFICATION_PREFIXES[
          Math.floor(Math.random() * this.CLARIFICATION_PREFIXES.length)
        ];
        content = this.extractClarificationFocus(userMessage);
        break;
      case 'emotional':
        prefix = this.EMOTIONAL_MIRRORING[
          Math.floor(Math.random() * this.EMOTIONAL_MIRRORING.length)
        ];
        return `${prefix}.`;
      default:
        prefix = this.REFLECTION_PREFIXES[
          Math.floor(Math.random() * this.REFLECTION_PREFIXES.length)
        ];
        content = keyPhrases[0];
    }

    const paraphrase = `${prefix} ${content}.`;

    if (paraphrase.length > 120) {
      return null;
    }

    return paraphrase;
  }

  static generateDynamicParaphrase(userMessage: string, conversationContext: string[]): string | null {
    const emotionalIntensity = this.detectEmotionalIntensity(userMessage);
    const topicType = this.detectTopicType(userMessage);

    let style: 'reflection' | 'validation' | 'clarification' | 'emotional';

    if (emotionalIntensity === 'high') {
      style = Math.random() < 0.6 ? 'emotional' : 'validation';
    } else if (topicType === 'relationship' || topicType === 'work') {
      style = 'reflection';
    } else if (conversationContext.length < 2) {
      style = 'reflection';
    } else {
      style = Math.random() < 0.5 ? 'validation' : 'clarification';
    }

    return this.generateParaphrase(userMessage, style);
  }

  private static detectEmotionalIntensity(message: string): 'low' | 'medium' | 'high' {
    const highIntensityWords = ['betrayed', 'devastated', 'furious', 'terrified', 'hopeless', 'worthless', 'broken'];
    const mediumIntensityWords = ['upset', 'worried', 'stressed', 'frustrated', 'sad', 'anxious'];

    const lowerMessage = message.toLowerCase();

    if (highIntensityWords.some(word => lowerMessage.includes(word))) {
      return 'high';
    } else if (mediumIntensityWords.some(word => lowerMessage.includes(word))) {
      return 'medium';
    }

    return 'low';
  }

  private static detectTopicType(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('boss') || lowerMessage.includes('work') ||
        lowerMessage.includes('job') || lowerMessage.includes('colleague') ||
        lowerMessage.includes('manager') || lowerMessage.includes('coworker')) {
      return 'work';
    }

    if (lowerMessage.includes('partner') || lowerMessage.includes('relationship') ||
        lowerMessage.includes('friend') || lowerMessage.includes('family')) {
      return 'relationship';
    }

    return 'general';
  }

  private static extractValidationContent(message: string): string {
    const emotion = this.extractEmotion(message);
    if (emotion) {
      return emotion.replace("you're feeling", "").trim();
    }
    return "that way in this situation";
  }

  private static extractClarificationFocus(message: string): string {
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const words = sentences[0].trim().split(/\s+/).slice(0, 4).join(' ');
      return `what you meant by "${words}..."`;
    }
    return "what's happening for you";
  }

  private static extractKeyPhrases(text: string): string[] {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    const keyPhrases: string[] = [];

    for (const sentence of sentences) {
      const emotion = this.extractEmotion(sentence);
      if (emotion) {
        keyPhrases.push(emotion);
        continue;
      }

      const cleanedSentence = this.cleanSentence(sentence);
      if (cleanedSentence.length > 15 && cleanedSentence.length < 80) {
        keyPhrases.push(cleanedSentence);
      }
    }

    return keyPhrases.slice(0, 3);
  }

  private static extractEmotion(sentence: string): string | null {
    const lowerSentence = sentence.toLowerCase();

    const feelingPatterns = [
      /i feel ([\w\s]+)/,
      /i'm feeling ([\w\s]+)/,
      /i am feeling ([\w\s]+)/,
      /feeling ([\w\s]+)/,
      /i'm ([\w]+)/,
      /i am ([\w]+)/
    ];

    for (const pattern of feelingPatterns) {
      const match = lowerSentence.match(pattern);
      if (match && match[1]) {
        const emotionPhrase = match[1].trim().split(/\s+/).slice(0, 3).join(' ');
        const hasEmotion = this.EMOTION_WORDS.some(emotion =>
          emotionPhrase.includes(emotion)
        );

        if (hasEmotion) {
          return `you're feeling ${emotionPhrase}`;
        }
      }
    }

    for (const emotion of this.EMOTION_WORDS) {
      if (lowerSentence.includes(emotion)) {
        return `you're feeling ${emotion}`;
      }
    }

    return null;
  }

  private static cleanSentence(sentence: string): string {
    let words = sentence.toLowerCase().split(/\s+/);

    words = words.filter(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      return cleanWord.length > 0 && !this.FILLER_WORDS.includes(cleanWord);
    });

    words = words.slice(0, 12);

    let cleaned = words.join(' ');

    cleaned = cleaned.replace(/^(i |i'm |im |my |me )/i, 'you ');
    cleaned = cleaned.replace(/ (i |i'm |im |my |me )$/i, ' you');

    return cleaned.trim();
  }

  static extractUserEmotionLabels(userMessage: string): string[] {
    const lowerMessage = userMessage.toLowerCase();
    const foundEmotions: string[] = [];

    for (const emotion of this.EMOTION_WORDS) {
      if (lowerMessage.includes(emotion)) {
        foundEmotions.push(emotion);
      }
    }

    const feelingPatterns = [
      /i feel ([\w]+)/gi,
      /i'm feeling ([\w]+)/gi,
      /feeling ([\w]+)/gi
    ];

    for (const pattern of feelingPatterns) {
      const matches = userMessage.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const emotion = match[1].toLowerCase().trim();
          if (emotion.length > 3 && !foundEmotions.includes(emotion)) {
            foundEmotions.push(emotion);
          }
        }
      }
    }

    return [...new Set(foundEmotions)];
  }

  static shouldUseParaphrase(turnCount: number, lastParaphraseUsed: boolean, emotionalIntensity?: 'low' | 'medium' | 'high'): boolean {
    if (turnCount === 0) {
      return true;
    }

    if (lastParaphraseUsed) {
      return false;
    }

    if (emotionalIntensity === 'high') {
      return Math.random() < 0.7;
    }

    return Math.random() < 0.4;
  }
}
