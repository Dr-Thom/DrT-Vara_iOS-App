import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdProvider } from './contexts/AdContext';
import mobileAds from 'react-native-google-mobile-ads';
import { ADMOB_CONFIG } from './config';

// Screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import TasksScreen from './screens/TasksScreen';
import WithdrawalScreen from './screens/WithdrawalScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import ReferralsScreen from './screens/ReferralsScreen';

const Stack = createNativeStackNavigator();

// Initialize AdMob
mobileAds()
  .initialize()
  .then((adapterStatuses) => {
    console.log('AdMob initialized:', adapterStatuses);
  })
  .catch((error) => {
    console.error('AdMob initialization failed:', error);
  });

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // App Stack
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'VARA',
              headerLeft: null,
            }}
          />
          <Stack.Screen
            name="Tasks"
            component={TasksScreen}
            options={{ title: 'Available Tasks' }}
          />
          <Stack.Screen
            name="Calculator"
            component={CalculatorScreen}
            options={{ title: 'Earnings Calculator' }}
          />
          <Stack.Screen
            name="Referrals"
            component={ReferralsScreen}
            options={{ title: 'Refer & Earn' }}
          />
          <Stack.Screen
            name="Withdrawal"
            component={WithdrawalScreen}
            options={{ title: 'Withdraw Earnings' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AdProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AdProvider>
    </AuthProvider>
  );
}
