import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import InstallPrompt from '@/components/InstallPrompt';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/Layout';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import ExerciseDemoScreen from '@/screens/ExerciseDemoScreen';
import WorkoutScreen from '@/screens/WorkoutScreen';
import RestScreen from '@/screens/RestScreen';
import SummaryScreen from '@/screens/SummaryScreen';
import ProgressScreen from '@/screens/ProgressScreen';

function App() {
  const { init, loading, user, guest } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 border-2 border-blue/30 border-t-blue rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthed = !!user || !!guest;

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={isAuthed ? <Navigate to="/home" replace /> : <AuthScreen />} />
          <Route path="/home" element={isAuthed ? <HomeScreen /> : <Navigate to="/" replace />} />
          <Route path="/exercise/:exerciseId" element={isAuthed ? <ExerciseDemoScreen /> : <Navigate to="/" replace />} />
          <Route path="/workout/:exerciseId" element={isAuthed ? <WorkoutScreen /> : <Navigate to="/" replace />} />
          <Route path="/rest/:exerciseId/:setNumber" element={isAuthed ? <RestScreen /> : <Navigate to="/" replace />} />
          <Route path="/summary/:exerciseId" element={isAuthed ? <SummaryScreen /> : <Navigate to="/" replace />} />
          <Route path="/progress" element={isAuthed ? <ProgressScreen /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <InstallPrompt />
    </HashRouter>
  );
}

export default App;
