import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Camera,
  Calendar,
  TrendingUp,
  Activity,
  Target,
  Eye,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getDashboardData,
  type DashboardStats,
  type AnalysisPoint,
  type RecentAnalysis
} from '../lib/dashboardData';
import type { Insight } from '../lib/insightsGenerator';
import { HolisticWellnessWidget } from './HolisticWellnessWidget';

interface DashboardProps {
  onTakeNewScan: () => void;
  onViewRoutine: () => void;
  onViewAnalysis: (analysisId: string) => void;
  onViewHistory: () => void;
}

export function Dashboard({
  onTakeNewScan,
  onViewRoutine,
  onViewAnalysis,
  onViewHistory
}: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalScans: 0,
    currentAge: 0,
    latestSkinAge: null,
    latestScore: null
  });
  const [chartData, setChartData] = useState<AnalysisPoint[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'score' | 'skinAge' | 'composite'>('score');
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);

    console.log('📊 Loading dashboard data...');

    const data = await getDashboardData();

    if (!data) {
      console.error('❌ Failed to load dashboard data');
      setHasData(false);
      setIsLoading(false);
      return;
    }

    console.log('✅ Dashboard data loaded:', data);

    setStats(data.stats);
    setChartData(data.chartData);
    setRecentAnalyses(data.recentAnalyses);
    setInsights(data.insights);
    setHasData(data.stats.totalScans > 0);
    setIsLoading(false);
  };

  const getChartValue = (point: AnalysisPoint) => {
    switch (chartMetric) {
      case 'score':
        return point.clinicalScore;
      case 'skinAge':
        return point.skinAge;
      case 'composite':
        return point.compositeIndex;
      default:
        return point.clinicalScore;
    }
  };

  const getChartLabel = () => {
    switch (chartMetric) {
      case 'score':
        return 'Clinical Score';
      case 'skinAge':
        return 'Skin Age';
      case 'composite':
        return 'Composite Index';
      default:
        return 'Clinical Score';
    }
  };

  const getMaxValue = () => {
    if (chartData.length === 0) return 25;
    const values = chartData.map(getChartValue);
    return Math.ceil(Math.max(...values) * 1.2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <div className="text-center">
            <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-lg text-slate-600">Loading your dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-2xl w-full p-8">
          <CardContent className="text-center space-y-6">
            <Camera className="w-20 h-20 text-blue-600 mx-auto" />
            <h1 className="text-3xl font-bold text-slate-800">Welcome to Your Skin Health Journey!</h1>
            <p className="text-lg text-slate-600">
              Start tracking your skin health by taking your first scan.
              Our AI will analyze your skin and provide personalized insights.
            </p>
            <Button
              onClick={onTakeNewScan}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              <Camera className="w-6 h-6 mr-2" />
              Take Your First Scan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <Button
            onClick={onTakeNewScan}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Camera className="w-5 h-5 mr-2" />
            Take New Scan
          </Button>
        </div>

        <HolisticWellnessWidget
          latestClinicalScore={stats.latestScore?.current}
          onOpenTherapist={() => {
            const therapistButton = document.querySelector('[data-therapist-button]') as HTMLButtonElement;
            if (therapistButton) therapistButton.click();
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Total Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{stats.totalScans}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Current Age
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{stats.currentAge}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Skin Age
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">
                {stats.latestSkinAge ?? '-'}
              </p>
              {stats.latestSkinAge && stats.currentAge && (
                <p className="text-sm text-slate-500 mt-1">
                  {stats.latestSkinAge > stats.currentAge ? '+' : ''}
                  {stats.latestSkinAge - stats.currentAge} years
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Latest Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">
                {stats.latestScore ? `${stats.latestScore.current}/${stats.latestScore.max}` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-xl font-bold text-slate-800">Your Skin Journey</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartMetric === 'score' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartMetric('score')}
                >
                  Clinical Score
                </Button>
                <Button
                  variant={chartMetric === 'skinAge' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartMetric('skinAge')}
                >
                  Skin Age
                </Button>
                <Button
                  variant={chartMetric === 'composite' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartMetric('composite')}
                >
                  Composite Index
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80 relative">
              <svg viewBox="0 0 800 300" className="w-full h-full">
                <line x1="60" y1="250" x2="750" y2="250" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="60" y1="20" x2="60" y2="250" stroke="#cbd5e1" strokeWidth="2" />

                <text x="30" y="25" fill="#64748b" fontSize="12">{getMaxValue()}</text>
                <text x="30" y="140" fill="#64748b" fontSize="12">{Math.round(getMaxValue() / 2)}</text>
                <text x="30" y="255" fill="#64748b" fontSize="12">0</text>

                {chartData.map((point, index) => {
                  const x = 80 + (index * (670 / Math.max(chartData.length - 1, 1)));
                  const value = getChartValue(point);
                  const y = 250 - (value / getMaxValue()) * 230;
                  const date = new Date(point.date);
                  const dateLabel = format(date, 'MMM d');

                  return (
                    <g key={point.id}>
                      <text
                        x={x}
                        y="270"
                        fill="#64748b"
                        fontSize="11"
                        textAnchor="middle"
                      >
                        {dateLabel}
                      </text>

                      {index < chartData.length - 1 && (
                        <line
                          x1={x}
                          y1={y}
                          x2={80 + ((index + 1) * (670 / Math.max(chartData.length - 1, 1)))}
                          y2={250 - (getChartValue(chartData[index + 1]) / getMaxValue()) * 230}
                          stroke="#3b82f6"
                          strokeWidth="3"
                        />
                      )}

                      <circle
                        cx={x}
                        cy={y}
                        r={index === chartData.length - 1 ? "8" : "6"}
                        fill={index === chartData.length - 1 ? "#ef4444" : "#3b82f6"}
                        stroke="white"
                        strokeWidth="2"
                      />

                      <text
                        x={x}
                        y={y - 15}
                        fill={index === chartData.length - 1 ? "#ef4444" : "#3b82f6"}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {value}
                      </text>
                    </g>
                  );
                })}

                <text x="400" y="295" fill="#64748b" fontSize="13" fontWeight="bold" textAnchor="middle">
                  Date
                </text>
                <text
                  x="-150"
                  y="15"
                  fill="#64748b"
                  fontSize="13"
                  fontWeight="bold"
                  textAnchor="middle"
                  transform="rotate(-90)"
                >
                  {getChartLabel()}
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>

        {insights.length > 0 && (
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-amber-600" />
                Your Skin Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight) => {
                const getBorderColor = () => {
                  switch (insight.type) {
                    case 'success':
                      return 'border-green-300 bg-green-50';
                    case 'achievement':
                      return 'border-purple-300 bg-purple-50';
                    case 'warning':
                      return 'border-orange-300 bg-orange-50';
                    case 'info':
                      return 'border-blue-300 bg-blue-50';
                    default:
                      return 'border-slate-300 bg-slate-50';
                  }
                };

                return (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border-2 ${getBorderColor()} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{insight.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-1">{insight.title}</h3>
                        <p className="text-sm text-slate-700">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-slate-800">Recent Analyses</CardTitle>
                  <Button variant="ghost" size="sm" onClick={onViewHistory}>
                    View All History
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="w-10 h-10 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {format(new Date(analysis.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-slate-600">
                          Score: {analysis.score}/{analysis.maxScore} •
                          Skin Age: {analysis.skinAge}
                          <span className="text-orange-600 font-semibold">
                            {' '}(+{analysis.ageDifference} years)
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewAnalysis(analysis.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={onTakeNewScan}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                >
                  <Camera className="w-5 h-5 mr-3" />
                  Take New Scan
                </Button>
                <Button
                  onClick={onViewRoutine}
                  variant="outline"
                  size="lg"
                  className="w-full justify-start border-2"
                >
                  <Activity className="w-5 h-5 mr-3" />
                  View My Routine
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start border-2"
                >
                  <Target className="w-5 h-5 mr-3" />
                  Set Goals
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
