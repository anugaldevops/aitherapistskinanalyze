import { supabase } from './supabase';

export interface ZoneImprovement {
  zoneName: string;
  previousScore: number;
  currentScore: number;
  change: number;
  percentageChange: number;
  improving: boolean;
}

export interface ImprovementAnalysis {
  hasHistory: boolean;
  clinicalScoreChange: number;
  clinicalScorePercentChange: number;
  skinAgeChange: number;
  overallTrend: 'improving' | 'stable' | 'declining';
  daysBetweenAnalyses: number;
  topImprovements: ZoneImprovement[];
  topDeclines: ZoneImprovement[];
  previousAnalysisDate: string | null;
  currentAnalysisDate: string | null;
  insightText: string;
}

export interface HistoricalTrend {
  totalAnalyses: number;
  firstAnalysisDate: string | null;
  latestAnalysisDate: string | null;
  overallClinicalScoreChange: number;
  overallSkinAgeChange: number;
  averageMonthlyImprovement: number;
  consistentlyImproving: boolean;
}

export class SkinImprovementService {
  async getImprovementAnalysis(): Promise<ImprovementAnalysis | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: analyses, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('analysis_date', { ascending: false })
        .limit(2);

      if (error || !analyses || analyses.length < 2) {
        return {
          hasHistory: false,
          clinicalScoreChange: 0,
          clinicalScorePercentChange: 0,
          skinAgeChange: 0,
          overallTrend: 'stable',
          daysBetweenAnalyses: 0,
          topImprovements: [],
          topDeclines: [],
          previousAnalysisDate: null,
          currentAnalysisDate: null,
          insightText: 'No previous analysis found for comparison.'
        };
      }

      const currentAnalysis = analyses[0];
      const previousAnalysis = analyses[1];

      const clinicalScoreChange = currentAnalysis.clinical_score - previousAnalysis.clinical_score;
      const clinicalScorePercentChange = previousAnalysis.clinical_score > 0
        ? (clinicalScoreChange / previousAnalysis.clinical_score) * 100
        : 0;

      const skinAgeChange = currentAnalysis.skin_age - previousAnalysis.skin_age;

      const daysBetween = Math.floor(
        (new Date(currentAnalysis.analysis_date).getTime() -
          new Date(previousAnalysis.analysis_date).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      const zoneImprovements = this.calculateZoneImprovements(
        previousAnalysis.zone_scores,
        currentAnalysis.zone_scores
      );

      const improving = zoneImprovements.filter(z => z.improving);
      const declining = zoneImprovements.filter(z => !z.improving);

      const topImprovements = improving
        .sort((a, b) => b.percentageChange - a.percentageChange)
        .slice(0, 3);

      const topDeclines = declining
        .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
        .slice(0, 3);

      let overallTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (clinicalScoreChange > 1 || skinAgeChange < -0.5) {
        overallTrend = 'improving';
      } else if (clinicalScoreChange < -1 || skinAgeChange > 0.5) {
        overallTrend = 'declining';
      }

      const insightText = this.generateInsightText(
        clinicalScoreChange,
        skinAgeChange,
        topImprovements,
        topDeclines,
        daysBetween
      );

      return {
        hasHistory: true,
        clinicalScoreChange,
        clinicalScorePercentChange,
        skinAgeChange,
        overallTrend,
        daysBetweenAnalyses: daysBetween,
        topImprovements,
        topDeclines,
        previousAnalysisDate: previousAnalysis.analysis_date,
        currentAnalysisDate: currentAnalysis.analysis_date,
        insightText
      };
    } catch (error) {
      console.error('Error in getImprovementAnalysis:', error);
      return null;
    }
  }

  private calculateZoneImprovements(
    previousZones: any,
    currentZones: any
  ): ZoneImprovement[] {
    const improvements: ZoneImprovement[] = [];

    if (!previousZones || !currentZones) {
      return improvements;
    }

    for (const zoneName in currentZones) {
      if (previousZones[zoneName]) {
        const prevTotal = previousZones[zoneName].total || 0;
        const currTotal = currentZones[zoneName].total || 0;
        const change = currTotal - prevTotal;
        const percentageChange = prevTotal > 0 ? (change / prevTotal) * 100 : 0;

        improvements.push({
          zoneName,
          previousScore: prevTotal,
          currentScore: currTotal,
          change,
          percentageChange,
          improving: change > 0
        });
      }
    }

    return improvements;
  }

