'use client';

import { getTrainers, getUsers, createTrainerUser, deleteTrainer, createClientUser, updateClientUser } from '@/lib/store';
import { User, Trainer } from '@/lib/types';
import { Users, UserPlus, Trash2, Plus, X, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);

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
    const [defaultSlots, setDefaultSlots] = useState<{ day_of_week: number; start_time: string }[]>([]);

    // Slot Inputs
    const [slotDay, setSlotDay] = useState(1);
    const [slotTime, setSlotTime] = useState('09:00');

    const refreshData = () => {
        getUsers().then(setUsers);
        getTrainers().then(setTrainers);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const resetForms = () => {
        setNewName('');
        setNewEmail('');
        setClientEmail('');
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
        const success = await createClientUser(clientEmail, defaultSlots);
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
        const success = await updateClientUser(editingUserId, clientEmail, defaultSlots);
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
        setDefaultSlots(user.default_slots || []);
        setUserType('client');
        setIsEditing(true);
        setIsAdding(true); // Open the form area
    };

    const addSlot = () => {
        setDefaultSlots([...defaultSlots, { day_of_week: slotDay, start_time: slotTime }]);
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
                    <p className="text-neutral-400 mt-2">System statistics and user management.</p>
                </div>
                <button
                    onClick={() => {
                        if (isAdding) {
                            resetForms();
                        } else {
                            setIsAdding(true);
                        }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    {isAdding ? 'Cancel' : 'Add User'}
                </button>
            </div>

            {isAdding && (
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
                                    <input
                                        type="time"
                                        value={slotTime} onChange={e => setSlotTime(e.target.value)}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                                    />
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
            </div>

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
        </div>
    );
}
