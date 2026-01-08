'use client';

import { getUsers, loginUser } from '@/lib/store';
import { User } from '@/lib/types';
import { getCurrentUser } from '@/lib/store'; // Ensure this is exported if I used it, otherwise just loginUser
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUsers().then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    const performLogin = (uEmail: string, uPassword: string = 'GymStrong2026!') => {
        setError('');

        const user = users.find(u => u.email === uEmail.trim());

        if (user) {
            // Demo password check - strictly for demo purposes
            if (uPassword === 'GymStrong2026!') {
                loginUser(user);
                if (user.role === 'admin') {
                    router.push('/dashboard/admin');
                } else if (user.role === 'trainer') {
                    router.push('/dashboard');
                } else {
                    router.push('/dashboard/client');
                }
            } else {
                setError('Invalid credentials');
            }
        } else {
            setError('User not found');
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        performLogin(email, password);
    };

    // ... (loading state)

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-2xl">
                {/* ... (header) ... */}

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* ... (inputs) ... */}

                    {/* ... (submit button) ... */}

                    <div className="mt-4 p-4 bg-neutral-950/50 rounded text-xs text-neutral-500 space-y-4 max-h-80 overflow-y-auto border border-neutral-900 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500 text-base">⚡️</span>
                            <p className="font-semibold text-neutral-400">Quick Login Shortcuts</p>
                        </div>

                        {/* Empty State / Seed Button */}
                        {!loading && users.length === 0 && (
                            <div className="text-center py-4">
                                <p className="text-neutral-500 text-sm mb-3">No users found.</p>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setLoading(true);
                                        const API_Base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                        try {
                                            await fetch(`${API_Base}/test-seed`);
                                            // Wait a sec then reload users
                                            setTimeout(async () => {
                                                const data = await getUsers();
                                                setUsers(data);
                                                setLoading(false);
                                            }, 1000);
                                        } catch (err) {
                                            console.error(err);
                                            setLoading(false);
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors w-full"
                                >
                                    ⚡️ Initialize Demo Data
                                </button>
                            </div>
                        )}

                        {/* Admin Section */}
                        <div className="space-y-1">
                            <p className="text-blue-400 font-bold sticky top-0 bg-neutral-900/90 py-1 px-1 rounded-sm backdrop-blur-sm">Admin</p>
                            {users.filter(u => u.role === 'admin').map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => performLogin(u.email)}
                                    className="w-full text-left p-2.5 hover:bg-neutral-800 bg-neutral-900/30 rounded-md transition-all border border-transparent hover:border-neutral-700 flex items-center justify-between group"
                                    title={`Login as ${u.email}`}
                                >
                                    <span className="text-neutral-300 truncate">Admin ({u.email})</span>
                                    <span className="opacity-0 group-hover:opacity-100 text-blue-500 font-bold px-2">Go &rarr;</span>
                                </button>
                            ))}
                        </div>

                        {/* Trainers Section */}
                        <div className="space-y-1">
                            <p className="text-purple-400 font-bold sticky top-0 bg-neutral-900/90 py-1 px-1 rounded-sm backdrop-blur-sm">Trainers</p>
                            {users.filter(u => u.role === 'trainer').map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => performLogin(u.email)}
                                    className="w-full text-left p-2.5 hover:bg-neutral-800 bg-neutral-900/30 rounded-md transition-all border border-transparent hover:border-neutral-700 flex items-center justify-between group"
                                    title={`Login as ${u.email}`}
                                >
                                    <span className="text-neutral-300 truncate">{u.name || u.email.split('@')[0]}</span>
                                    <span className="opacity-0 group-hover:opacity-100 text-purple-500 font-bold px-2">Go &rarr;</span>
                                </button>
                            ))}
                        </div>

                        {/* Clients Section */}
                        <div className="space-y-1">
                            <p className="text-green-400 font-bold sticky top-0 bg-neutral-900/90 py-1 px-1 rounded-sm backdrop-blur-sm">Clients</p>
                            {users.filter(u => u.role === 'client').map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => performLogin(u.email)}
                                    className="w-full text-left p-2.5 hover:bg-neutral-800 bg-neutral-900/30 rounded-md transition-all border border-transparent hover:border-neutral-700 flex items-center justify-between group"
                                    title={`Login as ${u.email}`}
                                >
                                    <span className="text-neutral-300 truncate">{u.name || u.email.split('@')[0]}</span>
                                    <span className="opacity-0 group-hover:opacity-100 text-green-500 font-bold px-2">Go &rarr;</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </form>

                <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                        API: {process.env.NEXT_PUBLIC_API_URL || 'LOCALHOST (Checking...)'}
                    </p>
                </div>
            </div>
        </div>
    );
}
