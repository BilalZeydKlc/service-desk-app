'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return 'Şifre en az 8 karakter olmalıdır';
        }
        const numberCount = (password.match(/\d/g) || []).length;
        if (numberCount < 2) {
            return 'Şifre en az 2 rakam içermelidir';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Kayıt yapılırken bir hata oluştu');
                return;
            }

            // Auto login after successful registration
            const signInResult = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (signInResult?.error) {
                setError('Kayıt başarılı, ancak giriş yapılırken hata oluştu');
                router.push('/');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('Kayıt yapılırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Kayıt Ol</h1>
                <p className="subtitle">Yeni hesap oluşturun</p>

                {error && <div className="alert-custom">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-floating">
                        <input
                            type="text"
                            className="form-control"
                            id="firstName"
                            name="firstName"
                            placeholder="Ad"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="firstName">Ad</label>
                    </div>

                    <div className="form-floating">
                        <input
                            type="text"
                            className="form-control"
                            id="lastName"
                            name="lastName"
                            placeholder="Soyad"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="lastName">Soyad</label>
                    </div>

                    <div className="form-floating">
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            placeholder="E-mail"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="email">E-mail</label>
                    </div>

                    <div className="form-floating">
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            name="password"
                            placeholder="Şifre"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <label htmlFor="password">Şifre</label>
                    </div>
                    <p className="password-hint">
                        En az 8 karakter ve 2 rakam içermelidir
                    </p>

                    <button
                        type="submit"
                        className="btn-primary-custom"
                        disabled={loading}
                    >
                        {loading && <span className="spinner-custom"></span>}
                        {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div className="divider">
                    <span>veya</span>
                </div>

                <div className="text-center">
                    <Link href="/" className="btn-link-custom">
                        Zaten hesabınız var mı? <span>Giriş Yap</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
