'use client';

import { getTrainers, getAppointments, getCurrentUser } from '@/lib/store';
import { Trainer, Appointment } from '@/lib/types';
import { Calendar, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import BookingModal from '@/components/BookingModal';

export default function ClientDashboardPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [myBookings, setMyBookings] = useState<Appointment[]>([]);
    const [bookingTrainer, setBookingTrainer] = useState<Trainer | null>(null);

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
                ))}
            </div>

            <div className="border-t border-neutral-800 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>
                {myBookings.length === 0 ? (
                    <div className="text-neutral-500 bg-neutral-900/30 p-8 rounded-xl border border-neutral-800 text-center">
                        <p>You haven't booked any sessions yet.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myBookings.map(app => {
                            const date = new Date(app.start_time);
                            // Simple date formatting
                            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                            // Find trainer name if possible, or use ID placeholder if not loaded yet
                            const trainerName = trainers.find(t => t.id === app.trainer_id)?.name || 'Unknown Trainer';

                            return (
                                <div key={app.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-neutral-400 text-xs uppercase font-bold tracking-wider mb-1">Session</p>
                                            <h4 className="text-lg font-bold text-white">{trainerName}</h4>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${app.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                            app.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {app.status.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-neutral-300 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span>{dateStr}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        </div>
                                        <span>{timeStr}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
