import { supabase } from './supabase';

export interface RoutineStep {
  id: string;
  user_id: string;
  routine_type: 'morning' | 'evening';
  step_name: string;
  step_order: number;
  scheduled_time: string;
  days_of_week: number[];
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  reminder_type: 'morning_routine' | 'evening_routine' | 'next_scan';
  scheduled_time?: string;
  scheduled_date?: string;
  days_of_week?: number[];
  enabled: boolean;
  last_triggered?: string;
  notification_methods: ('browser' | 'email')[];
  created_at: string;
  updated_at?: string;
}

export interface RoutineAdherence {
  id: string;
  user_id: string;
  date: string;
  routine_type: 'morning' | 'evening';
  completed: boolean;
  completed_steps: number;
  total_steps: number;
  created_at: string;
}

export interface StepCompletion {
  id: string;
  user_id: string;
  step_id: string;
  date: string;
  completed_at: string;
  created_at: string;
}

interface ScheduledReminder {
  id: string;
  type: 'morning_routine' | 'evening_routine' | 'next_scan';
  timeout: NodeJS.Timeout;
  scheduledFor: Date;
}

class ReminderService {
  private scheduledReminders: Map<string, ScheduledReminder> = new Map();
  private notificationPermission: NotificationPermission = 'default';
  private firedToday: Set<string> = new Set();

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      console.log(`🔔 Notification permission: ${permission}`);
      return permission === 'granted';
    }

    console.log('❌ Notification permission denied');
    return false;
  }

  async showNotification(title: string, body: string, data?: any): Promise<void> {
    if (this.notificationPermission !== 'granted') {
      console.log('⚠️ Cannot show notification - permission not granted');
      return;
    }

    console.log(`🔔 Showing notification: ${title}`);
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data?.tag || 'skincare-reminder',
      requireInteraction: false,
      data
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (data?.url) {
        window.location.href = data.url;
      }
    };
  }

  startReminderChecks(): void {
    console.log('🔄 Starting reminder service with timezone-aware scheduling');
    this.loadAndScheduleReminders();

    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();

    setTimeout(() => {
      console.log('🌅 New day - clearing fired reminders and rescheduling');
      this.firedToday.clear();
      this.loadAndScheduleReminders();

      setInterval(() => {
        console.log('🌅 New day - clearing fired reminders and rescheduling');
        this.firedToday.clear();
        this.loadAndScheduleReminders();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  stopReminderChecks(): void {
    console.log('⏹️ Stopping all scheduled reminders');
    this.scheduledReminders.forEach(reminder => {
      clearTimeout(reminder.timeout);
    });
    this.scheduledReminders.clear();
    this.firedToday.clear();
  }

  private async loadAndScheduleReminders(): Promise<void> {
    console.log('📅 Loading and scheduling reminders...');

    this.scheduledReminders.forEach(reminder => {
      clearTimeout(reminder.timeout);
    });
    this.scheduledReminders.clear();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ No user logged in');
      return;
    }

    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('enabled', true);

    if (!reminders || reminders.length === 0) {
      console.log('ℹ️ No active reminders found');
      return;
    }

    console.log(`✅ Found ${reminders.length} active reminders`);

    for (const reminder of reminders) {
      if (reminder.reminder_type === 'next_scan') {
        await this.scheduleNextScanReminder(reminder);
      } else {
        await this.scheduleRoutineReminder(reminder);
      }
    }
  }

  private async scheduleRoutineReminder(reminder: Reminder): Promise<void> {
    if (!reminder.scheduled_time) return;

    const [hours, minutes] = reminder.scheduled_time.split(':').map(Number);
    const now = new Date();
    const currentDay = now.getDay();

    const daysOfWeek = reminder.days_of_week || [0, 1, 2, 3, 4, 5, 6];

    if (!daysOfWeek.includes(currentDay)) {
      console.log(`⏭️ ${reminder.reminder_type} skipped - not scheduled for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]}`);
      return;
    }

    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    const uniqueKey = `${reminder.reminder_type}-${reminder.scheduled_time}-${now.toDateString()}`;

    if (this.firedToday.has(uniqueKey)) {
      console.log(`✓ ${reminder.reminder_type} already fired today at ${reminder.scheduled_time}`);
      return;
    }

    const msUntilFire = scheduledTime.getTime() - now.getTime();

    if (msUntilFire < 0) {
      console.log(`⏭️ ${reminder.reminder_type} time ${reminder.scheduled_time} has passed for today`);
      return;
    }

    const hoursUntil = Math.floor(msUntilFire / 1000 / 60 / 60);
    const minutesUntil = Math.floor((msUntilFire / 1000 / 60) % 60);

    console.log(`⏰ Scheduled ${reminder.reminder_type} for ${hours}:${String(minutes).padStart(2, '0')} (in ${hoursUntil}h ${minutesUntil}m)`);

    const timeout = setTimeout(async () => {
      console.log(`🔔 FIRING ${reminder.reminder_type} at local time ${hours}:${String(minutes).padStart(2, '0')}`);

      this.firedToday.add(uniqueKey);

      if (reminder.reminder_type === 'morning_routine' || reminder.reminder_type === 'evening_routine') {
        await this.fireRoutineNotification(reminder.reminder_type);
      }

      await supabase
        .from('reminders')
        .update({ last_triggered: new Date().toISOString() })
        .eq('id', reminder.id);

      this.scheduledReminders.delete(reminder.id);
    }, msUntilFire);

    this.scheduledReminders.set(reminder.id, {
      id: reminder.id,
      type: reminder.reminder_type,
      timeout,
      scheduledFor: scheduledTime
    });
  }

  private async scheduleNextScanReminder(reminder: Reminder): Promise<void> {
    if (!reminder.scheduled_date || !reminder.scheduled_time) return;

    const [year, month, day] = reminder.scheduled_date.split('-').map(Number);
    const [hours, minutes] = reminder.scheduled_time.split(':').map(Number);

    const scheduledTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const now = new Date();

    const msUntilFire = scheduledTime.getTime() - now.getTime();

    if (msUntilFire < 0) {
      console.log(`⏭️ Next scan reminder ${reminder.scheduled_date} ${reminder.scheduled_time} has passed`);
      return;
    }

    const daysUntil = Math.floor(msUntilFire / 1000 / 60 / 60 / 24);
    const hoursUntil = Math.floor((msUntilFire / 1000 / 60 / 60) % 24);

    console.log(`⏰ Scheduled next_scan for ${reminder.scheduled_date} at ${hours}:${String(minutes).padStart(2, '0')} (in ${daysUntil}d ${hoursUntil}h)`);

    const timeout = setTimeout(async () => {
      console.log(`🔔 FIRING next_scan at ${reminder.scheduled_date} ${hours}:${String(minutes).padStart(2, '0')}`);

      await this.showNotification(
        '📸 Time for your skin analysis!',
        "It's been 4 weeks! Ready for your next scan?",
        { tag: 'next-scan', url: '#/' }
      );

      await supabase
        .from('reminders')
        .update({ last_triggered: new Date().toISOString() })
        .eq('id', reminder.id);

      this.scheduledReminders.delete(reminder.id);
    }, msUntilFire);

    this.scheduledReminders.set(reminder.id, {
      id: reminder.id,
      type: reminder.reminder_type,
      timeout,
      scheduledFor: scheduledTime
    });
  }

  private async fireRoutineNotification(routineType: 'morning_routine' | 'evening_routine'): Promise<void> {
    const type = routineType === 'morning_routine' ? 'morning' : 'evening';
    const steps = await this.getRoutineSteps(type);

    if (steps.length === 0) {
      console.log(`⚠️ No ${type} routine steps found`);
      return;
    }

    const firstStep = steps[0]?.step_name || `your ${type} routine`;
    const title = '⏰ Time for your skincare!';
    const body = `Next step: Apply ${firstStep}`;
    const tag = `${type}-routine`;

    await this.showNotification(title, body, { tag, url: '#/routine' });
  }

  private async getRoutineSteps(routineType: 'morning' | 'evening'): Promise<RoutineStep[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('skincare_routine_steps')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_type', routineType)
      .eq('enabled', true)
      .order('step_order');

    return data || [];
  }
}

export const reminderService = new ReminderService();

export async function getRoutineSteps(routineType: 'morning' | 'evening'): Promise<RoutineStep[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  console.log(`📋 Fetching ${routineType} routine steps`);

  const { data, error } = await supabase
    .from('skincare_routine_steps')
    .select('*')
    .eq('user_id', user.id)
    .eq('routine_type', routineType)
    .order('step_order');

  if (error) {
    console.error('❌ Error fetching routine steps:', error);
    return [];
  }

  console.log(`✅ Loaded ${data?.length || 0} ${routineType} steps`);
  return data || [];
}

export async function saveRoutineStep(step: Partial<RoutineStep>): Promise<RoutineStep | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  console.log(`💾 Saving routine step: ${step.step_name}`);

  const stepData = {
    ...step,
    user_id: user.id
  };

  if (step.id) {
    const { data, error } = await supabase
      .from('skincare_routine_steps')
      .update(stepData)
      .eq('id', step.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating routine step:', error);
      return null;
    }

    console.log('✅ Routine step updated');
    return data;
  } else {
    const { data, error } = await supabase
      .from('skincare_routine_steps')
      .insert(stepData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating routine step:', error);
      return null;
    }

    console.log('✅ Routine step created');
    return data;
  }
}

export async function deleteRoutineStep(stepId: string): Promise<boolean> {
  console.log(`🗑️ Deleting routine step: ${stepId}`);

  const { error } = await supabase
    .from('skincare_routine_steps')
    .delete()
    .eq('id', stepId);

  if (error) {
    console.error('❌ Error deleting routine step:', error);
    return false;
  }

  console.log('✅ Routine step deleted');
  return true;
}

export async function getReminders(): Promise<Reminder[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  console.log('📋 Fetching reminders');

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('❌ Error fetching reminders:', error);
    return [];
  }

  console.log(`✅ Loaded ${data?.length || 0} reminders`);
  return data || [];
}

export async function saveReminder(reminder: Partial<Reminder>): Promise<Reminder | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  console.log(`💾 Saving reminder: ${reminder.reminder_type}`);

  const reminderData = {
    ...reminder,
    user_id: user.id
  };

  if (reminder.id) {
    const { data, error } = await supabase
      .from('reminders')
      .update(reminderData)
      .eq('id', reminder.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating reminder:', error);
      return null;
    }

    console.log('✅ Reminder updated');
    return data;
  } else {
    const { data, error } = await supabase
      .from('reminders')
      .insert(reminderData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating reminder:', error);
      return null;
    }

    console.log('✅ Reminder created');
    return data;
  }
}

