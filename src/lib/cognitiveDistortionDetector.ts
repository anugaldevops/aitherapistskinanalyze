export type DistortionType = 'generalizing' | 'assuming_cause' | 'mind_reading' | 'vague';

export interface DetectedDistortion {
  type: DistortionType;
  pattern: string;
  probe: string;
  timestamp: string;
}

export class CognitiveDistortionDetector {
  private static readonly GENERALIZING_PATTERNS = [
    /\balways\b/i,
    /\bnever\b/i,
    /\beveryone\b/i,
    /\bno one\b/i,
    /\beverybody\b/i,
    /\bnobody\b/i,
    /\ball the time\b/i,
    /\bevery time\b/i,
    /\bconstantly\b/i
  ];

  private static readonly ASSUMING_CAUSE_PATTERNS = [
    /\bmakes me (feel|think|do|act|be)\b/i,
    /\bcauses me to\b/i,
    /\bforces me to\b/i,
    /\bmade me (feel|think|do|act|be)\b/i,
    /\bbecause of (him|her|them|you)\b/i
  ];

  private static readonly MIND_READING_PATTERNS = [
    /\b(he|she|they|you) (thinks?|thought|believes?|believed)\b.*\bi\b/i,
    /\b(he|she|they|you) (doesn't|don't|didn't) like\b/i,
    /\b(he|she|they|you) (hates?|hated)\b/i,
    /\bi know (he|she|they|you) (thinks?|thought)\b/i,
    /\b(he's|she's|they're|you're) judging\b/i,
    /\bthey all think\b/i
  ];

  private static readonly VAGUE_PATTERNS = [
    /\brejected me\b/i,
    /\bhurt me\b/i,
    /\bdisrespected me\b/i,
    /\bupset me\b/i,
    /\bwas mean\b/i,
    /\btreated me badly\b/i
  ];

  static detectDistortions(message: string): DetectedDistortion[] {
    const detections: DetectedDistortion[] = [];

    const generalizing = this.detectGeneralizing(message);
    if (generalizing) {
      detections.push(generalizing);
    }

    const assumingCause = this.detectAssumingCause(message);
    if (assumingCause) {
      detections.push(assumingCause);
    }

    const mindReading = this.detectMindReading(message);
    if (mindReading) {
      detections.push(mindReading);
    }

    const vague = this.detectVague(message);
    if (vague) {
      detections.push(vague);
    }

    return detections.slice(0, 1);
  }

  private static detectGeneralizing(message: string): DetectedDistortion | null {
    for (const pattern of this.GENERALIZING_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const word = match[0].toLowerCase().trim();
        let probe = '';

        if (word === 'never' || word === 'no one' || word === 'nobody') {
          probe = `${word.charAt(0).toUpperCase() + word.slice(1)}? What would happen if that changed?`;
        } else if (word === 'always' || word === 'every time' || word === 'all the time') {
          probe = `${word.charAt(0).toUpperCase() + word.slice(1)}? Can you think of even one exception?`;
        } else {
          probe = "That's a strong word. Is that true in every situation?";
        }

        return {
          type: 'generalizing',
          pattern: match[0],
          probe,
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  private static detectAssumingCause(message: string): DetectedDistortion | null {
    for (const pattern of this.ASSUMING_CAUSE_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const feeling = match[1] || 'react';

        const probes = [
          `How does what they're doing cause you to ${feeling} that way?`,
          `What is the connection between their action and how you ${feeling}?`,
          `In what way does that make you ${feeling}?`
        ];

        return {
          type: 'assuming_cause',
          pattern: match[0],
          probe: probes[Math.floor(Math.random() * probes.length)],
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  private static detectMindReading(message: string): DetectedDistortion | null {
    for (const pattern of this.MIND_READING_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const probes = [
          "How do you know they think that?",
          "What makes you certain about what they're thinking?",
          "Is it possible they might think something different?",
          "What evidence do you have for that belief?"
        ];

        return {
          type: 'mind_reading',
          pattern: match[0],
          probe: probes[Math.floor(Math.random() * probes.length)],
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  private static detectVague(message: string): DetectedDistortion | null {
    for (const pattern of this.VAGUE_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const action = match[0].toLowerCase().trim();

        const probes = [
          `How specifically did they ${action.replace(' me', '')}?`,
          `Can you describe exactly what happened?`,
          `What did they say or do that felt like ${action}?`
        ];

        return {
          type: 'vague',
          pattern: match[0],
          probe: probes[Math.floor(Math.random() * probes.length)],
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  static shouldUseProbe(
    turnCount: number,
    lastProbeUsed: boolean,
    hasDistortion: boolean
  ): boolean {
    if (!hasDistortion) {
      return false;
    }

    if (lastProbeUsed) {
      return false;
    }

    if (turnCount === 0) {
      return false;
    }

    return Math.random() < 0.4;
  }
}
