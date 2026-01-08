'use client';

import AvailabilityEditor from '@/components/AvailabilityEditor';
import { getTrainers, addAvailability, deleteAvailability } from '@/lib/store';
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

    const handleAdd = async (newSlot: Partial<Availability>) => {
        if (!trainer) return;
        const savedSlot = await addAvailability(trainer.id, newSlot);
        if (savedSlot) {
            setTrainer({
                ...trainer,
                availabilities: [...(trainer.availabilities || []), savedSlot]
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!trainer) return;
        const success = await deleteAvailability(id);
        if (success) {
            setTrainer({
                ...trainer,
                availabilities: (trainer.availabilities || []).filter(a => a.id !== id)
            });
        }
    };

    if (!trainer) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Schedule & Availability</h1>
                <p className="text-neutral-400 mt-2">Manage when clients can book appointments with you.</p>
            </div>

            <AvailabilityEditor
                availabilities={trainer.availabilities || []}
                onAdd={handleAdd}
                onDelete={handleDelete}
            />
        </div>
    );
}
