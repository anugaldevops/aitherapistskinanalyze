import { historicalDataService, HistoricalContext } from './historicalDataService';

export interface EnrichedPromptContext {
  systemPromptAddition: string;
  recentInsights: string[];
  patternHighlights: string[];
  correlationNotes: string[];
  userJourneySnapshot: string;
}

export interface ContextPriority {
  includeJournals: boolean;
  includeSkinAnalyses: boolean;
  includeTherapySessions: boolean;
  prioritizeEmotionalPatterns: boolean;
  prioritizeProgressIndicators: boolean;
  maxContextLength: number;
}

export class ContextEnrichmentService {
  private readonly TOKEN_ESTIMATE_RATIO = 4;
  private readonly DEFAULT_MAX_TOKENS = 800;

  async buildEnrichedContext(
    priority: Partial<ContextPriority> = {}
  ): Promise<EnrichedPromptContext | null> {
    const {
      includeJournals = true,
      includeSkinAnalyses = true,
      includeTherapySessions = true,
      prioritizeEmotionalPatterns = true,
      prioritizeProgressIndicators = true,
      maxContextLength = this.DEFAULT_MAX_TOKENS
    } = priority;

    try {
      const historicalContext = await historicalDataService.getUserHistoricalContext({
        daysBack: 90,
        maxJournalEntries: includeJournals ? 8 : 0,
        maxTherapySessions: includeTherapySessions ? 5 : 0,
        maxSkinAnalyses: includeSkinAnalyses ? 8 : 0,
        includeFullConversations: false,
        prioritizeRecent: true
      });

      if (!historicalContext) {
        return null;
      }

      const enrichedContext = this.generateEnrichedPrompt(
        historicalContext,
        {
          prioritizeEmotionalPatterns,
          prioritizeProgressIndicators,
          maxTokens: maxContextLength
        }
      );

      return enrichedContext;
    } catch (error) {
      console.error('Error building enriched context:', error);
      return null;
    }
  }

