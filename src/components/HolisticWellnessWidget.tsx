import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Activity, Brain, Moon, TrendingUp } from 'lucide-react';

interface HolisticWellnessWidgetProps {
  latestClinicalScore?: number;
  onOpenTherapist?: () => void;
}

export function HolisticWellnessWidget({ latestClinicalScore = 75, onOpenTherapist }: HolisticWellnessWidgetProps) {
  const overallScore = 72;
  const circumference = 2 * Math.PI * 56;
  const progress = circumference * (1 - overallScore / 100);

  const getMentalWellnessStatus = () => {
    if (!latestClinicalScore) return { status: 'Good', color: 'text-green-600' };
    if (latestClinicalScore <= 6) return { status: 'Excellent', color: 'text-green-600' };
    if (latestClinicalScore <= 12) return { status: 'Moderate', color: 'text-yellow-600' };
    return { status: 'Needs Attention', color: 'text-orange-600' };
  };

  const mentalWellness = getMentalWellnessStatus();

  return (
    <Card className="bg-gradient-to-r from-teal-50 via-blue-50 to-cyan-50 border-2 border-teal-200 shadow-2xl">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-8 h-8 text-teal-600" />
              Holistic Wellness Overview
            </CardTitle>
            <p className="text-slate-600 mt-2">Skin health • Mental wellness • Lifestyle balance</p>
          </div>

          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <defs>
                <linearGradient id="wellness-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="#e5e7eb"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#wellness-gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-slate-800">{overallScore}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl text-center shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">📊</div>
            <p className="font-bold text-slate-800 text-sm">Skin Health</p>
            <p className="text-lg font-semibold text-blue-600 mt-1">
              {latestClinicalScore || 75}/100
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl text-center shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">
              <Brain className="w-8 h-8 mx-auto text-teal-600" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Mental Wellness</p>
            <p className={`text-sm font-semibold mt-1 ${mentalWellness.color}`}>
              {mentalWellness.status}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl text-center shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">
              <Moon className="w-8 h-8 mx-auto text-blue-600" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Sleep Recovery</p>
            <p className="text-sm text-blue-600 font-semibold mt-1">Improving</p>
          </div>

          <div className="bg-white p-4 rounded-xl text-center shadow-md border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-2">
              <TrendingUp className="w-8 h-8 mx-auto text-green-600" />
            </div>
            <p className="font-bold text-slate-800 text-sm">Activity</p>
            <p className="text-sm text-green-600 font-semibold mt-1">Consistent</p>
          </div>
        </div>

        <div className="bg-white/80 p-5 rounded-xl border-2 border-teal-100">
          <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-xl">🤖</span> AI Insights:
          </p>
          <div className="text-sm text-slate-700 space-y-1">
            <p>• Stress indicators decreased after recent mindfulness practice</p>
            <p>• Emotional balance showing positive trends this week</p>
            <p>• Regular activity contributing to improved wellness scores</p>
          </div>
        </div>

        {onOpenTherapist && (
          <Button
            onClick={onOpenTherapist}
            data-therapist-button
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Open AI Therapist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
