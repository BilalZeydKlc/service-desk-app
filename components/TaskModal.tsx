'use client';

import { useState, useEffect, useRef } from 'react';

interface Task {
    _id: string;
    date: string;
    companyName: string;
    description: string;
    isCompleted: boolean;
}

interface Company {
    companyName: string;
    visitCount: number;
}

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    tasks: Task[];
    onTaskCreate: (task: Omit<Task, '_id'>) => void;
    onTaskUpdate: (id: string, task: Partial<Task>) => void;
    onTaskDelete: (id: string) => void;
}

export default function TaskModal({
    isOpen,
    onClose,
    selectedDate,
    tasks,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
}: TaskModalProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        companyName: '',
        description: '',
        isCompleted: false,
    });

    // Autocomplete state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isCompanyInputFocused, setIsCompanyInputFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Fetch companies when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCompanies();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setIsAdding(false);
            setEditingId(null);
            setFormData({ companyName: '', description: '', isCompleted: false });
            setShowSuggestions(false);
            setIsCompanyInputFocused(false);
        }
    }, [isOpen]);

    // Filter companies based on input - only show when input is focused
    useEffect(() => {
        if (isCompanyInputFocused && formData.companyName.length >= 1) {
            const filtered = companies.filter(c =>
                c.companyName.toLowerCase().includes(formData.companyName.toLowerCase())
            );
            setFilteredCompanies(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setFilteredCompanies([]);
            setShowSuggestions(false);
        }
    }, [formData.companyName, companies, isCompanyInputFocused]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await fetch('/api/companies');
            const data = await response.json();
            if (response.ok) {
                setCompanies(data.companies);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    if (!isOpen || !selectedDate) return null;

    const formatDate = (date: Date) => {
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${days[date.getDay()]}`;
    };

    const handleCompanySelect = (companyName: string) => {
        setFormData({ ...formData, companyName });
        setShowSuggestions(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName || !formData.description) return;

        if (editingId) {
            onTaskUpdate(editingId, formData);
            setEditingId(null);
        } else {
            onTaskCreate({
                date: selectedDate.toISOString(),
                ...formData,
            });
            setIsAdding(false);
        }

        setFormData({ companyName: '', description: '', isCompleted: false });
        setShowSuggestions(false);
    };

    const startEdit = (task: Task) => {
        setEditingId(task._id);
        setFormData({
            companyName: task.companyName,
            description: task.description,
            isCompleted: task.isCompleted,
        });
        setIsAdding(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setFormData({ companyName: '', description: '', isCompleted: false });
        setShowSuggestions(false);
    };

    const CompanyInput = ({ id }: { id: string }) => (
        <div className="company-input-wrapper">
            <input
                ref={inputRef}
                type="text"
                placeholder="Firma Adı"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                onFocus={() => setIsCompanyInputFocused(true)}
                onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setIsCompanyInputFocused(false), 200);
                }}
                className="form-control mb-2"
                required
                autoComplete="off"
                autoFocus={id === 'new'}
            />
            {showSuggestions && filteredCompanies.length > 0 && (
                <div className="company-suggestions" ref={suggestionsRef}>
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.companyName}
                            className="suggestion-item"
                            onClick={() => handleCompanySelect(company.companyName)}
                        >
                            <span className="suggestion-name">{company.companyName}</span>
                            <span className="suggestion-count">{company.visitCount} ziyaret</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h4>{formatDate(selectedDate)}</h4>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {tasks.length === 0 && !isAdding && (
                        <p className="no-tasks">Bu gün için kayıtlı iş bulunmuyor.</p>
                    )}

                    {tasks.map(task => (
                        <div key={task._id} className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
                            {editingId === task._id ? (
                                <form onSubmit={handleSubmit} className="task-form">
                                    <CompanyInput id="edit" />
                                    <textarea
                                        placeholder="İş Açıklaması"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="form-control mb-2"
                                        rows={3}
                                        required
                                    />
                                    <div className="form-check mb-2">
                                        <input
                                            type="checkbox"
                                            id="isCompleted"
                                            checked={formData.isCompleted}
                                            onChange={e => setFormData({ ...formData, isCompleted: e.target.checked })}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="isCompleted" className="form-check-label">
                                            Tamamlandı
                                        </label>
                                    </div>
                                    <div className="form-buttons">
                                        <button type="submit" className="btn-save">Kaydet</button>
                                        <button type="button" className="btn-cancel" onClick={cancelEdit}>İptal</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="task-info">
                                        <h5>{task.companyName}</h5>
                                        <p>{task.description}</p>
                                        <span className={`status-badge ${task.isCompleted ? 'completed' : 'pending'}`}>
                                            {task.isCompleted ? '✓ Tamamlandı' : '⏳ Bekliyor'}
                                        </span>
                                    </div>
                                    <div className="task-actions">
                                        <button
                                            className="btn-toggle"
                                            onClick={() => onTaskUpdate(task._id, { isCompleted: !task.isCompleted })}
                                            title={task.isCompleted ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                                        >
                                            {task.isCompleted ? '↩' : '✓'}
                                        </button>
                                        <button className="btn-edit" onClick={() => startEdit(task)}>✎</button>
                                        <button className="btn-delete" onClick={() => onTaskDelete(task._id)}>🗑</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {isAdding && (
                        <form onSubmit={handleSubmit} className="task-form">
                            <CompanyInput id="new" />
                            <textarea
                                placeholder="İş Açıklaması"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="form-control mb-2"
                                rows={3}
                                required
                            />
                            <div className="form-check mb-2">
                                <input
                                    type="checkbox"
                                    id="newIsCompleted"
                                    checked={formData.isCompleted}
                                    onChange={e => setFormData({ ...formData, isCompleted: e.target.checked })}
                                    className="form-check-input"
                                />
                                <label htmlFor="newIsCompleted" className="form-check-label">
                                    Tamamlandı
                                </label>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="btn-save">Ekle</button>
                                <button type="button" className="btn-cancel" onClick={cancelEdit}>İptal</button>
                            </div>
                        </form>
                    )}
                </div>

                {!isAdding && !editingId && (
                    <div className="modal-footer">
                        <button className="btn-add-task" onClick={() => setIsAdding(true)}>
                            + Yeni İş Ekle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