  private generateInsightText(
    clinicalScoreChange: number,
    skinAgeChange: number,
    topImprovements: ZoneImprovement[],
    topDeclines: ZoneImprovement[],
    daysBetween: number
  ): string {
    const insights: string[] = [];

    if (clinicalScoreChange > 2) {
      insights.push(`Your clinical score improved by ${clinicalScoreChange.toFixed(1)} points`);
    } else if (clinicalScoreChange < -2) {
      insights.push(`Your clinical score declined by ${Math.abs(clinicalScoreChange).toFixed(1)} points`);
    } else {
      insights.push('Your clinical score remained stable');
    }

    if (skinAgeChange < -1) {
      insights.push(`your skin age reduced by ${Math.abs(skinAgeChange).toFixed(1)} years`);
    } else if (skinAgeChange > 1) {
      insights.push(`your skin age increased by ${skinAgeChange.toFixed(1)} years`);
    }

    if (topImprovements.length > 0) {
      const topZone = topImprovements[0];
      insights.push(`${topZone.zoneName} showed the most improvement (${topZone.percentageChange.toFixed(0)}% better)`);
    }

    if (topDeclines.length > 0 && topDeclines[0].percentageChange < -5) {
      const topDeclineZone = topDeclines[0];
      insights.push(`${topDeclineZone.zoneName} needs attention`);
    }

    if (daysBetween > 0) {
      insights.push(`over ${daysBetween} days`);
    }

    return insights.join(', ') + '.';
  }

  async getHistoricalTrend(): Promise<HistoricalTrend | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: analyses, error } = await supabase
        .from('analysis_history')
        .select('clinical_score, skin_age, analysis_date')
        .eq('user_id', user.id)
        .order('analysis_date', { ascending: true });

      if (error || !analyses || analyses.length === 0) {
        return null;
      }

      const firstAnalysis = analyses[0];
      const latestAnalysis = analyses[analyses.length - 1];

      const overallClinicalScoreChange = latestAnalysis.clinical_score - firstAnalysis.clinical_score;
      const overallSkinAgeChange = latestAnalysis.skin_age - firstAnalysis.skin_age;

      const daysBetween = Math.floor(
        (new Date(latestAnalysis.analysis_date).getTime() -
          new Date(firstAnalysis.analysis_date).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const monthsBetween = daysBetween / 30;
      const averageMonthlyImprovement = monthsBetween > 0
        ? overallClinicalScoreChange / monthsBetween
        : 0;

      let improvingCount = 0;
      for (let i = 1; i < analyses.length; i++) {
        const change = analyses[i].clinical_score - analyses[i - 1].clinical_score;
        if (change > 0) improvingCount++;
      }
      const consistentlyImproving = analyses.length > 1 && (improvingCount / (analyses.length - 1)) > 0.6;

      return {
        totalAnalyses: analyses.length,
        firstAnalysisDate: firstAnalysis.analysis_date,
        latestAnalysisDate: latestAnalysis.analysis_date,
        overallClinicalScoreChange,
        overallSkinAgeChange,
        averageMonthlyImprovement,
        consistentlyImproving
      };
    } catch (error) {
      console.error('Error in getHistoricalTrend:', error);
      return null;
    }
  }

  async getProgressSummary(): Promise<string> {
    const improvement = await this.getImprovementAnalysis();
    const trend = await this.getHistoricalTrend();

    if (!improvement || !improvement.hasHistory) {
      return 'No skin analysis history available yet. Complete another scan to track your progress.';
    }

    const parts: string[] = [];

    if (improvement.overallTrend === 'improving') {
      parts.push('Your skin is improving!');
    } else if (improvement.overallTrend === 'declining') {
      parts.push('Your skin shows some decline.');
    } else {
      parts.push('Your skin remains stable.');
    }

    parts.push(improvement.insightText);

    if (trend && trend.totalAnalyses > 2) {
      if (trend.consistentlyImproving) {
        parts.push(`Overall trend: consistently improving across ${trend.totalAnalyses} scans.`);
      } else {
        parts.push(`You've completed ${trend.totalAnalyses} scans total.`);
      }
    }

    return parts.join(' ');
  }
}

export const skinImprovementService = new SkinImprovementService();
