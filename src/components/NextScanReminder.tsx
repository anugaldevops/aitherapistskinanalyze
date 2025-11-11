import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Clock, Bell, X, ExternalLink, Download } from 'lucide-react';
import { saveReminder, reminderService } from '../lib/reminderService';
import {
  openNextScanInGoogleCalendar,
  downloadNextScanICSFile
} from '../lib/calendarExport';

interface NextScanReminderProps {
  onClose: () => void;
  onReminderSet?: () => void;
}

export function NextScanReminder({ onClose, onReminderSet }: NextScanReminderProps) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 28);

  const [reminderDate, setReminderDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [enableReminder, setEnableReminder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSetReminder = async () => {
    if (!enableReminder) {
      onClose();
      return;
    }

    setIsSaving(true);

    const hasPermission = await reminderService.requestNotificationPermission();
    if (!hasPermission) {
      alert('Please enable notifications to receive reminders.');
      setIsSaving(false);
      return;
    }

    const reminder = await saveReminder({
      reminder_type: 'next_scan',
      scheduled_date: reminderDate,
      scheduled_time: reminderTime + ':00',
      enabled: true,
      notification_methods: ['browser']
    });

    if (reminder) {
      console.log(`📅 Next scan reminder set for ${reminderDate} at ${reminderTime}`);
      reminderService.startReminderChecks();
      alert(`Reminder set! You'll be notified on ${new Date(reminderDate).toLocaleDateString()} at ${reminderTime}`);
      onReminderSet?.();
      onClose();
    } else {
      alert('Failed to set reminder. Please try again.');
    }

    setIsSaving(false);
  };

  const handleAddToGoogleCalendar = () => {
    console.log('📅 Adding Next Scan to Google Calendar');
    openNextScanInGoogleCalendar(reminderDate, reminderTime);
    alert('✓ Google Calendar opened!\n\nClick "Save" to add the reminder to your calendar.');
  };

  const handleDownloadICS = () => {
    console.log('📥 Downloading Next Scan .ics file');
    downloadNextScanICSFile(reminderDate, reminderTime);
    alert('✓ Calendar file downloaded!\n\nOpen "skin-analysis-reminder.ics" to import into your calendar app.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-purple-600" />
              <CardTitle className="text-xl font-bold text-slate-800">
                📅 Set Reminder for Next Scan
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-purple-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>We recommend analyzing every 4 weeks to track progress.</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Consistent tracking helps you see how your skincare routine is working over time.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reminder-date" className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Reminder Date
              </Label>
              <Input
                id="reminder-date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="reminder-time" className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                Reminder Time
              </Label>
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="enable-reminder"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600"
              />
              <Label htmlFor="enable-reminder" className="cursor-pointer">
                <span className="font-semibold text-slate-800">Enable reminder</span>
                <p className="text-xs text-slate-600 mt-0.5">
                  You'll receive a browser notification at the scheduled time
                </p>
              </Label>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                📅 Add Scan Reminder to Calendar
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToGoogleCalendar}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border-blue-200"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>Google Calendar</span>
                </Button>
                <Button
                  onClick={handleDownloadICS}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download .ics</span>
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Calendar events include reminders 1 day and 1 hour before your scan
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSetReminder}
              disabled={isSaving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSaving ? 'Setting...' : enableReminder ? 'Set Reminder' : 'Continue'}
            </Button>
          </div>

          <p className="text-xs text-center text-slate-500 mt-4">
            You can manage your reminders in the Profile Settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function NextScanBanner({ onClick }: { onClick: () => void }) {
  return (
    <Card className="mb-6 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-bold text-slate-800">📸 Ready for your next scan?</p>
              <p className="text-sm text-slate-600">It's been 4 weeks since your last analysis!</p>
            </div>
          </div>
          <Button
            onClick={onClick}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Start Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
