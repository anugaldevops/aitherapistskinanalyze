import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { Meditation } from '../data/meditations';

interface MeditationPlayerProps {
  meditation: Meditation;
  onComplete: () => void;
  onClose: () => void;
}

export function MeditationPlayer({ meditation, onComplete, onClose }: MeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => {
      setIsPlaying(false);
      setHasCompleted(true);
      onComplete();
    };
    const handleError = () => {
      console.error('Error loading audio file:', meditation.audioFile);
      setAudioError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [onComplete, meditation.audioFile]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
    setIsPlaying(true);
    setHasCompleted(false);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 border-2 border-purple-200 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{meditation.icon}</div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{meditation.title}</h3>
            <p className="text-sm text-slate-600">{meditation.description}</p>
            <p className="text-xs text-slate-500 mt-1">
              {meditation.backgroundMusic} • {meditation.duration}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/50"
        >
          <X className="w-5 h-5 text-slate-600" />
        </Button>
      </div>

      {hasCompleted && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            Meditation completed! Take a moment to notice how you feel. 🌟
          </p>
        </div>
      )}

      {audioError && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="text-sm text-amber-900 font-semibold mb-2">
            Audio File Not Available
          </p>
          <p className="text-xs text-amber-800 mb-3">
            The meditation audio file hasn't been generated yet. You can still read the meditation script below.
          </p>
          <div className="max-h-48 overflow-y-auto p-3 bg-white rounded border border-amber-200">
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {meditation.script}
            </p>
          </div>
        </div>
      )}

      {!audioError && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-mono w-12">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-sm text-slate-600 font-mono w-12">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={togglePlay}
                size="lg"
                className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRestart}
                className="border-2 border-purple-200 hover:bg-purple-100"
              >
                <RotateCcw className="w-5 h-5 text-purple-600" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="hover:bg-white/50"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-slate-600" />
                ) : (
                  <Volume2 className="w-5 h-5 text-slate-600" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => {
                  setVolume(value[0] / 100);
                  if (isMuted) setIsMuted(false);
                }}
                className="w-24"
              />
            </div>
          </div>

          {isPlaying && (
            <div className="p-4 bg-white/60 rounded-lg border border-purple-200">
              <p className="text-center text-sm text-slate-700 italic">
                Take a deep breath and listen... Let yourself be guided through this practice.
              </p>
            </div>
          )}
        </div>
      )}

      <audio
        ref={audioRef}
        src={meditation.audioFile}
        preload="metadata"
      />
    </Card>
  );
}
