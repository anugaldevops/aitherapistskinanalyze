import { AlertCircle, Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

interface CrisisResourcesAlertProps {
  onClose: () => void;
}

export function CrisisResourcesAlert({ onClose }: CrisisResourcesAlertProps) {
  return (
    <Alert className="border-red-500 bg-red-50 border-2">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <AlertDescription className="text-red-900 space-y-4 mt-2">
        <p className="font-bold text-base">
          If you're in immediate danger, please get help right now:
        </p>

        <div className="space-y-3 bg-white p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Emergency Services</p>
              <a href="tel:911" className="text-blue-600 hover:underline text-lg font-bold">
                Call 911
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold">National Suicide Prevention Lifeline</p>
              <a href="tel:988" className="text-blue-600 hover:underline text-lg font-bold">
                Call or Text 988
              </a>
              <p className="text-sm text-slate-600">Available 24/7</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Crisis Text Line</p>
              <p className="text-slate-700">
                Text <span className="font-bold text-blue-600">HOME</span> to{' '}
                <a href="sms:741741" className="text-blue-600 hover:underline font-bold">
                  741741
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold">International Resources</p>
              <a
                href="https://www.iasp.info/resources/Crisis_Centres/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Find Help in Your Country
              </a>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
          <p className="text-amber-900 text-sm font-medium">
            <strong>You are not alone.</strong> Professional help is available right now, and people care about you.
            Your life has value, and these feelings can get better with support.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="border-red-300"
          >
            Close This Message
          </Button>
          <Button
            onClick={() => window.open('https://findahelpline.com/', '_blank')}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Find Local Resources
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
