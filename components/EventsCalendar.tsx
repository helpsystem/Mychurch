import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, MapPin, Clock, Users, Tag } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface Event {
  id: string;
  title: {
    en: string;
    fa: string;
  };
  description: {
    en: string;
    fa: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: 'service' | 'prayer' | 'study' | 'fellowship' | 'outreach' | 'special';
  attendees?: number;
  maxAttendees?: number;
  color: string;
  recurring?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

interface CalendarProps {
  isAdmin?: boolean;
  onEventClick?: (event: Event) => void;
  onCreateEvent?: () => void;
}

const EventsCalendar: React.FC<CalendarProps> = ({ 
  isAdmin = false, 
  onEventClick,
  onCreateEvent 
}) => {
  const { lang, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Get events for current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(`/api/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      // Mock data for demonstration
      setEvents([
        {
          id: '1',
          title: {
            en: 'Sunday Service',
            fa: 'مراسم یکشنبه'
          },
          description: {
            en: 'Weekly worship service with communion',
            fa: 'مراسم عبادت هفتگی با عشای ربانی'
          },
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '12:00',
          location: 'Main Sanctuary',
          category: 'service',
          attendees: 150,
          maxAttendees: 200,
          color: '#3B82F6',
          recurring: {
            type: 'weekly',
            interval: 1
          }
        },
        {
          id: '2',
          title: {
            en: 'Prayer Meeting',
            fa: 'جلسه دعا'
          },
          description: {
            en: 'Community prayer and intercession time',
            fa: 'زمان دعا و شفاعت جامعه'
          },
          date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          startTime: '19:00',
          endTime: '20:30',
          location: 'Prayer Room',
          category: 'prayer',
          attendees: 45,
          color: '#10B981'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'service': return '⛪';
      case 'prayer': return '🙏';
      case 'study': return '📖';
      case 'fellowship': return '🤝';
      case 'outreach': return '🌍';
      case 'special': return '✨';
      default: return '📅';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'service': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'prayer': return 'bg-green-100 text-green-800 border-green-200';
      case 'study': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fellowship': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'outreach': return 'bg-red-100 text-red-800 border-red-200';
      case 'special': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = lang === 'fa' 
    ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-lg">
          {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-indigo-600" />
              {lang === 'fa' ? 'تقویم رویدادها' : 'Events Calendar'}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {lang === 'fa' ? 'امروز' : 'Today'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onCreateEvent}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {lang === 'fa' ? 'رویداد جدید' : 'New Event'}
              </button>
            )}
            
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm rounded ${view === 'month' ? 'bg-white shadow-sm' : ''}`}
              >
                {lang === 'fa' ? 'ماه' : 'Month'}
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm rounded ${view === 'week' ? 'bg-white shadow-sm' : ''}`}
              >
                {lang === 'fa' ? 'هفته' : 'Week'}
              </button>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-semibold text-gray-800">
            {formatDate(currentDate)}
          </h3>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day && day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border border-gray-100 rounded-lg relative
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isToday ? 'ring-2 ring-indigo-500' : ''}
                  ${day ? 'hover:bg-gray-50 cursor-pointer' : ''}
                `}
              >
                {day && (
                  <>
                    <div className={`
                      text-sm font-medium mb-1
                      ${isToday ? 'text-indigo-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {day.getDate()}
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                          title={event.title[lang] || event.title.en}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{getCategoryIcon(event.category)}</span>
                            <span className="truncate font-medium">
                              {event.title[lang] || event.title.en}
                            </span>
                          </div>
                          <div className="text-xs opacity-75">
                            {event.startTime}
                          </div>
                        </div>
                      ))}
                      
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 2} {lang === 'fa' ? 'رویداد دیگر' : 'more'}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(selectedEvent.category)}</span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedEvent.title[lang] || selectedEvent.title.en}
                    </h3>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(selectedEvent.category)}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {selectedEvent.category}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                {selectedEvent.description[lang] || selectedEvent.description.en}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{selectedEvent.location}</span>
                </div>
                
                {selectedEvent.attendees && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span>
                      {selectedEvent.attendees}
                      {selectedEvent.maxAttendees && ` / ${selectedEvent.maxAttendees}`}
                      {lang === 'fa' ? ' شرکت‌کننده' : ' attendees'}
                    </span>
                  </div>
                )}
              </div>

              {selectedEvent.recurring && selectedEvent.recurring.type !== 'none' && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{lang === 'fa' ? 'رویداد تکراری:' : 'Recurring Event:'}</strong>
                    {' '}
                    {lang === 'fa' ? 
                      `هر ${selectedEvent.recurring.interval} ${selectedEvent.recurring.type === 'weekly' ? 'هفته' : selectedEvent.recurring.type === 'monthly' ? 'ماه' : 'سال'}` :
                      `Every ${selectedEvent.recurring.interval} ${selectedEvent.recurring.type}`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;