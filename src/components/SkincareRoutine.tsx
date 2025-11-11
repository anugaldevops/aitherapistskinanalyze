import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sun,
  Moon,
  Plus,
  X,
  Save,
  Bell,
  Calendar,
  Check,
  Download,
  ExternalLink
} from 'lucide-react';
import {
  getRoutineSteps,
  saveRoutineStep,
  deleteRoutineStep,
  getReminders,
  saveReminder,
  getMonthlyAdherence,
  markRoutineComplete,
  getTodayStepCompletions,
  markStepComplete,
  unmarkStepComplete,
  reminderService,
  type RoutineStep,
  type Reminder,
  type RoutineAdherence
} from '../lib/reminderService';
import {
  addAllRoutineStepsToGoogleCalendar,
  downloadICSFile
} from '../lib/calendarExport';

export function SkincareRoutine({ onClose }: { onClose: () => void }) {
  const [morningSteps, setMorningSteps] = useState<RoutineStep[]>([]);
  const [eveningSteps, setEveningSteps] = useState<RoutineStep[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [adherence, setAdherence] = useState<RoutineAdherence[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAdherence, setShowAdherence] = useState(false);
  const [showTodaySteps, setShowTodaySteps] = useState(false);

  useEffect(() => {
    loadData();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const [morning, evening, reminderData, adherenceData, completions] = await Promise.all([
      getRoutineSteps('morning'),
      getRoutineSteps('evening'),
      getReminders(),
      getMonthlyAdherence(new Date().getFullYear(), new Date().getMonth() + 1),
      getTodayStepCompletions()
    ]);

    setMorningSteps(morning);
    setEveningSteps(evening);
    setReminders(reminderData);
    setAdherence(adherenceData);
    setCompletedSteps(completions);
    setIsLoading(false);
  };

  const handleAddStep = async (routineType: 'morning' | 'evening') => {
    const defaultTime = routineType === 'morning' ? '07:00' : '22:00';
    const steps = routineType === 'morning' ? morningSteps : eveningSteps;

    const newStep: Partial<RoutineStep> = {
      routine_type: routineType,
      step_name: '',
      step_order: steps.length,
      scheduled_time: defaultTime,
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      enabled: true
    };

    const saved = await saveRoutineStep(newStep);
    if (saved) {
      if (routineType === 'morning') {
        setMorningSteps([...morningSteps, saved]);
      } else {
        setEveningSteps([...eveningSteps, saved]);
      }
    }
  };

  const handleUpdateStep = async (stepId: string, updates: Partial<RoutineStep>, routineType: 'morning' | 'evening') => {
    const steps = routineType === 'morning' ? morningSteps : eveningSteps;
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const updated = await saveRoutineStep({ ...step, ...updates });
    if (updated) {
      if (routineType === 'morning') {
        setMorningSteps(morningSteps.map(s => s.id === stepId ? updated : s));
      } else {
        setEveningSteps(eveningSteps.map(s => s.id === stepId ? updated : s));
      }
    }
  };

  const handleDeleteStep = async (stepId: string, routineType: 'morning' | 'evening') => {
    const success = await deleteRoutineStep(stepId);
    if (success) {
      if (routineType === 'morning') {
        setMorningSteps(morningSteps.filter(s => s.id !== stepId));
      } else {
        setEveningSteps(eveningSteps.filter(s => s.id !== stepId));
      }
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await reminderService.requestNotificationPermission();
    setNotificationsEnabled(granted);

    if (granted) {
      reminderService.startReminderChecks();
      alert('Notifications enabled! You will receive reminders for your routine.');
    }
  };

  const handleAddToGoogleCalendar = () => {
    if (morningSteps.length === 0 && eveningSteps.length === 0) {
      alert('Please add some routine steps first!');
      return;
    }

    console.log('📅 Adding routine to Google Calendar');
    addAllRoutineStepsToGoogleCalendar(morningSteps, eveningSteps);

    setTimeout(() => {
      alert(`✓ Opened ${morningSteps.length + eveningSteps.length} Google Calendar tabs!\n\nClick "Save" on each event to add it to your calendar.`);
    }, 1000);
  };

  const handleDownloadICS = () => {
    if (morningSteps.length === 0 && eveningSteps.length === 0) {
      alert('Please add some routine steps first!');
      return;
    }

    console.log('📥 Downloading .ics file');
    downloadICSFile(morningSteps, eveningSteps);

    setTimeout(() => {
      alert('✓ Calendar file downloaded!\n\nOpen "skincare-routine.ics" on your device to import into:\n• Apple Calendar\n• Outlook\n• Any calendar app');
    }, 500);
  };

  const handleSaveRoutine = async () => {
    setIsSaving(true);

    const morningReminder = reminders.find(r => r.reminder_type === 'morning_routine');
    const eveningReminder = reminders.find(r => r.reminder_type === 'evening_routine');

    if (notificationsEnabled && morningSteps.length > 0 && !morningReminder) {
      const firstMorningTime = morningSteps[0]?.scheduled_time || '07:00:00';
      await saveReminder({
        reminder_type: 'morning_routine',
        scheduled_time: firstMorningTime,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        notification_methods: ['browser']
      });
    }

    if (notificationsEnabled && eveningSteps.length > 0 && !eveningReminder) {
      const firstEveningTime = eveningSteps[0]?.scheduled_time || '22:00:00';
      await saveReminder({
        reminder_type: 'evening_routine',
        scheduled_time: firstEveningTime,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        notification_methods: ['browser']
      });
    }

    setIsSaving(false);
    alert('Routine saved successfully!');
  };

  const handleToggleStepCompletion = async (stepId: string, routineType: 'morning' | 'evening') => {
    const isCompleted = completedSteps.get(stepId);

    if (isCompleted) {
      await unmarkStepComplete(stepId, routineType);
      const newCompletions = new Map(completedSteps);
      newCompletions.delete(stepId);
      setCompletedSteps(newCompletions);
    } else {
      await markStepComplete(stepId, routineType);
      const newCompletions = new Map(completedSteps);
      newCompletions.set(stepId, true);
      setCompletedSteps(newCompletions);
    }

    await loadData();
  };

  const getTodayCompletionStats = () => {
    const totalSteps = morningSteps.length + eveningSteps.length;
    const completed = Array.from(completedSteps.keys()).filter(stepId => {
      return morningSteps.some(s => s.id === stepId) || eveningSteps.some(s => s.id === stepId);
    }).length;

    return { completed, total: totalSteps, percentage: totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0 };
  };

  const handleMarkComplete = async (routineType: 'morning' | 'evening') => {
    const steps = routineType === 'morning' ? morningSteps : eveningSteps;
    const today = new Date().toISOString().split('T')[0];

    const success = await markRoutineComplete(today, routineType, steps.length, steps.length);
    if (success) {
      alert(`${routineType === 'morning' ? 'Morning' : 'Evening'} routine marked complete!`);
      loadData();
    }
  };

  const calculateAdherenceStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastAdherence = adherence.filter(a => {
      const adherenceDate = new Date(a.date);
      adherenceDate.setHours(0, 0, 0, 0);
      return adherenceDate <= today;
    });

    if (pastAdherence.length === 0) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    const totalCompleted = pastAdherence.reduce((sum, a) => sum + a.completed_steps, 0);
    const totalPossible = pastAdherence.reduce((sum, a) => sum + a.total_steps, 0);

    const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return { percentage, completed: totalCompleted, total: totalPossible };
  };

  const getAdherenceForDate = (date: Date, routineType: 'morning' | 'evening') => {
    const dateStr = date.toISOString().split('T')[0];
    return adherence.find(a => a.date === dateStr && a.routine_type === routineType);
  };

  const renderRoutineSection = (
    title: string,
    icon: React.ReactNode,
    routineType: 'morning' | 'evening',
    steps: RoutineStep[]
  ) => (
    <Card className="mb-6">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50">
        <CardTitle className="flex items-center gap-2 text-xl">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {steps.length === 0 ? (
          <p className="text-sm text-slate-500 mb-4">No steps added yet. Click "Add Step" to get started.</p>
        ) : (
          <div className="space-y-4 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-bold text-slate-400 min-w-[24px]">{index + 1}.</span>
                <Input
                  value={step.step_name}
                  onChange={(e) => handleUpdateStep(step.id, { step_name: e.target.value }, routineType)}
                  placeholder="Step name (e.g., Cleanser, SPF)"
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={step.scheduled_time?.slice(0, 5)}
                  onChange={(e) => handleUpdateStep(step.id, { scheduled_time: e.target.value + ':00' }, routineType)}
                  className="w-32"
                />
                <div className="flex gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const daysOfWeek = step.days_of_week || [];
                        const newDays = daysOfWeek.includes(idx)
                          ? daysOfWeek.filter(d => d !== idx)
                          : [...daysOfWeek, idx].sort();
                        handleUpdateStep(step.id, { days_of_week: newDays }, routineType);
                      }}
                      className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                        (step.days_of_week || []).includes(idx)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteStep(step.id, routineType)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => handleAddStep(routineType)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add {title} Step
          </Button>
          {steps.length > 0 && (
            <Button
              variant="outline"
              onClick={() => handleMarkComplete(routineType)}
              className="flex items-center gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              <Check className="w-4 h-4" />
              Mark Complete Today
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAdherenceCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const morningAdherence = getAdherenceForDate(date, 'morning');
      const eveningAdherence = getAdherenceForDate(date, 'evening');

      const isFuture = date > today;

      let totalSteps = 0;
      let completedSteps = 0;
      let dayPercentage = 0;

      if (!isFuture) {
        if (morningAdherence) {
          totalSteps += morningAdherence.total_steps;
          completedSteps += morningAdherence.completed_steps;
        }
        if (eveningAdherence) {
          totalSteps += eveningAdherence.total_steps;
          completedSteps += eveningAdherence.completed_steps;
        }

        dayPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      }

      let bgColor = 'bg-white border-slate-200';
      let dotColor = 'bg-slate-400';

      if (!isFuture && totalSteps > 0) {
        if (dayPercentage === 100) {
          bgColor = 'bg-green-100 border-green-300';
          dotColor = 'bg-green-600';
        } else if (dayPercentage >= 50) {
          bgColor = 'bg-yellow-100 border-yellow-300';
          dotColor = 'bg-yellow-600';
        } else if (dayPercentage > 0) {
          bgColor = 'bg-orange-50 border-orange-200';
          dotColor = 'bg-orange-500';
        } else {
          bgColor = 'bg-slate-100 border-slate-300';
          dotColor = 'bg-slate-400';
        }
      }

      days.push(
        <div
          key={day}
          className={`h-12 flex flex-col items-center justify-center rounded-lg border ${bgColor}`}
        >
          <span className="text-sm font-semibold text-slate-700">{day}</span>
          {!isFuture && totalSteps > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
              {dayPercentage < 100 && dayPercentage > 0 && (
                <span className="text-[8px] font-semibold text-slate-600">{dayPercentage}%</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-5 h-5" />
              This Month's Adherence
            </CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-700">
                {(() => {
                  const stats = calculateAdherenceStats();
                  return `${stats.percentage}%`;
                })()}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {(() => {
                  const stats = calculateAdherenceStats();
                  return `${stats.completed} of ${stats.total} steps`;
                })()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-slate-600">100% (all done)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
              <span className="text-slate-600">50-99% (some done)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300"></div>
              <span className="text-slate-600">0% (missed)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white border border-slate-200"></div>
              <span className="text-slate-600">Future days</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-600 mb-2">
                {day}
              </div>
            ))}
            {days}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-4xl p-6">
          <p className="text-center">Loading routine...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">My Skincare Routine</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Card className="mb-6 border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">Enable Reminders</p>
                      <p className="text-sm text-slate-600">Get notified for your routine steps</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={notificationsEnabled}
                    variant={notificationsEnabled ? 'outline' : 'default'}
                    className={notificationsEnabled ? 'bg-green-50 text-green-700 border-green-300' : ''}
                  >
                    {notificationsEnabled ? '✓ Enabled' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  📅 Sync to Calendar
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Add your routine to your phone or email calendar for reminders across all devices
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={handleAddToGoogleCalendar}
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border-blue-200"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                    <span>Add to Google Calendar</span>
                  </Button>

                  <Button
                    onClick={handleDownloadICS}
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Add to Apple Calendar</span>
                  </Button>

                  <Button
                    onClick={handleDownloadICS}
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Download .ics File</span>
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                  <p className="text-xs text-slate-600">
                    <strong>How it works:</strong>
                  </p>
                  <ul className="text-xs text-slate-600 mt-2 space-y-1 ml-4">
                    <li>• <strong>Google Calendar:</strong> Opens browser tabs for each step. Click "Save" to add.</li>
                    <li>• <strong>Apple Calendar:</strong> Downloads .ics file. Open on iPhone/Mac to import.</li>
                    <li>• <strong>.ics File:</strong> Works with Outlook, Yahoo, and any calendar app.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {(morningSteps.length > 0 || eveningSteps.length > 0) && (
              <Card className="mb-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      Today's Routine
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTodaySteps(!showTodaySteps)}
                    >
                      {showTodaySteps ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  <div className="mt-2">
                    {(() => {
                      const stats = getTodayCompletionStats();
                      return (
                        <p className="text-sm text-slate-600">
                          <strong>{stats.completed} of {stats.total} steps completed today ({stats.percentage}%)</strong>
                        </p>
                      );
                    })()}
                  </div>
                </CardHeader>
                {showTodaySteps && (
                  <CardContent className="pt-0">
                    {morningSteps.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Sun className="w-4 h-4" />
                          Morning Routine
                        </h3>
                        <div className="space-y-2">
                          {morningSteps.map(step => (
                            <div
                              key={step.id}
                              className={`flex items-center gap-3 p-2 rounded-lg border ${
                                completedSteps.get(step.id)
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={completedSteps.get(step.id) || false}
                                onChange={() => handleToggleStepCompletion(step.id, 'morning')}
                                className="w-5 h-5 rounded text-green-600 cursor-pointer"
                              />
                              <div className="flex-1">
                                <p className={`font-medium ${completedSteps.get(step.id) ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                  {step.step_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {step.scheduled_time.slice(0, 5)}
                                </p>
                              </div>
                              {completedSteps.get(step.id) && (
                                <span className="text-green-600 text-sm font-semibold">✓ Done</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {eveningSteps.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <Moon className="w-4 h-4" />
                          Evening Routine
                        </h3>
                        <div className="space-y-2">
                          {eveningSteps.map(step => (
                            <div
                              key={step.id}
                              className={`flex items-center gap-3 p-2 rounded-lg border ${
                                completedSteps.get(step.id)
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={completedSteps.get(step.id) || false}
                                onChange={() => handleToggleStepCompletion(step.id, 'evening')}
                                className="w-5 h-5 rounded text-green-600 cursor-pointer"
                              />
                              <div className="flex-1">
                                <p className={`font-medium ${completedSteps.get(step.id) ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                  {step.step_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {step.scheduled_time.slice(0, 5)}
                                </p>
                              </div>
                              {completedSteps.get(step.id) && (
                                <span className="text-green-600 text-sm font-semibold">✓ Done</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            <Button
              variant="outline"
              onClick={() => setShowAdherence(!showAdherence)}
              className="mb-6 w-full"
            >
              {showAdherence ? 'Hide' : 'Show'} Adherence Calendar
            </Button>

            {showAdherence && renderAdherenceCalendar()}

            {renderRoutineSection('☀️ Morning Skincare', <Sun className="w-5 h-5" />, 'morning', morningSteps)}
            {renderRoutineSection('🌙 Evening Skincare', <Moon className="w-5 h-5" />, 'evening', eveningSteps)}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRoutine}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Routine'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
