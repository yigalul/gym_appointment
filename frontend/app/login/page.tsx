'use client';

import { getUsers, loginUser } from '@/lib/store';
import { User } from '@/lib/types';
import { getCurrentUser } from '@/lib/store'; // Ensure this is exported if I used it, otherwise just loginUser
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getUsers().then(data => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    const handleLogin = (user: User) => {
        loginUser(user);

        // Redirect based on role
        if (user.role === 'admin') {
            router.push('/dashboard/admin');
        } else if (user.role === 'trainer') {
            router.push('/dashboard'); // Main trainer dashboard
        } else {
            router.push('/dashboard/client');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading users...</div>;

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">Select a Role</h2>
                    <p className="mt-2 text-neutral-400">Simulate login as different credentials</p>
                </div>

                <div className="grid gap-4 mt-8">
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => handleLogin(user)}
                            className="flex items-center justify-between w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:border-neutral-700 transition-all group"
                        >
                            <div className="text-left">
                                <div className="font-semibold text-white capitalize">{user.role}</div>
                                <div className="text-sm text-neutral-500">{user.email}</div>
                            </div>
                            <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                Login &rarr;
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
