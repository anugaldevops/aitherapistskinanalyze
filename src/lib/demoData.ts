export interface DemoAnalysis {
  clinicalScore: number;
  skinAge: number;
  date: string;
}

export interface DemoWellness {
  mental: number;
  sleep: string;
  exercise: string;
  stressTrend: string;
}

export const DEMO_ANALYSIS: DemoAnalysis[] = [
  {
    clinicalScore: 68,
    skinAge: 28,
    date: '2025-11-10'
  },
  {
    clinicalScore: 72,
    skinAge: 27,
    date: '2025-11-11'
  }
];

export const DEMO_WELLNESS: DemoWellness = {
  mental: 65,
  sleep: 'improving',
  exercise: 'consistent',
  stressTrend: 'decreasing'
};

export const DEMO_THERAPY_TIPS: string[] = [
  'Practice grounding: Identify 5 things you see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste',
  'Reconnect with your inner child through a favorite childhood activity or hobby',
  'Use 4-7-8 breathing before bed: Inhale for 4 counts, hold for 7, exhale for 8',
  'Journal about three things that brought you joy today, no matter how small',
  'Take a 10-minute nature walk or simply observe natural elements around you',
  'Practice self-compassion by speaking to yourself as you would to a close friend'
];

export function getLatestAnalysis(): DemoAnalysis | null {
  if (typeof window === 'undefined') return null;

  try {
    const analyses = localStorage.getItem('analyses');
    if (!analyses) return DEMO_ANALYSIS[DEMO_ANALYSIS.length - 1];

    const parsed = JSON.parse(analyses);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const latest = parsed[parsed.length - 1];
      return {
        clinicalScore: latest.clinicalScore || latest.clinical_score || 70,
        skinAge: latest.skinAge || latest.skin_age || 30,
        date: latest.date || latest.analyzed_at || new Date().toISOString()
      };
    }

    return DEMO_ANALYSIS[DEMO_ANALYSIS.length - 1];
  } catch (error) {
    console.error('Error fetching latest analysis:', error);
    return DEMO_ANALYSIS[DEMO_ANALYSIS.length - 1];
  }
}

export function getDashboardWellness(): DemoWellness {
  return DEMO_WELLNESS;
}

export function getRandomTherapyTip(): string {
  const randomIndex = Math.floor(Math.random() * DEMO_THERAPY_TIPS.length);
  return DEMO_THERAPY_TIPS[randomIndex];
}
