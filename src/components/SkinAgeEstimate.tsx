import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { TrendingDown, TrendingUp, Minus, AlertCircle, Award, Activity, Save, Check, Loader2 } from 'lucide-react';
import { SkinAgeEstimate as SkinAgeEstimateType } from '../lib/skinAgeCalculation';
import { EmotionalWellnessCard } from './EmotionalWellnessCard';

interface SkinAgeEstimateProps {
  estimate: SkinAgeEstimateType;
  onContinue: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  clinicalScore?: number;
  onOpenTherapist?: () => void;
}

export function SkinAgeEstimate({ estimate, onContinue, onSave, isSaving, isSaved, clinicalScore, onOpenTherapist }: SkinAgeEstimateProps) {
  const isYounger = estimate.ageDifference < 0;
  const isSame = estimate.ageDifference === 0;
  const isOlder = estimate.ageDifference > 0;

  const getDifferenceIcon = () => {
    if (isYounger) return TrendingDown;
    if (isSame) return Minus;
    return TrendingUp;
  };

  const getDifferenceColor = () => {
    if (isYounger) return 'text-green-600';
    if (isSame) return 'text-blue-600';
    return 'text-orange-600';
  };

  const getDifferenceMessage = () => {
    if (isYounger) return 'Your skin appears younger than your actual age';
    if (isSame) return 'Your skin age matches your actual age';
    return 'Your skin shows accelerated aging signs';
  };

  const DifferenceIcon = getDifferenceIcon();

  return (
    <div className="space-y-6 mt-8">
      <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            <CardTitle className="text-3xl font-bold">Skin Age Estimation Results</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-300">
              <p className="text-sm font-semibold text-slate-600 mb-2">Estimated Skin Age</p>
              <p className="text-5xl font-bold text-blue-600">{estimate.estimatedSkinAge}</p>
              <p className="text-sm text-slate-500 mt-1">years</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-slate-300">
              <p className="text-sm font-semibold text-slate-600 mb-2">Your Actual Age</p>
              <p className="text-5xl font-bold text-slate-700">{estimate.actualAge}</p>
              <p className="text-sm text-slate-500 mt-1">years</p>
            </div>

            <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${
              isYounger ? 'border-green-300' : isOlder ? 'border-orange-300' : 'border-blue-300'
            }`}>
              <p className="text-sm font-semibold text-slate-600 mb-2">Difference</p>
              <div className="flex items-center gap-2">
                <DifferenceIcon className={`w-8 h-8 ${getDifferenceColor()}`} />
                <p className={`text-5xl font-bold ${getDifferenceColor()}`}>
                  {estimate.ageDifference > 0 ? '+' : ''}{estimate.ageDifference}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-1">years</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            isYounger ? 'bg-green-50 border-green-300' : isOlder ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-300'
          }`}>
            <p className={`text-center font-semibold ${getDifferenceColor()}`}>
              {getDifferenceMessage()}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border-2 border-slate-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-800">Composite Aging Index</h3>
              <span className="text-2xl font-bold text-blue-600">
                {estimate.compositeIndex.toFixed(1)} / 100
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  estimate.compositeIndex < 30
                    ? 'bg-green-500'
                    : estimate.compositeIndex < 45
                    ? 'bg-blue-500'
                    : estimate.compositeIndex < 55
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(estimate.compositeIndex, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">
              Model Validation: R² = 0.70 correlation with chronological age (Robic et al., 2023)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-slate-700" />
            <CardTitle className="text-xl">What This Means</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-5 border border-slate-300">
            <p className="text-slate-800 leading-relaxed">
              Your skin shows signs consistent with <span className="font-bold text-blue-600">{estimate.estimatedSkinAge} year old</span> skin.
              This assessment is based on clinical analysis scoring <span className="font-bold">{estimate.breakdown.reduce((sum, b) => sum + b.score, 0) + (estimate.pigmentationContribution > 0 ? 3 : 0)}/33</span> points
              across 10 facial zones using research-validated aging indicators.
            </p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-slate-300">
            <h4 className="font-bold text-slate-800 mb-3">Primary Contributing Factors:</h4>
            <ul className="space-y-2">
              {estimate.topConcerns.map((concern, idx) => (
                <li key={concern.zoneName} className="flex items-start gap-2">
                  <span className="font-bold text-slate-600">{idx + 1}.</span>
                  <span className="text-slate-700">
                    <span className="font-semibold">{concern.displayName}</span> - Score: {concern.score}/3
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <CardTitle className="text-xl">Priority Concerns</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 mb-4">
            These zones scored highest and have the most significant impact on your aging profile:
          </p>
          <div className="space-y-3">
            {estimate.topConcerns.map((concern, idx) => (
              <div
                key={concern.zoneName}
                className="bg-white rounded-lg p-4 border-l-4 border-orange-500 shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">
                      {idx + 1}. {concern.displayName}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Score: <span className="font-semibold text-orange-600">{concern.score}/3</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Model Weight</p>
                    <p className="text-xl font-bold text-blue-600">
                      {(concern.weight * 100).toFixed(0)}%
                    </p>
                    {concern.weight >= 0.13 && (
                      <p className="text-xs text-orange-600 font-semibold">
                        Strongest predictor
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {clinicalScore !== undefined && (
        <EmotionalWellnessCard
          clinicalScore={clinicalScore}
          onOpenTherapist={onOpenTherapist}
        />
      )}

      {onSave && (
        <div className="flex justify-center">
          <Button
            onClick={onSave}
            disabled={isSaving || isSaved}
            size="lg"
            className={`font-bold px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all ${
              isSaved
                ? 'bg-green-600 hover:bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Saving your analysis...
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-3 h-6 w-6" />
                Already Saved
              </>
            ) : (
              <>
                <Save className="mr-3 h-6 w-6" />
                Save This Analysis to My Profile
              </>
            )}
          </Button>
        </div>
      )}

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-xl">Future Skin Outlook</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 mb-6">
            Based on your current skin condition and aging trajectory, see what your skin may look like in the future.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={onContinue}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              See Future Skin Prediction
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
