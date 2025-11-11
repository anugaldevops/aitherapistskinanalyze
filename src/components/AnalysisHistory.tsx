import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import {
  History,
  TrendingDown,
  TrendingUp,
  Calendar,
  Eye,
  Trash2,
  X,
  AlertTriangle,
  BarChart3,
  Clock,
  Award,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  SavedAnalysis,
  calculateTrend,
  formatDate
} from '../lib/analysisHistory';
import {
  getAnalysisHistory,
  deleteAnalysis as deleteAnalysisFromDb,
  updateAnalysisMetadata,
  AnalysisMetadata
} from '../lib/analysisHistoryDb';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalysisHistoryProps {
  onClose: () => void;
  onCompare?: (analysis1: SavedAnalysis, analysis2: SavedAnalysis) => void;
}

type SortOption = 'newest' | 'oldest' | 'youngest' | 'oldest-age';

export function AnalysisHistory({ onClose, onCompare }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<SavedAnalysis[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [editingAnalysis, setEditingAnalysis] = useState<SavedAnalysis | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [sortOption]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Loading analysis history from database...');

      let sortBy: 'photo_date' | 'age_in_photo' = 'photo_date';
      let ascending = false;

      if (sortOption === 'newest') {
        sortBy = 'photo_date';
        ascending = false;
      } else if (sortOption === 'oldest') {
        sortBy = 'photo_date';
        ascending = true;
      } else if (sortOption === 'youngest') {
        sortBy = 'age_in_photo';
        ascending = true;
      } else if (sortOption === 'oldest-age') {
        sortBy = 'age_in_photo';
        ascending = false;
      }

      const analyses = await getAnalysisHistory(sortBy, ascending);
      console.log(`✅ Loaded ${analyses.length} saved analyses:`, analyses);
      setHistory(analyses);
    } catch (err) {
      console.error('❌ Error loading analysis history:', err);
      setError('Unable to load history. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnalysisFromDb(id);
      await loadHistory();
      setSelectedForCompare(selectedForCompare.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting analysis:', err);
      setError('Failed to delete analysis');
    }
  };

  const handleClearAll = async () => {
    try {
      for (const analysis of history) {
        await deleteAnalysisFromDb(analysis.id);
      }
      setHistory([]);
      setSelectedForCompare([]);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Error clearing history:', err);
      setError('Failed to clear history');
    }
  };

  const handleSelectForCompare = (analysis: SavedAnalysis) => {
    if (selectedForCompare.find(item => item.id === analysis.id)) {
      setSelectedForCompare(selectedForCompare.filter(item => item.id !== analysis.id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, analysis]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompare) {
      onCompare(selectedForCompare[0], selectedForCompare[1]);
    }
  };

  const handleEdit = (analysis: SavedAnalysis) => {
    setEditingAnalysis(analysis);
  };

  const handleSaveEdit = async (metadata: AnalysisMetadata) => {
    if (!editingAnalysis) return;

    setIsSaving(true);
    try {
      const success = await updateAnalysisMetadata(editingAnalysis.id, metadata);
      if (success) {
        await loadHistory();
        setEditingAnalysis(null);
      } else {
        setError('Failed to update analysis');
      }
    } catch (err) {
      console.error('Error updating analysis:', err);
      setError('Failed to update analysis');
    } finally {
      setIsSaving(false);
    }
  };

  const trend = calculateTrend(history);

  const chartData = [...history]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(item => ({
      date: formatDate(item.date),
      score: item.clinicalScore,
      skinAge: item.skinAge,
      actualAge: item.actualAge
    }));

  const getAssessmentLabel = (compositeIndex: number): { label: string; color: string } => {
    if (compositeIndex >= 18) return { label: 'Excellent', color: 'text-teal-600' };
    if (compositeIndex >= 15) return { label: 'Good', color: 'text-green-600' };
    if (compositeIndex >= 12) return { label: 'Fair', color: 'text-amber-600' };
    if (compositeIndex >= 9) return { label: 'Poor', color: 'text-orange-600' };
    return { label: 'Concerning', color: 'text-red-600' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-teal-50 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold text-slate-800">
                Your Skin Journey Timeline
              </CardTitle>
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Sort by:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="youngest">By Age (youngest to oldest)</option>
              <option value="oldest-age">By Age (oldest to youngest)</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-semibold text-slate-600">Loading your history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600 mb-2">{error}</p>
              <Button onClick={loadHistory} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-600 mb-2">No saved analyses yet</p>
              <p className="text-sm text-slate-500 mb-4">
                Complete your first skin scan!
              </p>
              <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                Start Analysis
              </Button>
            </div>
          ) : (
            <>
              {trend && (
                <Alert className={`border-2 ${trend.improving ? 'border-teal-200 bg-teal-50' : 'border-orange-200 bg-orange-50'}`}>
                  <div className="flex items-center gap-3">
                    {trend.improving ? (
                      <TrendingUp className="w-6 h-6 text-teal-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-orange-600" />
                    )}
                    <AlertDescription className={`font-semibold ${trend.improving ? 'text-teal-800' : 'text-orange-800'}`}>
                      {trend.improving ? (
                        <>
                          Your skin health is improving! {trend.metric === 'score' ? 'Score' : 'Skin age'} improved by{' '}
                          {trend.change.toFixed(1)} {trend.metric === 'score' ? 'points' : 'years'}
                        </>
                      ) : (
                        <>
                          Your {trend.metric === 'score' ? 'score' : 'skin age'} has changed by{' '}
                          {trend.change.toFixed(1)} {trend.metric === 'score' ? 'points' : 'years'}
                        </>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {history.length >= 2 && (
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">Progress Chart</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#0891b2"
                          strokeWidth={3}
                          name="Clinical Score"
                          dot={{ fill: '#0891b2', r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="skinAge"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          name="Skin Age"
                          dot={{ fill: '#f59e0b', r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="actualAge"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Actual Age"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {selectedForCompare.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">
                      {selectedForCompare.length} analysis selected for comparison
                    </p>
                    {selectedForCompare.length === 2 && (
                      <p className="text-sm text-blue-700">Click "Compare" to see side-by-side comparison</p>
                    )}
                  </div>
                  {selectedForCompare.length === 2 && onCompare && (
                    <Button onClick={handleCompare} className="bg-blue-600 hover:bg-blue-700">
                      Compare Now
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-600" />
                    Analysis Timeline ({history.length}/{10})
                  </h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear History
                  </Button>
                </div>

                {showClearConfirm && (
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <p className="font-semibold mb-2">Are you sure you want to clear all history?</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleClearAll}
                        >
                          Yes, Clear All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowClearConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  {history.map((item, index) => {
                    const assessment = getAssessmentLabel(item.compositeIndex);
                    const isSelected = selectedForCompare.find(s => s.id === item.id);
                    const displayAge = item.ageInPhoto || item.actualAge;
                    const skinAgeDiff = item.skinAge - displayAge;
                    const photoDateDisplay = item.photoDate || item.date;

                    return (
                      <Card
                        key={item.id}
                        className={`transition-all hover:shadow-lg ${
                          isSelected ? 'border-2 border-blue-500 bg-blue-50' : 'border border-slate-200'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg p-2">
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Photo Date:</p>
                                  <p className="font-bold text-slate-800">{formatDate(photoDateDisplay)}</p>
                                  <p className="text-xs text-slate-500">Age: {displayAge} years old</p>
                                </div>
                                {index === 0 && sortOption === 'newest' && (
                                  <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                                    Latest
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                  <p className="text-xs text-slate-500 mb-1">Clinical Score</p>
                                  <p className="text-lg font-bold text-blue-600">
                                    {item.clinicalScore}/{item.maxClinicalScore}
                                  </p>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                  <p className="text-xs text-slate-500 mb-1">Skin Age</p>
                                  <p className="text-lg font-bold text-amber-600">
                                    {item.skinAge}
                                    <span className="text-sm text-slate-500 ml-1">
                                      ({skinAgeDiff > 0 ? '+' : ''}{skinAgeDiff})
                                    </span>
                                  </p>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                  <p className="text-xs text-slate-500 mb-1">Composite Index</p>
                                  <p className="text-lg font-bold text-slate-600">{item.compositeIndex.toFixed(1)}</p>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-slate-200">
                                  <p className="text-xs text-slate-500 mb-1">Assessment</p>
                                  <div className="flex items-center gap-1">
                                    <Award className={`w-4 h-4 ${assessment.color}`} />
                                    <p className={`text-sm font-bold ${assessment.color}`}>
                                      {assessment.label}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {(item.skincareRoutine || (item.lifestyleHabits && item.lifestyleHabits.length > 0)) && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 space-y-2">
                                  {item.skincareRoutine && (
                                    <div>
                                      <p className="text-xs font-semibold text-purple-700 mb-1">Routine:</p>
                                      <p className="text-sm text-slate-700">{item.skincareRoutine}</p>
                                    </div>
                                  )}
                                  {item.lifestyleHabits && item.lifestyleHabits.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-purple-700 mb-1">Habits:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {item.lifestyleHabits.map((habit, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-0.5 bg-white text-purple-700 text-xs rounded-full"
                                          >
                                            {habit}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-slate-600 mb-1">Top Problem Zones:</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.topProblemZones.map((zone, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                                    >
                                      {zone.name} ({zone.score})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 whitespace-nowrap"
                              >
                                Edit Details
                              </Button>
                              {onCompare && history.length >= 2 && (
                                <Button
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => handleSelectForCompare(item)}
                                  disabled={selectedForCompare.length >= 2 && !isSelected}
                                  className="whitespace-nowrap"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {isSelected ? 'Selected' : 'Select'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editingAnalysis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white">
            <CardHeader>
              <CardTitle>Edit Analysis Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Analysis scores cannot be changed as they are calculated from the original photo.
                </p>
              </div>

              <EditAnalysisForm
                analysis={editingAnalysis}
                onSave={handleSaveEdit}
                onCancel={() => setEditingAnalysis(null)}
                isSaving={isSaving}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface EditAnalysisFormProps {
  analysis: SavedAnalysis;
  onSave: (metadata: AnalysisMetadata) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function EditAnalysisForm({ analysis, onSave, onCancel, isSaving }: EditAnalysisFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const minDate = '1950-01-01';
  const [photoDate, setPhotoDate] = useState(analysis.photoDate || analysis.date);
  const [ageInPhoto, setAgeInPhoto] = useState((analysis.ageInPhoto || analysis.actualAge).toString());
  const [skincareRoutine, setSkincareRoutine] = useState(analysis.skincareRoutine || '');
  const [lifestyleHabits, setLifestyleHabits] = useState<string[]>(analysis.lifestyleHabits || []);
  const [notes, setNotes] = useState(analysis.notes || '');

  const LIFESTYLE_OPTIONS = [
    'Daily SPF use',
    'Smoking',
    'Regular exercise',
    'High stress',
    'Poor sleep',
    'Heavy sun exposure',
    'Healthy diet'
  ];

  const handleHabitToggle = (habit: string) => {
    if (lifestyleHabits.includes(habit)) {
      setLifestyleHabits(lifestyleHabits.filter(h => h !== habit));
    } else {
      setLifestyleHabits([...lifestyleHabits, habit]);
    }
  };

  const handleSubmit = () => {
    const age = parseInt(ageInPhoto);
    if (isNaN(age) || age < 13 || age > 80) {
      alert('Please enter a valid age between 13 and 80');
      return;
    }

    if (photoDate > today) {
      alert('Photo date cannot be in the future');
      return;
    }

    onSave({
      photoDate,
      ageInPhoto: age,
      skincareRoutine: skincareRoutine.trim(),
      lifestyleHabits,
      notes: notes.trim()
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-photoDate" className="text-base font-semibold">
          Photo Date
        </Label>
        <Input
          id="edit-photoDate"
          type="date"
          value={photoDate}
          onChange={(e) => setPhotoDate(e.target.value)}
          max={today}
          min={minDate}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-age" className="text-base font-semibold">
          Age in Photo
        </Label>
        <Input
          id="edit-age"
          type="number"
          min="13"
          max="80"
          value={ageInPhoto}
          onChange={(e) => setAgeInPhoto(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-routine" className="text-base font-semibold">
          Skincare Routine
        </Label>
        <textarea
          id="edit-routine"
          value={skincareRoutine}
          onChange={(e) => setSkincareRoutine(e.target.value)}
          placeholder="What products were you using?"
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Lifestyle & Habits</Label>
        <div className="grid grid-cols-2 gap-2">
          {LIFESTYLE_OPTIONS.map((habit) => (
            <label
              key={habit}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={lifestyleHabits.includes(habit)}
                onChange={() => handleHabitToggle(habit)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm">{habit}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-notes" className="text-base font-semibold">
          Notes
        </Label>
        <textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other relevant info"
          className="w-full min-h-[60px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-slate-100 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Analysis Scores (Read-Only)</p>
        <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
          <div>Clinical Score: <strong>{analysis.clinicalScore}/{analysis.maxClinicalScore}</strong></div>
          <div>Skin Age: <strong>{analysis.skinAge}</strong></div>
          <div>Composite Index: <strong>{analysis.compositeIndex.toFixed(1)}</strong></div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onCancel} variant="outline" className="flex-1" disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
