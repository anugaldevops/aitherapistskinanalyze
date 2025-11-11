export class ShortReplyUtility {
  private static readonly MAX_LENGTH = 220;
  private static readonly QUESTION_MARKERS = ['?', 'what', 'how', 'why', 'when', 'where', 'who', 'can you', 'would you', 'could you', 'do you'];

  static trimToMaxLength(text: string): string {
    if (text.length <= this.MAX_LENGTH) {
      return text;
    }

    const sentences = this.splitIntoSentences(text);
    let result = '';
    let questionCount = 0;

    for (const sentence of sentences) {
      const testResult = result + (result ? ' ' : '') + sentence;

      if (testResult.length > this.MAX_LENGTH) {
        break;
      }

      const isQuestion = this.isQuestion(sentence);
      if (isQuestion && questionCount >= 1) {
        continue;
      }

      result = testResult;
      if (isQuestion) {
        questionCount++;
      }
    }

    if (!result) {
      result = text.substring(0, this.MAX_LENGTH - 3).trim() + '...';
    }

    return result.trim();
  }

  static enforceOneQuestion(text: string): string {
    const sentences = this.splitIntoSentences(text);
    const result: string[] = [];
    let questionCount = 0;

    for (const sentence of sentences) {
      const isQuestion = this.isQuestion(sentence);

      if (isQuestion) {
        if (questionCount === 0) {
          result.push(sentence);
          questionCount++;
        }
      } else {
        result.push(sentence);
      }
    }

    return result.join(' ').trim();
  }

  static formatShortReply(text: string): string {
    let processed = this.enforceOneQuestion(text);
    processed = this.trimToMaxLength(processed);
    processed = this.removeTrailingEllipsis(processed);
    return processed;
  }

  private static splitIntoSentences(text: string): string[] {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = text.match(sentenceRegex);

    if (!matches) {
      return [text];
    }

    return matches.map(s => s.trim()).filter(s => s.length > 0);
  }

  private static isQuestion(sentence: string): boolean {
    const lowerSentence = sentence.toLowerCase().trim();

    if (lowerSentence.endsWith('?')) {
      return true;
    }

    return this.QUESTION_MARKERS.some(marker =>
      lowerSentence.includes(marker.toLowerCase())
    );
  }

  private static removeTrailingEllipsis(text: string): string {
    return text.replace(/\.{3,}$/, '').trim();
  }

  static countQuestions(text: string): number {
    const sentences = this.splitIntoSentences(text);
    return sentences.filter(s => this.isQuestion(s)).length;
  }

  static shouldShorten(text: string): boolean {
    return text.length > this.MAX_LENGTH || this.countQuestions(text) > 1;
  }
}
