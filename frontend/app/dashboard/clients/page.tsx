'use client';

import { getAppointments } from '@/lib/store';
import { Appointment } from '@/lib/types';
import { Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Client {
    name: string;
    email: string;
    lastSession: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        getAppointments().then(appointments => {
            const uniqueClients: Record<string, Client> = {};

            appointments.forEach(app => {
                if (!uniqueClients[app.client_email]) {
                    uniqueClients[app.client_email] = {
                        name: app.client_name,
                        email: app.client_email,
                        lastSession: app.start_time
                    };
                } else {
                    // Update last session if this one is later
                    if (new Date(app.start_time) > new Date(uniqueClients[app.client_email].lastSession)) {
                        uniqueClients[app.client_email].lastSession = app.start_time;
                    }
                }
            });

            setClients(Object.values(uniqueClients));
        });
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Clients</h1>
                <p className="text-neutral-400 mt-2">Manage your client base.</p>
            </div>

            <div className="bg-neutral-800/30 rounded-xl border border-neutral-800 overflow-hidden">
                <div className="p-6 border-b border-neutral-800">
                    <h3 className="text-lg font-semibold text-white">Active Clients</h3>
                </div>
                <div className="p-6">
                    {clients.length === 0 ? (
                        <p className="text-neutral-400">No clients found.</p>
                    ) : (
                        <div className="grid gap-4">
                            {clients.map((client, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-neutral-800 rounded-full text-neutral-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">{client.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-neutral-400">
                                                <Mail className="w-3 h-3" />
                                                <span>{client.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                        Last session: {new Date(client.lastSession).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
