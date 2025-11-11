import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Sparkles, TrendingUp, Shield, Calendar, Download, RefreshCw, CheckCircle, AlertTriangle, Share2, FileText, Save } from 'lucide-react';
import { SkinAgeEstimate } from '../lib/skinAgeCalculation';
import { ClinicalScore } from '../lib/clinicalScoring';
import { calculateFuturePrediction, generateInterventions, FuturePrediction as FuturePredictionType } from '../lib/futurePrediction';
import { generatePDFReport, generateShareableText } from '../lib/reportGenerator';
import { saveAnalysis, getHistoryCount } from '../lib/analysisHistory';

interface FuturePredictionProps {
  skinAgeEstimate: SkinAgeEstimate;
  clinicalScore: ClinicalScore;
  onRestart: () => void;
}

export function FuturePrediction({ skinAgeEstimate, clinicalScore, onRestart }: FuturePredictionProps) {
  const [selectedYears, setSelectedYears] = useState(10);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [prediction] = useState<FuturePredictionType>(() =>
    calculateFuturePrediction(skinAgeEstimate, [5, 10, 15, 20])
  );
  const [interventions] = useState(() =>
    generateInterventions(skinAgeEstimate, clinicalScore)
  );

  const healthyScenario = prediction.healthyScenarios.find(s => s.yearsFromNow === selectedYears);
  const currentScenario = prediction.currentPathScenarios.find(s => s.yearsFromNow === selectedYears);

  const difference = currentScenario && healthyScenario
    ? currentScenario.skinAge - healthyScenario.skinAge
    : 0;

  const handleDownloadPDF = async () => {
    console.log('📄 Generating PDF report...');
    setIsGeneratingPDF(true);

    try {
      await generatePDFReport({
        skinAgeEstimate,
        clinicalScore,
        futurePrediction: prediction,
        selectedYears,
      });
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadText = () => {
    console.log('📝 Generating text report...');
    const reportText = `
SKIN AGE ANALYSIS REPORT
========================

Current Analysis:
- Actual Age: ${skinAgeEstimate.actualAge} years
- Estimated Skin Age: ${skinAgeEstimate.estimatedSkinAge} years
- Composite Index: ${skinAgeEstimate.compositeIndex.toFixed(1)}/100

Future Prediction (${selectedYears} years):
- Healthy Lifestyle Path: Skin Age ${healthyScenario?.skinAge} years
- Current Path: Skin Age ${currentScenario?.skinAge} years
- Potential Difference: ${difference} years

Priority Concerns:
${interventions.map((int, idx) =>
  `${idx + 1}. ${int.concern} (${int.severity})
${int.recommendations.map(rec => `   - ${rec}`).join('\n')}`
).join('\n\n')}

Disclaimer: These predictions are estimates based on clinical research patterns.
Individual results vary. Consult a dermatologist for personalized treatment plans.
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkinAge-Analysis-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ Text report downloaded');
  };

  const handleShareResults = async () => {
    console.log('📤 Sharing results...');
    const shareText = generateShareableText({
      skinAgeEstimate,
      clinicalScore,
      futurePrediction: prediction,
      selectedYears,
    });

    try {
      await navigator.clipboard.writeText(shareText);
      alert('✅ Results copied to clipboard! You can now paste and share.');
      console.log('✅ Results copied to clipboard');
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  const handleSaveAnalysis = () => {
    console.log('💾 Saving analysis to history...');
    try {
      saveAnalysis(skinAgeEstimate, clinicalScore, skinAgeEstimate.actualAge);
      setIsSaved(true);
      const count = getHistoryCount();
      alert(`✅ Analysis saved! You now have ${count} saved analysis${count !== 1 ? 'es' : ''}.`);
      console.log('✅ Analysis saved to history');
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      alert('Failed to save analysis. Please try again.');
    }
  };

  return (
    <div className="space-y-8 mt-8">
      <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-300 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <CardTitle className="text-3xl font-bold">Future Skin Prediction</CardTitle>
          </div>
          <p className="text-slate-700 mt-2">
            See how your skin may age with different lifestyle choices
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-slate-800">Customize Your Timeline</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Years into future:</span>
                <span className="text-2xl font-bold text-purple-600">{selectedYears} years</span>
              </div>
              <Slider
                value={[selectedYears]}
                onValueChange={(value) => setSelectedYears(value[0])}
                min={5}
                max={20}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>5 years</span>
                <span>10 years</span>
                <span>15 years</span>
                <span>20 years</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-600" />
                  <CardTitle className="text-xl text-green-800">Healthy Lifestyle Path</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-slate-600 mb-2">In {selectedYears} Years (Age {healthyScenario?.actualAge})</p>
                  <p className="text-4xl font-bold text-green-600 mb-2">{healthyScenario?.skinAge}</p>
                  <p className="text-sm text-slate-700 font-semibold">Estimated Skin Age</p>
                  <p className="text-xs text-green-700 mt-2">
                    +{healthyScenario?.agingYearsAdded} years vs today
                  </p>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <p className="font-semibold text-green-800">With consistent improvements:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Daily SPF 30+ prevents 80% of facial aging</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Nightly retinol or retinoid</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Vitamin C serum for pigmentation</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Stay hydrated, reduce stress</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Avoid smoking and excess sun</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-100 p-3 rounded-lg border border-green-300">
                  <p className="text-xs text-green-800 font-semibold">
                    Aging Rate: +{prediction.healthyAgingRate} years skin age per year
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <CardTitle className="text-xl text-orange-800">Current Path</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
                  <p className="text-sm text-slate-600 mb-2">In {selectedYears} Years (Age {currentScenario?.actualAge})</p>
                  <p className="text-4xl font-bold text-orange-600 mb-2">{currentScenario?.skinAge}</p>
                  <p className="text-sm text-slate-700 font-semibold">Estimated Skin Age</p>
                  <p className="text-xs text-orange-700 mt-2">
                    +{currentScenario?.agingYearsAdded} years vs today
                  </p>
                </div>

                <div className="space-y-3 text-sm text-slate-700">
                  <p className="font-semibold text-orange-800">Without intervention:</p>
                  <p>
                    Accelerated aging patterns typically continue or worsen, especially with sun exposure and lifestyle factors.
                  </p>
                  <p className="text-orange-700 font-semibold">
                    The difference compounds over time, making early intervention crucial.
                  </p>
                </div>

                <div className="bg-orange-100 p-3 rounded-lg border border-orange-300">
                  <p className="text-xs text-orange-800 font-semibold">
                    Aging Rate: +{prediction.currentAgingRate} years skin age per year
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl border-2 border-purple-300 text-center">
            <p className="text-2xl font-bold text-purple-800 mb-2">
              Potential Difference: {difference} Years of Skin Aging
            </p>
            <p className="text-lg text-purple-700">
              Good skincare can make you look {difference} years younger in {selectedYears} years!
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border-2 border-slate-300">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Aging Trajectory Comparison
            </h3>
            <div className="relative h-64 bg-slate-50 rounded-lg p-4 border border-slate-200">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <line x1="40" y1="0" x2="40" y2="180" stroke="#94a3b8" strokeWidth="2" />
                <line x1="40" y1="180" x2="400" y2="180" stroke="#94a3b8" strokeWidth="2" />

                <text x="10" y="15" fontSize="10" fill="#475569">Age</text>
                <text x="350" y="195" fontSize="10" fill="#475569">Years</text>

                <polyline
                  points={`40,${180 - (prediction.currentSkinAge - prediction.currentActualAge) * 3} ${
                    prediction.healthyScenarios.map((s, i) =>
                      `${40 + (i + 1) * 90},${180 - (s.skinAge - prediction.currentActualAge) * 3}`
                    ).join(' ')
                  }`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />

                <polyline
                  points={`40,${180 - (prediction.currentSkinAge - prediction.currentActualAge) * 3} ${
                    prediction.currentPathScenarios.map((s, i) =>
                      `${40 + (i + 1) * 90},${180 - (s.skinAge - prediction.currentActualAge) * 3}`
                    ).join(' ')
                  }`}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                />

                <circle cx="40" cy={180 - (prediction.currentSkinAge - prediction.currentActualAge) * 3} r="4" fill="#3b82f6" />
              </svg>
              <div className="absolute bottom-2 right-4 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-slate-700">Healthy Path</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-0.5 bg-orange-500"></div>
                  <span className="text-slate-700">Current Path</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="text-2xl">Key Interventions by Priority</CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            Based on your priority concerns and clinical scores
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {interventions.map((intervention, idx) => (
            <div key={idx} className="bg-white rounded-lg p-5 border-l-4 border-blue-500 shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    {intervention.priority}. {intervention.concern}
                  </h4>
                  <p className="text-sm text-slate-600">
                    Severity: <span className={`font-semibold ${
                      intervention.severity === 'Severe' ? 'text-red-600' :
                      intervention.severity === 'Moderate' ? 'text-orange-600' :
                      intervention.severity === 'Mild' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{intervention.severity}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {intervention.recommendations.map((rec, recIdx) => (
                  <div key={recIdx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-2 border-yellow-300">
        <CardContent className="p-6">
          <p className="text-sm text-slate-700 italic">
            <span className="font-bold">Disclaimer:</span> These predictions are estimates based on clinical research patterns.
            Individual results vary based on genetics, lifestyle, environment, and treatment adherence.
            Consult a board-certified dermatologist for personalized treatment plans and medical advice.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center justify-center sm:justify-start gap-2">
                  <Save className="w-6 h-6 text-teal-600" />
                  Track Your Progress
                </h3>
                <p className="text-sm text-slate-600">
                  Save this analysis to monitor your skin health improvements over time
                </p>
              </div>
              <Button
                onClick={handleSaveAnalysis}
                disabled={isSaved}
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold px-8 py-4 text-lg shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save This Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg shadow-xl disabled:opacity-50"
          >
            <Download className="w-5 h-5 mr-2" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Report'}
          </Button>
          <Button
            onClick={handleDownloadText}
            size="lg"
            variant="outline"
            className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-bold px-8 py-6 text-lg shadow-lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            Download Text Report
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleShareResults}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold px-8 py-6 text-lg shadow-xl"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Results
          </Button>
          <Button
            onClick={onRestart}
            size="lg"
            variant="outline"
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 text-lg shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Start New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
