import { Wind, Sparkles, BookOpen, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface QuickActionMenuProps {
  onSelectBreathing: () => void;
  onSelectGrounding: () => void;
  onSelectJournal: () => void;
  onClose: () => void;
}

export function QuickActionMenu({
  onSelectBreathing,
  onSelectGrounding,
  onSelectJournal,
  onClose
}: QuickActionMenuProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-slate-800">Choose One Action</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-amber-100"
        >
          <X className="w-5 h-5 text-slate-700" />
        </Button>
      </div>

      <p className="text-sm text-slate-700 mb-4">
        We've talked through some things. Let's do one small action together before we end:
      </p>

      <div className="space-y-2">
        <button
          onClick={onSelectBreathing}
          className="w-full p-3 rounded-lg bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 text-left transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <Wind className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">4-7-8 Breathing</p>
              <p className="text-xs text-slate-600">1 minute calming breath</p>
            </div>
          </div>
        </button>

        <button
          onClick={onSelectGrounding}
          className="w-full p-3 rounded-lg bg-white hover:bg-teal-50 border-2 border-teal-200 hover:border-teal-400 text-left transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center transition-colors">
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">5-4-3-2-1 Grounding</p>
              <p className="text-xs text-slate-600">1 minute sensory awareness</p>
            </div>
          </div>
        </button>

        <button
          onClick={onSelectJournal}
          className="w-full p-3 rounded-lg bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-400 text-left transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">Journal Prompt</p>
              <p className="text-xs text-slate-600">1 minute reflection</p>
            </div>
          </div>
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Or close this to end our session for now
      </p>
    </Card>
  );
}
