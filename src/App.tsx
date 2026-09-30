import React from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { RoleProvider } from './context/RoleContext';
import { DailyShiftPage } from './screens/DailyShiftPage';

export default function App() {
  return (
    <RoleProvider>
      <LoginPage>
        <DailyShiftPage />
      </LoginPage>
    </RoleProvider>
  );
}
