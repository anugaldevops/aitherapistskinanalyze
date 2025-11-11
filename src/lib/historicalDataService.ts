import { supabase } from './supabase';
import { journalService, JournalEntry } from './journalService';
import { getAnalysisHistory, SavedAnalysis } from './analysisHistoryDb';
import { privacyControlsService } from './privacyControlsService';

export interface TherapySessionData {
  id: string;
  sessionStartTime: string;
  sessionEndTime: string | null;
  conversationLog: Array<{ role: string; content: string; timestamp: string }>;
  moodsMentioned: string[];
  actionsTriggered: Array<{ action: string; timestamp: string }>;
  turnCount?: number;
  therapeuticModalities?: string[];
  crisisDetected?: boolean;
  innerChildWorkCount?: number;
}

export interface HistoricalContext {
  journals: {
    entries: JournalEntry[];
    totalCount: number;
    recentThemes: string[];
    emotionalPatterns: string[];
  };
  skinAnalyses: {
    analyses: SavedAnalysis[];
    overallTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
    averageClinicalScore: number;
    latestScore: number;
    significantChanges: string[];
  };
  therapySessions: {
    sessions: TherapySessionData[];
    totalSessions: number;
    commonMoods: string[];
    therapeuticProgress: string[];
    lastSessionSummary: string | null;
  };
  correlations: {
    stressSkinCorrelation: string | null;
    emotionalPatterns: string[];
    breakthroughMoments: string[];
  };
}

export interface DataAggregationOptions {
  daysBack?: number;
  maxJournalEntries?: number;
  maxTherapySessions?: number;
  maxSkinAnalyses?: number;
  includeFullConversations?: boolean;
  prioritizeRecent?: boolean;
}

export class HistoricalDataService {
  async getUserHistoricalContext(
    options: DataAggregationOptions = {}
  ): Promise<HistoricalContext | null> {
    try {
      const privacySettings = await privacyControlsService.getPrivacySettings();

      if (!privacySettings || !privacySettings.enableHistoricalContext) {
        console.log('Historical context disabled by user privacy settings');
        return null;
      }

      const {
        daysBack = privacySettings.historicalContextDays,
        maxJournalEntries = 10,
        maxTherapySessions = 5,
        maxSkinAnalyses = 10,
        includeFullConversations = false
      } = options;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const [journals, skinAnalyses, therapySessions] = await Promise.all([
        privacySettings.allowJournalAccess
          ? this.getJournalData(user.id, cutoffDate, maxJournalEntries)
          : this.getEmptyJournalData(),
        privacySettings.allowSkinAnalysisAccess
          ? this.getSkinAnalysisData(user.id, maxSkinAnalyses)
          : this.getEmptySkinAnalysisData(),
        privacySettings.allowTherapyHistoryAccess
          ? this.getTherapySessionData(user.id, cutoffDate, maxTherapySessions, includeFullConversations)
          : this.getEmptyTherapySessionData()
      ]);

      const correlations = this.generateCorrelations(journals, skinAnalyses, therapySessions);

      return {
        journals,
        skinAnalyses,
        therapySessions,
        correlations
      };
    } catch (error) {
      console.error('Error aggregating historical context:', error);
      return null;
    }
  }

  private getEmptyJournalData() {
    return {
      entries: [],
      totalCount: 0,
      recentThemes: [],
      emotionalPatterns: []
    };
  }

  private getEmptySkinAnalysisData() {
    return {
      analyses: [],
      overallTrend: 'insufficient_data' as const,
      averageClinicalScore: 0,
      latestScore: 0,
      significantChanges: []
    };
  }

  private getEmptyTherapySessionData() {
    return {
      sessions: [],
      totalSessions: 0,
      commonMoods: [],
      therapeuticProgress: [],
      lastSessionSummary: null
    };
  }

  private async getJournalData(
    _userId: string,
    cutoffDate: Date,
    maxEntries: number
  ) {
    const entries = await journalService.getRecentJournalEntries(maxEntries);

    const filteredEntries = entries.filter(
      entry => new Date(entry.entry_date) >= cutoffDate
    );

    const recentThemes = this.extractJournalThemes(filteredEntries);
    const emotionalPatterns = this.extractEmotionalPatterns(filteredEntries);

    return {
      entries: filteredEntries,
      totalCount: filteredEntries.length,
      recentThemes,
      emotionalPatterns
    };
  }

