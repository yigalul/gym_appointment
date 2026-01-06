'use client';

import { useState } from 'react';
import { Availability } from '@/lib/types';
import { Plus, X } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface AvailabilityEditorProps {
    initialAvailability: Availability[];
    onSave: (newAvailability: Availability[]) => void;
}

export default function AvailabilityEditor({ initialAvailability, onSave }: AvailabilityEditorProps) {
    const [availabilities, setAvailabilities] = useState<Availability[]>(initialAvailability);
    const [newDay, setNewDay] = useState(1);
    const [newStart, setNewStart] = useState('09:00');
    const [newEnd, setNewEnd] = useState('17:00');

    const addSlot = () => {
        const newSlot: Availability = {
            day_of_week: newDay,
            start_time: newStart,
            end_time: newEnd,
        };
        const updated = [...availabilities, newSlot];
        setAvailabilities(updated);
        onSave(updated);
    };

    const removeSlot = (index: number) => {
        const updated = availabilities.filter((_, i) => i !== index);
        setAvailabilities(updated);
        onSave(updated);
    };

    return (
        <div className="space-y-6 bg-neutral-800/50 p-6 rounded-xl border border-neutral-800">
            <div className="flex gap-4 items-end flex-wrap">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Day</label>
                    <select
                        value={newDay}
                        onChange={(e) => setNewDay(Number(e.target.value))}
                        className="block w-40 bg-neutral-900 border border-neutral-700 rounded-md p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {DAYS.map((day, i) => (
                            <option key={i} value={i}>{day}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Start Time</label>
                    <input
                        type="time"
                        value={newStart}
                        onChange={(e) => setNewStart(e.target.value)}
                        className="block w-32 bg-neutral-900 border border-neutral-700 rounded-md p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">End Time</label>
                    <input
                        type="time"
                        value={newEnd}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="block w-32 bg-neutral-900 border border-neutral-700 rounded-md p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={addSlot}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Slot
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Current Availability</h3>
                {availabilities.length === 0 && (
                    <p className="text-neutral-500 italic">No availability set. You are not bookable.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availabilities.map((slot, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                            <span className="font-medium text-white">{DAYS[slot.day_of_week]}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-neutral-400 font-mono text-sm">{slot.start_time} - {slot.end_time}</span>
                                <button
                                    onClick={() => removeSlot(idx)}
                                    className="p-1 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
