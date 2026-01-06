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
            const isValid = (user.role === 'admin' && password === 'adminpassword') ||
                (user.role === 'trainer' && password === 'trainerpassword') ||
                (user.role === 'client' && (password === 'clientpassword' || password === 'password123' || password === 'GymStrong2026!'));

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

                    <div className="mt-4 p-4 bg-neutral-950/50 rounded text-xs text-neutral-500 space-y-2">
                        <p className="font-semibold mb-2">Click to auto-fill Demo Credentials:</p>
                        <button
                            type="button"
                            onClick={() => { setEmail('admin@gym.com'); setPassword('adminpassword'); }}
                            className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors"
                        >
                            <span className="text-blue-400">Admin:</span> admin@gym.com / adminpassword
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail('sarah@gym.com'); setPassword('trainerpassword'); }}
                            className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors"
                        >
                            <span className="text-purple-400">Trainer:</span> sarah@gym.com / trainerpassword
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail('client@example.com'); setPassword('clientpassword'); }}
                            className="block w-full text-left p-2 hover:bg-neutral-800 rounded transition-colors"
                        >
                            <span className="text-green-400">Client:</span> client@example.com / clientpassword
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
