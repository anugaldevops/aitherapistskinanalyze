import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import { therapyService } from '../../lib/therapyService';
import { meditations } from '../../data/meditations';

export function MeditationProgress() {
  const [stats, setStats] = useState({
    totalCompletions: 0,
    completedMeditations: [] as string[],
    lastMeditationDate: null as string | null,
    favoriteMeditation: null as string | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const meditationStats = await therapyService.getMeditationStats();
    setStats(meditationStats);
    setLoading(false);
  };

  const getFavoriteMeditationDetails = () => {
    if (!stats.favoriteMeditation) return null;
    return meditations.find(m => m.id === stats.favoriteMeditation);
  };

  const getCompletionPercentage = () => {
    return Math.round((stats.completedMeditations.length / meditations.length) * 100);
  };

  const formatLastDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          <h3 className="font-bold text-slate-800">Loading meditation progress...</h3>
        </div>
      </Card>
    );
  }

  const favoriteMeditation = getFavoriteMeditationDetails();

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 border-2 border-purple-200 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h3 className="font-bold text-lg text-slate-800">Your Meditation Journey</h3>
      </div>

      {stats.totalCompletions === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-600 mb-2">You haven't completed any meditations yet.</p>
          <p className="text-sm text-slate-500">
            Start your mindfulness journey today!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-slate-600">Completed</p>
              </div>
              <p className="text-3xl font-bold text-slate-800">{stats.totalCompletions}</p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalCompletions === 1 ? 'meditation' : 'meditations'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-slate-600">Last Practice</p>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {formatLastDate(stats.lastMeditationDate)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-teal-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <p className="text-sm font-medium text-slate-600">Progress</p>
              </div>
              <p className="text-sm font-bold text-teal-600">
                {getCompletionPercentage()}%
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Tried {stats.completedMeditations.length} of {meditations.length} meditations
            </p>
          </div>

          {favoriteMeditation && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-300">
              <p className="text-sm font-medium text-slate-600 mb-2">
                Most Practiced
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{favoriteMeditation.icon}</span>
                <div>
                  <p className="font-bold text-slate-800">{favoriteMeditation.title}</p>
                  <p className="text-xs text-slate-600">{favoriteMeditation.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-purple-200">
            <p className="text-xs text-slate-500 text-center">
              Keep up your practice! Regular meditation can help reduce stress and improve emotional wellbeing.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
