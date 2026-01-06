'use client';

import { getTrainers, getAppointments } from '@/lib/store';
import { Calendar, Users, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Trainer, Appointment } from '@/lib/types';

export default function DashboardPage() {
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        // Hardcoded ID 1 for "Logged In" status
        getTrainers().then(trainers => {
            // In a real app we'd use auth context, here we just pick the first one if available
            if (trainers.length > 0) setTrainer(trainers[0]);
        });

        getAppointments().then(setAppointments);
    }, []);

    if (!trainer) {
        return <div className="p-8 text-neutral-400">Loading dashboard...</div>;
    }

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

            {/* Recent Appointments */}
            <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="p-6 border-b border-neutral-800">
                    <h3 className="text-lg font-semibold text-white">Upcoming Appointments</h3>
                </div>
                <div className="p-6 text-center text-neutral-400">
                    {upcomingAppointments.length === 0 ? (
                        <div className="py-8">
                            <p>No upcoming appointments scheduled.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {upcomingAppointments.map(app => (
                                <li key={app.id} className="flex justify-between items-center text-white bg-neutral-800 p-4 rounded-lg">
                                    <span>{app.client_name}</span>
                                    <span>{new Date(app.start_time).toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
