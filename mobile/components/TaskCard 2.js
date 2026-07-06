import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const TaskCard = ({ task, onComplete, completing }) => {
  const getTaskTypeColor = (type) => {
    const colors = {
      survey: '#3B82F6',
      video: '#8B5CF6',
      social: '#EC4899',
      data_entry: '#10B981',
      quiz: '#F59E0B',
    };
    return colors[type] || '#6B7280';
  };

  const handleExternalLink = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: getTaskTypeColor(task.task_type) }]}>
          <Text style={styles.badgeText}>{task.task_type.toUpperCase()}</Text>
        </View>
        <Text style={styles.reward}>${task.reward_amount.toFixed(2)}</Text>
      </View>

      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.description}>{task.description}</Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>⏱ {task.estimated_time} min</Text>
        <Text style={styles.metaText}>≈ ₱{(task.reward_amount * 55).toFixed(0)}</Text>
      </View>

      {task.survey_url && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleExternalLink(task.survey_url)}
        >
          <Text style={styles.linkText}>📋 Open Survey →</Text>
        </TouchableOpacity>
      )}

      {task.video_url && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleExternalLink(task.video_url)}
        >
          <Text style={styles.linkText}>🎥 Watch Video →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.completeButton, completing && styles.completingButton]}
        onPress={onComplete}
        disabled={completing}
      >
        <Text style={styles.completeButtonText}>
          {completing ? 'Completing...' : '✓ Mark as Complete'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reward: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  linkButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completingButton: {
    backgroundColor: '#6B7280',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskCard;
