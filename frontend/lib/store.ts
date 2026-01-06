import { Trainer, Appointment, User } from './types';

const API_Base = 'http://127.0.0.1:8000';

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

export async function getUsers(): Promise<User[]> {
    try {
        const res = await fetch(`${API_Base}/users/`);
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
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

export async function deleteTrainer(trainerId: number): Promise<boolean> {
    try {
        const res = await fetch(`${API_Base}/trainers/${trainerId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete trainer');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function createTrainerUser(name: string, role: string, email: string, bio: string): Promise<boolean> {
    try {
        // 1. Create User
        const userRes = await fetch(`${API_Base}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123', role: 'trainer' })
        });
        if (!userRes.ok) throw new Error('Failed to create user');
        const user = await userRes.json();

        // 2. Create Trainer Profile
        const trainerRes = await fetch(`${API_Base}/trainers/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                role,
                bio,
                user_id: user.id,
                photo_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=200&h=200'
            })
        });
        if (!trainerRes.ok) throw new Error('Failed to create trainer profile');

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function createClientUser(email: string, defaultSlots: { day_of_week: number; start_time: string }[], weeklyWorkoutLimit: number = 3): Promise<boolean> {
    try {
        const userRes = await fetch(`${API_Base}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password: 'GymStrong2026!',
                role: 'client',
                default_slots: defaultSlots,
                weekly_workout_limit: weeklyWorkoutLimit
            })
        });
        if (!userRes.ok) throw new Error('Failed to create user');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function updateClientUser(id: number, email: string, defaultSlots: { day_of_week: number; start_time: string }[], weeklyWorkoutLimit: number): Promise<boolean> {
    try {
        const userRes = await fetch(`${API_Base}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                default_slots: defaultSlots,
                weekly_workout_limit: weeklyWorkoutLimit
            })
        });
        if (!userRes.ok) throw new Error('Failed to update user');
        return true;
    } catch (error) {
        console.error(error);
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

export const MOCK_TRAINERS: Trainer[] = [];
