import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Activity, TrendingUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ClinicalScore } from '../lib/clinicalScoring';

interface ClinicalScoreDisplayProps {
  score: ClinicalScore;
  onContinue: () => void;
}

function getScoreIndicator(score: number) {
  if (score === 0) return { icon: CheckCircle, text: 'Smooth', color: 'text-green-600' };
  if (score === 1) return { icon: CheckCircle, text: 'Mild', color: 'text-blue-600' };
  if (score === 2) return { icon: AlertTriangle, text: 'Moderate', color: 'text-yellow-600' };
  return { icon: XCircle, text: 'Severe', color: 'text-red-600' };
}

export function ClinicalScoreDisplay({ score, onContinue }: ClinicalScoreDisplayProps) {
  const skinToneEven = score.overallPigmentationScore === 0;

  return (
    <Card className="mt-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-2xl">Clinical Zone Analysis - Real Pixel Data</CardTitle>
        </div>
        <p className="text-sm text-slate-600 mt-2">Analyzing {score.zones.length} zones with actual image pixel measurements</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-3 px-4 font-bold text-slate-700">Zone Name</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700">Wrinkle Score</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700">Visual Indicator</th>
                <th className="text-center py-3 px-4 font-bold text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {score.zones.map((zone, idx) => {
                const indicator = getScoreIndicator(zone.wrinkleScore);
                const Icon = indicator.icon;
                return (
                  <tr
                    key={zone.zoneName}
                    className={`border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {zone.displayName}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold text-lg ${indicator.color}`}>
                        {zone.wrinkleScore}/3
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <Icon className={`w-5 h-5 mx-auto ${indicator.color}`} />
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className={indicator.color}>{indicator.text}</span> wrinkles detected
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white border-2 border-slate-300 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Skin Tone Evenness</h3>
              <p className="text-sm text-slate-600">Pigmentation analysis across all zones</p>
            </div>
            <div className="flex items-center gap-3">
              {skinToneEven ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <span className="text-xl font-bold text-green-600">Even</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <span className="text-xl font-bold text-orange-600">Uneven - spots detected</span>
                </>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200"></div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">Total Clinical Score</h3>
              <p className="text-sm text-slate-600 mt-1">
                Sum of all zone wrinkle scores + overall pigmentation
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-800">
                {score.totalScore} / {score.maxScore}
              </div>
              <div className={`text-lg font-semibold mt-1 ${score.ratingColor}`}>
                {score.ratingMessage}
              </div>
            </div>
          </div>
        </div>

        <div className={`border-2 rounded-lg p-6 ${
          score.totalScore <= 6
            ? 'bg-green-50 border-green-300'
            : score.totalScore <= 12
            ? 'bg-yellow-50 border-yellow-300'
            : 'bg-orange-50 border-orange-300'
        }`}>
          <p className="text-sm font-semibold mb-2">
            Based on clinical validation: scores above 6 indicate accelerated facial aging (Robic et al., 2023)
          </p>
          <p className="text-xs text-slate-700">
            This analysis uses real pixel-level measurements from your image, calculating texture variance,
            pigmentation uniformity, and brightness levels within each facial zone polygon.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={onContinue}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <TrendingUp className="w-6 h-6 mr-3" />
            Calculate Skin Age Estimate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
