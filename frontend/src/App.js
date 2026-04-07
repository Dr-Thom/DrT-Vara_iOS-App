import React, { useState } from 'react';
import './App.css';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

// Components
import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import BonusExplained from './components/BonusExplained';
import SocialProof from './components/SocialProof';
import WaitlistForm from './components/WaitlistForm';
import AppStoreSection from './components/AppStoreSection';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

function App() {
  const handleGetStarted = () => {
    // Scroll to waitlist form
    const waitlistSection = document.querySelector('#waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If waitlist section not found, scroll to how it works
      const howItWorksSection = document.querySelector('#how-it-works');
      if (howItWorksSection) {
        howItWorksSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="App">
      <Header onGetStarted={handleGetStarted} />
      
      <main>
        <Hero onGetStarted={handleGetStarted} />
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
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
