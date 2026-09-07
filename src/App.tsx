import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { KeeperSelectionScreen } from './screens/KeeperSelectionScreen';
import { TodayScreen } from './screens/TodayScreen';
import { JournalScreen } from './screens/JournalScreen';
import { ElephantsScreen } from './screens/ElephantsScreen';
import { ElephantDetailsScreen } from './screens/ElephantDetailsScreen';
import { AssignmentsScreen } from './screens/AssignmentsScreen';

export default function App() {
  const { activeKeeperId } = useStore();
  const [currentScreen, setCurrentScreen] = useState<string>('today');
  const [selectedElephantId, setSelectedElephantId] = useState<string | null>(null);

  // If no keeper is selected, force settings/keeper selection screen
  useEffect(() => {
    if (!activeKeeperId && currentScreen !== 'settings') {
      setCurrentScreen('settings');
    } else if (activeKeeperId && currentScreen === 'settings' && !activeKeeperId) {
       // if activeKeeperId was just set and we are on settings, maybe go to today.
       // actually let's just let them navigate manually if they are already on settings.
    }
  }, [activeKeeperId, currentScreen]);

  const handleNavigate = (screen: string) => {
    if (screen === 'elephant_details') {
      // Must be called with an elephant id elsewhere
    }
    setCurrentScreen(screen);
  };

  const openElephantDetails = (id: string) => {
    setSelectedElephantId(id);
    setCurrentScreen('elephant_details');
  };

  const renderScreen = () => {
    if (!activeKeeperId && currentScreen !== 'settings') {
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
      default:
        return <TodayScreen onElephantClick={openElephantDetails} />;
    }
  };

  return (
    <Layout currentScreen={currentScreen} onNavigate={handleNavigate}>
      {renderScreen()}
    </Layout>
  );
}