export async function deleteReminder(reminderId: string): Promise<boolean> {
  console.log(`🗑️ Deleting reminder: ${reminderId}`);

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId);

  if (error) {
    console.error('❌ Error deleting reminder:', error);
    return false;
  }

  console.log('✅ Reminder deleted');
  return true;
}

export async function getMonthlyAdherence(year: number, month: number): Promise<RoutineAdherence[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  console.log(`📅 Fetching adherence for ${year}-${month}`);

  const { data, error } = await supabase
    .from('routine_adherence')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  if (error) {
    console.error('❌ Error fetching adherence:', error);
    return [];
  }

  console.log(`✅ Loaded ${data?.length || 0} adherence records`);
  return data || [];
}

export async function markRoutineComplete(
  date: string,
  routineType: 'morning' | 'evening',
  completedSteps: number,
  totalSteps: number
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  console.log(`✅ Marking ${routineType} routine complete for ${date}`);

  const { error } = await supabase
    .from('routine_adherence')
    .upsert({
      user_id: user.id,
      date,
      routine_type: routineType,
      completed: completedSteps === totalSteps,
      completed_steps: completedSteps,
      total_steps: totalSteps
    }, {
      onConflict: 'user_id,date,routine_type'
    });

  if (error) {
    console.error('❌ Error marking routine complete:', error);
    return false;
  }

  console.log('✅ Routine adherence recorded');
  return true;
}

