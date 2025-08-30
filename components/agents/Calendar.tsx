import React, { useState, useMemo } from 'react';
import { AgentComponentProps } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '../../assets/icons';

const CalendarAgent: React.FC<AgentComponentProps> = ({ instance, updateState }) => {
  const { events, viewDate: viewDateISO } = instance.state;
  const [viewDate, setViewDate] = useState(new Date(viewDateISO));
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [newEventText, setNewEventText] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00');

  const { month, year, daysInMonth, firstDayOfMonth } = useMemo(() => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { month, year, daysInMonth, firstDayOfMonth };
  }, [viewDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate.setMonth(viewDate.getMonth() + delta));
    setViewDate(newDate);
    updateState({ ...instance.state, viewDate: newDate.toISOString() });
  };
  
  const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];

  const selectedDateString = getFormattedDate(selectedDate);
  const eventsForSelectedDay = useMemo(() => {
      return (events[selectedDateString] || []).sort((a: any, b: any) => a.time.localeCompare(b.time));
  }, [events, selectedDateString]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventText.trim()) return;
    
    const newEvent = { time: newEventTime, text: newEventText.trim() };
    const updatedEventsForDay = [...(events[selectedDateString] || []), newEvent];
    
    updateState({
        ...instance.state,
        events: { ...events, [selectedDateString]: updatedEventsForDay }
    });

    setNewEventText('');
    setNewEventTime('12:00');
  };
  
  const handleDeleteEvent = (index: number) => {
      const updatedEventsForDay = [...eventsForSelectedDay];
      updatedEventsForDay.splice(index, 1);
      updateState({
        ...instance.state,
        events: { ...events, [selectedDateString]: updatedEventsForDay }
    });
  }

  const today = new Date();
  
  return (
    <div className="w-full h-full flex flex-col md:flex-row -m-4 bg-gray-50 dark:bg-gray-900">
      {/* Calendar View */}
      <div className="w-full md:w-2/3 p-4 flex flex-col">
        <header className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200"><ChevronLeftIcon className="w-6 h-6" /></button>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{year}年 {month + 1}月</h2>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200"><ChevronRightIcon className="w-6 h-6" /></button>
        </header>
        <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-grow">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, day) => {
            const date = new Date(year, month, day + 1);
            const dateStr = getFormattedDate(date);
            const isToday = getFormattedDate(today) === dateStr;
            const isSelected = selectedDateString === dateStr;
            const hasEvents = events[dateStr] && events[dateStr].length > 0;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`p-2 h-16 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors border-2 dark:text-gray-200 ${
                  isSelected ? 'bg-blue-500 border-blue-600 text-white' : 
                  isToday ? 'bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800/50' : 'border-transparent hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="font-medium">{day + 1}</span>
                {hasEvents && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Event Details View */}
      <div className="w-full md:w-1/3 p-4 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b dark:border-gray-600">
            {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </h3>
        <div className="flex-grow overflow-y-auto mb-4">
            {eventsForSelectedDay.length > 0 ? (
                <ul className="space-y-3">
                    {eventsForSelectedDay.map((event: any, index: number) => (
                        <li key={index} className="flex items-start p-2 rounded-md bg-gray-100 dark:bg-gray-700/60">
                           <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-16">{event.time}</span>
                           <p className="flex-grow text-sm text-gray-700 dark:text-gray-300">{event.text}</p>
                           <button onClick={() => handleDeleteEvent(index)} className="ml-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-8">该日无日程。</p>
            )}
        </div>
         <form onSubmit={handleAddEvent} className="flex-shrink-0">
            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">添加新日程</h4>
             <input
                type="text"
                value={newEventText}
                onChange={(e) => setNewEventText(e.target.value)}
                placeholder="日程内容..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-2 dark:text-gray-200"
            />
            <div className="flex items-center gap-2">
                 <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="flex-shrink-0 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-gray-200"
                />
                <button type="submit" className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    添加
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarAgent;