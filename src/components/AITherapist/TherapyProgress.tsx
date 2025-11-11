import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart3, MessageSquare, Heart, TrendingUp } from 'lucide-react';
import { therapyService } from '../../lib/therapyService';
import { format } from 'date-fns';

export function TherapyProgress() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    lastSessionDate: null as string | null,
    mostDiscussedMoods: [] as string[],
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await therapyService.getSessionStats();
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-slate-600">Loading your progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (stats.totalSessions === 0) {
    return null;
  }

  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Your Therapy Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-teal-200">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <p className="text-xs text-slate-600 font-medium">Total Sessions</p>
            </div>
            <p className="text-2xl font-bold text-teal-600">{stats.totalSessions}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-slate-600 font-medium">Messages</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalMessages}</p>
          </div>
        </div>

        {stats.lastSessionDate && (
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-600 font-medium mb-1">Last Session</p>
            <p className="text-sm text-slate-800">
              {format(new Date(stats.lastSessionDate), 'MMM dd, yyyy')}
            </p>
          </div>
        )}

        {stats.mostDiscussedMoods.length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-slate-600 font-medium">Common Feelings</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {stats.mostDiscussedMoods.map((mood, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                >
                  {mood}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-teal-100 to-blue-100 rounded-lg p-3 border border-teal-300">
          <p className="text-xs text-slate-700">
            <strong>Great progress!</strong> Keep taking care of your mental wellness.
            Every conversation is a step forward.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
