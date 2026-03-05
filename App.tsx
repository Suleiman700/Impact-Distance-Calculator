import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import IntroScreen from './screens/IntroScreen';

const Stack = createStackNavigator();

function AppContent() {
  const { settings, colors } = useSettings();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.card,
      text: colors.textBright,
      border: colors.cardBorder,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={settings.showOnboarding ? "Intro" : "Home"}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HistoryProvider } from './contexts/HistoryContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <HistoryProvider>
          <AppContent />
        </HistoryProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
