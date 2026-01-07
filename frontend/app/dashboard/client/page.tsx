'use client';

import { getTrainers, getAppointments, getCurrentUser, getNotifications, markNotificationRead } from '@/lib/store';
import { Trainer, Appointment, Notification } from '@/lib/types';
import { Calendar, User, ChevronLeft, ChevronRight, Settings, Plus, Trash2, X, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, isSameDay, parseISO } from 'date-fns';

import BookingModal from '@/components/BookingModal';

export default function ClientDashboardPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [myBookings, setMyBookings] = useState<Appointment[]>([]);
    const [bookingTrainer, setBookingTrainer] = useState<Trainer | null>(null);
    const [isManageDefaultsOpen, setIsManageDefaultsOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Calendar State
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    // Calendar Helpers
    const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    });
    const timeSlots = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm

    useEffect(() => {
        getTrainers().then(setTrainers);
        loadBookings();
        loadNotifications();
    }, []);

    const loadBookings = async () => {
        const user = getCurrentUser();
        if (!user) return;
        const allApps = await getAppointments();
        // Filter for current user and valid status
        const userApps = allApps.filter(a => a.client_email === user.email && a.status !== 'cancelled');
        // Sort by date desc
        userApps.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        setMyBookings(userApps);
    };

    const loadNotifications = async () => {
        const user = getCurrentUser();
        if (!user) return;
        const notifs = await getNotifications(user.id);
        setNotifications(notifs);
    };

    const handleReadNotification = async (id: number) => {
        await markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleBook = (trainer: Trainer) => {
        setBookingTrainer(trainer);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Find a Trainer</h1>
                    <p className="text-neutral-400 mt-2">Browse our expert coaches and book a session.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notifications Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="p-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg hover:bg-neutral-700 transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-neutral-900 transform translate-x-1/4 -translate-y-1/4"></span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
                                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                                    <span className="text-xs text-neutral-500">{unreadCount} unread</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-neutral-500 text-sm">No notifications</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`p-3 border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800/50 transition-colors ${!notif.is_read ? 'bg-blue-500/5' : ''}`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className={`text-sm ${!notif.is_read ? 'text-white' : 'text-neutral-400'}`}>
                                                        {notif.message}
                                                    </p>
                                                    {!notif.is_read && (
                                                        <button
                                                            onClick={() => handleReadNotification(notif.id)}
                                                            className="text-blue-500 hover:text-blue-400"
                                                            title="Mark as read"
                                                        >
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-neutral-600 mt-1">
                                                    {format(parseISO(notif.created_at), 'MMM d, h:mm a')}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsManageDefaultsOpen(true)}
                        className="px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <Settings className="w-4 h-4" />
                        Manage Defaults
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {trainers.map(trainer => (
                    <div key={trainer.id} className="bg-neutral-800/30 rounded-xl border border-neutral-800 p-6 flex gap-6">
                        <img
                            src={trainer.photo_url || 'https://via.placeholder.com/150'}
                            alt={trainer.name}
                            className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700"
                        />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">{trainer.name}</h3>
                            <p className="text-blue-400 font-medium mb-1">{trainer.role}</p>
                            <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{trainer.bio}</p>
                            <button
                                onClick={() => handleBook(trainer)}
                                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Book Session
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-neutral-800 pt-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">My Bookings</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                            <button onClick={() => setCurrentWeekStart(subDays(currentWeekStart, 7))} className="p-2 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-white px-2">
                                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
                            </span>
                            <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Grid Header */}
                        <div className="grid grid-cols-8 border-b border-neutral-800">
                            <div className="p-4 text-neutral-500 text-xs font-medium border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10 w-20">
                                Time
                            </div>
                            {weekDays.map((day, idx) => (
                                <div key={idx} className={`p-4 text-center border-r border-neutral-800 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-500/5' : ''}`}>
                                    <div className={`text-xs font-medium uppercase mb-1 ${isSameDay(day, new Date()) ? 'text-blue-500' : 'text-neutral-500'}`}>
                                        {format(day, 'EEE')}
                                    </div>
                                    <div className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-white'}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid Body */}
                        <div>
                            {timeSlots.map((hour) => (
                                <div key={hour} className="grid grid-cols-8 border-b border-neutral-800 last:border-b-0 min-h-[100px]">
                                    {/* Time Column */}
                                    <div className="p-2 text-right text-xs text-neutral-500 border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10 w-20">
                                        {hour}:00
                                    </div>

                                    {/* Day Columns */}
                                    {weekDays.map((day, dayIdx) => {
                                        // Find appointments for this day and hour
                                        const slotAppts = myBookings.filter(appt => {
                                            const apptDate = parseISO(appt.start_time);
                                            return isSameDay(apptDate, day) && apptDate.getHours() === hour;
                                        });

                                        return (
                                            <div key={dayIdx} className={`p-1 border-r border-neutral-800 last:border-r-0 relative group ${isSameDay(day, new Date()) ? 'bg-blue-500/5' : ''}`}>
                                                {slotAppts.map((appt) => {
                                                    const trainer = trainers.find(t => t.id === appt.trainer_id);
                                                    return (
                                                        <div
                                                            key={appt.id}
                                                            className="mb-1 p-2 rounded-md bg-neutral-800 border border-neutral-700 hover:border-blue-500 text-xs cursor-pointer transition-colors group/card"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-semibold text-blue-400">
                                                                    {trainer?.name.split(' ')[0]}
                                                                </span>
                                                                <span className={`text-[10px] uppercase font-bold px-1 rounded ${appt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    {appt.status}
                                                                </span>
                                                            </div>
                                                            <div className="text-neutral-400 mt-1">
                                                                {trainer?.specialty}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Defaults Management Modal */}
            <DefaultScheduleModal
                isOpen={isManageDefaultsOpen}
                onClose={() => setIsManageDefaultsOpen(false)}
            />

            <BookingModal
                isOpen={!!bookingTrainer}
                trainer={bookingTrainer}
                onClose={() => {
                    setBookingTrainer(null);
                    loadBookings(); // Refresh list after booking
                }}
            />
        </div>
    );
}

function DefaultScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const user = getCurrentUser();
    const [slots, setSlots] = useState<{ day_of_week: number; start_time: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setSlots(user.default_slots || []);
        }
    }, [isOpen, user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        // Import dynamically to avoid circular dep issues in this snippet if generic
        const { updateClientDefaults } = await import('@/lib/store');
        await updateClientDefaults(user.id, slots);
        setIsSaving(false);
        onClose();
        // Force reload or state update handled by store update mostly
        window.location.reload(); // Simple refresh to show new state
    };

    const addSlot = () => {
        setSlots([...slots, { day_of_week: 1, start_time: '09:00' }]);
    };

    const removeSlot = (idx: number) => {
        const newSlots = [...slots];
        newSlots.splice(idx, 1);
        setSlots(newSlots);
    };

    const updateSlot = (idx: number, field: 'day_of_week' | 'start_time', value: any) => {
        const newSlots = [...slots];
        newSlots[idx] = { ...newSlots[idx], [field]: value };
        setSlots(newSlots);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Manage Default Schedule</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-sm text-neutral-400">
                        Set your preferred weekly training times. The Auto-Scheduler will try to book these for you automatically.
                    </p>

                    {slots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <select
                                value={slot.day_of_week}
                                onChange={(e) => updateSlot(idx, 'day_of_week', parseInt(e.target.value))}
                                className="bg-neutral-800 border border-neutral-700 text-white rounded p-2 text-sm flex-1"
                            >
                                <option value={0}>Monday</option>
                                <option value={1}>Tuesday</option>
                                <option value={2}>Wednesday</option>
                                <option value={3}>Thursday</option>
                                <option value={4}>Friday</option>
                                <option value={5}>Saturday</option>
                                <option value={6}>Sunday</option>
                            </select>
                            <select
                                value={slot.start_time}
                                onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                                className="bg-neutral-800 border border-neutral-700 text-white rounded p-2 text-sm w-24"
                            >
                                {Array.from({ length: 14 }, (_, i) => i + 7).map(h => (
                                    <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>
                                        {h}:00
                                    </option>
                                ))}
                            </select>
                            <button onClick={() => removeSlot(idx)} className="p-2 text-red-500 hover:bg-neutral-800 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button onClick={addSlot} className="w-full py-2 border border-dashed border-neutral-700 text-neutral-400 rounded hover:bg-neutral-800 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> Add Slot
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
}
