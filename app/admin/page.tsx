'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';

interface UserStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalCompanies: number;
    lastActivity: string | null;
}

interface AdminUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
    stats: UserStats;
}

interface Task {
    _id: string;
    date: string;
    companyName: string;
    description: string;
    isCompleted: boolean;
    createdAt: string;
}

interface Company {
    companyName: string;
    visitCount: number;
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userTasks, setUserTasks] = useState<Task[]>([]);
    const [userCompanies, setUserCompanies] = useState<Company[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'tasks' | 'companies'>('tasks');

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            } else if (response.status === 403) {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const fetchUserDetails = useCallback(async (userId: string) => {
        setDetailLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${userId}/tasks`);
            const data = await response.json();
            if (response.ok) {
                setUserTasks(data.tasks);
                setUserCompanies(data.companies);
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        } else if (status === 'authenticated') {
            if ((session?.user as any)?.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchUsers();
            }
        }
    }, [status, session, router, fetchUsers]);

    const handleUserSelect = (user: AdminUser) => {
        setSelectedUser(user);
        setActiveTab('tasks');
        fetchUserDetails(user._id);
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (status === 'loading' || loading) {
        return (
            <div className="auth-container">
                <div className="spinner-custom" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!session || (session.user as any)?.role !== 'admin') {
        return null;
    }

    return (
        <div className="dashboard-container">
            <nav className="dashboard-navbar">
                <div className="navbar-content">
                    <span className="navbar-brand">
                        <span style={{ marginRight: '8px' }}>🛡️</span>
                        Admin Panel
                    </span>
                    <div className="navbar-actions">
                        <button
                            className="btn-theme"
                            onClick={() => router.push('/dashboard')}
                            title="Dashboard'a Dön"
                            style={{ fontSize: '14px', padding: '6px 12px' }}
                        >
                            📊 Dashboard
                        </button>
                        <button className="btn-theme" onClick={toggleTheme} title={theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}>
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <button className="btn-logout" onClick={handleLogout}>
                            Çıkış
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-content">
                {/* Genel İstatistikler */}
                <div className="stats-grid-small">
                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{users.length}</div>
                        <div className="stat-label">Toplam Kullanıcı</div>
                    </div>
                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">📋</div>
                        <div className="stat-value">{users.reduce((sum, u) => sum + u.stats.totalTasks, 0)}</div>
                        <div className="stat-label">Toplam Görev</div>
                    </div>
                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{users.reduce((sum, u) => sum + u.stats.completedTasks, 0)}</div>
                        <div className="stat-label">Tamamlanan</div>
                    </div>
                    <div className="dashboard-card stat-card-small">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-value">{users.reduce((sum, u) => sum + u.stats.totalCompanies, 0)}</div>
                        <div className="stat-label">Toplam Firma</div>
                    </div>
                </div>

                {/* Kullanıcı Listesi */}
                <div className="dashboard-card" style={{ marginTop: '16px' }}>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                        👥 Kayıtlı Kullanıcılar
                    </h2>
                    <div className="admin-users-list">
                        {users.map((user) => (
                            <div
                                key={user._id}
                                className={`admin-user-card ${selectedUser?._id === user._id ? 'active' : ''}`}
                                onClick={() => handleUserSelect(user)}
                            >
                                <div className="admin-user-info">
                                    <div className="admin-user-avatar">
                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                    </div>
                                    <div className="admin-user-details">
                                        <div className="admin-user-name">
                                            {user.firstName} {user.lastName}
                                            {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                                        </div>
                                        <div className="admin-user-email">{user.email}</div>
                                        <div className="admin-user-meta">
                                            Kayıt: {formatDate(user.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-user-stats">
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-number">{user.stats.totalTasks}</span>
                                        <span className="admin-stat-desc">Görev</span>
                                    </div>
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-number">{user.stats.completedTasks}</span>
                                        <span className="admin-stat-desc">Tamamlanan</span>
                                    </div>
                                    <div className="admin-stat-item">
                                        <span className="admin-stat-number">{user.stats.totalCompanies}</span>
                                        <span className="admin-stat-desc">Firma</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kullanıcı Detay */}
                {selectedUser && (
                    <div className="dashboard-card" style={{ marginTop: '16px' }}>
                        <div className="admin-detail-header">
                            <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>
                                📋 {selectedUser.firstName} {selectedUser.lastName} - Detay
                            </h2>
                            <button
                                className="btn-theme"
                                onClick={() => setSelectedUser(null)}
                                style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                                ✕ Kapat
                            </button>
                        </div>

                        {/* Tab Buttons */}
                        <div className="admin-tabs">
                            <button
                                className={`admin-tab ${activeTab === 'tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tasks')}
                            >
                                📋 Görevler ({userTasks.length})
                            </button>
                            <button
                                className={`admin-tab ${activeTab === 'companies' ? 'active' : ''}`}
                                onClick={() => setActiveTab('companies')}
                            >
                                🏢 Firmalar ({userCompanies.length})
                            </button>
                        </div>

                        {detailLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                                <div className="spinner-custom" style={{ width: '30px', height: '30px' }}></div>
                            </div>
                        ) : (
                            <>
                                {/* Görevler Tab */}
                                {activeTab === 'tasks' && (
                                    <div className="admin-tasks-list">
                                        {userTasks.length === 0 ? (
                                            <p style={{ textAlign: 'center', opacity: 0.6, padding: '24px' }}>
                                                Bu kullanıcının henüz görevi yok
                                            </p>
                                        ) : (
                                            userTasks.map((task) => (
                                                <div key={task._id} className={`admin-task-item ${task.isCompleted ? 'completed' : ''}`}>
                                                    <div className="admin-task-status">
                                                        {task.isCompleted ? '✅' : '⏳'}
                                                    </div>
                                                    <div className="admin-task-content">
                                                        <div className="admin-task-company">{task.companyName}</div>
                                                        <div className="admin-task-desc">{task.description}</div>
                                                        <div className="admin-task-date">{formatDate(task.date)}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Firmalar Tab */}
                                {activeTab === 'companies' && (
                                    <div className="admin-companies-list">
                                        {userCompanies.length === 0 ? (
                                            <p style={{ textAlign: 'center', opacity: 0.6, padding: '24px' }}>
                                                Bu kullanıcının henüz ziyaret ettiği firma yok
                                            </p>
                                        ) : (
                                            userCompanies.map((company) => (
                                                <div key={company.companyName} className="admin-company-item">
                                                    <div className="admin-company-name">🏢 {company.companyName}</div>
                                                    <div className="admin-company-count">{company.visitCount} ziyaret</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