export async function getTodayStepCompletions(): Promise<Map<string, boolean>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Map();

  const today = new Date().toISOString().split('T')[0];

  const localKey = `step_completions_${user.id}_${today}`;
  const cachedData = localStorage.getItem(localKey);

  const { data, error } = await supabase
    .from('routine_step_completions')
    .select('step_id, completed_at')
    .eq('user_id', user.id)
    .eq('date', today);

  if (error) {
    console.error('❌ Error fetching step completions:', error);
    if (cachedData) {
      console.log('📦 Using cached completions from localStorage');
      return new Map(JSON.parse(cachedData));
    }
    return new Map();
  }

  const completionMap = new Map<string, boolean>();
  data?.forEach(completion => {
    completionMap.set(completion.step_id, true);
  });

  localStorage.setItem(localKey, JSON.stringify(Array.from(completionMap.entries())));
  console.log(`✅ Loaded ${completionMap.size} step completions for today`);

  return completionMap;
}

export async function markStepComplete(stepId: string, routineType: 'morning' | 'evening'): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  console.log(`✅ Marking step ${stepId} as complete`);

  const { error } = await supabase
    .from('routine_step_completions')
    .upsert({
      user_id: user.id,
      step_id: stepId,
      date: today,
      completed_at: now
    }, {
      onConflict: 'user_id,step_id,date'
    });

  if (error) {
    console.error('❌ Error marking step complete:', error);

    const localKey = `step_completions_${user.id}_${today}`;
    const cachedData = localStorage.getItem(localKey);
    const completionMap = cachedData ? new Map(JSON.parse(cachedData)) : new Map();
    completionMap.set(stepId, true);
    localStorage.setItem(localKey, JSON.stringify(Array.from(completionMap.entries())));
    console.log('📦 Saved to localStorage as backup');

    return false;
  }

  const localKey = `step_completions_${user.id}_${today}`;
  const cachedData = localStorage.getItem(localKey);
  const completionMap = cachedData ? new Map(JSON.parse(cachedData)) : new Map();
  completionMap.set(stepId, true);
  localStorage.setItem(localKey, JSON.stringify(Array.from(completionMap.entries())));

  await updateAdherenceForToday(routineType);

  console.log('✅ Step marked as complete');
  return true;
}

