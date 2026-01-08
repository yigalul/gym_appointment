'use client';

import { useState } from 'react';
import { Availability } from '@/lib/types';
import { Plus, X, Loader2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface AvailabilityEditorProps {
    availabilities: Availability[];
    onAdd: (slot: Partial<Availability>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

export default function AvailabilityEditor({ availabilities, onAdd, onDelete }: AvailabilityEditorProps) {
    const [newDay, setNewDay] = useState(1);
    const [shift, setShift] = useState<'morning' | 'evening'>('morning');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onAdd({
                day_of_week: newDay,
                start_time: shift === 'morning' ? '07:00' : '15:00',
                end_time: shift === 'morning' ? '12:00' : '20:00',
                is_recurring: true
            });
        } catch (err: any) {
            setError(err.message || 'Failed to add slot');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this slot?')) return;
        await onDelete(id);
    };

    return (
        <div className="space-y-6 bg-neutral-800/50 p-6 rounded-xl border border-neutral-800">

            {/* Error Banner */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

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
                    <label className="text-sm font-medium text-neutral-400">Shift</label>
                    <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value as 'morning' | 'evening')}
                        className="block w-48 bg-neutral-900 border border-neutral-700 rounded-md p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="morning">Morning (07:00 - 12:00)</option>
                        <option value="evening">Evening (15:00 - 20:00)</option>
                    </select>
                </div>

                <button
                    onClick={handleAdd}
                    disabled={isLoading}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Slot
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Current Availability</h3>
                {availabilities.length === 0 && (
                    <p className="text-neutral-500 italic">No availability set. You are not bookable.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availabilities.map((slot) => (
                        <div key={slot.id || Math.random()} className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                            <span className="font-medium text-white">{DAYS[slot.day_of_week] || 'Unknown'}</span>
                            <div className="flex items-center gap-4">
                                <span className={`font-mono text-sm px-2 py-1 rounded ${slot.start_time === '07:00' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-indigo-500/10 text-indigo-500'
                                    }`}>
                                    {slot.start_time === '07:00' ? 'Morning Shift' : 'Evening Shift'} ({slot.start_time} - {slot.end_time})
                                </span>
                                <button
                                    onClick={() => slot.id && handleDelete(slot.id)}
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
