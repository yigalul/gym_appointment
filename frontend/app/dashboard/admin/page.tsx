'use client';

import { getTrainers, getUsers, createTrainerUser, deleteTrainer } from '@/lib/store';
import { User, Trainer } from '@/lib/types';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('Strength Coach');

    const refreshData = () => {
        getUsers().then(setUsers);
        getTrainers().then(setTrainers);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleAddTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await createTrainerUser(newName, newRole, newEmail, "Expert trainer.");
        if (success) {
            alert('Trainer added successfully!');
            setIsAdding(false);
            setNewName('');
            setNewEmail('');
            refreshData();
        } else {
            alert('Failed to add trainer.');
        }
    };

    const handleDeleteTrainer = async (userId: number) => {
        if (!confirm('Are you sure? This will delete the trainer and their account.')) return;

        // Find trainer ID from user ID
        const trainer = trainers.find(t => t.user_id === userId);
        if (!trainer) {
            // Fallback: If no trainer profile linked but role is trainer, maybe just delete user? 
            // For now, simpler to assume integrity. Or user might be 'trainer' role but no profile yet?
            // Let's just alert.
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
                    <p className="text-neutral-400 mt-2">System statistics and user management.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    {isAdding ? 'Cancel' : 'Add Trainer'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-neutral-800/50 border border-blue-500/30 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Add New Trainer</h3>
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
                        <div className="flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
                                Create Account
                            </button>
                        </div>
                    </form>
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
                                <div className="text-sm text-neutral-500 capitalize">{user.role}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-neutral-600">ID: {user.id}</div>
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
