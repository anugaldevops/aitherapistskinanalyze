import { SkinAgeEstimate } from './skinAgeCalculation';
import { ClinicalScore } from './clinicalScoring';

const HISTORY_KEY = 'skinage_analysis_history';
const MAX_HISTORY_ITEMS = 10;

export interface SavedAnalysis {
  id: string;
  date: string;
  timestamp: number;
  photoDate?: string;
  actualAge: number;
  ageInPhoto?: number;
  skinAge: number;
  clinicalScore: number;
  maxClinicalScore: number;
  compositeIndex: number;
  topProblemZones: Array<{
    name: string;
    score: number;
  }>;
  skincareRoutine?: string;
  lifestyleHabits?: string[];
  notes?: string;
  rawData: {
    skinAgeEstimate: SkinAgeEstimate;
    clinicalScore: ClinicalScore;
  };
}

export function saveAnalysis(
  skinAgeEstimate: SkinAgeEstimate,
  clinicalScore: ClinicalScore,
  actualAge: number
): SavedAnalysis {
  const timestamp = Date.now();
  const date = new Date(timestamp).toISOString();

  const topZones = clinicalScore.zones
    .map(zone => ({
      name: zone.displayName,
      score: zone.wrinkleScore + zone.pigmentationScore + zone.radianceScore
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const analysis: SavedAnalysis = {
    id: `analysis_${timestamp}`,
    date,
    timestamp,
    actualAge,
    skinAge: skinAgeEstimate.estimatedSkinAge,
    clinicalScore: clinicalScore.totalScore,
    maxClinicalScore: clinicalScore.maxScore,
    compositeIndex: skinAgeEstimate.compositeIndex,
    topProblemZones: topZones,
    rawData: {
      skinAgeEstimate,
      clinicalScore
    }
  };

  const history = getAnalysisHistory();
  history.unshift(analysis);

  if (history.length > MAX_HISTORY_ITEMS) {
    history.splice(MAX_HISTORY_ITEMS);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  console.log('✅ Analysis saved to history:', analysis.id);

  return analysis;
}

export function getAnalysisHistory(): SavedAnalysis[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as SavedAnalysis[];
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error loading analysis history:', error);
    return [];
  }
}

export function getAnalysisById(id: string): SavedAnalysis | null {
  const history = getAnalysisHistory();
  return history.find(item => item.id === id) || null;
}

export function deleteAnalysis(id: string): void {
  const history = getAnalysisHistory();
  const filtered = history.filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  console.log('🗑️ Analysis deleted:', id);
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  console.log('🗑️ Analysis history cleared');
}

export function getHistoryCount(): number {
  return getAnalysisHistory().length;
}

export function getLatestAnalysis(): SavedAnalysis | null {
  const history = getAnalysisHistory();
  return history.length > 0 ? history[0] : null;
}

export function calculateTrend(history: SavedAnalysis[]): {
  improving: boolean;
  change: number;
  metric: 'score' | 'skinAge';
} | null {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  const scoreChange = newest.clinicalScore - oldest.clinicalScore;
  const skinAgeChange = newest.skinAge - oldest.skinAge;

  if (Math.abs(scoreChange) >= Math.abs(skinAgeChange)) {
    return {
      improving: scoreChange > 0,
      change: scoreChange,
      metric: 'score'
    };
  } else {
    return {
      improving: skinAgeChange < 0,
      change: Math.abs(skinAgeChange),
      metric: 'skinAge'
    };
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}
