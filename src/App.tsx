import React from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { RoleProvider } from './context/RoleContext';
import { AppShell } from './components/AppShell';

export default function App() {
  return (
    <RoleProvider>
      <LoginPage>
        <AppShell />
      </LoginPage>
    </RoleProvider>
  );
}
