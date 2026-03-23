import { Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import EditScreen from './screens/EditScreen';
import CameraScreen from './screens/CameraScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  return (
    <div className="h-full w-full bg-surface overflow-hidden relative">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/edit" element={<EditScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </div>
  );
}
