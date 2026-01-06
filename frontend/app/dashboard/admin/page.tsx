'use client';

import { getTrainers, getUsers, createTrainerUser, deleteTrainer, createClientUser, updateClientUser, getAppointments, cancelAppointment } from '@/lib/store';
import { User, Trainer, Appointment } from '@/lib/types';
import { Users, UserPlus, Trash2, Plus, X, Pencil, Calendar, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

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
        setIsAdding(true); // Open the form area
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

        // Find trainer ID from user ID
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

    return (
        <div className="space-y-8">
            {/* ... previous content ... */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
                    {/* ... */}
                </div>
                {/* ... */}
            </div>

            {/* We are inserting this section at the bottom of the main div, so we need to be careful with replace chunks or just append it before existing lists */}
            {/* Actually, let's just append the appointments section at the very end of the return, before the closing </div> */}

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
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                                        No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appt) => {
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

            {/* Existing User/Trainer Lists (which we need to make sure we don't overwrite blindly) */}
            {/* To avoid huge complexity, I will append this section AFTER the Clients list, which is near the end of the file/component. */}
        </div>
    );

    {
        isAdding && (
            <div className="bg-neutral-800/50 border border-blue-500/30 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                {!isEditing && (
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setUserType('trainer')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${userType === 'trainer' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                        >
                            Add Trainer
                        </button>
                        <button
                            onClick={() => setUserType('client')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${userType === 'client' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}`}
                        >
                            Add Client
                        </button>
                    </div>
                )}

                {isEditing && (
                    <div className="mb-6 pb-4 border-b border-neutral-700">
                        <h3 className="text-lg font-semibold text-white">Editing Client: {clientEmail}</h3>
                    </div>
                )}

                {userType === 'trainer' ? (
                    <form onSubmit={handleAddTrainer} className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">New Trainer Details</h3>
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
                        <div className="flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
                                Create Trainer
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={isEditing ? handleUpdateClient : handleAddClient} className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">{isEditing ? 'Update Client Details' : 'New Client Details'}</h3>
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
                                    {Array.from({ length: 14 }).map((_, i) => { // 7am to 8pm roughly
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
            </div>
        )
    }

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-neutral-300">Total Users</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                </div>
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
                        <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-neutral-300">Total Bookings</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{appointments.filter(a => a.status !== 'cancelled').length}</p>
                </div>
            </div >

        <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="p-6 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-white">All Users</h3>
            </div>
            <div>
                {users.map((user, idx) => (
                    <div key={user.id} className={`p-4 flex items-center justify-between ${idx !== users.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                        <div>
                            <div className="font-medium text-white">{user.email}</div>
                            <div className="text-sm text-neutral-500 capitalize flex items-center gap-2">
                                {user.role}
                                {user.default_slots && user.default_slots.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded-full text-neutral-400">
                                        {user.default_slots.length} Slots
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-neutral-600">ID: {user.id}</div>
                            {user.role === 'client' && (
                                <button
                                    onClick={() => startEditClient(user)}
                                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    title="Edit Client"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                            {user.role === 'trainer' && (
                                <button
                                    onClick={() => handleDeleteTrainer(user.id)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Trainer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

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
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                                        No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appt) => {
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
                                                {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    appt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
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

        </div >
    );
}
