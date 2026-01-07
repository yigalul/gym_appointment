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

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.email === email.trim());

        // Simple password check (in real app this would be server-side)
        // For now we check if hashed_password matches input or if it's just a simulation
        if (user) {
            // For simplicity in this demo, we accept the correct password OR just the user existence if no password provided in UI logic before
            // checking basic hardcoded passwords for the demo roles:
            // In a real app, strict server-side validation.
            // For this demo, we can just check against the universal strong password
            const isValid = password === 'GymStrong2026!';

            if (isValid) {
                loginUser(user);
                // Redirect based on role (still needed for routing, but hidden from user)
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

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="mt-2 text-neutral-400">Please sign in to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-600 transition-colors"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-black border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-blue-600 transition-colors"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Sign In
                    </button>

                    <div className="mt-4 p-4 bg-neutral-950/50 rounded text-xs text-neutral-500 space-y-2 max-h-48 overflow-y-auto">
                        <p className="font-semibold mb-2">Click to auto-fill Demo Credentials (Password: GymStrong2026!):</p>

                        <div className="space-y-1">
                            <p className="text-blue-400 font-bold">Admin</p>
                            <button type="button" onClick={() => { setEmail('admin@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Admin (admin@gym.com)
                            </button>
                        </div>

                        <div className="space-y-1">
                            <p className="text-purple-400 font-bold">Trainers</p>
                            <button type="button" onClick={() => { setEmail('sarah@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Sarah (sarah@gym.com)
                            </button>
                            <button type="button" onClick={() => { setEmail('mike@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Mike (mike@gym.com)
                            </button>
                        </div>

                        <div className="space-y-1">
                            <p className="text-green-400 font-bold">Clients</p>
                            <button type="button" onClick={() => { setEmail('alice@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Alice (alice@gym.com)
                            </button>
                            <button type="button" onClick={() => { setEmail('bob@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Bob (bob@gym.com)
                            </button>
                            <button type="button" onClick={() => { setEmail('charlie@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Charlie (charlie@gym.com)
                            </button>
                            <button type="button" onClick={() => { setEmail('dave@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Dave (dave@gym.com)
                            </button>
                            <button type="button" onClick={() => { setEmail('eve@gym.com'); setPassword('GymStrong2026!'); }} className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors text-neutral-300">
                                Eve (eve@gym.com)
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
