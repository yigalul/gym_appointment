'use client';

import { getTrainers, getUsers, createTrainerUser, deleteTrainer, createClientUser, updateClientUser, getAppointments, cancelAppointment } from '@/lib/store';
import { User, Trainer, Appointment } from '@/lib/types';
import { Users, UserPlus, Trash2, Plus, X, Pencil, Calendar, XCircle, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Dashboard State
    const [activeTab, setActiveTab] = useState<'trainers' | 'clients' | 'appointments'>('trainers');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [userType, setUserType] = useState<'trainer' | 'client'>('trainer');

    // Trainer Form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('Strength Coach');

    // Client Form
    const [clientEmail, setClientEmail] = useState('');
    const [clientWeeklyLimit, setClientWeeklyLimit] = useState(3);
    const [defaultSlots, setDefaultSlots] = useState<{ day_of_week: number; start_time: string }[]>([]);

    // Slot Inputs
    const [slotDay, setSlotDay] = useState(1);
    const [slotHour, setSlotHour] = useState(9); // 0-23

    const refreshData = () => {
        getUsers().then(setUsers);
        getTrainers().then(setTrainers);
        getAppointments().then(setAppointments);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const resetForms = () => {
        setNewName('');
        setNewEmail('');
        setClientEmail('');
        setClientWeeklyLimit(3);
        setDefaultSlots([]);
        setIsAdding(false);
        setIsEditing(false);
        setEditingUserId(null);
    };

    const handleAddTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createTrainerUser(newName, newRole, newEmail, "Expert trainer.");
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
        const success = await createClientUser(clientEmail, defaultSlots, clientWeeklyLimit);
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
        const success = await updateClientUser(editingUserId, clientEmail, defaultSlots, clientWeeklyLimit);
        if (success) {
            alert('Client updated successfully!');
            resetForms();
            refreshData();
        } else {
            alert('Failed to update client.');
        }
    };

    const startEditClient = (user: User) => {
        setEditingUserId(user.id);
        setClientEmail(user.email);
        setClientWeeklyLimit(user.weekly_workout_limit || 3);
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
                                setUserType(activeTab === 'trainers' ? 'trainer' : 'client');
                                setIsAdding(true);
                            }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors self-start md:self-auto"
                    >
                        <UserPlus className="w-4 h-4" />
                        {isAdding ? 'Cancel' : (activeTab === 'trainers' ? 'Add Trainer' : 'Add Client')}
                    </button>
                )}
            </div>

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
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="email" placeholder="Email Address" required
                                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <input
                                    type="text" placeholder="Specialty / Role" required
                                    value={newRole} onChange={e => setNewRole(e.target.value)}
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
                        <form onSubmit={isEditing ? handleUpdateClient : handleAddClient} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="email" placeholder="Client Email" required
                                    value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-neutral-400">Weekly Workout Limit</label>
                                    <input
                                        type="number" min="1" max="7" required
                                        value={clientWeeklyLimit} onChange={e => setClientWeeklyLimit(Number(e.target.value))}
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
                                            <div className="text-sm text-neutral-500">{trainer.specialty}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-neutral-600 hidden md:block">{trainer.availability || 'No schedule'}</div>
                                        <button
                                            onClick={() => handleDeleteTrainer(trainer.user_id)}
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
                                        <div className="font-medium text-white">{user.email}</div>
                                        <div className="text-sm text-neutral-500 mt-1 flex gap-2 items-center">
                                            <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-xs">
                                                Limit: {user.weekly_workout_limit || 3}/wk
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
                                    <button
                                        onClick={() => startEditClient(user)}
                                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Edit Client Attributes"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: APPOINTMENTS */}
            {activeTab === 'appointments' && (
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">All Appointments</h3>
                    <div className="overflow-x-auto">
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
                                            {appointments.length === 0 ? 'No appointments found.' : `No appointments matching "${searchQuery}".`}
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
                </div>
            )}

        </div>
    );
}
