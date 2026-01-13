'use client';

import AvailabilityEditor from '@/components/AvailabilityEditor';
import { getTrainers, addAvailability, deleteAvailability, addFullWeekAvailability } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Availability, Trainer } from '@/lib/types';

export default function SchedulePage() {
    // Mock logged-in user state
    const [trainer, setTrainer] = useState<Trainer | null>(null);
    const [pendingShift, setPendingShift] = useState<'morning' | 'evening' | null>(null);

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

    const handleConfirmShift = async () => {
        if (!trainer || !pendingShift) return;

        if (pendingShift === 'morning') {
            await addFullWeekAvailability(trainer.id, "07:00", "12:00");
        } else {
            await addFullWeekAvailability(trainer.id, "15:00", "20:00");
        }

        const trainers = await getTrainers();
        if (trainers.length > 0) setTrainer(trainers[0]);
        setPendingShift(null);
    };

    if (!trainer) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8 max-w-4xl relative">
            {/* Confirmation Modal */}
            {pendingShift && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-white">
                                {pendingShift === 'morning' ? '☀️ Add Morning Slots?' : '🌙 Add Evening Slots?'}
                            </h3>
                            <p className="text-neutral-400">
                                This will add availability from
                                {pendingShift === 'morning' ? ' 7:00 AM to 12:00 PM' : ' 3:00 PM to 8:00 PM'}
                                <br />for every day of the week.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setPendingShift(null)}
                                className="flex-1 px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmShift}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-medium"
                            >
                                Yes, Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold text-white">Schedule & Availability</h1>
                <div className="flex justify-between items-end">
                    <p className="text-neutral-400 mt-2">Manage when clients can book appointments with you.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPendingShift('morning')}
                            className="text-xs bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 px-3 py-1.5 rounded-lg transition-colors border border-yellow-400/30 font-medium"
                        >
                            ☀️ Morning (7am-12pm)
                        </button>
                        <button
                            onClick={() => setPendingShift('evening')}
                            className="text-xs bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/30 font-medium"
                        >
                            🌙 Evening (3pm-8pm)
                        </button>
                    </div>
                </div>
            </div>

            <AvailabilityEditor
                availabilities={trainer.availabilities || []}
                onAdd={handleAdd}
                onDelete={handleDelete}
            />
        </div>
    );
}
