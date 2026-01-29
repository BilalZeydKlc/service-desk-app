'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import TaskModal from '@/components/TaskModal';

interface Task {
    _id: string;
    date: string;
    companyName: string;
    description: string;
    isCompleted: boolean;
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchTasks = useCallback(async () => {
        try {
            const month = currentMonth.getMonth() + 1;
            const year = currentMonth.getFullYear();
            const response = await fetch(`/api/tasks?month=${month}&year=${year}`);
            const data = await response.json();
            if (response.ok) {
                setTasks(data.tasks);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchTasks();
        }
    }, [session, fetchTasks]);

    if (status === 'loading' || loading) {
        return (
            <div className="auth-container">
                <div className="spinner-custom" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const handleDateSelect = (date: Date, dayTasks: Task[]) => {
        setSelectedDate(date);
        setSelectedTasks(dayTasks);
        setModalOpen(true);
    };

    const handleTaskCreate = async (taskData: Omit<Task, '_id'>) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (response.ok) {
                fetchTasks();
                // Update selected tasks
                const data = await response.json();
                setSelectedTasks(prev => [...prev, data.task]);
            }
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const handleTaskUpdate = async (id: string, updates: Partial<Task>) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                fetchTasks();
                // Update selected tasks
                setSelectedTasks(prev =>
                    prev.map(task => task._id === id ? { ...task, ...updates } : task)
                );
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleTaskDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchTasks();
                // Update selected tasks
                setSelectedTasks(prev => prev.filter(task => task._id !== id));
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;
    const pendingTasks = totalTasks - completedTasks;

    return (
        <div className="dashboard-container">
            <nav className="dashboard-navbar">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <span className="navbar-brand">Service Desk</span>
                    <div className="d-flex align-items-center gap-3">
                        <span className="text-secondary">{session.user?.name}</span>
                        <button className="btn-logout" onClick={handleLogout}>
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="dashboard-card welcome-card">
                    <h2>Hoş Geldiniz! 👋</h2>
                    <p className="mb-0 opacity-75">
                        {session.user?.name?.split(' ')[0]}
                    </p>
                </div>

                <div className="stats-grid">
                    <div className="dashboard-card stat-card">
                        <div className="icon">📊</div>
                        <div className="value">{pendingTasks}</div>
                        <div className="label">Bekleyen</div>
                    </div>

                    <div className="dashboard-card stat-card">
                        <div className="icon">✅</div>
                        <div className="value">{completedTasks}</div>
                        <div className="label">Tamamlanan</div>
                    </div>

                    <div className="dashboard-card stat-card">
                        <div className="icon">📅</div>
                        <div className="value">{totalTasks}</div>
                        <div className="label">Toplam</div>
                    </div>
                </div>

                <div className="dashboard-card">
                    <Calendar onDateSelect={handleDateSelect} tasks={tasks} />
                </div>
            </div>

            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                selectedDate={selectedDate}
                tasks={selectedTasks}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
            />
        </div>
    );
}
