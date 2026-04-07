import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Landing Page Components
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import BonusExplained from './components/BonusExplained';
import SocialProof from './components/SocialProof';
import WaitlistForm from './components/WaitlistForm';
import AppStoreSection from './components/AppStoreSection';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import ExitIntentPopup from './components/ExitIntentPopup';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// App Pages
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Withdrawal from './pages/Withdrawal';

const LandingPage = () => {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <BonusExplained />
        <SocialProof />
        <div id="waitlist">
          <WaitlistForm />
        </div>
        <AppStoreSection />
        <FAQ />
      </main>
      <Footer />
      <ExitIntentPopup />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* App Routes (Protected) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="withdrawal" element={<Withdrawal />} />
            </Route>
            
            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
