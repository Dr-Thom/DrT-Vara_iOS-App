import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@samson/onboarding_seen';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '💰',
    title: 'Earn Money',
    body: 'Complete simple tasks and earn $0.10 for every completed task.',
  },
  {
    emoji: '🎁',
    title: 'Earn Bonuses',
    body: 'Receive a $1 Bonus every 5 tasks.\n\nReceive a $10 Super Bonus every 25 tasks.',
  },
  {
    emoji: '💸',
    title: 'Cash Out',
    body: 'Withdraw your earnings once your balance reaches $5.00.',
  },
  {
    emoji: '👥',
    title: 'Invite Friends',
    body: 'Invite 3 qualified friends and earn a $10 Referral Bonus.',
  },
];

export const markOnboardingComplete = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {}
};

export const hasSeenOnboarding = async () => {
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_KEY);
    return v === 'true';
  } catch {
    return false;
  }
};

export const resetOnboarding = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch {}
};

const OnboardingScreen = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  const goTo = (i) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    onDone?.();
  };

  const handleNext = async () => {
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      await markOnboardingComplete();
      onDone?.();
    }
  };

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container} data-testid="onboarding-screen">
      <View style={styles.topBar}>
        <Text style={styles.logo}>SAMSON</Text>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} data-testid="onboarding-skip-btn">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.cta} onPress={handleNext} data-testid="onboarding-next-btn">
        <Text style={styles.ctaText}>
          {isLast ? '🚀 Start Earning' : 'Next →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },
  logo: { fontSize: 28, fontWeight: '700', color: '#3B82F6' },
  skipText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  slide: { padding: 24, alignItems: 'center', justifyContent: 'center', flex: 1 },
  emoji: { fontSize: 96, marginBottom: 32 },
  slideTitle: { fontSize: 32, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 16 },
  slideBody: { fontSize: 17, color: '#4B5563', textAlign: 'center', lineHeight: 26, maxWidth: 320 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#3B82F6', width: 24 },
  cta: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default OnboardingScreen;
