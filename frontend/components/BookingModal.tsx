import { useState, useEffect } from 'react';
import { Trainer, Availability } from '@/lib/types';
import { createAppointment, getCurrentUser, getAppointments } from '@/lib/store';
import { X, Calendar, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, isSameDay, parseISO, isBefore, startOfToday } from 'date-fns';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: Trainer | null;
}

export default function BookingModal({ isOpen, onClose, trainer }: BookingModalProps) {
    const [step, setStep] = useState<'select' | 'preview'>('select');
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date, startTime: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [appointments, setAppointments] = useState<any[]>([]);

    // Calendar State
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setSelectedSlot(null);
            setError('');
        } else {
            // Reset to current week when opening
            setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
            // Fetch appointments to calculate availability
            getAppointments().then(data => setAppointments(data));
        }
    }, [isOpen]);

    if (!isOpen || !trainer) return null;

    // Calendar Helpers
    const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    });
    const timeSlots = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm

    const handleSelectSlot = (date: Date, startTime: string) => {
        setSelectedSlot({ date, startTime });
        setStep('preview');
        setError('');
    };

    const handleBack = () => {
        setStep('select');
        setSelectedSlot(null);
    };

    const handleConfirm = async () => {
        const user = getCurrentUser();
        if (!user) {
            setError('You must be logged in to book.');
            return;
        }

        if (!selectedSlot) return;

        setIsSubmitting(true);
        setError('');

        // Combine date and time to ISO string
        const dateStr = format(selectedSlot.date, 'yyyy-MM-dd');
        const startTimeISO = `${dateStr}T${selectedSlot.startTime}:00`;

        try {
            await createAppointment(
                trainer.id,
                startTimeISO,
                user.email?.split('@')[0] || 'Unknown Client',
                user.email
            );

            setIsSubmitting(false);
            alert('Booking Successful!');
            onClose();
        } catch (err) {
            setIsSubmitting(false);
            setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        }
    };

    const isSlotAvailable = (day: Date, hour: number) => {
        // 1. Date Check (Cannot book past)
        if (isBefore(day, startOfToday())) return 'past';

        // 2. Client Restriction: Morning (7-12) and Evening (15-20)
        // (Assuming this modal is primarily for clients or follows client rules)
        const isMorning = hour >= 7 && hour <= 12;
        const isEvening = hour >= 15 && hour <= 20;

        if (!isMorning && !isEvening) return 'unavailable';

        // 3. Basic Availability (Trainer's schedule)
        const dayOfWeek = day.getDay(); // 0-6
        const hourStr = hour.toString().padStart(2, '0') + ':00';

        // Check if hour is within any availability range (Start <= Time < End)
        const validSlot = trainer.availabilities.find(s => {
            if (s.day_of_week !== dayOfWeek) return false;
            return s.start_time <= hourStr && hourStr < s.end_time;
        });

        if (!validSlot) return 'unavailable'; // Trainer not working

        const slotTimeISO = `${format(day, 'yyyy-MM-dd')}T${hourStr}`;

        // 4. User Duplicate
        const user = getCurrentUser();
        if (user) {
            const userBooked = appointments.some(a =>
                a.client_email === user.email &&
                a.start_time === slotTimeISO &&
                a.status !== 'cancelled'
            );
            if (userBooked) return 'joined'; // Already booked by YOU
        }

        // 5. Trainer Capacity
        const trainerApps = appointments.filter(a =>
            a.trainer_id === trainer.id &&
            a.start_time === slotTimeISO &&
            a.status !== 'cancelled'
        );
        if (trainerApps.length >= 2) return 'full'; // Full

        return 'available';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        {step === 'select' ? `Book with ${trainer.name}` : 'Confirm Booking'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'select' ? (
                        <div className="space-y-4">
                            {/* Calendar Navigation */}
                            <div className="flex items-center justify-between mb-4 bg-neutral-800/30 p-3 rounded-xl border border-neutral-800">
                                <button onClick={() => setCurrentWeekStart(subDays(currentWeekStart, 7))} className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-white font-medium">
                                    {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                                </span>
                                <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Weekly Grid */}
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden overflow-x-auto">
                                <div className="min-w-[600px]">
                                    {/* Header Row */}
                                    <div className="grid grid-cols-8 border-b border-neutral-800 bg-neutral-800/20">
                                        <div className="p-3 text-xs font-medium text-neutral-500 border-r border-neutral-800 text-right">Time</div>
                                        {weekDays.map((day, idx) => (
                                            <div key={idx} className={`p-3 text-center border-r border-neutral-800 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-500/10' : ''}`}>
                                                <div className="text-xs font-bold text-neutral-400 uppercase">{format(day, 'EEE')}</div>
                                                <div className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-white'}`}>{format(day, 'd')}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Time Slots */}
                                    {timeSlots.map((hour) => (
                                        <div key={hour} className="grid grid-cols-8 border-b border-neutral-800 last:border-b-0 h-10">
                                            <div className="p-2 text-xs text-neutral-500 border-r border-neutral-800 text-right sticky left-0 bg-neutral-900 z-10">
                                                {hour}:00
                                            </div>
                                            {weekDays.map((day, dayIdx) => {
                                                const status = isSlotAvailable(day, hour);
                                                return (
                                                    <div key={dayIdx} className={`border-r border-neutral-800 last:border-r-0 p-0.5 ${isSameDay(day, new Date()) ? 'bg-blue-500/5' : ''}`}>
                                                        {status === 'available' ? (
                                                            <button
                                                                onClick={() => handleSelectSlot(day, hour.toString().padStart(2, '0'))}
                                                                className="w-full h-full bg-green-500/20 hover:bg-green-500/40 rounded border border-green-500/30 transition-colors flex items-center justify-center group"
                                                            >
                                                                <Check className="w-3 h-3 text-green-400 opacity-0 group-hover:opacity-100" />
                                                            </button>
                                                        ) : status === 'full' ? (
                                                            <div className="w-full h-full bg-red-500/10 rounded border border-red-500/20 flex items-center justify-center cursor-not-allowed">
                                                                <span className="text-[10px] text-red-500 font-medium">Full</span>
                                                            </div>
                                                        ) : status === 'joined' ? (
                                                            <div className="w-full h-full bg-blue-500/20 rounded border border-blue-500/30 flex items-center justify-center">
                                                                <span className="text-[10px] text-blue-400 font-medium">Joined</span>
                                                            </div>
                                                        ) : (
                                                            // Unavailable or Past
                                                            <div className="w-full h-full bg-neutral-950/30"></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="bg-neutral-800/50 rounded-xl p-6 space-y-4 border border-neutral-800">
                                <h3 className="text-lg font-bold text-white mb-2">Booking Preview</h3>

                                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                                    <span className="text-neutral-400">Trainer</span>
                                    <span className="text-white font-medium">{trainer.name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                                    <span className="text-neutral-400">Date</span>
                                    <span className="text-white font-medium">{selectedSlot && format(selectedSlot.date, 'PPPP')}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-neutral-700">
                                    <span className="text-neutral-400">Time</span>
                                    <span className="text-white font-medium">{selectedSlot?.startTime}:00</span>
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

