import { RoutineStep } from './reminderService';

function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatLocalDateForICS(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function formatDateForGoogle(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function getDayAbbreviation(dayNumber: number): string {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[dayNumber];
}

function generateRecurrenceRule(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 7) {
    return 'FREQ=DAILY';
  }

  const dayAbbreviations = daysOfWeek.map(getDayAbbreviation).join(',');
  return `FREQ=WEEKLY;BYDAY=${dayAbbreviations}`;
}

export function generateGoogleCalendarUrl(
  title: string,
  startDateTime: Date,
  endDateTime: Date,
  description: string,
  recurrenceRule?: string
): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';

  const startUTC = formatDateForGoogle(startDateTime);
  const endUTC = formatDateForGoogle(endDateTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUTC}/${endUTC}`,
    details: description
  });

  if (recurrenceRule) {
    params.append('recur', `RRULE:${recurrenceRule}`);
  }

  const url = `${baseUrl}?${params.toString()}`;

  console.log(`📅 Google Calendar URL:`);
  console.log(`   Title: ${title}`);
  console.log(`   Start: ${startUTC}`);
  console.log(`   End: ${endUTC}`);
  console.log(`   Recurrence: ${recurrenceRule || 'None'}`);

  return url;
}

export function addRoutineStepToGoogleCalendar(
  step: RoutineStep,
  routineType: 'morning' | 'evening'
): void {
  console.log(`📅 Adding ${routineType} routine step to Google Calendar: ${step.step_name}`);

  const now = new Date();
  const [hours, minutes] = step.scheduled_time.split(':');

  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes), 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + 5);

  const title = `${routineType === 'morning' ? '☀️' : '🌙'} ${routineType.charAt(0).toUpperCase() + routineType.slice(1)} Skincare - ${step.step_name}`;
  const description = `Apply ${step.step_name} as part of your ${routineType} skincare routine.`;

  const recurrenceRule = generateRecurrenceRule(step.days_of_week);

  console.log(`🕐 Local time: ${startDate.toLocaleTimeString()}`);
  console.log(`🌍 UTC time: ${startDate.toISOString()}`);
  console.log(`📋 Recurrence: ${recurrenceRule}`);

  const url = generateGoogleCalendarUrl(title, startDate, endDate, description, recurrenceRule);

  window.open(url, '_blank');
  console.log(`✅ Opened Google Calendar with event: ${step.step_name}`);
}

export function addAllRoutineStepsToGoogleCalendar(
  morningSteps: RoutineStep[],
  eveningSteps: RoutineStep[]
): void {
  console.log(`📅 Adding all routine steps to Google Calendar (${morningSteps.length} morning, ${eveningSteps.length} evening)`);

  let added = 0;

  morningSteps.forEach((step, index) => {
    setTimeout(() => {
      addRoutineStepToGoogleCalendar(step, 'morning');
      added++;
    }, index * 500);
  });

  eveningSteps.forEach((step, index) => {
    setTimeout(() => {
      addRoutineStepToGoogleCalendar(step, 'evening');
      added++;
    }, (morningSteps.length + index) * 500);
  });

  setTimeout(() => {
    console.log(`✅ Opened ${added} Google Calendar tabs`);
  }, (morningSteps.length + eveningSteps.length) * 500 + 100);
}

export function generateICSFile(
  morningSteps: RoutineStep[],
  eveningSteps: RoutineStep[]
): string {
  console.log(`📅 Generating .ics file (${morningSteps.length} morning, ${eveningSteps.length} evening steps)`);

  const now = new Date();
  const dtstamp = formatDateForICS(now);
  const timezone = getUserTimezone();

  console.log(`🌍 Using timezone: ${timezone}`);

  let icsContent = 'BEGIN:VCALENDAR\r\n';
  icsContent += 'VERSION:2.0\r\n';
  icsContent += 'PRODID:-//SkinAge AI//Skincare Routine//EN\r\n';
  icsContent += 'CALSCALE:GREGORIAN\r\n';
  icsContent += 'METHOD:PUBLISH\r\n';

  let eventIndex = 1;

  morningSteps.forEach((step) => {
    const [hours, minutes] = step.scheduled_time.split(':');
    const startDate = new Date(now);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const uid = `morning-${step.step_name.toLowerCase().replace(/\s+/g, '-')}-${eventIndex}@skinage.ai`;
    const recurrenceRule = generateRecurrenceRule(step.days_of_week);
    const localDateStr = formatLocalDateForICS(startDate);
    const escapedSummary = escapeICSText(`Morning Skincare - ${step.step_name}`);
    const escapedDescription = escapeICSText(`Time to apply ${step.step_name} as part of your morning skincare routine.`);

    icsContent += 'BEGIN:VEVENT\r\n';
    icsContent += `UID:${uid}\r\n`;
    icsContent += `DTSTAMP:${dtstamp}\r\n`;
    icsContent += `DTSTART;TZID=${timezone}:${localDateStr}\r\n`;
    icsContent += 'DURATION:PT5M\r\n';
    icsContent += `RRULE:${recurrenceRule}\r\n`;
    icsContent += `SUMMARY:${escapedSummary}\r\n`;
    icsContent += `DESCRIPTION:${escapedDescription}\r\n`;
    icsContent += 'STATUS:CONFIRMED\r\n';
    icsContent += 'BEGIN:VALARM\r\n';
    icsContent += 'TRIGGER:-PT5M\r\n';
    icsContent += 'ACTION:DISPLAY\r\n';
    icsContent += `DESCRIPTION:${escapeICSText('Morning skincare reminder')}\r\n`;
    icsContent += 'END:VALARM\r\n';
    icsContent += 'END:VEVENT\r\n';

    eventIndex++;
  });

  eveningSteps.forEach((step) => {
    const [hours, minutes] = step.scheduled_time.split(':');
    const startDate = new Date(now);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const uid = `evening-${step.step_name.toLowerCase().replace(/\s+/g, '-')}-${eventIndex}@skinage.ai`;
    const recurrenceRule = generateRecurrenceRule(step.days_of_week);
    const localDateStr = formatLocalDateForICS(startDate);
    const escapedSummary = escapeICSText(`Evening Skincare - ${step.step_name}`);
    const escapedDescription = escapeICSText(`Time to apply ${step.step_name} as part of your evening skincare routine.`);

    icsContent += 'BEGIN:VEVENT\r\n';
    icsContent += `UID:${uid}\r\n`;
    icsContent += `DTSTAMP:${dtstamp}\r\n`;
    icsContent += `DTSTART;TZID=${timezone}:${localDateStr}\r\n`;
    icsContent += 'DURATION:PT5M\r\n';
    icsContent += `RRULE:${recurrenceRule}\r\n`;
    icsContent += `SUMMARY:${escapedSummary}\r\n`;
    icsContent += `DESCRIPTION:${escapedDescription}\r\n`;
    icsContent += 'STATUS:CONFIRMED\r\n';
    icsContent += 'BEGIN:VALARM\r\n';
    icsContent += 'TRIGGER:-PT5M\r\n';
    icsContent += 'ACTION:DISPLAY\r\n';
    icsContent += `DESCRIPTION:${escapeICSText('Evening skincare reminder')}\r\n`;
    icsContent += 'END:VALARM\r\n';
    icsContent += 'END:VEVENT\r\n';

    eventIndex++;
  });

  icsContent += 'END:VCALENDAR\r\n';

  console.log(`✅ Generated .ics file with ${eventIndex - 1} events`);
  return icsContent;
}

export function downloadICSFile(
  morningSteps: RoutineStep[],
  eveningSteps: RoutineStep[]
): void {
  console.log('📥 Downloading .ics file for skincare routine');

  const icsContent = generateICSFile(morningSteps, eveningSteps);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'skincare-routine.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  console.log('✅ .ics file downloaded: skincare-routine.ics');
}

export function generateNextScanGoogleCalendarUrl(
  date: string,
  time: string
): string {
  console.log(`📅 Generating Next Scan Google Calendar event for ${date} at ${time}`);

  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');

  const startDateTime = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    0,
    0
  );

  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + 30);

  const title = '📸 Skin Analysis - Time for Next Scan';
  const description = `It's been 4 weeks! Time to track your skin progress.\n\nRemember to:\n- Use consistent lighting\n- Take photos from the same angle\n- Record your current routine`;

  console.log(`🕐 Local time: ${startDateTime.toLocaleString()}`);
  console.log(`🌍 UTC time: ${startDateTime.toISOString()}`);

  const url = generateGoogleCalendarUrl(title, startDateTime, endDateTime, description);
  console.log('✅ Next Scan Google Calendar URL generated');
  return url;
}

