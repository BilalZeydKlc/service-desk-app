'use client';

import { useState, useEffect, useRef } from 'react';

interface Task {
    _id: string;
    date: string;
    companyName: string;
    description: string;
    isCompleted: boolean;
}

interface SearchBoxProps {
    onTaskSelect: (task: Task) => void;
}

export default function SearchBox({ onTaskSelect }: SearchBoxProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Task[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchTasks = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(`/api/tasks/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (response.ok) {
                    setResults(data.tasks);
                    setIsOpen(data.tasks.length > 0);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchTasks, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const handleSelect = (task: Task) => {
        onTaskSelect(task);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className="search-container" ref={containerRef}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Firma adı ile ara..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                />
                {loading && <span className="search-spinner"></span>}
            </div>

            {isOpen && results.length > 0 && (
                <div className="search-results">
                    {results.map((task) => (
                        <div
                            key={task._id}
                            className={`search-result-item ${task.isCompleted ? 'completed' : ''}`}
                            onClick={() => handleSelect(task)}
                        >
                            <div className="result-company">{task.companyName}</div>
                            <div className="result-meta">
                                <span className="result-date">{formatDate(task.date)}</span>
                                <span className={`result-status ${task.isCompleted ? 'done' : 'pending'}`}>
                                    {task.isCompleted ? '✓' : '⏳'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
