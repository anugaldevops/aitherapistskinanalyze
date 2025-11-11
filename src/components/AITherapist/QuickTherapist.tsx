import { useState, useEffect } from 'react';
import { MessageCircleHeart } from 'lucide-react';
import { VoiceTherapist } from '../VoiceTherapist/VoiceTherapist';
import { useAuth } from '../../contexts/AuthContext';

interface QuickTherapistProps {
  onStartScan?: () => void;
  onShowHistory?: () => void;
  onViewRoutine?: () => void;
  onOpenDashboard?: () => void;
}

export function QuickTherapist({
  onStartScan,
  onShowHistory,
  onViewRoutine,
  onOpenDashboard
}: QuickTherapistProps) {
  const { isAuthenticated } = useAuth();
  const [showTherapist, setShowTherapist] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setShowTherapist(true);
      }
    };

    if (isAuthenticated) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowTherapist(true)}
        className="fixed bottom-5 right-5 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 z-[9999]"
        aria-label="Open AI Therapist"
        title="Talk to AI Therapist"
      >
        <MessageCircleHeart className="w-7 h-7" />
      </button>

      <VoiceTherapist
        isOpen={showTherapist}
        onClose={() => setShowTherapist(false)}
        onStartScan={onStartScan}
        onShowHistory={onShowHistory}
        onViewRoutine={onViewRoutine}
        onOpenDashboard={onOpenDashboard}
      />
    </>
  );
}
