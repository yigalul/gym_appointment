'use client';

import { useState, useEffect } from 'react';
import { Trainer, Availability } from '@/lib/types';
import { createAppointment, getCurrentUser, getAppointments } from '@/lib/store';
import { X, Calendar, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: Trainer | null;
}

export default function BookingModal({ isOpen, onClose, trainer }: BookingModalProps) {
    const [step, setStep] = useState<'select' | 'preview'>('select');
    const [date, setDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setDate('');
            setSelectedSlot(null);
            setError('');
        } else {
            // Set default date to today or next available? 
            // For simplicity, user picks date.
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
        }
    }, [isOpen]);

    if (!isOpen || !trainer) return null;

    const availableSlots = trainer.availabilities; // Need to filter by day of week of selected date

    const handleNext = () => {
        if (!selectedSlot || !date) {
            setError('Please select a date and time slot.');
            return;
        }
        setStep('preview');
        setError('');
    };

    const handleBack = () => {
        setStep('select');
    };

    const handleConfirm = async () => {
        const user = getCurrentUser();
        if (!user) {
            setError('You must be logged in to book.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        // Combine date and time to ISO string
        // Date: YYYY-MM-DD
        // Time: HH:mm
        const startTimeISO = `${date}T${selectedSlot?.start_time}:00`;

        try {
            await createAppointment(
                trainer.id,
                startTimeISO,
                user.email?.split('@')[0] || 'Unknown Client', // Fallback name
                user.email
            );

            // If we get here, it succeeded
            setIsSubmitting(false);
            alert('Booking Successful!');
            onClose();
        } catch (err) {
            setIsSubmitting(false);
            setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        }
    };

    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Fetch appointments to calculate availability
            // In a real app, we might query by date range
            getAppointments().then(data => setAppointments(data));
        }
    }, [isOpen]);

    // Filter slots based on selected date's day of week AND availability
    const getFilteredSlots = () => {
        if (!date) return [];
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay(); // 0-6
        const user = getCurrentUser();

        // 1. Filter by Day of Week
        let slots = availableSlots.filter(slot => slot.day_of_week === dayOfWeek);

        // 2. Filter out execution-time full slots
        slots = slots.filter(slot => {
            const slotTimeISO = `${date}T${slot.start_time}:00`;

            // Check Trainer Capacity (Max 2)
            const trainerApps = appointments.filter(a =>
                a.trainer_id === trainer.id &&
                a.start_time === slotTimeISO &&
                a.status !== 'cancelled'
            );
            if (trainerApps.length >= 2) return false;

            // Check Duplicate Booking (User already booked)
            if (user) {
                const userBooked = appointments.some(a =>
                    a.client_email === user.email &&
                    a.start_time === slotTimeISO &&
                    a.status !== 'cancelled'
                );
                if (userBooked) return false;
            }

            return true;
        });

        return slots;
    };

    const filteredSlots = getFilteredSlots();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        {step === 'select' ? 'Book Session' : 'Confirm Booking'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Progress Steps */}
                    <div className="flex items-center gap-2 mb-6 text-sm">
                        <span className={`font-semibold ${step === 'select' ? 'text-blue-500' : 'text-neutral-500'}`}>1. Select Time</span>
                        <ChevronRight className="w-4 h-4 text-neutral-600" />
                        <span className={`font-semibold ${step === 'preview' ? 'text-blue-500' : 'text-neutral-500'}`}>2. Preview & Confirm</span>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'select' ? (
                        <div className="space-y-6">
                            {/* Trainer Info */}
                            <div className="flex items-center gap-4 p-3 bg-neutral-800/50 rounded-xl">
                                <img src={trainer.photo_url} alt={trainer.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="text-sm text-neutral-400">Trainer</p>
                                    <h3 className="font-bold text-white">{trainer.name}</h3>
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Select Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Time Slots */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Available Slots</label>
                                {filteredSlots.length === 0 ? (
                                    <div className="text-center p-4 border border-dashed border-neutral-800 rounded-lg text-neutral-500">
                                        No slots available for this date.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {filteredSlots.map(slot => (
                                            <button
                                                key={slot.id} // Assuming slot has ID, or use combination
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedSlot === slot
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                                                    }`}
                                            >
                                                {slot.start_time} - {slot.end_time}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!selectedSlot || !date}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-neutral-800/50 rounded-xl p-4 space-y-4 border border-neutral-800">
                                <h3 className="text-lg font-bold text-white mb-2">Booking Preview</h3>

                                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                                    <span className="text-neutral-400">Trainer</span>
                                    <span className="text-white font-medium">{trainer.name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                                    <span className="text-neutral-400">Date</span>
                                    <span className="text-white font-medium">{date}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                                    <span className="text-neutral-400">Time</span>
                                    <span className="text-white font-medium">{selectedSlot?.start_time} to {selectedSlot?.end_time}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-400">Price</span>
                                    <span className="text-green-400 font-medium">Included in Membership</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-3 bg-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-700 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
