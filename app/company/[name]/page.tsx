'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TaskModal from '@/components/TaskModal';

interface Task {
    _id: string;
    date: string;
    companyName: string;
    description: string;
    isCompleted: boolean;
}

export default function CompanyVisitsPage({ params }: { params: Promise<{ name: string }> }) {
    const resolvedParams = use(params);
    const companyName = decodeURIComponent(resolvedParams.name);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [visits, setVisits] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchVisits();
        }
    }, [session]);

    const fetchVisits = async () => {
        try {
            const response = await fetch(`/api/companies/${encodeURIComponent(companyName)}`);
            const data = await response.json();
            if (response.ok) {
                setVisits(data.visits);
            }
        } catch (error) {
            console.error('Error fetching visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setModalOpen(true);
    };

    const handleTaskUpdate = async (id: string, updates: Partial<Task>) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (response.ok) {
                fetchVisits();
                if (selectedTask && selectedTask._id === id) {
                    setSelectedTask({ ...selectedTask, ...updates });
                }
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleTaskDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchVisits();
                setModalOpen(false);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="auth-container">
                <div className="spinner-custom" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="dashboard-container">
            <nav className="dashboard-navbar">
                <div className="navbar-content">
                    <button className="back-btn" onClick={() => router.push('/dashboard')}>
                        ‹ Geri
                    </button>
                    <span className="navbar-brand">{companyName}</span>
                    <div style={{ width: '60px' }}></div>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="visits-header">
                    <h2>{visits.length} Ziyaret</h2>
                </div>

                <div className="visits-list">
                    {visits.map((visit) => (
                        <div
                            key={visit._id}
                            className={`visit-item ${visit.isCompleted ? 'completed' : ''}`}
                            onClick={() => handleTaskClick(visit)}
                        >
                            <div className="visit-date">{formatDate(visit.date)}</div>
                            <div className="visit-description">{visit.description}</div>
                            <div className="visit-status">
                                <span className={`status-badge ${visit.isCompleted ? 'completed' : 'pending'}`}>
                                    {visit.isCompleted ? '✓ Tamamlandı' : '⏳ Bekliyor'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedTask && (
                <TaskModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    selectedDate={new Date(selectedTask.date)}
                    tasks={[selectedTask]}
                    onTaskCreate={() => { }}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                />
            )}
        </div>
    );
}
