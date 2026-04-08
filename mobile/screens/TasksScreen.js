import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAds } from '../contexts/AdContext';
import { tasksAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import AdBanner from '../components/AdBanner';

const TasksScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const { user, refreshUser } = useAuth();
  const { showRewardedAd, trackTaskCompletion, rewardedLoaded } = useAds();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await tasksAPI.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId);

    // Show rewarded video ad first
    try {
      if (rewardedLoaded) {
        await showRewardedAd();
        // User watched the ad, now complete the task
        await completeTask(taskId);
      } else {
        // Ad not loaded, allow task completion anyway
        Alert.alert(
          'Ad Not Ready',
          'Ad is still loading. You can complete the task, but consider watching ads to support us!',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setCompletingTaskId(null) },
            { text: 'Continue', onPress: () => completeTask(taskId) },
          ]
        );
      }
    } catch (error) {
      console.error('Ad error:', error);
      // If ad fails, still allow task completion
      await completeTask(taskId);
    }
  };

  const completeTask = async (taskId) => {
    try {
      const response = await tasksAPI.completeTask(taskId);
      
      Alert.alert('Success!', response.message);
      
      // Track task completion for interstitial ad
      trackTaskCompletion();
      
      // Refresh data
      await refreshUser();
      await fetchTasks();

      // Check for bonus unlock
      if (response.bonus_unlocked && !user?.bonus_unlocked) {
        setTimeout(() => {
          Alert.alert(
            '🎉 Congratulations!',
            'You unlocked your $2 USD bonus!',
            [{ text: 'Awesome!', style: 'default' }]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to complete task';
      Alert.alert('Error', typeof errorMsg === 'string' ? errorMsg : 'Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={() => handleCompleteTask(item._id)}
            completing={completingTaskId === item._id}
          />
        )}
        ListHeaderComponent={() => (
          <>
            <AdBanner />
            <View style={styles.header}>
              <Text style={styles.title}>Available Tasks</Text>
              <Text style={styles.subtitle}>
                {tasks.length} task{tasks.length !== 1 ? 's' : ''} available • Choose any task to start earning
              </Text>
            </View>

            {!user?.bonus_unlocked && (
              <View style={styles.bonusAlert}>
                <Text style={styles.bonusAlertText}>
                  🎯 Complete {Math.max(0, 5 - (user?.tasks_completed || 0))} more task
                  {Math.max(0, 5 - (user?.tasks_completed || 0)) !== 1 ? 's' : ''} to unlock your $2 USD bonus!
                </Text>
              </View>
            )}
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>All tasks completed!</Text>
            <Text style={styles.emptyText}>Great job! Check back later for new tasks.</Text>
          </View>
        )}
        ListFooterComponent={() => <AdBanner style={styles.bottomAd} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  bonusAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bonusAlertText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  bottomAd: {
    marginTop: 20,
  },
});

export default TasksScreen;
