import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdProvider } from './contexts/AdContext';
import ErrorBoundary from './components/ErrorBoundary';
import { attachNotificationListeners } from './services/notifications';

// Screens
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import TasksScreen from './screens/TasksScreen';
import WithdrawalScreen from './screens/WithdrawalScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import ReferralsScreen from './screens/ReferralsScreen';
import OffersScreen from './screens/OffersScreen';
import OnboardingScreen, { hasSeenOnboarding } from './screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

// AdMob temporarily disabled — re-enable once Google account country issue is resolved.

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState(null); // null while loading

  useEffect(() => {
    if (user) {
      hasSeenOnboarding().then(setOnboardingSeen);
    } else {
      setOnboardingSeen(null);
    }
  }, [user]);

  if (loading) {
    return null;
  }

  // Authenticated, first time → show onboarding
  if (user && onboardingSeen === false) {
    return <OnboardingScreen onDone={() => setOnboardingSeen(true)} />;
  }

  // Still checking onboarding flag → render nothing briefly
  if (user && onboardingSeen === null) {
    return null;
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
              title: 'SAMSON',
              headerLeft: null,
            }}
          />
          <Stack.Screen
            name="Tasks"
            component={TasksScreen}
            options={{ title: 'Available Tasks' }}
          />
          <Stack.Screen
            name="Offers"
            component={OffersScreen}
            options={{ title: '💎 Offers & Surveys' }}
          />
          <Stack.Screen
            name="Calculator"
            component={CalculatorScreen}
            options={{ title: 'Earnings Calculator' }}
          />
          <Stack.Screen
            name="Referrals"
            component={ReferralsScreen}
            options={{ title: 'Invite Friends' }}
          />
          <Stack.Screen
            name="Withdrawal"
            component={WithdrawalScreen}
            options={{ title: 'Cash Out' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const navRef = useRef(null);

  useEffect(() => {
    const detach = attachNotificationListeners((screen, params) => {
      try {
        navRef.current?.navigate(screen, params);
      } catch (e) {
        console.warn('Nav from notification failed:', e?.message);
      }
    });
    return detach;
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AdProvider>
            <NavigationContainer ref={navRef}>
              <AppNavigator />
            </NavigationContainer>
          </AdProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
