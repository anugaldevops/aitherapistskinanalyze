import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Mic, MicOff, X, Volume2, VolumeX, MessageSquare, MicIcon, Sparkles } from 'lucide-react';
import { VoiceWaveform } from './VoiceWaveform';
import { TextChatTherapist } from './TextChatTherapist';
import { CrisisResourcesAlert } from '../AITherapist/CrisisResourcesAlert';
import { MeditationPlayer } from '../MeditationPlayer';
import { voiceSpeechService } from '../../lib/voiceSpeech';
import { therapyService, TherapyMessage } from '../../lib/therapyService';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { meditations, Meditation } from '../../data/meditations';

interface VoiceTherapistProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan?: () => void;
  onShowHistory?: () => void;
  onViewRoutine?: () => void;
  onOpenDashboard?: () => void;
}

export function VoiceTherapist({
  isOpen,
  onClose,
  onStartScan,
  onShowHistory,
  onViewRoutine,
  onOpenDashboard
}: VoiceTherapistProps) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<'voice' | 'text'>('text');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<TherapyMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [currentMeditation, setCurrentMeditation] = useState<Meditation | null>(null);
  const [showMeditations, setShowMeditations] = useState(false);
  const [sessionMode, setSessionMode] = useState<'general' | 'menopause'>('general');
  const [showPartsWork, setShowPartsWork] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (isOpen && !preferenceLoaded) {
      loadPreference();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && preferenceLoaded && !isInitialized) {
      initializeTherapist();
    }
  }, [isOpen, preferenceLoaded]);

  const loadPreference = async () => {
    const preference = await therapyService.getTherapistPreference();
    setMode(preference);
    setPreferenceLoaded(true);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeTherapist = async () => {
    if (mode === 'voice' && !voiceSpeechService.isSupported()) {
      setError('Voice features are not supported in your browser. Please use Chrome, Edge, or Safari. Try switching to text mode.');
      setIsInitialized(true);
      return;
    }

    await therapyService.createSession(mode);
    await therapyService.loadSessionState();

    const userName = profile?.name || 'there';
    const lastSessionSummary = await therapyService.getLastSessionSummary();
    const greeting = lastSessionSummary || therapyService.getGreeting(userName);

    const greetingMessage: TherapyMessage = {
      role: 'therapist',
      content: greeting,
      timestamp: new Date().toISOString()
    };

    setMessages([greetingMessage]);
    await therapyService.addMessage('therapist', greeting);

    if (mode === 'voice' && !isMuted && !hasGreeted.current) {
      hasGreeted.current = true;
      speakMessage(greeting);
    }

    setIsInitialized(true);
  };

  const speakMessage = (text: string) => {
    setIsSpeaking(true);
    voiceSpeechService.speak(text, () => {
      setIsSpeaking(false);
    }, 'female');
  };

  const startListening = () => {
    if (isSpeaking) {
      voiceSpeechService.stopSpeaking();
      setIsSpeaking(false);
    }

    setError(null);
    setCurrentTranscript('');

    voiceSpeechService.startListening(
      (transcript, isFinal) => {
        setCurrentTranscript(transcript);

        if (isFinal) {
          handleUserMessage(transcript);
          setCurrentTranscript('');
        }
      },
      (error) => {
        setError(`Voice recognition error: ${error}`);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    setIsListening(true);
  };

  const stopListening = () => {
    voiceSpeechService.stopListening();
    setIsListening(false);
  };

  const handleMeditationComplete = async () => {
    const meditationName = currentMeditation?.title || 'the meditation';

    let followUpContent = '';
    if (sessionMode === 'menopause') {
      followUpContent = `What changed, even 1%—cooler, calmer, or sleepier?`;
    } else {
      followUpContent = `Take a moment to notice how you feel after completing "${meditationName}". Would you like to journal about your experience, or shall we continue our conversation?`;
    }

    const completionMessage: TherapyMessage = {
      role: 'therapist',
      content: followUpContent,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, completionMessage]);
    await therapyService.addMessage('therapist', completionMessage.content);

    if (currentMeditation) {
      await therapyService.trackMeditationCompletion(currentMeditation.id);
    }

    if (mode === 'voice' && !isMuted) {
      speakMessage(completionMessage.content);
    }
  };

  const handleSelectMeditation = (meditation: Meditation) => {
    setCurrentMeditation(meditation);
    setShowMeditations(false);

    const meditationMessage: TherapyMessage = {
      role: 'therapist',
      content: `Great choice! Let's begin the "${meditation.title}" meditation. Find a comfortable position, and when you're ready, press play.`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, meditationMessage]);
    therapyService.addMessage('therapist', meditationMessage.content);
  };

  const handlePartsWorkRequest = async () => {
    setShowPartsWork(false);
    const userName = profile?.name || 'there';

    const partsWorkPrompt = `${userName}, let's explore a part of you that might need attention. Close your eyes for a moment and notice what emotion or feeling is most present right now. What does this part of you need?`;

    const therapistMessage: TherapyMessage = {
      role: 'therapist',
      content: partsWorkPrompt,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, therapistMessage]);
    await therapyService.addMessage('therapist', partsWorkPrompt);
    await therapyService.logAction('parts_work_initiated');

    if (mode === 'voice' && !isMuted) {
      speakMessage(partsWorkPrompt);
    }
  };

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: TherapyMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    await therapyService.addMessage('user', text);

    if (therapyService.checkForCrisisKeywords(text)) {
      setShowCrisisAlert(true);
    }

    if (therapyService.checkForMenopauseTopic(text)) {
      const currentMode = therapyService.getSessionMode();
      if (currentMode !== 'menopause') {
        setSessionMode('menopause');
      }
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes('meditation') || lowerText.includes('meditate') || lowerText.includes('guided exercise')) {
      setShowMeditations(true);
      const response = "I'd love to guide you through a meditation. I have several options available. Which one speaks to you?";
      const therapistMessage: TherapyMessage = {
        role: 'therapist',
        content: response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, therapistMessage]);
      await therapyService.addMessage('therapist', response);
      return;
    }

    if (lowerText.includes('deeper work') || lowerText.includes('explore a part') || lowerText.includes('parts work')) {
      setShowPartsWork(true);
    }

    const command = therapyService.parseVoiceCommand(text);

    if (command) {
      await handleVoiceCommand(command.intent);
      return;
    }

    setIsProcessing(true);
    const userName = profile?.name || 'there';

    try {
      const response = await therapyService.generateTherapeuticResponse(text, userName);

      if (response === "CRISIS_ALERT") {
        setShowCrisisAlert(true);
        setIsProcessing(false);
        return;
      }

      const therapistMessage: TherapyMessage = {
        role: 'therapist',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, therapistMessage]);
      await therapyService.addMessage('therapist', response);

      if (mode === 'voice' && !isMuted) {
        speakMessage(response);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: TherapyMessage = {
        role: 'therapist',
        content: `I'm sorry, ${userName}. I'm having trouble connecting right now. Please try again.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceCommand = async (intent: string) => {
    await therapyService.logAction(intent);

    let response = '';

    switch (intent) {
      case 'start_scan':
        response = "Great! I'll open the scan interface for you now. Let's check on your skin health.";
        setTimeout(() => {
          onClose();
          onStartScan?.();
        }, 2000);
        break;

      case 'show_history':
        response = "Let me pull up your analysis history for you.";
        setTimeout(() => {
          onClose();
          onShowHistory?.();
        }, 2000);
        break;

      case 'view_routine':
        response = "Opening your skincare routine. Let's see how you've been doing!";
        setTimeout(() => {
          onClose();
          onViewRoutine?.();
        }, 2000);
        break;

      case 'open_dashboard':
        response = "Taking you back to your dashboard now.";
        setTimeout(() => {
          onClose();
          onOpenDashboard?.();
        }, 2000);
        break;

      case 'show_help':
        response = "I can help you with: starting a new scan, viewing your history, checking your routine, or just listening to how you're feeling. What would you like to do?";
        break;

      default:
        response = "I'm not sure I understood that command. Try saying 'start a scan', 'show history', or 'view routine'.";
    }

    const therapistMessage: TherapyMessage = {
      role: 'therapist',
      content: response,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, therapistMessage]);
    await therapyService.addMessage('therapist', response);

    if (mode === 'voice' && !isMuted) {
      speakMessage(response);
    }
  };

  const handleClose = async () => {
    if (mode === 'voice') {
      voiceSpeechService.stopListening();
      voiceSpeechService.stopSpeaking();
    }
    await therapyService.endSession();
    hasGreeted.current = false;
    setMessages([]);
    setIsInitialized(false);
    setIsProcessing(false);
    setPreferenceLoaded(false);
    onClose();
  };

  const toggleMode = async () => {
    const newMode = mode === 'voice' ? 'text' : 'voice';

    if (mode === 'voice') {
      voiceSpeechService.stopListening();
      voiceSpeechService.stopSpeaking();
      setIsListening(false);
      setIsSpeaking(false);
    }

    setMode(newMode);
    therapyService.updateMode(newMode);
    await therapyService.setTherapistPreference(newMode);
    setError(null);
  };

  const toggleMute = () => {
    if (isSpeaking) {
      voiceSpeechService.stopSpeaking();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                {mode === 'voice' ? <Volume2 className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
              </div>
              AI Therapist
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="hover:bg-white/80 bg-white/30 gap-2 text-slate-800 font-medium"
              >
                {mode === 'voice' ? (
                  <>
                    <MessageSquare className="w-4 h-4 text-slate-700" />
                    <span className="text-sm">Text</span>
                  </>
                ) : (
                  <>
                    <MicIcon className="w-4 h-4 text-slate-700" />
                    <span className="text-sm">Voice</span>
                  </>
                )}
              </Button>
              {mode === 'voice' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="hover:bg-white/80 bg-white/30"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-slate-700" /> : <Volume2 className="w-5 h-5 text-slate-700" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="hover:bg-white/80 bg-white/30 hover:bg-red-100"
              >
                <X className="w-5 h-5 text-slate-700 hover:text-red-600" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {showCrisisAlert && (
          <CrisisResourcesAlert onClose={() => setShowCrisisAlert(false)} />
        )}

        {currentMeditation && (
          <div className="mb-4">
            <MeditationPlayer
              meditation={currentMeditation}
              onComplete={handleMeditationComplete}
              onClose={() => setCurrentMeditation(null)}
            />
          </div>
        )}

        {sessionMode === 'menopause' && !currentMeditation && (
          <div className="mb-4 p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border-2 border-teal-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800">Menopause Relief Meditations</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSessionMode('general')}
                className="h-8 w-8 hover:bg-teal-100"
              >
                <X className="w-5 h-5 text-slate-700" />
              </Button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Choose a meditation designed for menopause support:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {meditations.filter(m => ['cooling-breath-478', 'safe-place', 'progressive-relaxation'].includes(m.id)).map((meditation) => (
                <button
                  key={meditation.id}
                  onClick={() => handleSelectMeditation(meditation)}
                  className="p-4 rounded-xl bg-gradient-to-r from-teal-100 to-blue-100 hover:from-teal-200 hover:to-blue-200 shadow hover:shadow-lg transition-all text-center"
                >
                  <div className="text-2xl mb-1">{meditation.icon}</div>
                  <p className="font-semibold text-sm text-slate-800 mb-1">
                    {meditation.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    {meditation.duration}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {showPartsWork && (
          <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800">Deeper Exploration</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPartsWork(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Ready to explore the different parts of yourself? This brief exercise helps you connect with what needs attention.
            </p>
            <Button
              onClick={handlePartsWorkRequest}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              Explore a Part of Me
            </Button>
          </div>
        )}

        {showMeditations && !currentMeditation && sessionMode !== 'menopause' && (
          <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Guided Meditations</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMeditations(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Choose a meditation to begin your practice:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {meditations.map((meditation) => (
                <button
                  key={meditation.id}
                  onClick={() => handleSelectMeditation(meditation)}
                  className="p-3 rounded-xl bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all text-left"
                >
                  <div className="text-3xl mb-2">{meditation.icon}</div>
                  <p className="font-semibold text-sm text-slate-800 mb-1">
                    {meditation.title}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    {meditation.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium">
                      {meditation.duration}
                    </span>
                    <span className="text-xs text-slate-500">
                      {meditation.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'text' ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <TextChatTherapist
              messages={messages}
              onSendMessage={handleUserMessage}
              isProcessing={isProcessing}
            />
          </div>
        ) : (
          <>
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
                    <p className="text-base leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {currentTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-300 text-blue-900 opacity-70">
                <p className="text-sm italic">{currentTranscript}</p>
              </div>
            </div>
          )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 space-y-4 pt-4 border-t border-slate-200">
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-slate-200">
            <VoiceWaveform
              isActive={isListening || isSpeaking}
              type={isListening ? 'listening' : 'speaking'}
            />
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking || !isInitialized}
              size="lg"
              className={`w-20 h-20 rounded-full shadow-xl transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600 font-medium">
              {isListening
                ? 'Listening...'
                : isSpeaking
                ? 'Speaking...'
                : 'Tap the microphone to speak'}
            </p>
            {!isListening && !isSpeaking && (
              <p className="text-xs text-slate-500 mt-1">
                Try saying: "Start a scan", "Show my history", or just share how you're feeling
              </p>
            )}
          </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