  private generateEnrichedPrompt(
    context: HistoricalContext,
    options: {
      prioritizeEmotionalPatterns: boolean;
      prioritizeProgressIndicators: boolean;
      maxTokens: number;
    }
  ): EnrichedPromptContext {
    const recentInsights: string[] = [];
    const patternHighlights: string[] = [];
    const correlationNotes: string[] = [];
    let systemPromptAddition = '';

    if (context.journals.totalCount > 0) {
      recentInsights.push(
        `User has ${context.journals.totalCount} journal entries showing themes: ${context.journals.recentThemes.slice(0, 3).join(', ')}`
      );

      if (context.journals.emotionalPatterns.length > 0 && options.prioritizeEmotionalPatterns) {
        patternHighlights.push(...context.journals.emotionalPatterns);
      }

      const latestEntry = context.journals.entries[0];
      if (latestEntry) {
        const daysAgo = Math.floor(
          (Date.now() - new Date(latestEntry.entry_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        recentInsights.push(`Last journaled ${daysAgo} days ago about: "${latestEntry.prompt}"`);
      }
    }

    if (context.skinAnalyses.analyses.length > 0) {
      const trendText = this.getTrendDescription(context.skinAnalyses.overallTrend);
      recentInsights.push(
        `Skin health trend: ${trendText} (score: ${context.skinAnalyses.latestScore.toFixed(1)})`
      );

      if (context.skinAnalyses.significantChanges.length > 0 && options.prioritizeProgressIndicators) {
        patternHighlights.push(...context.skinAnalyses.significantChanges);
      }
    }

    if (context.therapySessions.totalSessions > 0) {
      recentInsights.push(
        `${context.therapySessions.totalSessions} recent therapy sessions. Common themes: ${context.therapySessions.commonMoods.slice(0, 3).join(', ')}`
      );

      if (context.therapySessions.therapeuticProgress.length > 0 && options.prioritizeProgressIndicators) {
        patternHighlights.push(...context.therapySessions.therapeuticProgress);
      }

      if (context.therapySessions.lastSessionSummary) {
        recentInsights.push(context.therapySessions.lastSessionSummary);
      }
    }

    if (context.correlations.stressSkinCorrelation) {
      correlationNotes.push(context.correlations.stressSkinCorrelation);
    }

    if (context.correlations.emotionalPatterns.length > 0) {
      correlationNotes.push(...context.correlations.emotionalPatterns);
    }

    if (context.correlations.breakthroughMoments.length > 0) {
      patternHighlights.push(...context.correlations.breakthroughMoments);
    }

    systemPromptAddition = this.buildSystemPromptAddition(
      recentInsights,
      patternHighlights,
      correlationNotes,
      options.maxTokens
    );

    const userJourneySnapshot = this.generateJourneySnapshot(context);

    return {
      systemPromptAddition,
      recentInsights,
      patternHighlights,
      correlationNotes,
      userJourneySnapshot
    };
  }

  private buildSystemPromptAddition(
    insights: string[],
    patterns: string[],
    correlations: string[],
    maxTokens: number
  ): string {
    let addition = '\n\n## USER HISTORICAL CONTEXT\n';

    if (insights.length > 0) {
      addition += '\nRecent Activity:\n';
      insights.slice(0, 3).forEach(insight => {
        addition += `- ${insight}\n`;
      });
    }

    if (patterns.length > 0) {
      addition += '\nObserved Patterns:\n';
      patterns.slice(0, 3).forEach(pattern => {
        addition += `- ${pattern}\n`;
      });
    }

    if (correlations.length > 0) {
      addition += '\nKey Insights:\n';
      correlations.slice(0, 2).forEach(correlation => {
        addition += `- ${correlation}\n`;
      });
    }

    addition += '\nInstructions:\n';
    addition += '- Reference past conversations and journal entries naturally when relevant\n';
    addition += '- Acknowledge patterns and progress you observe\n';
    addition += '- Draw connections between emotional state and physical wellness\n';
    addition += '- Celebrate breakthroughs and validate struggles based on history\n';
    addition += '- Do not overwhelm the user by mentioning too much history at once\n';

    const estimatedTokens = addition.length / this.TOKEN_ESTIMATE_RATIO;
    if (estimatedTokens > maxTokens) {
      const targetLength = Math.floor(maxTokens * this.TOKEN_ESTIMATE_RATIO * 0.9);
      addition = addition.substring(0, targetLength) + '\n...[context optimized for brevity]';
    }

    return addition;
  }

  private getTrendDescription(trend: string): string {
    const descriptions: Record<string, string> = {
      improving: 'improving positively',
      declining: 'showing some challenges',
      stable: 'maintaining steadily',
      insufficient_data: 'needs more data for trends'
    };
    return descriptions[trend] || 'unknown';
  }

  private generateJourneySnapshot(context: HistoricalContext): string {
    const snapshot: string[] = [];

    if (context.journals.totalCount > 0) {
      snapshot.push(`📝 ${context.journals.totalCount} journal reflections exploring ${context.journals.recentThemes.join(', ')}`);
    }

    if (context.skinAnalyses.analyses.length >= 2) {
      const trend = context.skinAnalyses.overallTrend;
      const emoji = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
      snapshot.push(`${emoji} Wellness trend: ${this.getTrendDescription(trend)}`);
    }

    if (context.therapySessions.totalSessions > 0) {
      snapshot.push(`💬 ${context.therapySessions.totalSessions} therapy conversations`);
    }

    if (context.correlations.breakthroughMoments.length > 0) {
      snapshot.push(`✨ Recent breakthrough moments identified`);
    }

    return snapshot.join(' • ');
  }

  async getConversationStarters(context: HistoricalContext): Promise<string[]> {
    const starters: string[] = [];

    if (context.journals.entries.length > 0) {
      const latestEntry = context.journals.entries[0];
      const daysAgo = Math.floor(
        (Date.now() - new Date(latestEntry.entry_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysAgo <= 7) {
        starters.push(`I see you journaled recently about "${latestEntry.prompt}". How are those thoughts evolving?`);
      }
    }

    if (context.skinAnalyses.overallTrend === 'improving' && context.therapySessions.commonMoods.length > 0) {
      starters.push('Your skin health has been improving. I wonder if that connects to the inner work you\'ve been doing?');
    }

    if (context.correlations.breakthroughMoments.length > 0) {
      starters.push('I noticed some positive shifts in your recent reflections. What feels different for you?');
    }

    if (context.therapySessions.commonMoods.includes('anxious') || context.therapySessions.commonMoods.includes('stressed')) {
      starters.push('Anxiety and stress have come up in our conversations. How are you managing those feelings today?');
    }

    return starters;
  }

  estimateContextTokens(context: string): number {
    return Math.ceil(context.length / this.TOKEN_ESTIMATE_RATIO);
  }

  optimizeContextForTokenLimit(context: string, maxTokens: number): string {
    const estimatedTokens = this.estimateContextTokens(context);

    if (estimatedTokens <= maxTokens) {
      return context;
    }

    const targetLength = Math.floor(maxTokens * this.TOKEN_ESTIMATE_RATIO * 0.95);

    const sections = context.split('\n\n');

    let optimized = '';
    let currentLength = 0;

    for (const section of sections) {
      if (currentLength + section.length + 2 > targetLength) {
        optimized += '\n\n[Additional context available but truncated for brevity]';
        break;
      }
      optimized += (optimized ? '\n\n' : '') + section;
      currentLength += section.length + 2;
    }

    return optimized;
  }

  async getTimeBasedContext(daysBack: number): Promise<string> {
    const context = await historicalDataService.getUserHistoricalContext({
      daysBack,
      maxJournalEntries: 5,
      maxTherapySessions: 3,
      maxSkinAnalyses: 5
    });

    if (!context) {
      return '';
    }

    return await historicalDataService.generateContextSummary(context, 400);
  }
}

export const contextEnrichmentService = new ContextEnrichmentService();
