'use client';

import { getTrainers, getUsers, createTrainerUser, deleteTrainer, createClientUser, updateClientUser, deleteUser, getAppointments, cancelAppointment, autoScheduleWeek, clearWeekAppointments, sendAdminWhatsApp, getSystemWeek, updateSystemWeek, autoResolveConflicts } from '@/lib/store';
import { User, Trainer, Appointment } from '@/lib/types';
import { Users, UserPlus, Trash2, Plus, X, Pencil, Calendar, XCircle, Search, ChevronLeft, ChevronRight, Wand2, AlertCircle, CheckCircle, RotateCcw, BrainCircuit } from 'lucide-react';
import { useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addDays, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Dashboard State
    const [activeTab, setActiveTab] = useState<'trainers' | 'clients' | 'appointments'>('trainers');
    const [searchQuery, setSearchQuery] = useState('');

    // Calendar State
    const [currentWeekStart, setCurrentWeekStart] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'week'>('week');

    useEffect(() => {
        // Load initial week from system
        getSystemWeek().then(dateStr => {
            setCurrentWeekStart(startOfWeek(parseISO(dateStr), { weekStartsOn: 0 }));
        });
    }, []);

    // Sync week changes to backend
    const handleWeekChange = (newDate: Date) => {
        setCurrentWeekStart(newDate);
        updateSystemWeek(format(newDate, 'yyyy-MM-dd'));
    };

    const TRAINER_COLORS = [
        'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30',
        'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30',
        'bg-orange-600/20 border-orange-500/50 hover:bg-orange-600/30',
        'bg-pink-600/20 border-pink-500/50 hover:bg-pink-600/30',
        'bg-teal-600/20 border-teal-500/50 hover:bg-teal-600/30',
        'bg-indigo-600/20 border-indigo-500/50 hover:bg-indigo-600/30',
    ];
    const getTrainerColor = (id: number) => TRAINER_COLORS[id % TRAINER_COLORS.length];




    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [userType, setUserType] = useState<'trainer' | 'client'>('trainer');

    // Trainer Form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('Strength Coach');

    // Client Form
    const [clientFirstName, setClientFirstName] = useState('');
    const [clientLastName, setClientLastName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhoneNumber, setClientPhoneNumber] = useState('');
    const [clientWeeklyLimit, setClientWeeklyLimit] = useState(3);
    const [clientWorkoutCredits, setClientWorkoutCredits] = useState(10); // Added
    const [defaultSlots, setDefaultSlots] = useState<{ day_of_week: number; start_time: string }[]>([]);

    // Slot Inputs
    const [slotDay, setSlotDay] = useState(1);
    const [slotHour, setSlotHour] = useState(9); // 0-23

    // Auto-Schedule Report State
    const [scheduleReport, setScheduleReport] = useState<any | null>(null); // Type 'any' for now to support dynamic fields
    const [isScheduling, setIsScheduling] = useState(false);
    const [hasLastReport, setHasLastReport] = useState(false);

    useEffect(() => {
        // Check if report exists
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('last_schedule_report');
            if (stored) setHasLastReport(true);
        }
    }, [scheduleReport]); // Update when report changes


    const refreshData = () => {
        getUsers().then(setUsers);
        getTrainers().then(setTrainers);
        getAppointments().then(setAppointments);
    };

    useEffect(() => {
        refreshData();
    }, []);



    const clearInputs = () => {
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setClientFirstName('');
        setClientLastName('');
        setClientEmail('');
        setClientPhoneNumber('');
        setClientWeeklyLimit(3);
        setClientWorkoutCredits(10); // Reset
        setDefaultSlots([]);
        setEditingUserId(null);
        setIsEditing(false);
    };

    const resetForms = () => {
        clearInputs();
        setIsAdding(false);
    };

    const openAddForm = () => {
        clearInputs();
        setUserType(activeTab === 'trainers' ? 'trainer' : 'client');
        setIsAdding(true);
    };

    const handleAddTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createTrainerUser(newName, newRole, newEmail, "Expert trainer.", newPassword || 'password123');
        if (success) {
            alert('Trainer added successfully!');
            resetForms();
            refreshData();
        } else {
            alert('Failed to add trainer.');
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        // createClientUser doesn't accept credits yet, defaulting to 10 in backend
        const success = await createClientUser(clientEmail, newPassword || 'GymStrong2026!', defaultSlots, clientWeeklyLimit, clientPhoneNumber, clientFirstName, clientLastName);
        if (success) {
            alert('Client added successfully!');
            resetForms();
            refreshData();
        } else {
            alert('Failed to add client.');
        }
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId) return;
        const success = await updateClientUser(editingUserId, clientEmail, defaultSlots, clientWeeklyLimit, clientPhoneNumber, clientFirstName, clientLastName, clientWorkoutCredits);
        if (success) {
            alert('Client updated successfully!');
            resetForms();
            refreshData();
        } else {
            alert('Failed to update client.');
        }
    };

    const startEditClient = (user: User) => {
        clearInputs();
        setEditingUserId(user.id);
        setClientEmail(user.email);
        setClientPhoneNumber(user.phone_number || '');
        setClientFirstName(user.first_name || '');
        setClientLastName(user.last_name || '');
        setClientWeeklyLimit(user.weekly_workout_limit || 3);
        setClientWorkoutCredits(user.workout_credits || 10); // Load credits
        setDefaultSlots(user.default_slots || []);
        setUserType('client');
        setIsEditing(true);
        setIsAdding(true);
    };

    const addSlot = () => {
        const timeString = `${slotHour.toString().padStart(2, '0')}:00`;
        setDefaultSlots([...defaultSlots, { day_of_week: slotDay, start_time: timeString }]);
    };

    const removeSlot = (index: number) => {
        setDefaultSlots(defaultSlots.filter((_, i) => i !== index));
    };

    const handleDeleteTrainer = async (userId: number) => {
        if (!confirm('Are you sure? This will delete the trainer and their account.')) return;

        const trainer = trainers.find(t => t.user_id === userId);
        if (!trainer) {
            alert('Could not look up trainer profile for this user.');
            return;
        }

        const success = await deleteTrainer(trainer.id);
        if (success) {
            refreshData();
        } else {
            alert('Failed to delete trainer.');
        }
    };

    const handleDeleteClient = async (userId: number) => {
        if (!confirm('Are you sure? This will delete the user and all their appointments.')) return;
        const success = await deleteUser(userId);
        if (success) {
            refreshData();
        } else {
            alert('Failed to delete client.');
        }
    };

    const dayName = (d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];

    const handleCancelAppointment = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        const success = await cancelAppointment(id);
        if (success) {
            alert('Appointment cancelled.');
            refreshData();
        } else {
            alert('Failed to cancel appointment.');
        }
    };

    // ... (rest of the file until the client list)

    // In the Client List Mapping (around line 610)



    const [confirmSchedule, setConfirmSchedule] = useState(false);

    // Auto-reset confirmation
    useEffect(() => {
        if (confirmSchedule) {
            const timeout = setTimeout(() => setConfirmSchedule(false), 3000);
            return () => clearTimeout(timeout);
        }
    }, [confirmSchedule]);

    const handleAutoSchedule = async () => {
        if (!currentWeekStart) return;

        if (!confirmSchedule) {
            setConfirmSchedule(true);
            return;
        }

        setConfirmSchedule(false);
        setIsScheduling(true);
        const result = await autoScheduleWeek(format(currentWeekStart, 'yyyy-MM-dd'));
        setIsScheduling(false);

        if (result) {
            setScheduleReport(result);
            if (typeof window !== 'undefined') {
                localStorage.setItem('last_schedule_report', JSON.stringify(result));
                setHasLastReport(true);
            }
            refreshData();
        } else {
            setErrorMsg('Failed to run auto-scheduler.');
        }
    };




    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);

    // Message Modal State
    const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
    const [msgTargetUser, setMsgTargetUser] = useState<User | null>(null);
    const [msgContent, setMsgContent] = useState('');
    const [isSendingMsg, setIsSendingMsg] = useState(false);

    const openMessageModal = (user: User) => {
        setMsgTargetUser(user);
        setMsgContent('');
        setIsMsgModalOpen(true);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!msgTargetUser) return;

        setIsSendingMsg(true);
        const success = await sendAdminWhatsApp(msgTargetUser.id, msgContent);
        setIsSendingMsg(false);

        if (success) {
            setSuccessMsg(`Message sent to ${msgTargetUser.email}`);
            setIsMsgModalOpen(false);
        } else {
            setErrorMsg("Failed to send message. Check console/network.");
        }
    };

    // Auto-reset confirmation after 3 seconds
    useEffect(() => {
        if (confirmClear) {
            const timeout = setTimeout(() => setConfirmClear(false), 3000);
            return () => clearTimeout(timeout);
        }
    }, [confirmClear]);

    const handleClearWeek = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!confirmClear) {
            setConfirmClear(true);
            return; // Wait for second click
        }

        setConfirmClear(false);
        setErrorMsg(null);
        setSuccessMsg(null);
        if (!currentWeekStart) return;

        try {
            const success = await clearWeekAppointments(format(currentWeekStart, 'yyyy-MM-dd'));
            if (success) {
                setSuccessMsg('Week cleared successfully.');
                refreshData();
            } else {
                setErrorMsg('Failed to clear week. Check console for details.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('An error occurred while clearing the week.');
        }
    };

    const handleViewLastReport = () => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('last_schedule_report');
            if (stored) {
                setScheduleReport(JSON.parse(stored));
            } else {
                alert("No previous report found.");
                setHasLastReport(false);
            }
        }
    };

    // --- Search & Filter Logic ---
    const filteredTrainers = trainers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredClients = users.filter(u =>
        u.role === 'client' &&
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAppointments = appointments.filter(a =>
        a.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.client_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!currentWeekStart) {
        return <div className="p-12 text-center text-neutral-500">Loading admin dashboard...</div>;
    }

    // Calendar Helpers
    const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 })
    });
    const timeSlots = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm

    const prevWeek = () => handleWeekChange(subDays(currentWeekStart, 7));
    const nextWeek = () => handleWeekChange(addDays(currentWeekStart, 7));


    const goToCurrentWeek = () => handleWeekChange(startOfWeek(new Date(), { weekStartsOn: 0 }));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
                    <p className="text-neutral-400 mt-2">Manage your gym ecosystem.</p>
                </div>

                {(activeTab === 'trainers' || activeTab === 'clients') && (
                    <button
                        onClick={() => {
                            if (isAdding) {
                                resetForms();
                            } else {
                                openAddForm();
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto"
                    >
                        <UserPlus className="w-4 h-4" />
                        {isAdding ? 'Cancel' : (activeTab === 'trainers' ? 'Add Trainer' : 'Add Client')}
                    </button>
                )}
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex justify-between items-center">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)}><X className="w-5 h-5" /></button>
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex justify-between items-center">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)}><X className="w-5 h-5" /></button>
                </div>
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-neutral-300">Active Trainers</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{trainers.length}</p>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-neutral-300">Total Clients</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'client').length}</p>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-neutral-300">Total Bookings</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{appointments.filter(a => a.status !== 'cancelled').length}</p>
                </div>
            </div>

            {/* Form Area */}
            {isAdding && (
                <div className="bg-neutral-800/50 border border-blue-500/30 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-white mb-6">
                        {isEditing ? `Editing ${userType === 'trainer' ? 'Trainer' : 'Client'}` : `Add New ${userType === 'trainer' ? 'Trainer' : 'Client'}`}
                    </h3>

                    {userType === 'trainer' ? (
                        <form onSubmit={handleAddTrainer} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text" placeholder="Full Name" required
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    autoComplete="off"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="email" placeholder="Email Address" required
                                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                    autoComplete="off"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />

                                <input
                                    type="password" placeholder="Password" required
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text" placeholder="Specialty / Role" required
                                    value={newRole} onChange={e => setNewRole(e.target.value)}
                                    autoComplete="off"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={resetForms} className="px-6 py-2 bg-neutral-700 text-white font-semibold rounded-lg hover:bg-neutral-600">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
                                    Create Trainer
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={isEditing ? handleUpdateClient : handleAddClient} className="space-y-4" autoComplete="off">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text" placeholder="First Name"
                                    value={clientFirstName} onChange={e => setClientFirstName(e.target.value)}
                                    autoComplete="given-name"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text" placeholder="Last Name"
                                    value={clientLastName} onChange={e => setClientLastName(e.target.value)}
                                    autoComplete="family-name"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="email" placeholder="Client Email" required
                                    value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                                    autoComplete="off"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text" placeholder="Phone Number (e.g. +1234567890)"
                                    value={clientPhoneNumber} onChange={e => setClientPhoneNumber(e.target.value)}
                                    autoComplete="tel"
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                {!isEditing && (
                                    <input
                                        type="password" placeholder="Password" required
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                    />
                                )}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-neutral-400">Weekly Workout Limit</label>
                                    <input
                                        type="number" min="1" max="7" required
                                        value={clientWeeklyLimit} onChange={e => setClientWeeklyLimit(Number(e.target.value))}
                                        autoComplete="off"
                                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-neutral-400">Workout Credits</label>
                                    <input
                                        type="number" min="0" required
                                        value={clientWorkoutCredits} onChange={e => setClientWorkoutCredits(Number(e.target.value))}
                                        autoComplete="off"
                                        className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                                <h4 className="text-sm font-medium text-neutral-300 mb-3">Default Slot Spaces</h4>
                                <div className="flex gap-2 mb-4">
                                    <select
                                        value={slotDay} onChange={e => setSlotDay(Number(e.target.value))}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                                    >
                                        <option value={0}>Sunday</option>
                                        <option value={1}>Monday</option>
                                        <option value={2}>Tuesday</option>
                                        <option value={3}>Wednesday</option>
                                        <option value={4}>Thursday</option>
                                        <option value={5}>Friday</option>
                                        <option value={6}>Saturday</option>
                                    </select>
                                    <select
                                        value={slotHour} onChange={e => setSlotHour(Number(e.target.value))}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                                    >
                                        {Array.from({ length: 14 }).map((_, i) => {
                                            const h = i + 7;
                                            const nextH = h + 1;
                                            return (
                                                <option key={h} value={h}>{h}:00 to {nextH}:00</option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        type="button" onClick={addSlot}
                                        className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {defaultSlots.length > 0 && (
                                    <div className="space-y-2">
                                        {defaultSlots.map((slot, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm bg-neutral-800 px-3 py-2 rounded-md border border-neutral-700">
                                                <span className="text-neutral-300">{dayName(slot.day_of_week)} at {slot.start_time}</span>
                                                <button type="button" onClick={() => removeSlot(idx)} className="text-red-400 hover:text-red-300">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={resetForms} className="px-6 py-2 bg-neutral-700 text-white font-semibold rounded-lg hover:bg-neutral-600">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
                                    {isEditing ? 'Update Client' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Message Modal */}
            {isMsgModalOpen && msgTargetUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-white mb-2">Send WhatsApp Message</h3>
                        <p className="text-neutral-400 text-sm mb-6">
                            To: <span className="text-white font-medium">{msgTargetUser.first_name} {msgTargetUser.last_name}</span>
                            <br />
                            <span className="text-xs text-neutral-500">{msgTargetUser.phone_number || 'No Phone'} • {msgTargetUser.email}</span>
                        </p>

                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <textarea
                                autoFocus
                                value={msgContent}
                                onChange={e => setMsgContent(e.target.value)}
                                placeholder="Type your message here..."
                                className="w-full h-32 bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white outline-none focus:border-green-500 resize-none font-sans"
                                required
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMsgModalOpen(false)}
                                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSendingMsg}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                                >
                                    {isSendingMsg ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tabs & Search Bar */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Tabs */}
                    <div className="flex p-1 bg-neutral-900 rounded-lg self-start md:self-auto">
                        <button
                            onClick={() => { setActiveTab('trainers'); resetForms(); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'trainers' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Trainers
                        </button>
                        <button
                            onClick={() => { setActiveTab('clients'); resetForms(); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'clients' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Clients
                        </button>
                        <button
                            onClick={() => { setActiveTab('appointments'); resetForms(); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'appointments' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Appointments
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-neutral-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: TRAINERS */}
            {activeTab === 'trainers' && (
                <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 overflow-hidden">
                    <div className="p-6 border-b border-neutral-800">
                        <h3 className="text-lg font-semibold text-white">Trainers Directory</h3>
                    </div>
                    <div>
                        {filteredTrainers.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No trainers found matching "{searchQuery}".</div>
                        ) : (
                            filteredTrainers.map((trainer) => (
                                <div key={trainer.id} className="p-4 flex items-center justify-between border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                            {trainer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{trainer.name}</div>
                                            <div className="text-sm text-neutral-500">{trainer.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-neutral-600 hidden md:block">
                                            {trainer.availabilities && trainer.availabilities.length > 0
                                                ? trainer.availabilities.map(a => `${dayName(a.day_of_week)} ${a.start_time}`).join(', ')
                                                : 'No schedule'}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTrainer(trainer.user_id || 0)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Trainer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}


            {/* TAB CONTENT: CLIENTS */}
            {activeTab === 'clients' && (
                <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 overflow-hidden">
                    <div className="p-6 border-b border-neutral-800">
                        <h3 className="text-lg font-semibold text-white">Clients Directory</h3>
                    </div>
                    <div>
                        {filteredClients.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No clients found matching "{searchQuery}".</div>
                        ) : (
                            filteredClients.map((user) => (
                                <div key={user.id} className="p-4 flex items-center justify-between border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors">
                                    <div>
                                        <div className="font-medium text-white">{user.first_name} {user.last_name}</div>
                                        <div className="text-sm text-neutral-500">{user.email}</div>
                                        {user.phone_number && <div className="text-xs text-neutral-400">{user.phone_number}</div>}
                                        <div className="text-sm text-neutral-500 mt-1 flex gap-2 items-center">
                                            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-xs">
                                                Limit: {user.weekly_workout_limit || 3}/wk
                                            </span>
                                            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-xs text-green-400">
                                                Credits: {user.workout_credits !== undefined ? user.workout_credits : 10}
                                            </span>
                                        </div>
                                        {user.default_slots && user.default_slots.length > 0 && (
                                            <div className="mt-2 flex gap-1 flex-wrap">
                                                {user.default_slots.map((slot, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-400">
                                                        {dayName(slot.day_of_week)} {slot.start_time}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openMessageModal(user)}
                                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                            title="Send WhatsApp Message"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => startEditClient(user)}
                                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit Client Attributes"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClient(user.id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Client"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}


            {/* TAB CONTENT: APPOINTMENTS */}
            {activeTab === 'appointments' && (
                <div className="space-y-4">
                    {/* Week Header */}
                    <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                        <div className="flex items-center gap-4">
                            <button onClick={prevWeek} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-white font-medium">
                                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                            </span>
                            <button onClick={nextWeek} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <button
                                onClick={goToCurrentWeek}
                                className="ml-2 p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                title="Go to Current Week"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mr-4">
                                <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50"></div> Confirmed
                                <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></div> Cancelled
                            </div>
                            <button
                                onClick={handleClearWeek}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 mr-2 ${confirmClear
                                    ? 'bg-red-600 text-white animate-pulse font-bold'
                                    : 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white'
                                    }`}
                                title="Delete all appointments for this week"
                            >
                                <Trash2 className="w-3 h-3" />
                                {confirmClear ? 'Confirm Delete?' : 'Clear Week'}
                            </button>
                            <button
                                onClick={handleAutoSchedule}
                                disabled={isScheduling}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 mr-2 ${confirmSchedule
                                    ? 'bg-blue-600 text-white animate-pulse font-bold'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    }`}
                            >
                                <Wand2 className="w-3 h-3" />
                                {isScheduling ? 'Scheduling...' : (confirmSchedule ? 'Run Schedule?' : 'Auto-Schedule')}
                            </button>
                            {hasLastReport && (
                                <button
                                    onClick={handleViewLastReport}
                                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors border border-neutral-700 mr-2"
                                >
                                    View Last Report
                                </button>
                            )}
                            <button
                                onClick={() => setViewMode(viewMode === 'list' ? 'week' : 'list')}
                                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors border border-neutral-700"
                            >
                                {viewMode === 'list' ? 'Switch to Grid' : 'Switch to List'}
                            </button>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                            <table className="w-full text-left">
                                <thead className="text-sm text-neutral-400 border-b border-neutral-800">
                                    <tr>
                                        <th className="pb-4 font-medium">Trainer</th>
                                        <th className="pb-4 font-medium">Client</th>
                                        <th className="pb-4 font-medium">Date & Time</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-neutral-500">
                                                No appointments found for search "{searchQuery}".
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAppointments.map((appt) => {
                                            const trainer = trainers.find(t => t.id === appt.trainer_id);
                                            const date = new Date(appt.start_time);
                                            return (
                                                <tr key={appt.id} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/20 transition-colors">
                                                    <td className="py-4 text-white font-medium">{trainer?.name || 'Unknown'}</td>
                                                    <td className="py-4 text-neutral-300">
                                                        <div className="flex flex-col">
                                                            <span>{appt.client_name}</span>
                                                            <span className="text-xs text-neutral-500">{appt.client_email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-neutral-300">
                                                        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${appt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                                            appt.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-500'
                                                            }`}>
                                                            {appt.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        {appt.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => handleCancelAppointment(appt.id)}
                                                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                                                title="Cancel Appointment"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Grid Header */}
                                <div className="grid grid-cols-8 border-b border-neutral-800">
                                    <div className="p-4 text-neutral-500 text-xs font-medium border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10">
                                        Time
                                    </div>
                                    {weekDays.map((day, idx) => (
                                        <div key={idx} className={`p-4 text-center border-r border-neutral-800 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-500/5' : ''}`}>
                                            <div className={`text-xs font-medium uppercase mb-1 ${isSameDay(day, new Date()) ? 'text-blue-500' : 'text-neutral-500'}`}>
                                                {format(day, 'EEE')}
                                            </div>
                                            <div className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-white'}`}>
                                                {format(day, 'd')}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Grid Body */}
                                <div>
                                    {timeSlots.map((hour) => (
                                        <div key={hour} className="grid grid-cols-8 border-b border-neutral-800 last:border-b-0 min-h-[100px]">
                                            {/* Time Column */}
                                            <div className="p-2 text-right text-xs text-neutral-500 border-r border-neutral-800 sticky left-0 bg-neutral-900 z-10">
                                                {hour}:00
                                            </div>

                                            {/* Day Columns */}
                                            {weekDays.map((day, dayIdx) => {
                                                // Find appointments for this day and hour
                                                const slotAppts = filteredAppointments.filter(appt => {
                                                    const apptDate = parseISO(appt.start_time);
                                                    return isSameDay(apptDate, day) && apptDate.getHours() === hour;
                                                });

                                                const TRAINER_COLORS = [
                                                    { bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:bg-blue-500/20' },
                                                    { bg: 'bg-green-500/10', border: 'border-green-500/20', hover: 'hover:bg-green-500/20' },
                                                    { bg: 'bg-purple-500/10', border: 'border-purple-500/20', hover: 'hover:bg-purple-500/20' },
                                                    { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', hover: 'hover:bg-yellow-500/20' },
                                                    { bg: 'bg-pink-500/10', border: 'border-pink-500/20', hover: 'hover:bg-pink-500/20' },
                                                ];

                                                const getTrainerColor = (trainerId: number) => {
                                                    const index = trainerId % TRAINER_COLORS.length;
                                                    const color = TRAINER_COLORS[index];
                                                    return `${color.bg} ${color.border} ${color.hover}`;
                                                };

                                                return (
                                                    <div key={dayIdx} className={`p-1 border-r border-neutral-800 last:border-r-0 relative group ${isSameDay(day, new Date()) ? 'bg-blue-500/5' : ''}`}>
                                                        {slotAppts.map((appt) => {
                                                            const trainer = trainers.find(t => t.id === appt.trainer_id);
                                                            return (
                                                                <div
                                                                    key={appt.id}
                                                                    className={`mb-1 p-2 rounded-md border text-xs cursor-pointer transition-colors ${appt.status === 'cancelled'
                                                                        ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                                                                        : getTrainerColor(appt.trainer_id || 0)
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <span className={`font-semibold ${appt.status === 'cancelled' ? 'text-red-400 line-through' : 'text-white'}`}>
                                                                            {trainer?.name.split(' ')[0]}
                                                                        </span>
                                                                        {appt.status !== 'cancelled' && (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleCancelAppointment(appt.id); }}
                                                                                className="text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                title="Cancel"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-neutral-300 truncate mt-1">
                                                                        {appt.client_name}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Report Modal */}
            {scheduleReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-purple-500" />
                                Auto-Schedule Results
                            </h2>
                            <button onClick={() => setScheduleReport(null)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Success Stats */}
                            <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <div className="p-2 bg-green-500 rounded-full text-black">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-green-400 font-bold uppercase">Success</p>
                                    <p className="text-2xl font-bold text-white">{scheduleReport.success_count} Bookings Created</p>
                                </div>
                            </div>

                            {/* Failures List */}
                            {scheduleReport.failed_assignments.length > 0 ? (
                                <div>
                                    <h4 className="text-sm font-bold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        Missed Opportunities ({scheduleReport.failed_assignments.length})
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                        {scheduleReport.failed_assignments.map((fail: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-neutral-800/50 border border-neutral-800 rounded-lg text-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-white">{fail.client}</span>
                                                    <span className="text-red-400 font-medium">{fail.slot}</span>
                                                </div>
                                                <p className="text-neutral-500 text-xs">{fail.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-neutral-500 py-4">
                                    All requested slots were successfully booked!
                                </div>
                            )}

                            {/* AI Resolution Section - AUTOMATIC */}
                            {scheduleReport.resolved_count > 0 && (
                                <div className="mt-6 border-t border-neutral-800 pt-6 animate-in slide-in-from-bottom-2 fade-in">
                                    <h4 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <BrainCircuit className="w-4 h-4" />
                                        AI Resolution Results
                                    </h4>
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
                                        <p className="text-xl font-bold text-white mb-1">{scheduleReport.resolved_count} Conflicts Resolved</p>
                                        <p className="text-xs text-neutral-400">Alternative slots found and automatically booked.</p>
                                    </div>
                                    {scheduleReport.resolution_details && scheduleReport.resolution_details.length > 0 && (
                                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            {scheduleReport.resolution_details.map((det: any, idx: number) => (
                                                <div key={idx} className="p-2 text-sm border-l-2 border-green-500 pl-3 bg-neutral-800/30 rounded-r-md">
                                                    <div className="flex justify-between text-neutral-300 mb-1">
                                                        <span>{det.client.split('@')[0]}</span>
                                                        <span className="text-xs text-neutral-500">{det.trainer}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="line-through text-red-400/70">{det.original_slot}</span>
                                                        <span>→</span>
                                                        <span className="text-green-400 font-bold">{det.new_slot}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setScheduleReport(null)}
                                className="w-full py-3 bg-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-700 transition-colors mt-2"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