  private async getSkinAnalysisData(_userId: string, maxAnalyses: number) {
    const analyses = await getAnalysisHistory('photo_date', false);
    const recentAnalyses = analyses.slice(0, maxAnalyses);

    let overallTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data' = 'insufficient_data';
    let averageClinicalScore = 0;
    let latestScore = 0;

    if (recentAnalyses.length >= 2) {
      const scores = recentAnalyses.map(a => a.clinicalScore);
      averageClinicalScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      latestScore = scores[0];

      const oldestScore = scores[scores.length - 1];
      const scoreDiff = latestScore - oldestScore;

      if (Math.abs(scoreDiff) < 1) {
        overallTrend = 'stable';
      } else if (scoreDiff > 0) {
        overallTrend = 'improving';
      } else {
        overallTrend = 'declining';
      }
    } else if (recentAnalyses.length === 1) {
      latestScore = recentAnalyses[0].clinicalScore;
      averageClinicalScore = latestScore;
    }

    const significantChanges = this.identifySignificantSkinChanges(recentAnalyses);

    return {
      analyses: recentAnalyses,
      overallTrend,
      averageClinicalScore,
      latestScore,
      significantChanges
    };
  }

  private async getTherapySessionData(
    userId: string,
    cutoffDate: Date,
    maxSessions: number,
    includeFullConversations: boolean
  ) {
    const { data: sessions, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('session_start_time', cutoffDate.toISOString())
      .order('session_start_time', { ascending: false })
      .limit(maxSessions);

    if (error || !sessions) {
      return {
        sessions: [],
        totalSessions: 0,
        commonMoods: [],
        therapeuticProgress: [],
        lastSessionSummary: null
      };
    }

    const sessionData: TherapySessionData[] = sessions.map(session => ({
      id: session.id,
      sessionStartTime: session.session_start_time,
      sessionEndTime: session.session_end_time,
      conversationLog: includeFullConversations
        ? session.conversation_log
        : this.summarizeConversation(session.conversation_log),
      moodsMentioned: session.mood_mentioned || [],
      actionsTriggered: session.actions_triggered || [],
      turnCount: session.turn_count,
      therapeuticModalities: session.therapeutic_modalities_used || [],
      crisisDetected: session.crisis_detected || false,
      innerChildWorkCount: session.inner_child_work_count || 0
    }));

    const allMoods = sessionData.flatMap(s => s.moodsMentioned);
    const moodCounts = allMoods.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mood]) => mood);

    const therapeuticProgress = this.analyzeTherapeuticProgress(sessionData);
    const lastSessionSummary = sessionData.length > 0
      ? this.generateSessionSummary(sessionData[0])
      : null;

    return {
      sessions: sessionData,
      totalSessions: sessionData.length,
      commonMoods,
      therapeuticProgress,
      lastSessionSummary
    };
  }

  private summarizeConversation(conversationLog: any): any[] {
    if (!Array.isArray(conversationLog) || conversationLog.length === 0) {
      return [];
    }

    const maxMessages = 6;
    if (conversationLog.length <= maxMessages) {
      return conversationLog;
    }

    const summary = [
      conversationLog[0],
      conversationLog[1],
      {
        role: 'system',
        content: `[${conversationLog.length - 4} messages summarized]`,
        timestamp: new Date().toISOString()
      },
      ...conversationLog.slice(-2)
    ];

    return summary;
  }

  private extractJournalThemes(entries: JournalEntry[]): string[] {
    const themes: Set<string> = new Set();

    const themeKeywords = {
      'Self-reflection': ['myself', 'who i am', 'identity', 'self'],
      'Relationships': ['relationship', 'partner', 'friend', 'family', 'connection'],
      'Work & Career': ['work', 'job', 'career', 'boss', 'colleague'],
      'Emotional Growth': ['growth', 'healing', 'progress', 'better', 'changed'],
      'Anxiety & Stress': ['anxious', 'stress', 'worried', 'overwhelm', 'nervous'],
      'Depression': ['sad', 'depressed', 'hopeless', 'empty', 'numb'],
      'Trauma': ['trauma', 'past', 'hurt', 'pain', 'memory'],
      'Inner Child': ['child', 'younger', 'childhood', 'parent']
    };

    entries.forEach(entry => {
      const lowerText = entry.entry_text.toLowerCase();
      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
          themes.add(theme);
        }
      });
    });

    return Array.from(themes);
  }

  private extractEmotionalPatterns(entries: JournalEntry[]): string[] {
    const patterns: string[] = [];

    const recentEntries = entries.slice(0, 5);
    const emotions = recentEntries.map(e => e.mood_at_time).filter(Boolean);

    if (emotions.length >= 3) {
      const anxietyCount = emotions.filter(e =>
        ['anxious', 'worried', 'nervous'].includes(e.toLowerCase())
      ).length;

      if (anxietyCount >= 2) {
        patterns.push('Recurring anxiety noted in recent entries');
      }

      const positiveCount = emotions.filter(e =>
        ['happy', 'content', 'hopeful', 'calm'].includes(e.toLowerCase())
      ).length;

      if (positiveCount >= 2) {
        patterns.push('Positive emotional trend in recent reflections');
      }
    }

    const entryLengths = entries.map(e => e.entry_text.length);
    const avgLength = entryLengths.reduce((sum, len) => sum + len, 0) / entryLengths.length;

    if (avgLength > 500) {
      patterns.push('Deep, detailed reflections (high engagement)');
    } else if (avgLength < 100) {
      patterns.push('Brief, surface-level entries');
    }

    return patterns;
  }

  private identifySignificantSkinChanges(analyses: SavedAnalysis[]): string[] {
    const changes: string[] = [];

    if (analyses.length < 2) return changes;

    const latest = analyses[0];
    const previous = analyses[1];

    const scoreDiff = latest.clinicalScore - previous.clinicalScore;
    if (scoreDiff > 3) {
      changes.push(`Clinical score improved by ${scoreDiff.toFixed(1)} points recently`);
    } else if (scoreDiff < -3) {
      changes.push(`Clinical score decreased by ${Math.abs(scoreDiff).toFixed(1)} points recently`);
    }

    const skinAgeDiff = latest.skinAge - previous.skinAge;
    if (Math.abs(skinAgeDiff) > 2) {
      changes.push(`Skin age changed by ${skinAgeDiff > 0 ? '+' : ''}${skinAgeDiff.toFixed(1)} years`);
    }

    return changes;
  }

  private analyzeTherapeuticProgress(sessions: TherapySessionData[]): string[] {
    const progress: string[] = [];

    const allModalities = sessions.flatMap(s => s.therapeuticModalities || []);
    const uniqueModalities = [...new Set(allModalities)];

    if (uniqueModalities.length > 3) {
      progress.push(`Explored ${uniqueModalities.length} different therapeutic approaches`);
    }

    const crisisCount = sessions.filter(s => s.crisisDetected).length;
    if (crisisCount > 0) {
      progress.push(`${crisisCount} crisis intervention(s) provided`);
    }

    const innerChildSessions = sessions.filter(s => (s.innerChildWorkCount || 0) > 0).length;
    if (innerChildSessions > 0) {
      progress.push(`Inner child work explored in ${innerChildSessions} session(s)`);
    }

    return progress;
  }

  private generateSessionSummary(session: TherapySessionData): string {
    const moods = session.moodsMentioned.length > 0
      ? session.moodsMentioned.join(', ')
      : 'no specific moods mentioned';

    const date = new Date(session.sessionStartTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `Last session on ${date}: discussed ${moods}`;
  }

  private generateCorrelations(
    journals: any,
    skinAnalyses: any,
    therapySessions: any
  ) {
    const correlations: {
      stressSkinCorrelation: string | null;
      emotionalPatterns: string[];
      breakthroughMoments: string[];
    } = {
      stressSkinCorrelation: null,
      emotionalPatterns: [],
      breakthroughMoments: []
    };

    if (skinAnalyses.analyses.length >= 2 && therapySessions.commonMoods.length > 0) {
      const hasStressAnxiety = therapySessions.commonMoods.some((mood: string) =>
        ['stressed', 'anxious', 'worried', 'overwhelmed'].includes(mood.toLowerCase())
      );

      if (hasStressAnxiety && skinAnalyses.overallTrend === 'declining') {
        correlations.stressSkinCorrelation = 'Stress/anxiety may be affecting skin health';
      } else if (!hasStressAnxiety && skinAnalyses.overallTrend === 'improving') {
        correlations.stressSkinCorrelation = 'Emotional wellness correlates with skin improvement';
      }
    }

    if (journals.recentThemes.includes('Emotional Growth') &&
        skinAnalyses.overallTrend === 'improving') {
      correlations.emotionalPatterns.push('Personal growth journey reflected in wellness improvements');
    }

    const positiveShift = journals.emotionalPatterns.some((p: string) =>
      p.includes('Positive emotional trend')
    );
    if (positiveShift) {
      correlations.breakthroughMoments.push('Recent positive emotional shift detected in journals');
    }

    return correlations;
  }

  async generateContextSummary(
    context: HistoricalContext,
    maxTokens: number = 500
  ): Promise<string> {
    let summary = '';

    if (context.journals.totalCount > 0) {
      summary += `\n\n## Journal History (${context.journals.totalCount} entries)\n`;
      summary += `Themes: ${context.journals.recentThemes.join(', ') || 'None identified'}\n`;
      if (context.journals.emotionalPatterns.length > 0) {
        summary += `Patterns: ${context.journals.emotionalPatterns.join('; ')}\n`;
      }

      const recentEntry = context.journals.entries[0];
      if (recentEntry) {
        const preview = recentEntry.entry_text.substring(0, 150);
        const date = new Date(recentEntry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        summary += `Latest (${date}): "${preview}..."\n`;
      }
    }

    if (context.skinAnalyses.analyses.length > 0) {
      summary += `\n## Skin Analysis History (${context.skinAnalyses.analyses.length} analyses)\n`;
      summary += `Trend: ${context.skinAnalyses.overallTrend}\n`;
      summary += `Latest score: ${context.skinAnalyses.latestScore.toFixed(1)}, Avg: ${context.skinAnalyses.averageClinicalScore.toFixed(1)}\n`;
      if (context.skinAnalyses.significantChanges.length > 0) {
        summary += `Changes: ${context.skinAnalyses.significantChanges.join('; ')}\n`;
      }
    }

    if (context.therapySessions.totalSessions > 0) {
      summary += `\n## Therapy Session History (${context.therapySessions.totalSessions} sessions)\n`;
      if (context.therapySessions.commonMoods.length > 0) {
        summary += `Common themes: ${context.therapySessions.commonMoods.join(', ')}\n`;
      }
      if (context.therapySessions.therapeuticProgress.length > 0) {
        summary += `Progress: ${context.therapySessions.therapeuticProgress.join('; ')}\n`;
      }
      if (context.therapySessions.lastSessionSummary) {
        summary += `${context.therapySessions.lastSessionSummary}\n`;
      }
    }

    if (context.correlations.stressSkinCorrelation) {
      summary += `\n## Key Insight\n${context.correlations.stressSkinCorrelation}\n`;
    }

    if (context.correlations.emotionalPatterns.length > 0) {
      summary += `Patterns: ${context.correlations.emotionalPatterns.join('; ')}\n`;
    }

    if (summary.length > maxTokens * 4) {
      summary = summary.substring(0, maxTokens * 4) + '\n...[truncated]';
    }

    return summary;
  }

  async getConversationContext(sessionCount: number = 3): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '';

    const { data: sessions } = await supabase
      .from('therapy_sessions')
      .select('conversation_log, session_start_time, mood_mentioned')
      .eq('user_id', user.id)
      .order('session_start_time', { ascending: false })
      .limit(sessionCount);

    if (!sessions || sessions.length === 0) {
      return '';
    }

    let context = '\n\n## Recent Conversation History\n';

    sessions.reverse().forEach((session, index) => {
      const date = new Date(session.session_start_time).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      context += `\n### Session ${index + 1} (${date})\n`;

      if (session.mood_mentioned && session.mood_mentioned.length > 0) {
        context += `Moods: ${session.mood_mentioned.join(', ')}\n`;
      }

      const conversationLog = session.conversation_log as Array<{ role: string; content: string }>;
      if (Array.isArray(conversationLog) && conversationLog.length > 0) {
        const summary = conversationLog.slice(0, 4).map(msg => {
          const preview = msg.content.substring(0, 100);
          return `${msg.role}: ${preview}${msg.content.length > 100 ? '...' : ''}`;
        }).join('\n');
        context += `${summary}\n`;
      }
    });

    return context;
  }
}

export const historicalDataService = new HistoricalDataService();
