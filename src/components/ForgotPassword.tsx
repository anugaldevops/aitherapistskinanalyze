import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert } from './ui/alert';
import { Loader2, CheckCircle, Copy, Check } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onNavigateToReset: () => void;
}

export function ForgotPassword({ onBackToLogin, onNavigateToReset }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetToken] = useState(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

  const resetLink = `${window.location.origin}/#/reset-password?token=${resetToken}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 2000));
    setLinkGenerated(true);
    setIsSubmitting(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClickLink = () => {
    onNavigateToReset();
  };

  if (linkGenerated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center">Password Reset Link Generated</CardTitle>
          <CardDescription className="text-center">
            Your password reset link is ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Reset Link</Label>
            <div className="flex gap-2">
              <Input
                value={resetLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Copy this link to reset your password
          </p>

          <Button
            onClick={handleClickLink}
            className="w-full"
          >
            Click Here to Reset Password
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 text-center">
              In production, this link would be sent to <strong>{email}</strong> via email
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-[#0EA5E9] hover:underline bg-transparent border-0 cursor-pointer"
              style={{ background: 'none', padding: 0 }}
            >
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email address and we'll generate a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-[#0EA5E9] hover:underline bg-transparent border-0 cursor-pointer"
              style={{ background: 'none', padding: 0 }}
              disabled={isSubmitting}
            >
              Back to Login
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
