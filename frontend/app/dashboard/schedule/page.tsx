'use client';

import AvailabilityEditor from '@/components/AvailabilityEditor';
import { getTrainers } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Availability, Trainer } from '@/lib/types';

export default function SchedulePage() {
    // Mock logged-in user state
    const [trainer, setTrainer] = useState<Trainer | null>(null);

    useEffect(() => {
        getTrainers().then(trainers => {
            if (trainers.length > 0) setTrainer(trainers[0]);
        });
    }, []);

    const handleSave = async (newAvailability: Availability[]) => {
        // In a real app, this would be an API call to SAVE
        console.log('Saving availability:', newAvailability);

        if (!trainer) return;

        // Optimistic update locally
        setTrainer({ ...trainer, availabilities: newAvailability });

        // TODO: Call API to persist
        // await saveAvailability(trainer.id, newAvailability);
    };

    if (!trainer) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Schedule & Availability</h1>
                <p className="text-neutral-400 mt-2">Manage when clients can book appointments with you.</p>
            </div>

            <AvailabilityEditor
                initialAvailability={trainer.availabilities}
                onSave={handleSave}
            />
        </div>
    );
}
