import { SkinAgeEstimate } from './skinAgeCalculation';
import { ClinicalScore } from './clinicalScoring';

export interface FuturePredictionScenario {
  yearsFromNow: number;
  actualAge: number;
  skinAge: number;
  agingYearsAdded: number;
}

export interface FuturePrediction {
  currentSkinAge: number;
  currentActualAge: number;
  healthyScenarios: FuturePredictionScenario[];
  currentPathScenarios: FuturePredictionScenario[];
  healthyAgingRate: number;
  currentAgingRate: number;
}

export interface Intervention {
  concern: string;
  severity: string;
  priority: number;
  recommendations: string[];
}

const HEALTHY_AGING_RATE = 0.8;
const CURRENT_AGING_RATE = 1.2;

export function calculateFuturePrediction(
  skinAgeEstimate: SkinAgeEstimate,
  yearsToPredict: number[] = [5, 10, 15, 20]
): FuturePrediction {
  console.log('\n🔮 CALCULATING FUTURE SKIN PREDICTION');
  console.log('='.repeat(60));
  console.log(`Current Actual Age: ${skinAgeEstimate.actualAge}`);
  console.log(`Current Skin Age: ${skinAgeEstimate.estimatedSkinAge}`);
  console.log(`Composite Index: ${skinAgeEstimate.compositeIndex.toFixed(2)}`);

  const healthyScenarios: FuturePredictionScenario[] = [];
  const currentPathScenarios: FuturePredictionScenario[] = [];

  console.log('\n📊 SCENARIO CALCULATIONS:');
  console.log('-'.repeat(60));

  for (const years of yearsToPredict) {
    const healthyAgingYears = years * HEALTHY_AGING_RATE;
    const currentPathAgingYears = years * CURRENT_AGING_RATE;

    const healthyScenario: FuturePredictionScenario = {
      yearsFromNow: years,
      actualAge: skinAgeEstimate.actualAge + years,
      skinAge: Math.round(skinAgeEstimate.estimatedSkinAge + healthyAgingYears),
      agingYearsAdded: Math.round(healthyAgingYears),
    };

    const currentPathScenario: FuturePredictionScenario = {
      yearsFromNow: years,
      actualAge: skinAgeEstimate.actualAge + years,
      skinAge: Math.round(skinAgeEstimate.estimatedSkinAge + currentPathAgingYears),
      agingYearsAdded: Math.round(currentPathAgingYears),
    };

    console.log(`\nIn ${years} years (Age ${healthyScenario.actualAge}):`);
    console.log(`  🟢 Healthy Path: Skin Age ${healthyScenario.skinAge} (+${healthyScenario.agingYearsAdded} from today)`);
    console.log(`  🟠 Current Path: Skin Age ${currentPathScenario.skinAge} (+${currentPathScenario.agingYearsAdded} from today)`);
    console.log(`  💡 Potential Difference: ${currentPathScenario.skinAge - healthyScenario.skinAge} years`);

    healthyScenarios.push(healthyScenario);
    currentPathScenarios.push(currentPathScenario);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return {
    currentSkinAge: skinAgeEstimate.estimatedSkinAge,
    currentActualAge: skinAgeEstimate.actualAge,
    healthyScenarios,
    currentPathScenarios,
    healthyAgingRate: HEALTHY_AGING_RATE,
    currentAgingRate: CURRENT_AGING_RATE,
  };
}

export function generateInterventions(
  skinAgeEstimate: SkinAgeEstimate,
  clinicalScore: ClinicalScore
): Intervention[] {
  console.log('\n💊 GENERATING PERSONALIZED INTERVENTIONS');
  console.log('='.repeat(60));

  const interventions: Intervention[] = [];

  const topConcerns = skinAgeEstimate.topConcerns;

  for (let i = 0; i < topConcerns.length; i++) {
    const concern = topConcerns[i];
    const severity = concern.score === 0 ? 'None' : concern.score === 1 ? 'Mild' : concern.score === 2 ? 'Moderate' : 'Severe';

    let recommendations: string[] = [];

    if (concern.zoneName.includes('forehead') || concern.zoneName.includes('glabella')) {
      recommendations = [
        'Retinol 0.025-0.1% nightly (start low, increase gradually)',
        'Hydrating serums with hyaluronic acid',
        'Consider Botox for dynamic lines (consult dermatologist)',
        'Avoid excessive facial expressions and squinting',
      ];
    } else if (concern.zoneName.includes('crowsfeet')) {
      recommendations = [
        'Eye cream with peptides and retinol',
        'Daily sunglasses outdoors (UV protection)',
        'Gentle application - no rubbing or pulling',
        'Consider professional treatments (RF microneedling)',
      ];
    } else if (concern.zoneName.includes('cheek')) {
      recommendations = [
        'Vitamin C serum daily (morning application)',
        'Retinol at night for collagen stimulation',
        'Daily SPF 50+ (reapply every 2 hours in sun)',
        'Consider professional treatments (laser, microneedling)',
      ];
    } else if (concern.zoneName.includes('nasolabial')) {
      recommendations = [
        'Retinol or tretinoin for collagen support',
        'Hyaluronic acid fillers (consult dermatologist)',
        'Facial exercises for muscle tone',
        'Daily SPF and antioxidant serums',
      ];
    }

    interventions.push({
      concern: concern.displayName,
      severity,
      priority: i + 1,
      recommendations,
    });

    console.log(`\n${i + 1}. ${concern.displayName} (${severity} - ${concern.score}/3):`);
    recommendations.forEach((rec) => {
      console.log(`   • ${rec}`);
    });
  }

  if (clinicalScore.overallPigmentationScore > 0) {
    interventions.push({
      concern: 'Uneven Skin Tone',
      severity: 'Moderate',
      priority: interventions.length + 1,
      recommendations: [
        'Vitamin C serum 10-20% (morning application)',
        'Niacinamide 5-10% for tone evening',
        'Strict daily SPF 50+ (most important for pigmentation)',
        'Consider professional treatments (chemical peels, laser)',
      ],
    });

    console.log(`\n${interventions.length}. Uneven Skin Tone (Moderate):`);
    console.log('   • Vitamin C serum 10-20% (morning application)');
    console.log('   • Niacinamide 5-10% for tone evening');
    console.log('   • Strict daily SPF 50+ (most important for pigmentation)');
    console.log('   • Consider professional treatments (chemical peels, laser)');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return interventions;
}
