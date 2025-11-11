import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, TrendingUp, Brain, Calendar, Lock, Unlock, Settings } from 'lucide-react';
import { therapyService } from '../lib/therapyService';
import { privacyControlsService, PrivacySettings } from '../lib/privacyControlsService';

export function HistoricalInsightsPanel() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    const settings = await privacyControlsService.getPrivacySettings();
    setPrivacySettings(settings);
  };

  const loadInsights = async () => {
    setLoading(true);
    try {
      const progressData = await therapyService.analyzeUserProgress();
      setInsights(progressData);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHistoricalContext = async () => {
    if (!privacySettings) return;

    const newValue = !privacySettings.enableHistoricalContext;
    const success = await privacyControlsService.updatePrivacySettings({
      enableHistoricalContext: newValue
    });

    if (success) {
      await loadPrivacySettings();
    }
  };

  const updateDataAccess = async (
    field: 'allowJournalAccess' | 'allowTherapyHistoryAccess' | 'allowSkinAnalysisAccess',
    value: boolean
  ) => {
    const success = await privacyControlsService.updatePrivacySettings({
      [field]: value
    });

    if (success) {
      await loadPrivacySettings();
    }
  };

  if (!privacySettings) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Historical Insights</h3>
              <p className="text-sm text-slate-600">AI-powered analysis of your journey</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Privacy
          </Button>
        </div>

        {showPrivacySettings && (
          <div className="mb-6 p-4 bg-white rounded-lg border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {privacySettings.enableHistoricalContext ? (
                  <Unlock className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-slate-800">Historical Context</p>
                  <p className="text-xs text-slate-600">
                    {privacySettings.enableHistoricalContext
                      ? 'AI can access your historical data'
                      : 'AI uses only current conversation'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={privacySettings.enableHistoricalContext ? 'default' : 'outline'}
                onClick={toggleHistoricalContext}
              >
                {privacySettings.enableHistoricalContext ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {privacySettings.enableHistoricalContext && (
              <div className="space-y-2 pl-7">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={privacySettings.allowJournalAccess}
                    onChange={(e) => updateDataAccess('allowJournalAccess', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-slate-700">Journal entries</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={privacySettings.allowTherapyHistoryAccess}
                    onChange={(e) => updateDataAccess('allowTherapyHistoryAccess', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-slate-700">Past therapy sessions</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={privacySettings.allowSkinAnalysisAccess}
                    onChange={(e) => updateDataAccess('allowSkinAnalysisAccess', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-slate-700">Skin analysis history</span>
                </label>
                <div className="flex items-center gap-2 text-sm pt-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-700">Look back: {privacySettings.historicalContextDays} days</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!privacySettings.enableHistoricalContext && (
          <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg mb-4">
            <p className="text-sm text-yellow-800">
              Historical context is disabled. Enable it to receive insights based on your journey.
            </p>
          </div>
        )}

        {!insights && privacySettings.enableHistoricalContext && (
          <Button
            onClick={loadInsights}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing your journey...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        )}

        {insights && (
          <div className="space-y-4">
            {insights.journeySnapshot && (
              <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                <p className="text-sm text-slate-800 font-medium">{insights.journeySnapshot}</p>
              </div>
            )}

            {insights.insights && insights.insights.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  {insights.insights.map((insight: string, index: number) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-slate-200">
                      <p className="text-sm text-slate-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.patterns && insights.patterns.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Patterns Observed
                </h4>
                <div className="space-y-2">
                  {insights.patterns.map((pattern: string, index: number) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-slate-700">{pattern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.correlations && insights.correlations.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Key Insights</h4>
                <div className="space-y-2">
                  {insights.correlations.map((correlation: string, index: number) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-slate-700 font-medium">{correlation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={loadInsights}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={loading}
            >
              Refresh Insights
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
