import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, ChevronDown, ChevronUp, Camera } from 'lucide-react';

interface AnalysisMetadata {
  photoDate: string;
  ageInPhoto: number;
  skincareRoutine: string;
  lifestyleHabits: string[];
  notes: string;
}

interface AnalysisInfoFormProps {
  currentAge: number;
  onSubmit: (metadata: AnalysisMetadata) => void;
  onCancel: () => void;
}

const LIFESTYLE_OPTIONS = [
  'Daily SPF use',
  'Smoking',
  'Regular exercise',
  'High stress',
  'Poor sleep',
  'Heavy sun exposure',
  'Healthy diet'
];

export function AnalysisInfoForm({ currentAge, onSubmit, onCancel }: AnalysisInfoFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const minDate = '1950-01-01';
  const [photoDate, setPhotoDate] = useState(today);
  const [ageInPhoto, setAgeInPhoto] = useState(currentAge.toString());
  const [skincareRoutine, setSkincareRoutine] = useState('');
  const [lifestyleHabits, setLifestyleHabits] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [dateError, setDateError] = useState('');

  const handleHabitToggle = (habit: string) => {
    if (lifestyleHabits.includes(habit)) {
      setLifestyleHabits(lifestyleHabits.filter(h => h !== habit));
    } else {
      setLifestyleHabits([...lifestyleHabits, habit]);
    }
  };

  const handleDateChange = (newDate: string) => {
    setPhotoDate(newDate);

    if (newDate > today) {
      setDateError('Photo date cannot be in the future');
    } else if (newDate < minDate) {
      setDateError('Photo date must be after 1950');
    } else {
      setDateError('');
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

    if (photoDate < minDate) {
      alert('Photo date must be after 1950');
      return;
    }

    console.log('Saving analysis with photo_date:', photoDate);
    console.log('Age in photo:', age);
    console.log('Skincare routine:', skincareRoutine.trim());
    console.log('Lifestyle habits:', lifestyleHabits);
    console.log('Notes:', notes.trim());

    onSubmit({
      photoDate,
      ageInPhoto: age,
      skincareRoutine: skincareRoutine.trim(),
      lifestyleHabits,
      notes: notes.trim()
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200 shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Camera className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-2xl font-bold">Analysis Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photoDate" className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              When was this photo taken?
            </Label>
            <Input
              id="photoDate"
              type="date"
              value={photoDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={today}
              min={minDate}
              className="text-base"
            />
            {dateError && (
              <p className="text-sm text-red-600 font-medium">{dateError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageInPhoto" className="text-base font-semibold">
              Your age in this photo
            </Label>
            <Input
              id="ageInPhoto"
              type="number"
              min="13"
              max="80"
              value={ageInPhoto}
              onChange={(e) => setAgeInPhoto(e.target.value)}
              className="text-base"
            />
            <p className="text-sm text-slate-500">Age range: 13-80 years</p>
          </div>
        </div>

        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <span className="font-semibold">Add Details (Optional)</span>
            {showOptional ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>

          {showOptional && (
            <div className="mt-4 bg-white rounded-lg p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="routine" className="text-base font-semibold">
                  Skincare routine at this time
                </Label>
                <textarea
                  id="routine"
                  value={skincareRoutine}
                  onChange={(e) => setSkincareRoutine(e.target.value)}
                  placeholder="What products were you using? (e.g., SPF daily, retinol 3x/week)"
                  className="w-full min-h-[100px] px-3 py-2 text-base border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Lifestyle & habits</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Label htmlFor="notes" className="text-base font-semibold">
                  Notes
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other relevant info about your skin at this time"
                  className="w-full min-h-[80px] px-3 py-2 text-base border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-6"
          >
            Analyze This Photo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
