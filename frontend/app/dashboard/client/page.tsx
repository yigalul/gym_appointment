'use client';

import { getTrainers } from '@/lib/store';
import { Trainer } from '@/lib/types';
import { Calendar, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ClientDashboardPage() {
    const [trainers, setTrainers] = useState<Trainer[]>([]);

    useEffect(() => {
        getTrainers().then(setTrainers);
    }, []);

    const handleBook = (trainerId: number) => {
        // In a real app, open booking modal
        alert(`Booking flow for trainer ${trainerId} would open here.`);
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
                                onClick={() => handleBook(trainer.id)}
                                className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Book Session
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
