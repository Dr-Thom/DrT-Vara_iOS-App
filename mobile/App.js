👉 https://github.com/Dr-Thom/DrT-Vara_iOS-App/edit/main/mobile/App.js

SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdProvider } from './contexts/AdContext';
import ErrorBoundary from './components/ErrorBoundary';
import { attachNotificationListeners } from './services/notifications';

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

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState(null);

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

  if (user && onboardingSeen === false) {
    return <OnboardingScreen onDone={() => setOnboardingSeen(true)} />;
  }

  if (user && onboardingSeen === null) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: 'SAMSON', headerLeft: null }}
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
  const navigationRef = useRef(null);

  useEffect(() => {
    const cleanup = attachNotificationListeners((event) => {
      try {
        const url = event?.notification?.request?.content?.data?.deepLink;
        if (!url) return;
        if (typeof url === 'string' && url.startsWith('vara://')) {
          const path = url.replace('vara://', '');
          const route = path.charAt(0).toUpperCase() + path.slice(1);
          navigationRef.current?.navigate(route);
        }
      } catch (e) {
        // ignore
      }
    });
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AuthProvider>
            <AdProvider>
              <AppNavigator />
            </AdProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}  if (loading) {
    return null;
  }

  // Authenticated, first time → show onboarding
  if (user && onboardingSeen === false) {
    return <OnboardingScreen onDone={() => setOnboardingSeen(true)} />;
  }

  // Still checking onboarding flag → render nothing briefly
  if (user && onboardingSeen === null) {
    return null;
  if (loading) return null;
  if (user && onboardingSeen === false) {
    return <OnboardingScreen onDone={() => setOnboardingSeen(true)} />;
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
  }
  if (user && onboardingSeen === null) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        </>
      ) : (
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
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'SAMSON', headerLeft: null }} />
          <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Available Tasks' }} />
          <Stack.Screen name="Offers" component={OffersScreen} options={{ title: '💎 Offers & Surveys' }} />
          <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ title: 'Earnings Calculator' }} />
          <Stack.Screen name="Referrals" component={ReferralsScreen} options={{ title: 'Invite Friends' }} />
          <Stack.Screen name="Withdrawal" component={WithdrawalScreen} options={{ title: 'Cash Out' }} />
SAMSON: Offerwall screens, LoginScreen fix, AdMob env switching, dashboard beta
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    const cleanup = attachNotificationListeners((event) => {
      try {
        const url = event?.notification?.request?.content?.data?.deepLink;
        if (!url) return;
        if (typeof url === 'string' && url.startsWith('vara://')) {
          const path = url.replace('vara://', '');
          const route = path.charAt(0).toUpperCase() + path.slice(1);
          navigationRef.current?.navigate(route);
        }
      } catch (e) {}
    });
    return cleanup;
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AuthProvider>
            <AdProvider>
              <AppNavigator />
            </AdProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
