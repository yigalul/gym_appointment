import { Trainer, Appointment, User, Availability } from './types';

// Use environment variable for production, fallback to localhost for dev
const API_Base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Mock Auth State (in a real app, use Context or a library)
export let CURRENT_USER: User | null = null;

export function loginUser(user: User) {
    CURRENT_USER = user;
    if (typeof window !== 'undefined') {
        localStorage.setItem('gym_user', JSON.stringify(user));
    }
}

export function logoutUser() {
    CURRENT_USER = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('gym_user');
    }
}

export function getCurrentUser(): User | null {
    if (CURRENT_USER) return CURRENT_USER;
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('gym_user');
        if (stored) {
            CURRENT_USER = JSON.parse(stored);
            return CURRENT_USER;
        }
    }
    return null;
}

export async function loginUserViaApi(email: string, password: string): Promise<User | null> {
    try {
        const res = await fetch(`${API_Base}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getUsers(): Promise<User[]> {
    try {
        const res = await fetch(`${API_Base}/users/?t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}



export async function getUser(userId: number): Promise<User | null> {
    try {
        const res = await fetch(`${API_Base}/users/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getTrainers(): Promise<Trainer[]> {
    try {
        const res = await fetch(`${API_Base}/trainers/`);
        if (!res.ok) throw new Error('Failed to fetch trainers');
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getTrainerById(id: number): Promise<Trainer | undefined> {
    try {
        const res = await fetch(`${API_Base}/trainers/${id}`);
        if (!res.ok) return undefined;
        return res.json();
    } catch (error) {
        console.error(error);
        return undefined;
    }
}

export async function deleteTrainer(trainerId: number): Promise<{ success: boolean; report?: any[] }> {
    try {
        const res = await fetch(`${API_Base}/trainers/${trainerId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete trainer');
        const data = await res.json();
        return { success: true, report: data.affected_clients };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}

// Updated to accept password
export async function addFullWeekAvailability(trainerId: number, startTime: string = '09:00', endTime: string = '17:00'): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/trainers/${trainerId}/availability/all-week?start_time=${startTime}&end_time=${endTime}`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to add full week');
        return true;
    } catch (error) {
        console.error("WhatsApp Error:", error);
        return false;
    }
}

// --- System Settings ---
export async function getSystemWeek(): Promise<string> {
    try {
        const res = await fetch(`${API_Base}/settings/current-week`);
        const data = await res.json();
        return data.date;
    } catch (error) {
        console.error("Get System Week Error:", error);
        return new Date().toISOString().split('T')[0];
    }
}

export async function updateSystemWeek(date: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/settings/current-week`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date })
        });
        return res.ok;
    } catch (error) {
        console.error("Update System Week Error:", error);
        return false;
    }
}

interface CreateTrainerParams {
    name: string;
    role: string;
    bio: string;
    photo_url?: string;
    email: string;
    password: string;
}

export async function createTrainerUser(params: CreateTrainerParams): Promise<boolean> {
    try {
        // 1. Create User
        const userRes = await fetch(`${API_Base}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: params.email,
                password: params.password,
                role: 'trainer'
            })
        });
        if (!userRes.ok) throw new Error('Failed to create user account');
        const user = await userRes.json();

        // 2. Create Trainer Profile linked to user
        const trainerRes = await fetch(`${API_Base}/trainers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: params.name,
                role: params.role,
                bio: params.bio,
                user_id: user.id,
                photo_url: params.photo_url
            })
        });
        if (!trainerRes.ok) throw new Error('Failed to create trainer profile');

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function addUser(user: Partial<User>, password?: string): Promise<User> {
    const payload = {
        email: user.email,
        password: password || 'GymStrong2026!', // Default password if not validating logic here
        role: user.role,
        phone_number: user.phone_number,
        first_name: user.first_name,
        last_name: user.last_name,
        default_slots: user.default_slots || []
    };
    try {
        const res = await fetch(`${API_Base}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || 'Failed to add user');
        }
        return res.json();
    } catch (error) {
        console.error("Add User Error:", error);
        throw error;
    }
}

export async function createClientUser(email: string, name: string, limit: number, credits: number, profile_picture_url?: string): Promise<boolean> {
    try {
        const [first, ...lastParts] = name.split(' ');
        const last = lastParts.join(' ');

        const res = await fetch(`${API_Base}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password: 'password123', // Default
                role: 'client',
                first_name: first,
                last_name: last,
                weekly_workout_limit: limit,
                workout_credits: credits,
                profile_picture_url: profile_picture_url
            })
        });
        if (!res.ok) throw new Error('Failed to create user');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}


