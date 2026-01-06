'use client';

import { getTrainers, getAppointments, getCurrentUser } from '@/lib/store';
import { Trainer, Appointment } from '@/lib/types';
import { Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, isSameDay, parseISO } from 'date-fns';

import BookingModal from '@/components/BookingModal';

export default function ClientDashboardPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [myBookings, setMyBookings] = useState<Appointment[]>([]);
    const [bookingTrainer, setBookingTrainer] = useState<Trainer | null>(null);

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

    const handleBook = (trainer: Trainer) => {
        setBookingTrainer(trainer);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Find a Trainer</h1>
                <p className="text-neutral-400 mt-2">Browse our expert coaches and book a session.</p>
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
