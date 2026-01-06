'use client';

import { MOCK_TRAINERS } from '@/lib/store';
import { Camera, Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    // Mock logged-in user
    const [trainer, setTrainer] = useState(MOCK_TRAINERS[0] || {
        name: 'Sarah Connor',
        role: 'Strength Coach',
        bio: 'Specializing in functional training.',
        photo_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=200&h=200'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTrainer({ ...trainer, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        alert('Settings saved (locally)!');
        // In real app, PATCH /trainers/{id}
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-neutral-400 mt-2">Update your profile and account preferences.</p>
            </div>

            <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 p-6 space-y-6">
                <div className="flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                        <img
                            src={trainer.photo_url}
                            alt={trainer.name}
                            className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700 group-hover:border-blue-500 transition-colors"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Profile Photo</h3>
                        <p className="text-sm text-neutral-400">Click to upload a new one.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Display Name</label>
                        <input
                            type="text"
                            name="name"
                            value={trainer.name}
                            onChange={handleChange}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Role / Title</label>
                        <input
                            type="text"
                            name="role"
                            value={trainer.role}
                            onChange={handleChange}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-300">Bio</label>
                        <textarea
                            name="bio"
                            value={trainer.bio}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
