'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Settings, LogOut, Users, User, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/lib/store';
import { User as UserType } from '@/lib/types';
import { useEffect, useState } from 'react';

const MAIN_NAV = [
    { name: 'Trainer Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Clients (Trainer)', href: '/dashboard/clients', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const CLIENT_NAV = [
    { name: 'Find a Trainer', href: '/dashboard/client', icon: Dumbbell },
];

const ADMIN_NAV = [
    { name: 'Admin Overview', href: '/dashboard/admin', icon: User }, // Note: Lucide User icon might conflict with UserType if not careful
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [user, setUser] = useState<UserType | null>(null);

    useEffect(() => {
        setUser(getCurrentUser());
    }, []);

    // Helper to determine if a section should be shown
    const showTrainer = user?.role === 'trainer';
    const showClient = user?.role === 'client';
    const showAdmin = user?.role === 'admin';

    // Fallback if no user - maybe show distinct items or redirect (for now just show nothing specific)

    return (
        <div className="min-h-screen bg-black flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900/30 backdrop-blur-xl fixed h-full z-10 hidden md:block">
                <div className="p-6 border-b border-neutral-800">
                    <Link href="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-lg">💪</span>
                        </div>
                        GymApp
                    </Link>
                </div>

                <nav className="p-4 space-y-8 overflow-y-auto h-[calc(100vh-80px)]">
                    {/* Trainer Section - Only for Trainers */}
                    {showTrainer && (
                        <div>
                            <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Trainer</h3>
                            <ul className="space-y-1">
                                {MAIN_NAV.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                                    isActive
                                                        ? "bg-blue-600/10 text-blue-500"
                                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <Icon className={cn("w-4 h-4", isActive ? "text-blue-500" : "text-neutral-500 group-hover:text-white")} />
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Client Section - Only for Clients */}
                    {showClient && (
                        <div>
                            <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Client</h3>
                            <ul className="space-y-1">
                                {CLIENT_NAV.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                                    isActive
                                                        ? "bg-purple-600/10 text-purple-500"
                                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <Icon className={cn("w-4 h-4", isActive ? "text-purple-500" : "text-neutral-500 group-hover:text-white")} />
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {/* Admin Section - Only for Admins */}
                    {showAdmin && (
                        <div>
                            <h3 className="px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Admin</h3>
                            <ul className="space-y-1">
                                {ADMIN_NAV.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                                    isActive
                                                        ? "bg-green-600/10 text-green-500"
                                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <Icon className={cn("w-4 h-4", isActive ? "text-green-500" : "text-neutral-500 group-hover:text-white")} />
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </nav>

                <div className="absolute bottom-6 left-0 w-full px-6">
                    <Link href="/login" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium">
                        <LogOut className="w-4 h-4" />
                        Switch Role / Logout
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
