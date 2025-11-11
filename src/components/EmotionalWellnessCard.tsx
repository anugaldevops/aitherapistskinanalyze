import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Brain, Heart, Moon } from 'lucide-react';

interface EmotionalWellnessCardProps {
  clinicalScore: number;
  onOpenTherapist?: () => void;
}

export function EmotionalWellnessCard({ clinicalScore, onOpenTherapist }: EmotionalWellnessCardProps) {
  const getEmotionalState = () => {
    if (clinicalScore <= 6) {
      return {
        emoji: '😊',
        status: 'Positive emotional balance',
        description: 'Facial stress cues indicate good emotional wellness',
        bgColor: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200'
      };
    }
    if (clinicalScore <= 12) {
      return {
        emoji: '😐',
        status: 'Mild stress indicators',
        description: 'Some tension patterns detected in facial analysis',
        bgColor: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-200'
      };
    }
    return {
      emoji: '😟',
      status: 'High stress or emotional strain',
      description: 'Significant tension patterns may indicate stress',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200'
    };
  };

  const state = getEmotionalState();

  return (
    <Card className={`mt-6 bg-gradient-to-r ${state.bgColor} border-2 ${state.borderColor} shadow-xl`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Brain className="w-7 h-7 text-teal-600" />
          Emotional Wellness Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="text-6xl">{state.emoji}</div>
          <div className="flex-1">
            <p className="font-bold text-xl text-slate-800 mb-1">{state.status}</p>
            <p className="text-sm text-slate-600">{state.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Workload Stress</p>
            </div>
            <p className="text-xs text-slate-600">Forehead tension signals</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Sleep Recovery</p>
            </div>
            <p className="text-xs text-slate-600">Eye fatigue patterns</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-bold text-slate-800">Emotional State</p>
            </div>
            <p className="text-xs text-slate-600">Expression softness analysis</p>
          </div>
        </div>

        <div className="bg-teal-50 p-5 rounded-xl border-2 border-teal-200">
          <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="text-lg">🤖</span> AI Therapist Suggests:
          </p>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Try a 3-minute guided breathing exercise</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Reflect: "What emotion needs my attention today?"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Aim for 7–8 hours of sleep for optimal reset</span>
            </li>
          </ul>
        </div>

        {onOpenTherapist && (
          <Button
            onClick={onOpenTherapist}
            data-therapist-button
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            Talk to AI Therapist
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
