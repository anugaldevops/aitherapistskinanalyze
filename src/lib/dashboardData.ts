import { supabase } from './supabase';
import { generateInsights, type Insight } from './insightsGenerator';

export interface DashboardStats {
  totalScans: number;
  currentAge: number;
  latestSkinAge: number | null;
  latestScore: { current: number; max: number } | null;
}

export interface AnalysisPoint {
  id: string;
  date: string;
  clinicalScore: number;
  skinAge: number;
  compositeIndex: number;
}

export interface RecentAnalysis {
  id: string;
  date: string;
  score: number;
  maxScore: number;
  skinAge: number;
  ageDifference: number;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: AnalysisPoint[];
  recentAnalyses: RecentAnalysis[];
  insights: Insight[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No authenticated user');
    return null;
  }

  console.log('📊 Fetching dashboard data for user:', user.id);

  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('age')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentAge = profile?.age || 25;

    const { data: analyses, error: analysesError } = await supabase
      .from('analysis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: true });

    if (analysesError) {
      console.error('❌ Error fetching analyses:', analysesError);
      return null;
    }

    if (!analyses || analyses.length === 0) {
      console.log('📊 No analyses found for user');
      return {
        stats: {
          totalScans: 0,
          currentAge,
          latestSkinAge: null,
          latestScore: null
        },
        chartData: [],
        recentAnalyses: [],
        insights: []
      };
    }

    console.log(`✅ Found ${analyses.length} analyses`);

    const latestAnalysis = analyses[analyses.length - 1];

    const stats: DashboardStats = {
      totalScans: analyses.length,
      currentAge,
      latestSkinAge: latestAnalysis.skin_age,
      latestScore: {
        current: latestAnalysis.clinical_score,
        max: 21
      }
    };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentAnalyses = analyses.filter(a => new Date(a.analyzed_at) >= sixMonthsAgo);

    const chartData: AnalysisPoint[] = recentAnalyses.map(analysis => ({
      id: analysis.id,
      date: new Date(analysis.analyzed_at).toISOString().split('T')[0],
      clinicalScore: analysis.clinical_score,
      skinAge: analysis.skin_age,
      compositeIndex: calculateCompositeIndex(analysis)
    }));

    const recentThree = analyses.slice(-3).reverse();

    const recentAnalysesList: RecentAnalysis[] = recentThree.map(analysis => ({
      id: analysis.id,
      date: new Date(analysis.analyzed_at).toISOString().split('T')[0],
      score: analysis.clinical_score,
      maxScore: 21,
      skinAge: analysis.skin_age,
      ageDifference: analysis.skin_age - currentAge
    }));

    const analysisDataForInsights = analyses.map(analysis => ({
      id: analysis.id,
      date: new Date(analysis.analyzed_at).toISOString().split('T')[0],
      clinicalScore: analysis.clinical_score,
      skinAge: analysis.skin_age,
      zoneScores: analysis.zone_scores || undefined
    }));

    const { data: adherenceData } = await supabase
      .from('routine_adherence')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .lte('date', new Date().toISOString().split('T')[0]);

    let routineAdherence;
    if (adherenceData && adherenceData.length > 0) {
      const totalCompleted = adherenceData.reduce((sum, a) => sum + a.completed_steps, 0);
      const totalPossible = adherenceData.reduce((sum, a) => sum + a.total_steps, 0);
      const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

      routineAdherence = {
        percentage,
        trend: 'stable' as const
      };
    }

    const insights = generateInsights(analysisDataForInsights, routineAdherence);

    console.log('✅ Dashboard data loaded successfully');
    console.log(`💡 Generated ${insights.length} insights`);

    return {
      stats,
      chartData,
      recentAnalyses: recentAnalysesList,
      insights
    };

  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
    return null;
  }
}

function calculateCompositeIndex(analysis: any): number {
  const clinicalScore = analysis.clinical_score;
  const skinAge = analysis.skin_age;

  const normalizedClinicalScore = (clinicalScore / 21) * 100;

  const ageDeviation = Math.abs(skinAge - 30);
  const normalizedAgeScore = Math.max(0, 100 - (ageDeviation * 2));

  const compositeIndex = Math.round((normalizedClinicalScore + normalizedAgeScore) / 2);

  return compositeIndex;
}
