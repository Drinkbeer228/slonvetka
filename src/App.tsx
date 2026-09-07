import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { KeeperSelectionScreen } from './screens/KeeperSelectionScreen';
import { TodayScreen } from './screens/TodayScreen';
import { JournalScreen } from './screens/JournalScreen';
import { ElephantsScreen } from './screens/ElephantsScreen';
import { ElephantDetailsScreen } from './screens/ElephantDetailsScreen';
import { AssignmentsScreen } from './screens/AssignmentsScreen';
import { StaffScreen } from './screens/StaffScreen';

export default function App() {
  const { profile, loading } = useStore();
  const [currentScreen, setCurrentScreen] = useState<string>('today');
  const [selectedElephantId, setSelectedElephantId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !profile && currentScreen !== 'settings') {
      setCurrentScreen('settings');
    }
  }, [profile, loading, currentScreen]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-zinc-500">Загрузка...</div>;
  }

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const openElephantDetails = (id: string) => {
    setSelectedElephantId(id);
    setCurrentScreen('elephant_details');
  };

  const renderScreen = () => {
    if (!profile) {
      return <KeeperSelectionScreen onComplete={() => setCurrentScreen('today')} />;
    }

    switch (currentScreen) {
      case 'settings':
        return <KeeperSelectionScreen onComplete={() => setCurrentScreen('today')} />;
      case 'today':
        return <TodayScreen onElephantClick={openElephantDetails} />;
      case 'journal':
        return <JournalScreen />;
      case 'elephants':
        return <ElephantsScreen onElephantClick={openElephantDetails} />;
      case 'elephant_details':
        return selectedElephantId ? 
          <ElephantDetailsScreen elephantId={selectedElephantId} onBack={() => setCurrentScreen('elephants')} /> : 
          <ElephantsScreen onElephantClick={openElephantDetails} />;
      case 'assignments':
        return <AssignmentsScreen />;
      case 'staff':
        return <StaffScreen />;
      default:
        return <TodayScreen onElephantClick={openElephantDetails} />;
    }
  };

  if (!profile) {
    return renderScreen();
  }

  return (
    <Layout currentScreen={currentScreen} onNavigate={handleNavigate}>
      {renderScreen()}
    </Layout>
  );
}

