'use client';

import { useState, useEffect } from 'react';

interface Task {
    _id: string;
    date: string;
    companyName: string;
    description: string;
    isCompleted: boolean;
}

interface CalendarProps {
    onDateSelect: (date: Date, tasks: Task[]) => void;
    onMonthChange?: (date: Date) => void;
    tasks: Task[];
}

export default function Calendar({ onDateSelect, onMonthChange, tasks }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Monday = 0, Sunday = 6
        let startingDay = firstDay.getDay() - 1;
        if (startingDay < 0) startingDay = 6;

        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        setCurrentDate(newDate);
        onMonthChange?.(newDate);
    };

    const nextMonth = () => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        setCurrentDate(newDate);
        onMonthChange?.(newDate);
    };

    const getTasksForDay = (day: number) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            .toISOString().split('T')[0];
        return tasks.filter(task => {
            const taskDate = new Date(task.date).toISOString().split('T')[0];
            return taskDate === dateStr;
        });
    };

    const handleDayClick = (day: number) => {
        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayTasks = getTasksForDay(day);
        onDateSelect(selectedDate, dayTasks);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        );
    };

    const renderDays = () => {
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayTasks = getTasksForDay(day);
            const hasCompletedTasks = dayTasks.some(t => t.isCompleted);
            const hasPendingTasks = dayTasks.some(t => !t.isCompleted);

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday(day) ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                    onClick={() => handleDayClick(day)}
                >
                    <span className="day-number">{day}</span>
                    {dayTasks.length > 0 && (
                        <div className="task-indicators">
                            {hasPendingTasks && <span className="indicator pending"></span>}
                            {hasCompletedTasks && <span className="indicator completed"></span>}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button className="nav-btn" onClick={prevMonth}>‹</button>
                <h3 className="month-title">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button className="nav-btn" onClick={nextMonth}>›</button>
            </div>

            <div className="calendar-weekdays">
                {dayNames.map(day => (
                    <div key={day} className="weekday">{day}</div>
                ))}
            </div>

            <div className="calendar-grid">
                {renderDays()}
            </div>

            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="indicator pending"></span>
                    <span>Bekleyen</span>
                </div>
                <div className="legend-item">
                    <span className="indicator completed"></span>
                    <span>Tamamlanan</span>
                </div>
            </div>
        </div>
    );
}
