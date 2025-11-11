import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { AuthForms } from './AuthForms';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { Sparkles, TrendingUp, Shield, Clock } from 'lucide-react';

type ViewMode = 'landing' | 'auth' | 'forgot-password' | 'reset-password';

export function LandingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  if (viewMode === 'reset-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <ResetPassword onSuccess={() => setViewMode('auth')} />
      </div>
    );
  }

  if (viewMode === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <ForgotPassword
          onBackToLogin={() => setViewMode('auth')}
          onNavigateToReset={() => setViewMode('reset-password')}
        />
      </div>
    );
  }

  if (viewMode === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <AuthForms
          onSuccess={() => setViewMode('landing')}
          onForgotPassword={() => setViewMode('forgot-password')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>

            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
              SkinAge AI
            </h1>

            <p className="text-2xl text-gray-700 font-medium">
              Clinical Facial Analysis
            </p>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Track your skin health with research-validated AI analysis
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                size="lg"
                onClick={() => setViewMode('auth')}
                className="text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-shadow"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setViewMode('auth')}
                className="text-lg px-8 py-6 h-auto shadow-md hover:shadow-lg transition-shadow"
              >
                Sign In
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-16">
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Clinical-Grade Analysis</h3>
                    <p className="text-gray-600">
                      Advanced facial zone analysis based on validated research methodologies
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Track Progress Over Time</h3>
                    <p className="text-gray-600">
                      Monitor changes in your skin health and see the impact of your routine
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Personalized Recommendations</h3>
                    <p className="text-gray-600">
                      Get tailored skincare insights based on your unique analysis results
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Smart Routine Reminders</h3>
                    <p className="text-gray-600">
                      Stay consistent with your skincare journey through intelligent tracking
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>Your privacy is protected. All analyses are stored securely.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
