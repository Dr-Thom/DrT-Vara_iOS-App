import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

/**
 * Error Boundary — shows the error on screen instead of a silent crash.
 * This is critical for debugging preview/production APKs where console isn't available.
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={styles.wrap}>
          <Text style={styles.title}>App crashed</Text>
          <Text style={styles.subtitle}>Copy this and send it to your developer:</Text>
          <View style={styles.box}>
            <Text style={styles.mono}>
              {String(this.state.error?.toString?.() || this.state.error || 'Unknown error')}
            </Text>
          </View>
          <Text style={styles.subtitle}>Stack:</Text>
          <View style={styles.box}>
            <Text style={styles.mono}>
              {String(this.state.error?.stack || this.state.info?.componentStack || 'No stack')}
            </Text>
          </View>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { padding: 24, backgroundColor: '#FEF2F2', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#B91C1C', marginBottom: 8 },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#7F1D1D', marginTop: 12, marginBottom: 6 },
  box: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#111827' },
});

export default ErrorBoundary;
