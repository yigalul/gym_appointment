'use client';

import { getUsers, loginUser, loginUserViaApi } from '@/lib/store';
import { User } from '@/lib/types';
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

    const performLogin = async (uEmail: string, uPassword: string = '') => {
        setError('');
        setLoading(true);

        // 1. Try Manual API Login
        if (uPassword && uPassword !== 'GymStrong2026!') {
            const user = await loginUserViaApi(uEmail, uPassword);
            if (user) {
                finalizeLogin(user);
                return;
            }
            setError('Invalid email or password.');
            setLoading(false);
            return;
        }

        // 2. Fallback to Demo Login (if password is default or empty/shortcut)
        const user = users.find(u => u.email === uEmail.trim());
        if (user) {
            finalizeLogin(user);
        } else {
            setError('User not found.');
            setLoading(false);
        }
    };

    const finalizeLogin = (user: User) => {
        loginUser(user);
        if (user.role === 'admin') {
            router.push('/dashboard/admin');
        } else if (user.role === 'trainer') {
            router.push('/dashboard');
        } else {
            router.push('/dashboard/client');
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

                    <div className="border-t border-neutral-800 pt-6 mt-6">
                        <div className="text-center text-xs text-neutral-500 uppercase tracking-widest mb-4">Or Login Manually</div>
                        <div className="space-y-3">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="off"
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors placeholder-neutral-600"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password"
                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors placeholder-neutral-600"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'Sign In'}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="mt-6 pt-4 border-t border-neutral-800 text-center space-y-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                        API: {process.env.NEXT_PUBLIC_API_URL || 'LOCALHOST (Checking...)'}
                    </p>
                    <button
                        onClick={async () => {
                            if (!confirm("Reset all data to default demo set? This cannot be undone.")) return;
                            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            await fetch(`${API}/test-seed?force=true`);
                            window.location.reload();
                        }}
                        className="text-[10px] text-red-900 hover:text-red-500 underline transition-colors"
                    >
                        [Reset Demo Data]
                    </button>
                </div>
            </div >
        </div >
    );
}
