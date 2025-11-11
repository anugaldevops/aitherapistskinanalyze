import { ClinicalScore } from './clinicalScoring';

const ZONE_WEIGHTS: Record<string, number> = {
  'forehead': 0.11,
  'glabella': 0.12,
  'eye_crowsfeet_left': 0.10,
  'eye_crowsfeet_right': 0.10,
  'upper_cheek_left': 0.12,
  'upper_cheek_right': 0.12,
  'lower_cheek_left': 0.12,
  'lower_cheek_right': 0.12,
  'nasolabial_left': 0.13,
  'nasolabial_right': 0.13,
};

const PIGMENTATION_WEIGHT = 0.07;

export interface SkinAgeEstimate {
  estimatedSkinAge: number;
  actualAge: number;
  ageDifference: number;
  compositeIndex: number;
  breakdown: Array<{
    zoneName: string;
    displayName: string;
    score: number;
    normalizedScore: number;
    weight: number;
    weightedContribution: number;
  }>;
  pigmentationContribution: number;
  topConcerns: Array<{
    displayName: string;
    score: number;
    weight: number;
    zoneName: string;
  }>;
}

function normalizeScore(score: number): number {
  return score * 33.33;
}

export function calculateSkinAge(
  clinicalScore: ClinicalScore,
  actualAge: number
): SkinAgeEstimate {
  console.log('\n🧮 CALCULATING SKIN AGE ESTIMATE');
  console.log('='.repeat(60));
  console.log(`Input: Actual Age = ${actualAge} years`);
  console.log(`Clinical Total Score: ${clinicalScore.totalScore}/21`);

  const breakdown: SkinAgeEstimate['breakdown'] = [];
  let compositeIndex = 0;

  console.log('\n📊 STEP 1: Normalize each zone score to 0-100 scale (score × 33.33)');
  console.log('-'.repeat(60));

  for (const zone of clinicalScore.zones) {
    const normalizedScore = normalizeScore(zone.wrinkleScore);
    const weight = ZONE_WEIGHTS[zone.zoneName] || 0;
    const weightedContribution = normalizedScore * weight;

    console.log(`${zone.displayName}:`);
    console.log(`  Score: ${zone.wrinkleScore}/3`);
    console.log(`  Normalized: ${normalizedScore.toFixed(2)}/100`);
    console.log(`  Weight: ${(weight * 100).toFixed(0)}%`);
    console.log(`  Contribution: ${normalizedScore.toFixed(2)} × ${(weight * 100).toFixed(0)}% = ${weightedContribution.toFixed(2)}`);

    breakdown.push({
      zoneName: zone.zoneName,
      displayName: zone.displayName,
      score: zone.wrinkleScore,
      normalizedScore,
      weight,
      weightedContribution,
    });

    compositeIndex += weightedContribution;
  }

  const pigmentationNormalized = normalizeScore(clinicalScore.overallPigmentationScore);
  const pigmentationContribution = pigmentationNormalized * PIGMENTATION_WEIGHT;

  console.log(`\nOverall Pigmentation:`);
  console.log(`  Score: ${clinicalScore.overallPigmentationScore}/3`);
  console.log(`  Normalized: ${pigmentationNormalized.toFixed(2)}/100`);
  console.log(`  Weight: ${(PIGMENTATION_WEIGHT * 100).toFixed(0)}%`);
  console.log(`  Contribution: ${pigmentationNormalized.toFixed(2)} × ${(PIGMENTATION_WEIGHT * 100).toFixed(0)}% = ${pigmentationContribution.toFixed(2)}`);

  compositeIndex += pigmentationContribution;

  console.log('\n📈 STEP 2: Sum all weighted contributions');
  console.log('-'.repeat(60));
  console.log(`COMPOSITE AGING INDEX: ${compositeIndex.toFixed(2)} / 100`);

  console.log('\n🎯 STEP 3: Convert Composite Index to Skin Age Estimate');
  console.log('-'.repeat(60));

  let estimatedSkinAge: number;
  let reasoning: string;

  if (compositeIndex < 15) {
    estimatedSkinAge = actualAge - 5;
    reasoning = 'Index < 15: Excellent skin condition (Age - 5)';
  } else if (compositeIndex < 30) {
    estimatedSkinAge = actualAge - 2;
    reasoning = 'Index 15-29: Very good skin condition (Age - 2)';
  } else if (compositeIndex < 45) {
    estimatedSkinAge = actualAge + 2;
    reasoning = 'Index 30-44: Good skin condition (Age + 2)';
  } else if (compositeIndex < 55) {
    estimatedSkinAge = actualAge + 5;
    reasoning = 'Index 45-54: Moderate aging signs (Age + 5)';
  } else {
    estimatedSkinAge = actualAge + 8;
    reasoning = 'Index ≥ 55: Accelerated aging (Age + 8)';
  }

  console.log(`Formula Applied: ${reasoning}`);
  console.log(`Estimated Skin Age: ${estimatedSkinAge} years`);

  const ageDifference = estimatedSkinAge - actualAge;
  console.log(`Age Difference: ${ageDifference > 0 ? '+' : ''}${ageDifference} years`);

  const topConcerns = [...clinicalScore.zones]
    .sort((a, b) => b.wrinkleScore - a.wrinkleScore)
    .slice(0, 3)
    .map((zone) => ({
      displayName: zone.displayName,
      score: zone.wrinkleScore,
      weight: ZONE_WEIGHTS[zone.zoneName] || 0,
      zoneName: zone.zoneName,
    }));

  console.log('\n⚠️  TOP 3 PRIORITY CONCERNS:');
  topConcerns.forEach((concern, idx) => {
    console.log(`  ${idx + 1}. ${concern.displayName}: ${concern.score}/3 (${(concern.weight * 100).toFixed(0)}% model weight)`);
  });

  console.log('='.repeat(60) + '\n');

  return {
    estimatedSkinAge,
    actualAge,
    ageDifference,
    compositeIndex,
    breakdown,
    pigmentationContribution,
    topConcerns,
  };
}
