import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, DollarSign, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import API_CONFIG from '../config/api';

const Tasks = () => {
  const { user, refreshUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${API_CONFIG.BACKEND_URL}/api/tasks`,
        { withCredentials: true }
      );
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTaskId(taskId);
    
    try {
      const response = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/tasks/complete`,
        { task_id: taskId },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Refresh user data and tasks list
        await refreshUser();
        await fetchTasks();
        
        // Show bonus celebration if unlocked
        if (response.data.bonus_unlocked && !user?.bonus_unlocked) {
          setTimeout(() => {
            toast.success('🎉 Congratulations! You unlocked your $2 USD bonus!', {
              duration: 5000
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to complete task';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to complete task');
    } finally {
      setCompletingTaskId(null);
    }
  };

  const getTaskTypeColor = (type) => {
    const colors = {
      survey: 'bg-blue-100 text-blue-700 border-blue-200',
      video: 'bg-purple-100 text-purple-700 border-purple-200',
      social: 'bg-pink-100 text-pink-700 border-pink-200',
      data_entry: 'bg-green-100 text-green-700 border-green-200',
      quiz: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTaskTypeLabel = (type) => {
    const labels = {
      survey: 'Survey',
      video: 'Video',
      social: 'Social Media',
      data_entry: 'Data Entry',
      quiz: 'Quiz'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Tasks</h1>
        <p className="text-gray-600 mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} available • Choose any task to start earning
        </p>
      </div>

      {/* Progress Alert */}
      {!user?.bonus_unlocked && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-yellow-800">
              🎯 Complete {Math.max(0, 5 - (user?.tasks_completed || 0))} more task{Math.max(0, 5 - (user?.tasks_completed || 0)) !== 1 ? 's' : ''} to unlock your $2 USD bonus!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All tasks completed!</h3>
            <p className="text-gray-600">Great job! Check back later for new tasks.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task._id} className="hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={`${getTaskTypeColor(task.task_type)} border`}>
                    {getTaskTypeLabel(task.task_type)}
                  </Badge>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <DollarSign className="w-4 h-4" />
                    {task.reward_amount.toFixed(2)}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{task.title}</CardTitle>
                <CardDescription className="text-sm">{task.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {task.estimated_time} min
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">≈ ₱{(task.reward_amount * 55).toFixed(0)}</span>
                  </div>
                </div>

                {/* Task-specific links */}
                {task.survey_url && (
                  <a 
                    href={task.survey_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 mb-3 flex items-center gap-1"
                  >
                    Open Survey <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {task.video_url && (
                  <a 
                    href={task.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 mb-3 flex items-center gap-1"
                  >
                    Watch Video <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {task.social_url && (
                  <a 
                    href={task.social_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 mb-3 flex items-center gap-1"
                  >
                    Open {task.social_platform} <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <Button
                  onClick={() => handleCompleteTask(task._id)}
                  disabled={completingTaskId === task._id}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {completingTaskId === task._id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
