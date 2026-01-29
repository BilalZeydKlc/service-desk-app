'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import TaskModal from '@/components/TaskModal';
import SearchBox from '@/components/SearchBox';
import CompaniesModal from '@/components/CompaniesModal';

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
    const [companiesModalOpen, setCompaniesModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [totalCompanies, setTotalCompanies] = useState(0);

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

    const fetchCompanyCount = useCallback(async () => {
        try {
            const response = await fetch('/api/companies');
            const data = await response.json();
            if (response.ok) {
                setTotalCompanies(data.totalCompanies);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchTasks();
            fetchCompanyCount();
        }
    }, [session, fetchTasks, fetchCompanyCount]);

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

    const handleSearchSelect = (task: Task) => {
        setSelectedDate(new Date(task.date));
        setSelectedTasks([task]);
        setModalOpen(true);
    };

    const handleCompanySelect = (companyName: string) => {
        setCompaniesModalOpen(false);
        router.push(`/company/${encodeURIComponent(companyName)}`);
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
                fetchCompanyCount();
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
                fetchCompanyCount();
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
                <div className="navbar-content">
                    <span className="navbar-brand">Service Desk</span>
                    <button className="btn-logout" onClick={handleLogout}>
                        Çıkış
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <SearchBox onTaskSelect={handleSearchSelect} />

                <div className="stats-grid-small">
                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-value">{pendingTasks}</div>
                        <div className="stat-label">Bekleyen</div>
                    </div>

                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{completedTasks}</div>
                        <div className="stat-label">Tamamlanan</div>
                    </div>

                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">📅</div>
                        <div className="stat-value">{totalTasks}</div>
                        <div className="stat-label">Toplam</div>
                    </div>

                    <div
                        className="dashboard-card stat-card-small clickable"
                        onClick={() => setCompaniesModalOpen(true)}
                    >
                        <div className="stat-icon">🏢</div>
                        <div className="stat-value">{totalCompanies}</div>
                        <div className="stat-label">Firma</div>
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

            <CompaniesModal
                isOpen={companiesModalOpen}
                onClose={() => setCompaniesModalOpen(false)}
                onCompanySelect={handleCompanySelect}
            />
        </div>
    );
}