export async function unmarkStepComplete(stepId: string, routineType: 'morning' | 'evening'): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const today = new Date().toISOString().split('T')[0];

  console.log(`❌ Unmarking step ${stepId} as complete`);

  const { error } = await supabase
    .from('routine_step_completions')
    .delete()
    .eq('user_id', user.id)
    .eq('step_id', stepId)
    .eq('date', today);

  if (error) {
    console.error('❌ Error unmarking step:', error);

    const localKey = `step_completions_${user.id}_${today}`;
    const cachedData = localStorage.getItem(localKey);
    const completionMap = cachedData ? new Map(JSON.parse(cachedData)) : new Map();
    completionMap.delete(stepId);
    localStorage.setItem(localKey, JSON.stringify(Array.from(completionMap.entries())));
    console.log('📦 Removed from localStorage');

    return false;
  }

  const localKey = `step_completions_${user.id}_${today}`;
  const cachedData = localStorage.getItem(localKey);
  const completionMap = cachedData ? new Map(JSON.parse(cachedData)) : new Map();
  completionMap.delete(stepId);
  localStorage.setItem(localKey, JSON.stringify(Array.from(completionMap.entries())));

  await updateAdherenceForToday(routineType);

  console.log('✅ Step unmarked');
  return true;
}

async function updateAdherenceForToday(routineType: 'morning' | 'evening'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];

  const steps = await getRoutineSteps(routineType);
  const totalSteps = steps.length;

  if (totalSteps === 0) return;

  const { data: completions } = await supabase
    .from('routine_step_completions')
    .select('step_id')
    .eq('user_id', user.id)
    .eq('date', today)
    .in('step_id', steps.map(s => s.id));

  const completedSteps = completions?.length || 0;

  await markRoutineComplete(today, routineType, completedSteps, totalSteps);

  console.log(`📊 Updated adherence: ${completedSteps}/${totalSteps} steps completed`);
}
