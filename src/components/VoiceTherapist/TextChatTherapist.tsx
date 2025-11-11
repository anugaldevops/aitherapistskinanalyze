import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Loader2, Sparkles, Heart, Wind, Lightbulb, Shield, ScanFace } from 'lucide-react';
import { TherapyMessage, therapyService } from '../../lib/therapyService';
import { therapyExercises, TherapyExercise } from '../../data/therapyExercises';
import { QuickActionMenu } from '../AITherapist/QuickActionMenu';
import { MiniExerciseGuide } from '../AITherapist/MiniExerciseGuide';

interface TextChatTherapistProps {
  messages: TherapyMessage[];
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}

interface ExerciseInProgress {
  exercise: TherapyExercise;
  currentStep: number;
  isActive: boolean;
}

type MiniExerciseType = 'breathing' | 'grounding' | 'journal';

export function TextChatTherapist({
  messages,
  onSendMessage,
  isProcessing
}: TextChatTherapistProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showExercises, setShowExercises] = useState(false);
  const [exerciseInProgress, setExerciseInProgress] = useState<ExerciseInProgress | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [miniExercise, setMiniExercise] = useState<MiniExerciseType | null>(null);
  const [turnIndicatorVisible, setTurnIndicatorVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  useEffect(() => {
    const turnCount = therapyService.getTurnCount();
    const maxTurnsReached = therapyService.hasMaxTurnsReached();

    const hasEmotionalContent = messages.some(m => {
      if (m.role !== 'user') return false;
      const emotionalWords = ['stressed', 'anxious', 'sad', 'overwhelmed', 'worried', 'depressed', 'crying', 'hurt', 'pain', 'lonely', 'afraid', 'scared'];
      return emotionalWords.some(word => m.content.toLowerCase().includes(word));
    });

    if (maxTurnsReached && hasEmotionalContent && !showActionMenu && !miniExercise) {
      setShowActionMenu(true);
      setShowQuickReplies(false);
    }

    setTurnIndicatorVisible(turnCount > 0 && turnCount < 3);
  }, [messages, showActionMenu, miniExercise]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    const trimmedMessage = inputMessage.trim();
    if (trimmedMessage && !isProcessing) {
      const hasEmotionalContent = trimmedMessage.toLowerCase().match(/stressed|anxious|sad|overwhelmed|worried|depressed|crying|hurt|pain|lonely|afraid|scared/);

      if (therapyService.hasMaxTurnsReached() && hasEmotionalContent) {
        onSendMessage(trimmedMessage);
        setInputMessage('');
        setTimeout(() => {
          setShowActionMenu(true);
          setShowQuickReplies(false);
        }, 2000);
        return;
      }

      onSendMessage(trimmedMessage);
      setInputMessage('');

      if (trimmedMessage.toLowerCase().includes('exercise') ||
          trimmedMessage.toLowerCase().includes('help me with') ||
          trimmedMessage.toLowerCase().includes('breathing')) {
        setShowExercises(true);
      }
    }
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    const moodMessages = {
      '😊': "I'm feeling happy and positive today!",
      '😐': "I'm feeling neutral, just okay.",
      '😟': "I'm feeling worried or anxious.",
      '😢': "I'm feeling sad or down.",
      '😡': "I'm feeling frustrated or angry."
    };
    onSendMessage(moodMessages[mood as keyof typeof moodMessages]);
    setTimeout(() => setSelectedMood(null), 2000);
  };

  const startExercise = (exercise: TherapyExercise) => {
    setExerciseInProgress({
      exercise,
      currentStep: 0,
      isActive: true
    });
    setShowExercises(false);
    onSendMessage(`I'd like to try the "${exercise.title}" exercise`);
  };

  const nextExerciseStep = () => {
    if (!exerciseInProgress) return;

    if (exerciseInProgress.currentStep < exerciseInProgress.exercise.steps.length - 1) {
      setExerciseInProgress({
        ...exerciseInProgress,
        currentStep: exerciseInProgress.currentStep + 1
      });
    } else {
      setExerciseInProgress(null);
      onSendMessage('Thank you for completing the exercise with me!');
    }
  };

  const skipExercise = () => {
    setExerciseInProgress(null);
    onSendMessage('I\'d like to skip this exercise for now.');
  };

  const handleSelectBreathing = async () => {
    setShowActionMenu(false);
    setMiniExercise('breathing');
    await therapyService.trackExerciseOffered('mini-breathing-478');
  };

  const handleSelectGrounding = async () => {
    setShowActionMenu(false);
    setMiniExercise('grounding');
    await therapyService.trackExerciseOffered('mini-grounding-54321');
  };

  const handleSelectJournal = async () => {
    setShowActionMenu(false);
    setMiniExercise('journal');
    await therapyService.trackExerciseOffered('mini-journal-prompt');
  };

  const handleExerciseComplete = async (reflection: string, journalPrompt?: string) => {
    if (miniExercise) {
      await therapyService.trackExerciseCompleted(`mini-${miniExercise}`, reflection);

      if (miniExercise === 'journal' && reflection && reflection !== 'Completed the exercise' && journalPrompt) {
        await therapyService.saveJournalEntry(journalPrompt, reflection, `mini-${miniExercise}`);
      }
    }
    setMiniExercise(null);
    onSendMessage('I completed the exercise. What changed, even 1%? I feel a bit better.');
  };

  const handleExerciseSkip = () => {
    setMiniExercise(null);
    onSendMessage('I\'d like to skip this for now.');
  };

  const handleCloseActionMenu = () => {
    setShowActionMenu(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 border border-purple-200">
        <p className="text-xs text-slate-600 font-medium mb-2 text-center">How are you feeling right now?</p>
        <div className="flex justify-center gap-2">
          {['😊', '😐', '😟', '😢', '😡'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleMoodSelect(emoji)}
              className={`text-3xl hover:scale-125 transition-transform bg-transparent hover:bg-white/50 rounded-lg p-2 ${
                selectedMood === emoji ? 'scale-125 animate-bounce bg-white' : ''
              }`}
              title="Select your mood"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2 min-h-0 scroll-smooth">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-slate-800 shadow-md border border-slate-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'therapist' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">
                    {message.role === 'therapist' ? 'AI Therapist' : 'You'}
                  </p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-slate-800 shadow-md border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <p className="text-sm text-slate-600 italic">AI Therapist is typing...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {turnIndicatorVisible && (
          <div className="flex justify-center">
            <div className="bg-slate-100 px-3 py-1 rounded-full">
              <p className="text-xs text-slate-600 font-medium">
                Exchange {therapyService.getTurnCount()} of 3
              </p>
            </div>
          </div>
        )}

        {showActionMenu && (
          <QuickActionMenu
            onSelectBreathing={handleSelectBreathing}
            onSelectGrounding={handleSelectGrounding}
            onSelectJournal={handleSelectJournal}
            onClose={handleCloseActionMenu}
          />
        )}

        {miniExercise && (
          <MiniExerciseGuide
            type={miniExercise}
            onComplete={handleExerciseComplete}
            onSkip={handleExerciseSkip}
          />
        )}

        {showExercises && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <p className="font-bold text-slate-800">Guided Exercises</p>
            </div>
            <p className="text-sm text-slate-600 mb-3">These exercises can help you feel better. Choose one to begin:</p>
            <div className="grid grid-cols-2 gap-2">
              {therapyExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => startExercise(exercise)}
                  className="bg-white hover:bg-purple-50 border-2 border-purple-200 rounded-lg p-3 text-left transition-all hover:shadow-md"
                >
                  <div className="text-2xl mb-1">{exercise.icon}</div>
                  <p className="text-sm font-bold text-slate-800">{exercise.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{exercise.description}</p>
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowExercises(false)}
              variant="ghost"
              size="sm"
              className="w-full mt-3"
            >
              Not right now
            </Button>
          </div>
        )}

        {exerciseInProgress && (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4 border-2 border-teal-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{exerciseInProgress.exercise.icon}</span>
                <p className="font-bold text-slate-800">{exerciseInProgress.exercise.title}</p>
              </div>
              <p className="text-sm text-slate-600">
                Step {exerciseInProgress.currentStep + 1} of {exerciseInProgress.exercise.steps.length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 mb-3">
              <p className="text-base text-slate-800 leading-relaxed">
                {exerciseInProgress.exercise.steps[exerciseInProgress.currentStep].instruction}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={nextExerciseStep}
                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
              >
                {exerciseInProgress.currentStep < exerciseInProgress.exercise.steps.length - 1 ? 'Next' : 'Complete'}
              </Button>
              <Button
                onClick={skipExercise}
                variant="outline"
                className="border-2 border-slate-300"
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 pt-4 border-t border-slate-200">
        {showQuickReplies && (
          <div className="mb-3 space-y-2">
            <p className="text-xs text-slate-600 font-medium text-center">Quick support options:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  onSendMessage('I need help improving my mood');
                  setShowQuickReplies(false);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 border-purple-200 hover:bg-purple-50"
              >
                <Heart className="w-4 h-4 text-purple-600" />
                <span className="text-xs">Improve mood</span>
              </Button>
              <Button
                onClick={() => {
                  onSendMessage('Can we practice breathing exercises?');
                  setShowQuickReplies(false);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 border-blue-200 hover:bg-blue-50"
              >
                <Wind className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Practice breathing</span>
              </Button>
              <Button
                onClick={() => {
                  onSendMessage('Help me reframe a negative thought');
                  setShowQuickReplies(false);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 border-amber-200 hover:bg-amber-50"
              >
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span className="text-xs">Reframe a thought</span>
              </Button>
              <Button
                onClick={() => {
                  onSendMessage('I need help setting a boundary');
                  setShowQuickReplies(false);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2 border-green-200 hover:bg-green-50"
              >
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs">Set a boundary</span>
              </Button>
              {!therapyService.isSkincareSuppressed() && (
                <Button
                  onClick={() => {
                    onSendMessage('I want to check my skin progress');
                    setShowQuickReplies(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-2 border-teal-200 hover:bg-teal-50 col-span-2"
                >
                  <ScanFace className="w-4 h-4 text-teal-600" />
                  <span className="text-xs">Check skin progress</span>
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={showActionMenu ? "Choose an action above to continue..." : "Type your message... (or try 'start a scan')"}
            disabled={isProcessing || showActionMenu || miniExercise !== null}
            className="flex-1 bg-white border-2 border-slate-200 focus:border-blue-400 rounded-xl px-4 py-6 text-base"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isProcessing || showActionMenu || miniExercise !== null}
            size="lg"
            className="bg-gradient-to-br from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white px-6 rounded-xl"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        {!showActionMenu && !miniExercise && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Try saying: "Start a scan", "Show my history", or just share how you're feeling
          </p>
        )}
      </div>
    </div>
  );
}
