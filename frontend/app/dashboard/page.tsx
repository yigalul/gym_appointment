'use client';

import { getCurrentUser, getAppointments, getTrainers, getSystemWeek } from '@/lib/store';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { Calendar, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trainer, Appointment, User } from '@/lib/types'; // Added User to types

export default function DashboardPage() {
    const router = useRouter();
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 })); // Changed initial state and type
    const [user, setUser] = useState<User | null>(null); // Added user state

    useEffect(() => {
        // Load system week
        getSystemWeek().then(dateStr => {
            setCurrentWeekStart(startOfWeek(parseISO(dateStr), { weekStartsOn: 0 }));
        });

        const currentUser = getCurrentUser(); // Renamed to avoid conflict with state
        if (currentUser) {
            setUser(currentUser);
            if (currentUser.role === 'trainer') {
                // Load info...
                getTrainers().then(trainers => {
                    const myTrainerProfile = trainers.find(t => t.user_id === currentUser.id);
                    if (myTrainerProfile) {
                        setTrainer(myTrainerProfile);
                        getAppointments().then(apps => {
                            setAppointments(apps.filter(a => a.trainer_id === myTrainerProfile.id));
                        });
                    } else {
                        console.error("No trainer profile found for this user");
                    }
                });
            } else if (currentUser.role === 'admin') {
                router.push('/dashboard/admin');
            } else {
                router.push('/dashboard/client');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    if (!trainer || !user) { // Adjusted condition based on new state
        return <div className="p-8 text-neutral-400">Loading dashboard...</div>;
    }

    const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }) // Changed weekStartsOn to 0
    });
    const timeSlots = Array.from({ length: 16 }, (_, i) => i + 7); // 7am to 10pm

    // Removed prevWeek and nextWeek functions as per instruction

    const upcomingAppointments = appointments.filter(app => app.trainer_id === trainer.id);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Welcome back, {trainer.name.split(' ')[0]}</h1>
                <p className="text-neutral-400 mt-2">Here's what's happening today.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400 font-medium">Upcoming Sessions</p>
                            <h3 className="text-2xl font-bold text-white">{upcomingAppointments.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400 font-medium">Active Clients</p>
                            <h3 className="text-2xl font-bold text-white">12</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-400 font-medium">Hours This Week</p>
                            <h3 className="text-2xl font-bold text-white">24h</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Calendar */}
            <div className="space-y-4">
                {/* Week Header */}
                <div className="flex items-center justify-between mb-6"> {/* Adjusted class */}
                    <h2 className="text-xl font-bold text-white">Your Schedule</h2> {/* Added h2 */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                            {/* Navigation Locked by Admin */}
                            <span className="text-sm font-medium text-white px-2 py-1">
                                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Grid Header */}
                        <div className="grid grid-cols-8 border-b border-neutral-800">
                            <div className="p-4 text-neutral-500 text-xs font-medium border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10">
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
                                    <div className="p-2 text-right text-xs text-neutral-500 border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10">
                                        {hour}:00
                                    </div>

                                    {/* Day Columns */}
                                    {weekDays.map((day, dayIdx) => {
                                        // Find appointments for this day and hour
                                        const slotAppts = upcomingAppointments.filter(appt => {
                                            const apptDate = parseISO(appt.start_time);
                                            return isSameDay(apptDate, day) && apptDate.getHours() === hour;
                                        });

                                        return (
                                            <div key={dayIdx} className={`p-1 border-r border-neutral-800 last:border-r-0 relative group ${isSameDay(day, new Date()) ? 'bg-blue-500/5' : ''}`}>
                                                {slotAppts.map((appt) => (
                                                    <div
                                                        key={appt.id}
                                                        className={`mb-1 p-2 rounded-md border text-xs transition-colors ${appt.status === 'cancelled'
                                                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                            : 'bg-blue-600/20 border-blue-500/50 text-white'
                                                            }`}
                                                    >
                                                        <div className="font-semibold">
                                                            {appt.client_name}
                                                        </div>
                                                        <div className="text-xs opacity-75 mt-1">
                                                            {appt.status === 'confirmed' ? 'Confirmed' : appt.status.toUpperCase()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
