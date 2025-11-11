import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { ResetPassword } from './components/ResetPassword';
import { Loader2 } from 'lucide-react';
import './App.css';

const MainAnalysisApp = lazy(() => import('./components/MainAnalysisApp').then(m => ({ default: m.MainAnalysisApp })));
const QuickTherapist = lazy(() => import('./components/AITherapist/QuickTherapist').then(m => ({ default: m.QuickTherapist })));

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('#/reset-password') || hash.includes('type=recovery')) {
        setShowResetPassword(true);
      }
    };

    checkHash();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <ResetPassword
          onSuccess={() => {
            setShowResetPassword(false);
            window.location.hash = '';
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg text-gray-600">Loading application...</p>
        </div>
      </div>
    }>
      <MainAnalysisApp />
      <QuickTherapist />
    </Suspense>
  );
}

export default App;
