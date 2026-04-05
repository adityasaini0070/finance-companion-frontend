import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#5B4FE9" barStyle="light-content" />
      <AppNavigator />
    </NavigationContainer>
  );
}