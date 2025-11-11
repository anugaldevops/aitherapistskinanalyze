export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'achievement';
  icon: string;
  title: string;
  message: string;
  priority: number;
}

interface AnalysisData {
  id: string;
  date: string;
  clinicalScore: number;
  skinAge: number;
  zoneScores?: Record<string, number>;
}

interface RoutineAdherence {
  percentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export function generateInsights(
  analyses: AnalysisData[],
  routineAdherence?: RoutineAdherence
): Insight[] {
  const insights: Insight[] = [];

  if (analyses.length === 0) {
    return insights;
  }

  const scoreInsights = generateScoreInsights(analyses);
  insights.push(...scoreInsights);

  const skinAgeInsights = generateSkinAgeInsights(analyses);
  insights.push(...skinAgeInsights);

  if (analyses.length >= 2) {
    const trendInsights = generateTrendInsights(analyses);
    insights.push(...trendInsights);
  }

  if (routineAdherence) {
    const adherenceInsights = generateAdherenceInsights(routineAdherence);
    insights.push(...adherenceInsights);
  }

  if (analyses.length >= 3) {
    const zoneInsights = generateZoneInsights(analyses);
    insights.push(...zoneInsights);
  }

  if (analyses.length >= 2) {
    const predictionInsights = generatePredictionInsights(analyses);
    insights.push(...predictionInsights);
  }

  insights.sort((a, b) => b.priority - a.priority);

  return insights.slice(0, 5);
}

function generateScoreInsights(analyses: AnalysisData[]): Insight[] {
  const insights: Insight[] = [];

  if (analyses.length < 2) return insights;

  const latest = analyses[analyses.length - 1];
  const previous = analyses[analyses.length - 2];
  const scoreDiff = latest.clinicalScore - previous.clinicalScore;

  if (scoreDiff <= -2) {
    const monthsApart = Math.round(
      (new Date(latest.date).getTime() - new Date(previous.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    insights.push({
      id: 'score-improvement',
      type: 'success',
      icon: '🎉',
      title: 'Great Progress!',
      message: `Your clinical score improved by ${Math.abs(scoreDiff)} points over ${monthsApart} month${monthsApart > 1 ? 's' : ''}. Keep up your routine!`,
      priority: 10
    });
  } else if (scoreDiff >= 2) {
    insights.push({
      id: 'score-decline',
      type: 'warning',
      icon: '⚠️',
      title: 'Attention Needed',
      message: `Your clinical score increased by ${scoreDiff} points. Review your routine and lifestyle factors.`,
      priority: 9
    });
  } else if (scoreDiff === 0 && analyses.length >= 3) {
    insights.push({
      id: 'score-stable',
      type: 'info',
      icon: '📊',
      title: 'Stable Results',
      message: 'Your skin condition is maintaining. Consistency is key to long-term improvement.',
      priority: 5
    });
  }

  if (latest.clinicalScore <= 8) {
    insights.push({
      id: 'excellent-score',
      type: 'achievement',
      icon: '🏆',
      title: 'Excellent Skin Health!',
      message: `Your score of ${latest.clinicalScore}/21 indicates very healthy skin. You're doing everything right!`,
      priority: 8
    });
  }

  return insights;
}

function generateSkinAgeInsights(analyses: AnalysisData[]): Insight[] {
  const insights: Insight[] = [];

  if (analyses.length < 2) return insights;

  const latest = analyses[analyses.length - 1];
  const previous = analyses[analyses.length - 2];
  const ageDiff = latest.skinAge - previous.skinAge;

  if (ageDiff < 0) {
    insights.push({
      id: 'skin-age-younger',
      type: 'success',
      icon: '✨',
      title: 'Looking Younger!',
      message: `Your skin age decreased by ${Math.abs(ageDiff)} year${Math.abs(ageDiff) > 1 ? 's' : ''}. Your skincare routine is reversing visible aging!`,
      priority: 9
    });
  } else if (ageDiff > 2) {
    insights.push({
      id: 'skin-age-increase',
      type: 'warning',
      icon: '👀',
      title: 'Skin Age Alert',
      message: `Your skin age increased by ${ageDiff} years. Consider adjusting your routine or consulting a dermatologist.`,
      priority: 8
    });
  }

  return insights;
}

function generateTrendInsights(analyses: AnalysisData[]): Insight[] {
  const insights: Insight[] = [];

  const recentThree = analyses.slice(-3);
  const scores = recentThree.map(a => a.clinicalScore);

  const isImproving = scores[2] < scores[1] && scores[1] < scores[0];
  const isDeclining = scores[2] > scores[1] && scores[1] > scores[0];

  if (isImproving) {
    insights.push({
      id: 'consistent-improvement',
      type: 'success',
      icon: '📈',
      title: 'Consistent Improvement!',
      message: 'Your last 3 scans show steady progress. Whatever you\'re doing is working beautifully!',
      priority: 9
    });
  } else if (isDeclining) {
    insights.push({
      id: 'declining-trend',
      type: 'warning',
      icon: '📉',
      title: 'Declining Trend',
      message: 'Recent scans show a concerning pattern. Time to reassess your skincare approach.',
      priority: 10
    });
  }

  return insights;
}

function generateAdherenceInsights(adherence: RoutineAdherence): Insight[] {
  const insights: Insight[] = [];

  if (adherence.percentage >= 90) {
    insights.push({
      id: 'high-adherence',
      type: 'achievement',
      icon: '💪',
      title: 'Consistency Pays Off!',
      message: `${adherence.percentage}% routine adherence this month is excellent! Your dedication will show results.`,
      priority: 7
    });
  } else if (adherence.percentage >= 70) {
    insights.push({
      id: 'good-adherence',
      type: 'info',
      icon: '👍',
      title: 'Good Consistency',
      message: `${adherence.percentage}% adherence is solid. A bit more consistency could accelerate your progress.`,
      priority: 5
    });
  } else if (adherence.percentage < 50) {
    insights.push({
      id: 'low-adherence',
      type: 'warning',
      icon: '🔔',
      title: 'Routine Consistency',
      message: `Only ${adherence.percentage}% adherence this month. Consistent application is crucial for visible results.`,
      priority: 8
    });
  }

  if (adherence.trend === 'improving') {
    insights.push({
      id: 'improving-adherence',
      type: 'success',
      icon: '📊',
      title: 'Building Better Habits!',
      message: 'Your routine consistency is improving month over month. Keep building that momentum!',
      priority: 6
    });
  }

  return insights;
}

function generateZoneInsights(analyses: AnalysisData[]): Insight[] {
  const insights: Insight[] = [];

  if (!analyses[0].zoneScores || !analyses[analyses.length - 1].zoneScores) {
    return insights;
  }

  const latest = analyses[analyses.length - 1];
  const previous = analyses[0];

  const zoneNames: Record<string, string> = {
    forehead: 'forehead wrinkles',
    crowsFeet: 'crow\'s feet',
    underEye: 'under-eye area',
    nasolabial: 'smile lines',
    cheeks: 'cheek area',
    perioral: 'around mouth'
  };

  const improvementThreshold = -0.5;
  const worseningThreshold = 0.5;

  for (const [zone, latestScore] of Object.entries(latest.zoneScores || {})) {
    const previousScore = previous.zoneScores?.[zone];
    if (previousScore === undefined) continue;

    const diff = latestScore - previousScore;
    const zoneName = zoneNames[zone] || zone;

    if (diff <= improvementThreshold) {
      insights.push({
        id: `zone-improved-${zone}`,
        type: 'success',
        icon: '✨',
        title: 'Zone Improvement!',
        message: `Your ${zoneName} improved from ${previousScore.toFixed(1)}/3 to ${latestScore.toFixed(1)}/3. Great progress in this area!`,
        priority: 7
      });
    } else if (diff >= worseningThreshold) {
      insights.push({
        id: `zone-worse-${zone}`,
        type: 'warning',
        icon: '👀',
        title: 'Zone Attention',
        message: `Your ${zoneName} increased from ${previousScore.toFixed(1)}/3 to ${latestScore.toFixed(1)}/3. Consider targeted treatment.`,
        priority: 7
      });
    }
  }

  return insights;
}

function generatePredictionInsights(analyses: AnalysisData[]): Insight[] {
  const insights: Insight[] = [];

  if (analyses.length < 3) return insights;

  const recentScores = analyses.slice(-3).map(a => a.clinicalScore);
  const avgChange = (recentScores[2] - recentScores[0]) / 2;

  if (Math.abs(avgChange) < 0.5) {
    return insights;
  }

  const currentScore = recentScores[2];
  const predictedScore = Math.max(0, Math.min(21, Math.round(currentScore + avgChange * 6)));

  if (avgChange < 0) {
    insights.push({
      id: 'prediction-improvement',
      type: 'info',
      icon: '🔮',
      title: 'Positive Trajectory',
      message: `At your current rate of improvement, you may reach a score of ${predictedScore}/21 in 6 months. Stay consistent!`,
      priority: 6
    });
  } else if (avgChange > 0) {
    insights.push({
      id: 'prediction-decline',
      type: 'warning',
      icon: '📊',
      title: 'Trend Projection',
      message: `Current trend suggests a score of ${predictedScore}/21 in 6 months. Consider intervention now.`,
      priority: 8
    });
  }

  return insights;
}

export function generateMockInsights(): Insight[] {
  return [
    {
      id: 'mock-1',
      type: 'success',
      icon: '🎉',
      title: 'Great Progress!',
      message: 'Your clinical score improved by 4 points over 3 months. Keep up your routine!',
      priority: 10
    },
    {
      id: 'mock-2',
      type: 'achievement',
      icon: '💪',
      title: 'Consistency Pays Off!',
      message: '90% routine adherence this month is excellent! Your dedication will show results.',
      priority: 9
    },
    {
      id: 'mock-3',
      type: 'success',
      icon: '✨',
      title: 'Forehead Improvement!',
      message: 'Forehead wrinkles reduced from 2.0/3 to 1.0/3. Your retinol is working!',
      priority: 8
    },
    {
      id: 'mock-4',
      type: 'info',
      icon: '🔮',
      title: 'Positive Trajectory',
      message: 'At your current rate, you may reach a score of 12/21 in 6 months. Stay consistent!',
      priority: 7
    }
  ];
}
