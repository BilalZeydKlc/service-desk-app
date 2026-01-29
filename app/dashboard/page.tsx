'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="auth-container">
                <div className="spinner-custom" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

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
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="dashboard-card welcome-card">
                                <h2>Hoş Geldiniz, {session.user?.name?.split(' ')[0]}! 👋</h2>
                                <p className="mb-0 opacity-75">
                                    Service Desk yönetim panelinize başarıyla giriş yaptınız.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-4">
                            <div className="dashboard-card stat-card">
                                <div className="icon">📊</div>
                                <div className="value">0</div>
                                <div className="label">Açık Talepler</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="dashboard-card stat-card">
                                <div className="icon">✅</div>
                                <div className="value">0</div>
                                <div className="label">Çözülen Talepler</div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="dashboard-card stat-card">
                                <div className="icon">⏳</div>
                                <div className="value">0</div>
                                <div className="label">Bekleyen Talepler</div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="dashboard-card">
                                <h5 className="mb-3">Hızlı Bilgiler</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <p className="text-secondary mb-2">
                                            <strong>E-mail:</strong> {session.user?.email}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <p className="text-secondary mb-2">
                                            <strong>Hesap Durumu:</strong>{' '}
                                            <span className="text-success">Aktif</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