// Update User Defaults Only
export async function updateClientDefaults(userId: number, defaultSlots: { day_of_week: number; start_time: string }[]): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                default_slots: defaultSlots
            })
        });
        if (!res.ok) throw new Error('Failed to update defaults');

        // Update local storage if current user
        if (CURRENT_USER && CURRENT_USER.id === userId) {
            const updatedUser = { ...CURRENT_USER, default_slots: defaultSlots };
            loginUser(updatedUser);
        }

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// Update Full User (Admin)
export async function updateClientUser(id: number, email: string, name: string, limit: number, credits: number, profile_picture_url?: string): Promise<boolean> {
    try {
        const [first, ...lastParts] = name.split(' ');
        const last = lastParts.join(' ');

        const res = await fetch(`${API_Base}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                first_name: first,
                last_name: last,
                weekly_workout_limit: limit,
                workout_credits: credits,
                profile_picture_url: profile_picture_url
            })
        });
        if (!res.ok) throw new Error('Failed to update user');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function deleteUser(userId: number): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/users/${userId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete user');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

// --- Availability ---

export async function addAvailability(trainerId: number, availability: Partial<Availability>): Promise<Availability | null> {
    try {
        const res = await fetch(`${API_Base}/trainers/${trainerId}/availability/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(availability),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to add availability');
        }
        return await res.json();
    } catch (error) {
        console.error("Add Availability Error:", error);
        throw error; // Re-throw to handle in UI
    }
}

export async function deleteAvailability(availabilityId: number): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/availability/${availabilityId}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch (error) {
        console.error("Delete Availability Error:", error);
        return false;
    }
}

// Fetch appointments
export async function getAppointments(): Promise<Appointment[]> {
    try {
        const res = await fetch(`${API_Base}/appointments/`);
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createAppointment(
    trainerId: number,
    startTime: string, // ISO String
    clientName: string,
    clientEmail: string
): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/appointments/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trainer_id: trainerId,
                client_name: clientName,
                client_email: clientEmail,
                start_time: startTime,
                status: 'confirmed' // Or pending, depending on logic
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || 'Failed to create appointment');
        }
        return true;
    } catch (error) {
        console.error(error);
        if (error instanceof Error) throw error;
        throw new Error('Booking failed due to an unknown error');
    }
}

export async function cancelAppointment(appointmentId: number): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
        });
        if (!res.ok) throw new Error('Failed to cancel appointment');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function autoScheduleWeek(weekStartDate: string): Promise<{ success_count: number; failed_assignments: any[] } | null> {
    try {
        const res = await fetch(`${API_Base}/appointments/auto-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week_start_date: weekStartDate })
        });

        if (!res.ok) throw new Error('Failed to run auto-schedule');
        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function clearWeekAppointments(weekStartDate: string): Promise<boolean> {
    try {
        console.log(`Calling DELETE ${API_Base}/appointments/week/${weekStartDate}`);
        const res = await fetch(`${API_Base}/appointments/week/${weekStartDate}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to clear week');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getNotifications(userId: number): Promise<import('./types').Notification[]> {
    try {
        const res = await fetch(`${API_Base}/users/${userId}/notifications`);
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function markNotificationRead(id: number): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/notifications/${id}/read`, {
            method: 'PUT',
        });
        if (!res.ok) throw new Error('Failed to mark notification as read');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}


export const MOCK_TRAINERS: Trainer[] = [];

export async function sendAdminWhatsApp(userId: number, message: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/admin/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, message })
        });
        if (!res.ok) throw new Error('Failed to send message');
        return true;
    } catch (error) {
        return false;
    }
}

export async function autoResolveConflicts(weekStartDate: string): Promise<{ resolved_count: number; details: any[] } | null> {
    try {
        const res = await fetch(`${API_Base}/appointments/auto-resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week_start_date: weekStartDate })
        });
        if (!res.ok) throw new Error('Failed to run auto-resolve');
        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}
