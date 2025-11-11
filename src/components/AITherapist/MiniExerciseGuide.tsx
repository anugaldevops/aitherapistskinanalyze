import { useState, useEffect } from 'react';
import { Wind, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

type ExerciseType = 'breathing' | 'grounding' | 'journal';

interface ExerciseStep {
  instruction: string;
  duration: number;
}

interface MiniExerciseGuideProps {
  type: ExerciseType;
  onComplete: (reflection: string, journalPrompt?: string) => void;
  onSkip: () => void;
}

const BREATHING_STEPS: ExerciseStep[] = [
  { instruction: "Exhale completely through your mouth.", duration: 3 },
  { instruction: "Inhale quietly through your nose for 4 counts.", duration: 4 },
  { instruction: "Hold your breath for 7 counts.", duration: 7 },
  { instruction: "Exhale through your mouth for 8 counts.", duration: 8 },
  { instruction: "One more cycle: Inhale for 4...", duration: 4 },
  { instruction: "Hold for 7...", duration: 7 },
  { instruction: "Exhale for 8... Notice how you feel.", duration: 8 }
];

const GROUNDING_STEPS: ExerciseStep[] = [
  { instruction: "Name 5 things you can see right now.", duration: 10 },
  { instruction: "Name 4 things you can touch or feel.", duration: 10 },
  { instruction: "Name 3 things you can hear.", duration: 10 },
  { instruction: "Name 2 things you can smell (or favorite scents).", duration: 10 },
  { instruction: "Name 1 thing you can taste (or favorite taste).", duration: 10 }
];

const JOURNAL_PROMPTS = [
  "What would I say to a friend in my situation?",
  "What does my inner child need to hear right now?",
  "What am I grateful for about myself today?",
  "What small step can I take to care for myself?"
];

export function MiniExerciseGuide({ type, onComplete, onSkip }: MiniExerciseGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalPrompt] = useState(() =>
    JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]
  );

  const steps = type === 'breathing' ? BREATHING_STEPS :
                type === 'grounding' ? GROUNDING_STEPS : [];

  const totalSteps = steps.length;
  const isLastStep = currentStep >= totalSteps - 1;

  useEffect(() => {
    if (type !== 'journal' && !isComplete && steps[currentStep]) {
      const timer = setTimeout(() => {
        if (isLastStep) {
          setIsComplete(true);
        }
      }, steps[currentStep].duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isComplete, type, steps, isLastStep]);

  const handleNext = () => {
    if (isLastStep) {
      setIsComplete(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    if (type === 'journal' && journalText.trim()) {
      onComplete(journalText, journalPrompt);
    } else {
      onComplete("Completed the exercise");
    }
  };

  const icon = type === 'breathing' ? <Wind className="w-6 h-6 text-blue-600" /> :
               type === 'grounding' ? <Sparkles className="w-6 h-6 text-teal-600" /> :
               <CheckCircle2 className="w-6 h-6 text-purple-600" />;

  const title = type === 'breathing' ? '4-7-8 Breathing' :
                type === 'grounding' ? '5-4-3-2-1 Grounding' :
                'Journal Prompt';

  const bgGradient = type === 'breathing' ? 'from-blue-50 to-cyan-50' :
                     type === 'grounding' ? 'from-teal-50 to-green-50' :
                     'from-purple-50 to-pink-50';

  const borderColor = type === 'breathing' ? 'border-blue-300' :
                      type === 'grounding' ? 'border-teal-300' :
                      'border-purple-300';

  if (isComplete) {
    return (
      <Card className={`p-5 bg-gradient-to-br ${bgGradient} border-2 ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Great work!</h3>
            <p className="text-sm text-slate-700">
              What changed for you, even 1%?
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleFinish}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              Finish
            </Button>
            <Button
              onClick={onSkip}
              variant="outline"
              className="border-2"
            >
              Skip
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (type === 'journal') {
    return (
      <Card className={`p-5 bg-gradient-to-br ${bgGradient} border-2 ${borderColor}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>

          <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
            <p className="text-sm text-slate-700 font-medium mb-3">
              Take a moment to reflect on this:
            </p>
            <p className="text-base text-slate-800 italic leading-relaxed mb-4">
              {journalPrompt}
            </p>
            <Input
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write your thoughts here (optional)..."
              className="w-full"
            />
          </div>

          <p className="text-xs text-slate-600 text-center">
            Writing helps process emotions, but you can reflect quietly too
          </p>

          <div className="flex gap-2">
            <Button
              onClick={() => setIsComplete(true)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Done Reflecting
            </Button>
            <Button
              onClick={onSkip}
              variant="outline"
              className="border-2"
            >
              Skip
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-5 bg-gradient-to-br ${bgGradient} border-2 ${borderColor}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>
          <div className="text-sm text-slate-600 font-medium">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-slate-200 min-h-[80px] flex items-center">
          <p className="text-base text-slate-800 leading-relaxed">
            {steps[currentStep]?.instruction}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 gap-2"
          >
            {isLastStep ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={onSkip}
            variant="outline"
            className="border-2"
          >
            Skip
          </Button>
        </div>
      </div>
    </Card>
  );
}
