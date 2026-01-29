'use client';

import { useState, useEffect } from 'react';

interface Company {
    companyName: string;
    visitCount: number;
    lastVisit: string;
}

interface CompaniesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCompanySelect: (companyName: string) => void;
}

export default function CompaniesModal({ isOpen, onClose, onCompanySelect }: CompaniesModalProps) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchCompanies();
        }
    }, [isOpen]);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/companies');
            const data = await response.json();
            if (response.ok) {
                setCompanies(data.companies);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content companies-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h4>Firma Ziyaretleri</h4>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner-custom"></div>
                        </div>
                    ) : companies.length === 0 ? (
                        <p className="no-tasks">Henüz kayıtlı firma bulunmuyor.</p>
                    ) : (
                        <div className="companies-list">
                            {companies.map((company) => (
                                <div
                                    key={company.companyName}
                                    className="company-item"
                                    onClick={() => onCompanySelect(company.companyName)}
                                >
                                    <div className="company-info">
                                        <span className="company-name">{company.companyName}</span>
                                    </div>
                                    <div className="company-stats">
                                        <span className="visit-count">{company.visitCount} ziyaret</span>
                                        <span className="arrow">›</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
