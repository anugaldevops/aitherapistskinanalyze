import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SavedAnalysis, formatDate } from '../lib/analysisHistory';

interface AutomaticComparisonProps {
  currentAnalysis: SavedAnalysis;
  previousAnalysis: SavedAnalysis;
  onSelectDifferent?: () => void;
}

export function AutomaticComparison({
  currentAnalysis,
  previousAnalysis,
  onSelectDifferent
}: AutomaticComparisonProps) {
  const [showZoneDetails, setShowZoneDetails] = useState(false);

  const currentPhotoDate = currentAnalysis.photoDate || currentAnalysis.date;
  const previousPhotoDate = previousAnalysis.photoDate || previousAnalysis.date;
  const currentAge = currentAnalysis.ageInPhoto || currentAnalysis.actualAge;
  const previousAge = previousAnalysis.ageInPhoto || previousAnalysis.actualAge;

  const daysBetween = Math.floor(
    (new Date(currentPhotoDate).getTime() - new Date(previousPhotoDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const monthsBetween = (daysBetween / 30).toFixed(1);
  const yearsBetween = (daysBetween / 365).toFixed(1);

  console.log(`📊 Automatic Comparison:`);
  console.log(`Previous: ${previousPhotoDate} (Age ${previousAge})`);
  console.log(`Current: ${currentPhotoDate} (Age ${currentAge})`);
  console.log(`Time difference: ${daysBetween} days (${monthsBetween} months)`);

  const scoreDiff = currentAnalysis.clinicalScore - previousAnalysis.clinicalScore;
  const skinAgeDiff = currentAnalysis.skinAge - previousAnalysis.skinAge;
  const ageDiffChange = (currentAnalysis.skinAge - currentAge) - (previousAnalysis.skinAge - previousAge);
  const compositeIndexDiff = currentAnalysis.compositeIndex - previousAnalysis.compositeIndex;

  console.log(`Score change: ${scoreDiff > 0 ? '+' : ''}${scoreDiff}`);
  console.log(`Skin age change: ${skinAgeDiff > 0 ? '+' : ''}${skinAgeDiff}`);
  console.log(`Composite index change: ${compositeIndexDiff > 0 ? '+' : ''}${compositeIndexDiff.toFixed(1)}`);

  const monthlyScoreRate = (scoreDiff / parseFloat(monthsBetween)).toFixed(2);
  const projectedScore6Months = currentAnalysis.clinicalScore + (parseFloat(monthlyScoreRate) * 6);

  console.log(`Rate of change: ${monthlyScoreRate} points per month`);
  console.log(`6-month projection: ${projectedScore6Months.toFixed(1)} points`);

  const allZoneNames = new Set([
    ...previousAnalysis.rawData.clinicalScore.zones.map(z => z.displayName),
    ...currentAnalysis.rawData.clinicalScore.zones.map(z => z.displayName)
  ]);

  const zoneComparisons = Array.from(allZoneNames).map(zoneName => {
    const prevZone = previousAnalysis.rawData.clinicalScore.zones.find(z => z.displayName === zoneName);
    const currZone = currentAnalysis.rawData.clinicalScore.zones.find(z => z.displayName === zoneName);

    const prevScore = prevZone ? (prevZone.wrinkleScore + prevZone.pigmentationScore + prevZone.radianceScore) : 0;
    const currScore = currZone ? (currZone.wrinkleScore + currZone.pigmentationScore + currZone.radianceScore) : 0;

    return {
      zone: zoneName,
      prevScore,
      currScore,
      diff: currScore - prevScore,
      status: currScore < prevScore ? 'better' : currScore > prevScore ? 'worse' : 'same'
    };
  });

  const getOverallAssessment = () => {
    if (scoreDiff <= -2) {
      return {
        icon: <Sparkles className="w-6 h-6 text-green-600" />,
        title: "🎉 Great Progress!",
        message: `Your skin score improved by ${Math.abs(scoreDiff)} points.`,
        detail: "Your skincare routine is working! Keep it up.",
        color: "from-green-50 to-emerald-50",
        borderColor: "border-green-200"
      };
    } else if (scoreDiff >= -1 && scoreDiff <= 1) {
      return {
        icon: <CheckCircle className="w-6 h-6 text-blue-600" />,
        title: "✓ Stable Progress",
        message: "Your skin condition is maintaining well.",
        detail: "Continue your current routine.",
        color: "from-blue-50 to-cyan-50",
        borderColor: "border-blue-200"
      };
    } else {
      return {
        icon: <AlertCircle className="w-6 h-6 text-orange-600" />,
        title: "⚠️ Attention Needed",
        message: `Your skin score increased by ${scoreDiff} points.`,
        detail: "Consider reviewing your routine and lifestyle factors.",
        color: "from-orange-50 to-yellow-50",
        borderColor: "border-orange-200"
      };
    }
  };

  const assessment = getOverallAssessment();

  const getChangeIcon = (status: string) => {
    if (status === 'better') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (status === 'worse') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (status: string) => {
    if (status === 'better') return 'text-green-600 bg-green-50';
    if (status === 'worse') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const routineChanged = previousAnalysis.skincareRoutine !== currentAnalysis.skincareRoutine;
  const previousHabits = previousAnalysis.lifestyleHabits || [];
  const currentHabits = currentAnalysis.lifestyleHabits || [];
  const addedHabits = currentHabits.filter(h => !previousHabits.includes(h));
  const removedHabits = previousHabits.filter(h => !currentHabits.includes(h));
  const unchangedHabits = currentHabits.filter(h => previousHabits.includes(h));

  return (
    <Card className="w-full border-2 border-blue-300 shadow-2xl">
      <CardHeader className={`bg-gradient-to-r ${assessment.color} border-b ${assessment.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="w-7 h-7 text-blue-600" />
            <CardTitle className="text-2xl font-bold text-slate-800">
              📊 Progress Report
            </CardTitle>
          </div>
          {onSelectDifferent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectDifferent}
              className="text-xs"
            >
              Compare Different
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Calendar className="w-4 h-4" />
            <span>Comparing with analysis from {formatDate(previousPhotoDate)}</span>
            <span className="text-slate-500">({daysBetween} days ago)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>{formatDate(previousPhotoDate)} (Age {previousAge})</span>
            <ArrowRight className="w-4 h-4" />
            <span>{formatDate(currentPhotoDate)} (Age {currentAge})</span>
            <span className="ml-2 text-xs text-slate-500">({yearsBetween} years)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className={`bg-gradient-to-br ${assessment.color} rounded-xl p-6 border-2 ${assessment.borderColor}`}>
          <div className="flex items-start gap-4">
            {assessment.icon}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-1">{assessment.title}</h3>
              <p className="text-base font-semibold text-slate-700">{assessment.message}</p>
              <p className="text-sm text-slate-600 mt-1">{assessment.detail}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Side-by-Side Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="text-left p-3 font-bold text-slate-700">Metric</th>
                  <th className="text-center p-3 font-bold text-slate-700">Previous</th>
                  <th className="text-center p-3 font-bold text-slate-700">Current</th>
                  <th className="text-center p-3 font-bold text-slate-700">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 font-semibold">Clinical Score</td>
                  <td className="p-3 text-center">{previousAnalysis.clinicalScore}/{previousAnalysis.maxClinicalScore}</td>
                  <td className="p-3 text-center font-bold text-blue-600">
                    {currentAnalysis.clinicalScore}/{currentAnalysis.maxClinicalScore}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                      scoreDiff < 0 ? 'bg-green-100 text-green-700' :
                      scoreDiff > 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {scoreDiff > 0 ? '+' : ''}{scoreDiff}
                      {scoreDiff < 0 ? ' ✓' : scoreDiff > 0 ? ' ⚠️' : ''}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 font-semibold">Skin Age</td>
                  <td className="p-3 text-center">{previousAnalysis.skinAge} years</td>
                  <td className="p-3 text-center font-bold text-blue-600">{currentAnalysis.skinAge} years</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                      skinAgeDiff < 0 ? 'bg-green-100 text-green-700' :
                      skinAgeDiff > 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {skinAgeDiff > 0 ? '+' : ''}{skinAgeDiff} years
                      {skinAgeDiff < 0 ? ' ✓' : skinAgeDiff > 0 ? ' ⚠️' : ''}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 font-semibold">Age Difference</td>
                  <td className="p-3 text-center">
                    {previousAnalysis.skinAge - previousAge > 0 ? '+' : ''}{previousAnalysis.skinAge - previousAge} years
                  </td>
                  <td className="p-3 text-center font-bold text-blue-600">
                    {currentAnalysis.skinAge - currentAge > 0 ? '+' : ''}{currentAnalysis.skinAge - currentAge} years
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                      ageDiffChange < 0 ? 'bg-green-100 text-green-700' :
                      ageDiffChange > 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ageDiffChange < 0 ? 'Better' : ageDiffChange > 0 ? 'Worse' : 'Same'}
                      {ageDiffChange < 0 ? ' ✓' : ageDiffChange > 0 ? ' ⚠️' : ''}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 font-semibold">Composite Index</td>
                  <td className="p-3 text-center">{previousAnalysis.compositeIndex.toFixed(1)}</td>
                  <td className="p-3 text-center font-bold text-blue-600">
                    {currentAnalysis.compositeIndex.toFixed(1)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold ${
                      compositeIndexDiff < 0 ? 'bg-green-100 text-green-700' :
                      compositeIndexDiff > 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {compositeIndexDiff > 0 ? '+' : ''}{compositeIndexDiff.toFixed(1)}
                      {compositeIndexDiff < 0 ? ' ✓' : compositeIndexDiff > 0 ? ' ⚠️' : ''}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <button
            onClick={() => setShowZoneDetails(!showZoneDetails)}
            className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-3 hover:text-blue-600 transition-colors"
          >
            Zone-by-Zone Breakdown
            {showZoneDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showZoneDetails && (
            <div className="space-y-2">
              {zoneComparisons.map((zone, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    zone.status === 'better' ? 'bg-green-50 border-green-200' :
                    zone.status === 'worse' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getChangeIcon(zone.status)}
                    <span className="font-semibold text-slate-700">{zone.zone}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">{zone.prevScore}/9</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-800">{zone.currScore}/9</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getChangeColor(zone.status)}`}>
                      {zone.status === 'better' ? '↑ Better' : zone.status === 'worse' ? '↓ Worse' : '→ Same'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Rate of Change & Trend Analysis
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Time between photos:</p>
              <p className="text-lg font-bold text-slate-800">{daysBetween} days ({monthsBetween} months)</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Score change rate:</p>
              <p className="text-lg font-bold text-slate-800">
                {parseFloat(monthlyScoreRate) > 0 ? '+' : ''}{monthlyScoreRate} points per month
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">6-month projection:</p>
              <p className="text-lg font-bold text-slate-800">
                Score may reach {projectedScore6Months.toFixed(1)} points
              </p>
              <p className="text-sm mt-2 font-semibold text-purple-700">
                {parseFloat(monthlyScoreRate) < 0
                  ? "Keep going! You're on track to reduce aging signs."
                  : "Consider intervention to slow this trend."}
              </p>
            </div>
          </div>
        </div>

        {(routineChanged || addedHabits.length > 0 || removedHabits.length > 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">🔍 What Changed?</h3>

            {routineChanged && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Skincare Routine:</p>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-slate-500">Previous:</p>
                    <p className="text-sm text-slate-700">{previousAnalysis.skincareRoutine || 'None specified'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-slate-500">Current:</p>
                    <p className="text-sm font-semibold text-slate-800">{currentAnalysis.skincareRoutine || 'None specified'}</p>
                  </div>
                </div>
              </div>
            )}

            {(addedHabits.length > 0 || removedHabits.length > 0 || unchangedHabits.length > 0) && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Lifestyle Habits:</p>
                <div className="space-y-2">
                  {addedHabits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {addedHabits.map((habit, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          ✓ Added: {habit}
                        </span>
                      ))}
                    </div>
                  )}
                  {removedHabits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {removedHabits.map((habit, i) => (
                        <span key={i} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          ✗ Removed: {habit}
                        </span>
                      ))}
                    </div>
                  )}
                  {unchangedHabits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {unchangedHabits.map((habit, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          → {habit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(addedHabits.length > 0 || removedHabits.length > 0) && (
                  <p className="text-sm font-semibold text-blue-700 mt-3">
                    {addedHabits.length > 0 && removedHabits.length === 0
                      ? "You've made positive lifestyle changes!"
                      : removedHabits.length > 0 && addedHabits.length === 0
                      ? "Some habits were discontinued - this may affect results."
                      : "You've made several lifestyle changes - keep tracking to see their impact."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FirstAnalysisWelcome({
  analysis
}: {
  analysis: SavedAnalysis
}) {
  return (
    <Card className="w-full border-2 border-blue-300 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-blue-600" />
          <CardTitle className="text-2xl font-bold text-slate-800">
            Welcome to Your Skin Journey!
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
          <p className="text-lg font-semibold text-slate-800 mb-3">
            This is your first skin analysis - great start! 🎉
          </p>
          <div className="bg-white rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-600">Your Baseline:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Clinical Score</p>
                <p className="text-xl font-bold text-blue-600">
                  {analysis.clinicalScore}/{analysis.maxClinicalScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Skin Age</p>
                <p className="text-xl font-bold text-amber-600">{analysis.skinAge} years</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Age Difference</p>
                <p className="text-xl font-bold text-slate-700">
                  {(analysis.skinAge - (analysis.ageInPhoto || analysis.actualAge)) > 0 ? '+' : ''}
                  {analysis.skinAge - (analysis.ageInPhoto || analysis.actualAge)} years
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Composite Index</p>
                <p className="text-xl font-bold text-slate-700">{analysis.compositeIndex.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="text-lg font-bold text-slate-800 mb-3">📅 Next Steps</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Complete another scan in <strong>2-4 weeks</strong> to track progress</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Maintain consistent lighting and angles for accurate comparison</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Record your skincare routine and lifestyle habits each time</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>After 7+ days, you'll see automatic progress comparisons</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
            onClick={() => {
              const nextScanDate = new Date();
              nextScanDate.setDate(nextScanDate.getDate() + 14);
              alert(`Reminder: Schedule your next scan around ${nextScanDate.toLocaleDateString()}`);
            }}
          >
            Set Reminder for Next Scan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
