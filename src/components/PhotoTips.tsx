import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Sun,
  User,
  Eye,
  Wind,
  X,
  Check,
  AlertCircle,
  Lightbulb,
  Target
} from 'lucide-react';

export function PhotoTips() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const dos = [
    { icon: Target, text: 'Face the camera directly (front-facing)', color: 'text-teal-600' },
    { icon: Sun, text: 'Use natural daylight or bright indoor lighting', color: 'text-amber-500' },
    { icon: User, text: 'Keep a neutral expression (no smiling or frowning)', color: 'text-blue-600' },
    { icon: Eye, text: 'Remove glasses, hats, or anything covering your face', color: 'text-slate-600' },
    { icon: Wind, text: 'Clean skin (no makeup for best results)', color: 'text-cyan-600' },
    { icon: Camera, text: 'Hold phone at eye level', color: 'text-violet-600' },
    { icon: Lightbulb, text: 'Fill the frame with your face', color: 'text-orange-500' }
  ];

  const donts = [
    'Side angles or profile shots',
    'Dark or dim lighting',
    'Heavy makeup or filters',
    'Shadows across the face',
    'Face covered by hair, hands, or accessories',
    'Too far from camera',
    'Extreme facial expressions'
  ];

  return (
    <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-blue-100/50 transition-colors pb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-xl font-bold text-slate-800">
              How to Take the Perfect Analysis Photo
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-blue-200/50"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-blue-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-600" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-teal-100 rounded-full p-1.5">
                  <Check className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-lg font-bold text-teal-700">DO's</h3>
              </div>

              <div className="space-y-2.5">
                {dos.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-100 hover:border-teal-300 transition-colors"
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${item.color}`} />
                    <span className="text-sm font-medium text-slate-700 leading-relaxed">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-100 rounded-full p-1.5">
                  <X className="w-5 h-5 text-red-700" />
                </div>
                <h3 className="text-lg font-bold text-red-700">DON'Ts</h3>
              </div>

              <div className="space-y-2.5">
                {donts.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors"
                  >
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                    <span className="text-sm font-medium text-slate-700 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <Button
              onClick={() => setShowExamples(!showExamples)}
              variant="outline"
              className="w-full border-2 border-blue-300 hover:bg-blue-100 text-blue-700 font-semibold"
            >
              <Camera className="w-4 h-4 mr-2" />
              {showExamples ? 'Hide' : 'Show'} Example Photos
            </Button>
          </div>

          {showExamples && (
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-teal-100 rounded-full p-1.5">
                    <Check className="w-4 h-4 text-teal-700" />
                  </div>
                  <h4 className="font-bold text-teal-700">Good Example</h4>
                </div>
                <div className="relative rounded-lg overflow-hidden border-4 border-teal-400 shadow-md">
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                    alt="Good example: Well-lit front-facing selfie"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-teal-600/90 backdrop-blur-sm p-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-white font-medium">
                        Well-lit, direct angle, neutral expression, clear face
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-red-100 rounded-full p-1.5">
                    <X className="w-4 h-4 text-red-700" />
                  </div>
                  <h4 className="font-bold text-red-700">Bad Example</h4>
                </div>
                <div className="relative rounded-lg overflow-hidden border-4 border-red-400 shadow-md">
                  <img
                    src="https://images.pexels.com/photos/1090387/pexels-photo-1090387.jpeg?auto=compress&cs=tinysrgb&w=400"
                    alt="Bad example: Side angle with poor lighting"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm p-3">
                    <div className="flex items-start gap-2">
                      <X className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-white font-medium">
                        Side angle, inconsistent lighting, not facing camera
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-900">
                Pro Tip: Consistency is Key
              </p>
              <p className="text-xs text-blue-800">
                For the most accurate analysis, ensure even lighting across your entire face.
                Position yourself near a window during daytime or use a ring light for consistent illumination.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
