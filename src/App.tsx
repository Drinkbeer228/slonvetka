import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { LoginPage } from './components/auth/LoginPage';
import { DailyShiftPage } from './screens/DailyShiftPage';
import { TodayScreen } from './screens/TodayScreen';
import { JournalScreen } from './screens/JournalScreen';
import { ElephantsScreen } from './screens/ElephantsScreen';
import { ElephantDetailsScreen } from './screens/ElephantDetailsScreen';
import { AssignmentsScreen } from './screens/AssignmentsScreen';
import { StaffScreen } from './screens/StaffScreen';
import { VetDashboard } from './screens/VetDashboard';
import { VetCabinetDashboard } from './components/VetCabinetDashboard';
import { MonitoringAnalyticsScreen } from './screens/MonitoringAnalyticsScreen';

export default function App() {
  const { profile } = useStore();
  const [currentScreen, setCurrentScreen] = useState<string>('daily_shift');
  const [selectedElephantId, setSelectedElephantId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile && currentScreen !== 'settings') {
      setCurrentScreen('daily_shift');
    }
  }, [profile, currentScreen]);

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const openElephantDetails = (id: string) => {
    setSelectedElephantId(id);
    setCurrentScreen('elephant_details');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'settings':
        return <DailyShiftPage onNavigate={handleNavigate} />;
      case 'daily_shift':
        return <DailyShiftPage onNavigate={handleNavigate} />;
      case 'monitoring':
        return <MonitoringAnalyticsScreen onNavigate={handleNavigate} />;
      case 'vet_dashboard':
        return <VetDashboard onNavigate={handleNavigate} />;
      case 'vet_cabinet':
        return <VetCabinetDashboard onNavigate={handleNavigate} />;
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
        return <DailyShiftPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <LoginPage>
      <Layout currentScreen={currentScreen} onNavigate={handleNavigate}>
        {renderScreen()}
      </Layout>
    </LoginPage>
  );
}

