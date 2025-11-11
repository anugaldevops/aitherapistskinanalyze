import { SkinAgeEstimate } from './skinAgeCalculation';
import { ClinicalScore } from './clinicalScoring';
import { supabase } from './supabase';

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

export interface AnalysisMetadata {
  photoDate?: string;
  ageInPhoto?: number;
  skincareRoutine?: string;
  lifestyleHabits?: string[];
  notes?: string;
}

export async function saveAnalysis(
  skinAgeEstimate: SkinAgeEstimate,
  clinicalScore: ClinicalScore,
  actualAge: number,
  metadata?: AnalysisMetadata
): Promise<SavedAnalysis | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const timestamp = Date.now();
  const date = new Date(timestamp).toISOString();

  const topZones = clinicalScore.zones
    .map(zone => ({
      name: zone.displayName,
      score: zone.wrinkleScore + zone.pigmentationScore + zone.radianceScore
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const totalPigmentation = clinicalScore.zones.reduce(
    (sum, zone) => sum + zone.pigmentationScore,
    0
  );

  const zoneScores = clinicalScore.zones.reduce((acc, zone) => {
    acc[zone.displayName] = {
      wrinkle: zone.wrinkleScore,
      pigmentation: zone.pigmentationScore,
      radiance: zone.radianceScore,
      total: zone.wrinkleScore + zone.pigmentationScore + zone.radianceScore
    };
    return acc;
  }, {} as Record<string, any>);

  const ageDifference = skinAgeEstimate.estimatedSkinAge - actualAge;

  const analysisData = {
    user_id: user.id,
    analysis_date: date,
    photo_date: metadata?.photoDate || date,
    user_age: actualAge,
    age_in_photo: metadata?.ageInPhoto || actualAge,
    skin_age: skinAgeEstimate.estimatedSkinAge,
    age_difference: ageDifference,
    clinical_score: clinicalScore.totalScore,
    max_clinical_score: clinicalScore.maxScore,
    composite_index: skinAgeEstimate.compositeIndex,
    zone_scores: zoneScores,
    pigmentation_score: totalPigmentation,
    top_concerns: topZones,
    skincare_routine: metadata?.skincareRoutine || '',
    lifestyle_habits: metadata?.lifestyleHabits || [],
    notes: metadata?.notes || '',
    raw_data: {
      skinAgeEstimate,
      clinicalScore
    }
  };

  console.log('💾 Saving analysis to database with metadata:', analysisData);

  const { data, error } = await supabase
    .from('analysis_history')
    .insert(analysisData)
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Error saving analysis to database:', error);
    return null;
  }

  if (!data) {
    console.error('❌ No data returned from insert');
    return null;
  }

  const savedAnalysis: SavedAnalysis = {
    id: data.id,
    date: data.analysis_date,
    timestamp: new Date(data.analysis_date).getTime(),
    photoDate: data.photo_date,
    actualAge: data.user_age,
    ageInPhoto: data.age_in_photo,
    skinAge: data.skin_age,
    clinicalScore: data.clinical_score,
    maxClinicalScore: data.max_clinical_score,
    compositeIndex: data.composite_index,
    topProblemZones: data.top_concerns,
    skincareRoutine: data.skincare_routine,
    lifestyleHabits: data.lifestyle_habits || [],
    notes: data.notes,
    rawData: data.raw_data
  };

  console.log('✅ Analysis saved successfully! ID:', savedAnalysis.id);
  return savedAnalysis;
}

export async function getAnalysisHistory(sortBy: 'photo_date' | 'age_in_photo' = 'photo_date', ascending: boolean = false): Promise<SavedAnalysis[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  console.log(`📊 Fetching analysis history sorted by ${sortBy}, ascending: ${ascending}`);

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', user.id)
    .order(sortBy, { ascending });

  if (error) {
    console.error('Error loading analysis history:', error);
    return [];
  }

  console.log('Timeline sorted by photo_date');

  return (data || []).map(item => ({
    id: item.id,
    date: item.analysis_date,
    timestamp: new Date(item.analysis_date).getTime(),
    photoDate: item.photo_date,
    actualAge: item.user_age,
    ageInPhoto: item.age_in_photo,
    skinAge: item.skin_age,
    clinicalScore: item.clinical_score,
    maxClinicalScore: item.max_clinical_score,
    compositeIndex: item.composite_index,
    topProblemZones: item.top_concerns,
    skincareRoutine: item.skincare_routine,
    lifestyleHabits: item.lifestyle_habits || [],
    notes: item.notes,
    rawData: item.raw_data
  }));
}

export async function getAnalysisById(id: string): Promise<SavedAnalysis | null> {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error loading analysis:', error);
    return null;
  }

  return {
    id: data.id,
    date: data.analysis_date,
    timestamp: new Date(data.analysis_date).getTime(),
    photoDate: data.photo_date,
    actualAge: data.user_age,
    ageInPhoto: data.age_in_photo,
    skinAge: data.skin_age,
    clinicalScore: data.clinical_score,
    maxClinicalScore: data.max_clinical_score,
    compositeIndex: data.composite_index,
    topProblemZones: data.top_concerns,
    skincareRoutine: data.skincare_routine,
    lifestyleHabits: data.lifestyle_habits || [],
    notes: data.notes,
    rawData: data.raw_data
  };
}

export async function updateAnalysisMetadata(
  id: string,
  metadata: AnalysisMetadata
): Promise<boolean> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (metadata.photoDate) {
    updateData.photo_date = metadata.photoDate;
  }
  if (metadata.ageInPhoto !== undefined) {
    updateData.age_in_photo = metadata.ageInPhoto;
  }
  if (metadata.skincareRoutine !== undefined) {
    updateData.skincare_routine = metadata.skincareRoutine;
  }
  if (metadata.lifestyleHabits !== undefined) {
    updateData.lifestyle_habits = metadata.lifestyleHabits;
  }
  if (metadata.notes !== undefined) {
    updateData.notes = metadata.notes;
  }

  console.log('📝 Updating analysis metadata:', id, updateData);

  const { error } = await supabase
    .from('analysis_history')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating analysis metadata:', error);
    return false;
  }

  console.log('✅ Analysis metadata updated successfully');
  return true;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting analysis:', error);
    return;
  }

  console.log('🗑️ Analysis deleted:', id);
}

export async function getHistoryCount(): Promise<number> {
  const history = await getAnalysisHistory();
  return history.length;
}

export async function getLatestAnalysis(): Promise<SavedAnalysis | null> {
  const history = await getAnalysisHistory();
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
