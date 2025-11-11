import {
  extractPolygonPixels,
  calculateTextureVariance,
  calculatePigmentationVariance,
  calculateAverageBrightness,
  scoreTextureVariance,
  scorePigmentationEvenness,
  scoreBrightness
} from './pixelAnalysis';

interface Point {
  x: number;
  y: number;
}

export interface ZoneMetrics {
  zoneName: string;
  displayName: string;
  textureVariance: number;
  pigmentationVariance: number;
  averageBrightness: number;
  wrinkleScore: number;
  pigmentationScore: number;
  radianceScore: number;
  weight: number;
}

export interface ClinicalScore {
  zones: ZoneMetrics[];
  overallPigmentationScore: number;
  totalScore: number;
  maxScore: number;
  rating: 'Excellent' | 'Moderate' | 'Accelerated';
  ratingColor: string;
  ratingMessage: string;
}

const ZONE_DISPLAY_NAMES: Record<string, string> = {
  'forehead': 'Forehead',
  'glabella': 'Glabellar',
  'eye_crowsfeet_left': "Crow's Feet (Left)",
  'eye_crowsfeet_right': "Crow's Feet (Right)",
  'upper_cheek_left': 'Upper Cheek (Left)',
  'upper_cheek_right': 'Upper Cheek (Right)',
  'lower_cheek_left': 'Lower Cheek (Left)',
  'lower_cheek_right': 'Lower Cheek (Right)',
  'nasolabial_left': 'Nasolabial Fold (Left)',
  'nasolabial_right': 'Nasolabial Fold (Right)',
};

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

function getScoreEmoji(score: number): string {
  if (score === 0) return '✓';
  if (score === 1) return '○';
  if (score === 2) return '⚠️';
  return '❌';
}

export function analyzeFacialZones(
  ctx: CanvasRenderingContext2D,
  zones: Array<{ name: string; polygon: Point[] }>,
  imageWidth: number,
  imageHeight: number
): ClinicalScore {
  const zoneMetrics: ZoneMetrics[] = [];
  let totalPigmentationVariance = 0;
  let totalPixels = 0;

  console.log('\n🔬 STARTING CLINICAL PIXEL ANALYSIS');
  console.log('='.repeat(60));

  for (const zone of zones) {
    console.log(`\n📍 ZONE: ${zone.name.toUpperCase()}`);

    const pixelData = extractPolygonPixels(ctx, zone.polygon, imageWidth, imageHeight);

    if (pixelData.brightness.length === 0) {
      console.warn(`   ⚠️  No pixels extracted - zone may be outside image bounds`);
      continue;
    }

    console.log(`   ✓ Extracted ${pixelData.brightness.length} pixels from polygon`);

    const textureVariance = calculateTextureVariance(pixelData);
    const pigmentationVariance = calculatePigmentationVariance(pixelData);
    const averageBrightness = calculateAverageBrightness(pixelData);

    const wrinkleScore = scoreTextureVariance(textureVariance);
    const pigmentationScore = scorePigmentationEvenness(pigmentationVariance);
    const radianceScore = scoreBrightness(averageBrightness);

    console.log(`   📊 RAW MEASUREMENTS:`);
    console.log(`      • Texture Variance (wrinkle indicator): ${textureVariance.toFixed(2)}`);
    console.log(`      • Pigmentation Variance (tone evenness): ${pigmentationVariance.toFixed(2)}`);
    console.log(`      • Average Brightness (radiance): ${averageBrightness.toFixed(2)}`);
    console.log(`   🎯 CLINICAL SCORES:`);
    console.log(`      • Wrinkle Score: ${wrinkleScore}/3 ${getScoreEmoji(wrinkleScore)}`);
    console.log(`      • Pigmentation Score: ${pigmentationScore}/3 ${getScoreEmoji(pigmentationScore)}`);
    console.log(`      • Radiance Score: ${radianceScore}/3 ${getScoreEmoji(radianceScore)}`);

    totalPigmentationVariance += pigmentationVariance * pixelData.brightness.length;
    totalPixels += pixelData.brightness.length;

    zoneMetrics.push({
      zoneName: zone.name,
      displayName: ZONE_DISPLAY_NAMES[zone.name] || zone.name,
      textureVariance,
      pigmentationVariance,
      averageBrightness,
      wrinkleScore,
      pigmentationScore,
      radianceScore,
      weight: ZONE_WEIGHTS[zone.name] || 0.10
    });
  }

  console.log('\n' + '='.repeat(60));

  const overallPigmentationVariance = totalPixels > 0 ? totalPigmentationVariance / totalPixels : 0;
  const overallPigmentationScore = scorePigmentationEvenness(overallPigmentationVariance);

  let totalScore = 0;
  for (const metrics of zoneMetrics) {
    totalScore += metrics.wrinkleScore;
  }
  totalScore += overallPigmentationScore;

  const maxScore = 21;

  let rating: 'Excellent' | 'Moderate' | 'Accelerated';
  let ratingColor: string;
  let ratingMessage: string;

  if (totalScore <= 6) {
    rating = 'Excellent';
    ratingColor = 'text-green-600';
    ratingMessage = 'Excellent - aging well';
  } else if (totalScore <= 12) {
    rating = 'Moderate';
    ratingColor = 'text-yellow-600';
    ratingMessage = 'Moderate - normal aging';
  } else {
    rating = 'Accelerated';
    ratingColor = 'text-orange-600';
    ratingMessage = 'Accelerated - needs attention';
  }

  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   • Overall Pigmentation Variance: ${overallPigmentationVariance.toFixed(2)}`);
  console.log(`   • Overall Pigmentation Score: ${overallPigmentationScore}/3`);
  console.log(`   • Total Wrinkle Score (10 zones): ${totalScore - overallPigmentationScore}/30`);
  console.log(`   • TOTAL CLINICAL SCORE: ${totalScore}/${maxScore}`);
  console.log(`   • Rating: ${rating.toUpperCase()} ${rating === 'Excellent' ? '✓' : rating === 'Moderate' ? '⚠️' : '❌'}`);
  console.log('='.repeat(60) + '\n');

  return {
    zones: zoneMetrics,
    overallPigmentationScore,
    totalScore,
    maxScore,
    rating,
    ratingColor,
    ratingMessage
  };
}

export function getZoneHealthRating(wrinkleScore: number, pigmentationScore: number, radianceScore: number): { label: string; color: string } {
  const total = wrinkleScore + pigmentationScore + radianceScore;

  if (total === 0) {
    return { label: 'Excellent', color: 'text-green-600' };
  } else if (total <= 3) {
    return { label: 'Good', color: 'text-blue-600' };
  } else if (total <= 6) {
    return { label: 'Fair', color: 'text-yellow-600' };
  } else {
    return { label: 'Poor', color: 'text-orange-600' };
  }
}
