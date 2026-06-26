import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { withdrawalAPI } from '../services/api';
import AdBanner from '../components/AdBanner';

const WithdrawalScreen = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', emoji: '📱' },
    { id: 'paypal', name: 'PayPal', emoji: '💳' },
    { id: 'bank', name: 'Bank Transfer', emoji: '🏦' },
  ];

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (withdrawAmount > (user?.earnings || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    if (!accountDetails.trim()) {
      Alert.alert('Error', 'Please enter your account details');
      return;
    }

    Alert.alert(
      'Confirm Cash Out',
      `Cash out $${withdrawAmount.toFixed(2)} via ${paymentMethod.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await withdrawalAPI.requestWithdrawal(
                withdrawAmount,
                paymentMethod,
                accountDetails
              );
              Alert.alert('Success!', response.message);
              setAmount('');
              setAccountDetails('');
              await refreshUser();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Withdrawal failed');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AdBanner />

        <View style={styles.content}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>${(user?.earnings || 0).toFixed(2)}</Text>
            <Text style={styles.balancePeso}>≈ ₱{((user?.earnings || 0) * 55).toFixed(2)} PHP</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount to Cash Out</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodsContainer}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodButton,
                    paymentMethod === method.id && styles.methodButtonActive,
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Text style={styles.methodEmoji}>{method.emoji}</Text>
                  <Text
                    style={[
                      styles.methodText,
                      paymentMethod === method.id && styles.methodTextActive,
                    ]}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={
                paymentMethod === 'gcash'
                  ? 'Enter your GCash number'
                  : paymentMethod === 'paypal'
                  ? 'Enter your PayPal email'
                  : 'Enter your bank account details'
              }
              value={accountDetails}
              onChangeText={setAccountDetails}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.withdrawButton, loading && styles.withdrawButtonDisabled]}
            onPress={handleWithdraw}
            disabled={loading}
          >
            <Text style={styles.withdrawButtonText}>
              {loading ? 'Processing...' : 'Cash Out Now'}
            </Text>
          </TouchableOpacity>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              💡 Note: This is a mock withdrawal for testing. In production, actual payments will be processed.
            </Text>
          </View>
        </View>

        <AdBanner style={styles.bottomAd} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  balancePeso: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  methodsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  methodButtonActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  methodEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  methodTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  withdrawButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noteText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
  bottomAd: {
    marginTop: 20,
  },
});

export default WithdrawalScreen;
