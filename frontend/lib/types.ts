export interface ClientDefaultSlot {
  id?: number;
  user_id?: number;
  day_of_week: number;
  start_time: string;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'trainer' | 'client';
  default_slots?: ClientDefaultSlot[];
  // Trainer profile might be linked or fetched separately
}

export interface Availability {
  id?: number;
  trainer_id?: number;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // HH:mm format, e.g. "09:00"
  end_time: string;   // HH:mm format, e.g. "17:00"
}

export interface Trainer {
  id: number;
  user_id?: number;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  availabilities: Availability[];
}

export interface Appointment {
  id: number;
  trainer_id: number;
  client_id?: number;
  client_name: string;
  client_email: string;
  start_time: string; // ISO Date string
  status: 'confirmed' | 'pending' | 'cancelled';
}