export function generateNextScanICSFile(
  date: string,
  time: string
): string {
  console.log(`📅 Generating Next Scan .ics file for ${date} at ${time}`);

  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');

  const startDateTime = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );

  const now = new Date();
  const dtstamp = formatDateForICS(now);
  const timezone = getUserTimezone();
  const localDateStr = formatLocalDateForICS(startDateTime);

  console.log(`🌍 Using timezone: ${timezone}`);

  const description = `It's been 4 weeks! Time to track your skin progress.\n\nConsistent tracking helps you see how your skincare routine is working over time.\n\nRemember to:\n- Use consistent lighting\n- Take photos from the same angle\n- Record your current routine and habits`;

  const escapedSummary = escapeICSText('Skin Analysis - Time for Next Scan');
  const escapedDescription = escapeICSText(description);

  let icsContent = 'BEGIN:VCALENDAR\r\n';
  icsContent += 'VERSION:2.0\r\n';
  icsContent += 'PRODID:-//SkinAge AI//Next Scan Reminder//EN\r\n';
  icsContent += 'CALSCALE:GREGORIAN\r\n';
  icsContent += 'METHOD:PUBLISH\r\n';
  icsContent += 'BEGIN:VEVENT\r\n';
  icsContent += `UID:next-scan-${date}@skinage.ai\r\n`;
  icsContent += `DTSTAMP:${dtstamp}\r\n`;
  icsContent += `DTSTART;TZID=${timezone}:${localDateStr}\r\n`;
  icsContent += 'DURATION:PT30M\r\n';
  icsContent += `SUMMARY:${escapedSummary}\r\n`;
  icsContent += `DESCRIPTION:${escapedDescription}\r\n`;
  icsContent += 'STATUS:CONFIRMED\r\n';
  icsContent += 'BEGIN:VALARM\r\n';
  icsContent += 'TRIGGER:-P1D\r\n';
  icsContent += 'ACTION:DISPLAY\r\n';
  icsContent += `DESCRIPTION:${escapeICSText('Tomorrow: Skin analysis reminder')}\r\n`;
  icsContent += 'END:VALARM\r\n';
  icsContent += 'BEGIN:VALARM\r\n';
  icsContent += 'TRIGGER:-PT1H\r\n';
  icsContent += 'ACTION:DISPLAY\r\n';
  icsContent += `DESCRIPTION:${escapeICSText('1 hour: Time for your skin analysis')}\r\n`;
  icsContent += 'END:VALARM\r\n';
  icsContent += 'END:VEVENT\r\n';
  icsContent += 'END:VCALENDAR\r\n';

  console.log('✅ Next Scan .ics file generated');
  return icsContent;
}

export function downloadNextScanICSFile(date: string, time: string): void {
  console.log('📥 Downloading Next Scan .ics file');

  const icsContent = generateNextScanICSFile(date, time);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'skin-analysis-reminder.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  console.log('✅ .ics file downloaded: skin-analysis-reminder.ics');
}

export function openNextScanInGoogleCalendar(date: string, time: string): void {
  console.log('📅 Opening Next Scan in Google Calendar');

  const url = generateNextScanGoogleCalendarUrl(date, time);
  window.open(url, '_blank');

  console.log('✅ Google Calendar opened in new tab');
}
