import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Award,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { SavedAnalysis, formatDate } from '../lib/analysisHistory';

interface AnalysisComparisonProps {
  analysis1: SavedAnalysis;
  analysis2: SavedAnalysis;
  onClose: () => void;
}

export function AnalysisComparison({ analysis1, analysis2, onClose }: AnalysisComparisonProps) {
  const getPhotoTimestamp = (analysis: SavedAnalysis) => {
    const photoDate = analysis.photoDate || analysis.date;
    return new Date(photoDate).getTime();
  };

  const older = getPhotoTimestamp(analysis1) < getPhotoTimestamp(analysis2) ? analysis1 : analysis2;
  const newer = getPhotoTimestamp(analysis1) < getPhotoTimestamp(analysis2) ? analysis2 : analysis1;

  const olderPhotoDate = older.photoDate || older.date;
  const newerPhotoDate = newer.photoDate || newer.date;
  const olderAge = older.ageInPhoto || older.actualAge;
  const newerAge = newer.ageInPhoto || newer.actualAge;

  const daysBetween = Math.floor((getPhotoTimestamp(newer) - getPhotoTimestamp(older)) / (1000 * 60 * 60 * 24));
  const yearsBetween = (daysBetween / 365).toFixed(1);

  console.log(`Time between analyses: ${daysBetween} days (${yearsBetween} years)`);

  const scoreDiff = newer.clinicalScore - older.clinicalScore;
  const skinAgeDiff = newer.skinAge - older.skinAge;
  const compositeIndexDiff = newer.compositeIndex - older.compositeIndex;

  const getDiffIcon = (diff: number) => {
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-teal-600" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getDiffColor = (diff: number, inverse = false) => {
    if (inverse) {
      if (diff < 0) return 'text-teal-600';
      if (diff > 0) return 'text-red-600';
    } else {
      if (diff > 0) return 'text-teal-600';
      if (diff < 0) return 'text-red-600';
    }
    return 'text-slate-600';
  };

  const getAssessmentLabel = (compositeIndex: number): string => {
    if (compositeIndex >= 18) return 'Excellent';
    if (compositeIndex >= 15) return 'Good';
    if (compositeIndex >= 12) return 'Fair';
    if (compositeIndex >= 9) return 'Poor';
    return 'Concerning';
  };

  const allZoneNames = new Set([
    ...older.rawData.clinicalScore.zones.map(z => z.displayName),
    ...newer.rawData.clinicalScore.zones.map(z => z.displayName)
  ]);

  const zoneComparisons = Array.from(allZoneNames).map(zoneName => {
    const oldZone = older.rawData.clinicalScore.zones.find(z => z.displayName === zoneName);
    const newZone = newer.rawData.clinicalScore.zones.find(z => z.displayName === zoneName);

    const oldScore = oldZone ? (oldZone.wrinkleScore + oldZone.pigmentationScore + oldZone.radianceScore) : 0;
    const newScore = newZone ? (newZone.wrinkleScore + newZone.pigmentationScore + newZone.radianceScore) : 0;

    return {
      zone: zoneName,
      oldScore,
      newScore,
      diff: newScore - oldScore
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-teal-50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Analysis Comparison
                </CardTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-blue-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">
                From {formatDate(olderPhotoDate)}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                To {formatDate(newerPhotoDate)}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              Progress over {yearsBetween} years (Age {olderAge} → Age {newerAge})
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Overall Progress
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-2 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Clinical Score</p>
                    {getDiffIcon(scoreDiff)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-700">
                      {older.clinicalScore}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-2xl font-bold text-blue-600">
                      {newer.clinicalScore}
                    </span>
                  </div>
                  <p className={`text-sm font-bold mt-1 ${getDiffColor(scoreDiff)}`}>
                    {scoreDiff > 0 ? '+' : ''}{scoreDiff} points
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Skin Age</p>
                    {getDiffIcon(-skinAgeDiff)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-700">
                      {older.skinAge}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-2xl font-bold text-amber-600">
                      {newer.skinAge}
                    </span>
                  </div>
                  <p className={`text-sm font-bold mt-1 ${getDiffColor(skinAgeDiff, true)}`}>
                    {skinAgeDiff > 0 ? '+' : ''}{skinAgeDiff} years
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-600">Assessment</p>
                    {getDiffIcon(compositeIndexDiff)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-slate-700">
                      {getAssessmentLabel(older.compositeIndex)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-lg font-bold text-teal-600">
                      {getAssessmentLabel(newer.compositeIndex)}
                    </span>
                  </div>
                  <p className={`text-sm font-bold mt-1 ${getDiffColor(compositeIndexDiff)}`}>
                    {compositeIndexDiff > 0 ? '+' : ''}{compositeIndexDiff.toFixed(1)} index
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {(scoreDiff !== 0 || skinAgeDiff !== 0) && (
            <Card className={`border-2 ${scoreDiff > 0 ? 'border-teal-200 bg-teal-50' : 'border-orange-200 bg-orange-50'}`}>
              <CardContent className="p-4 flex items-start gap-3">
                {scoreDiff > 0 ? (
                  <TrendingUp className="w-6 h-6 text-teal-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-bold mb-1 ${scoreDiff > 0 ? 'text-teal-800' : 'text-orange-800'}`}>
                    {scoreDiff > 0 ? 'Great Progress!' : 'Changes Detected'}
                  </p>
                  <p className={`text-sm ${scoreDiff > 0 ? 'text-teal-700' : 'text-orange-700'}`}>
                    {scoreDiff > 0 ? (
                      <>
                        Your clinical score improved by {scoreDiff} points
                        {skinAgeDiff < 0 && ` and your skin age decreased by ${Math.abs(skinAgeDiff)} years`}.
                        Keep up the good work with your skincare routine!
                      </>
                    ) : (
                      <>
                        Your scores have changed. This could be due to lighting conditions, photo quality, or actual skin changes.
                        {Math.abs(scoreDiff) <= 2 && ' Small variations are normal between analyses.'}
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Zone-by-Zone Comparison</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {zoneComparisons.map(({ zone, oldScore, newScore, diff }) => (
                <Card key={zone} className="border border-slate-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700 text-sm mb-1">{zone}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-sm">{oldScore}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-blue-600 font-bold text-sm">{newScore}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getDiffIcon(diff)}
                        <span className={`font-bold text-sm ${getDiffColor(diff)}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-2">Time Between Analyses</h4>
            <p className="text-sm text-slate-600">
              {Math.round((newer.timestamp - older.timestamp) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
