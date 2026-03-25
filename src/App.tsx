import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import EditScreen from './screens/EditScreen';
import CameraScreen from './screens/CameraScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';

const PUBLIC_PATHS = ['/privacy', '/terms'];

export default function App() {
  const { user, isGuest, loading } = useAuth();
  const { pathname } = useLocation();

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  if (loading && !isPublicPage) {
    return (
      <div className="h-full w-full bg-surface flex items-center justify-center">
        <span className="text-xs text-muted tracking-widest animate-pulse">SOLAIRE</span>
      </div>
    );
  }

  if (!user && !isGuest && !isPublicPage) {
    return <AuthScreen />;
  }

  return (
    <div className="h-full w-full bg-surface overflow-hidden relative">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/edit" element={<EditScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
      </Routes>
    </div>
  );
}
