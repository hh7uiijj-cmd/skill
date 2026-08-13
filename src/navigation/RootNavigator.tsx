import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { LoadingView } from '../components/ui';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingView />;

  return (
    <NavigationContainer>
      {user ? (
        <DataProvider>
          <MainTabs />
        </DataProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
