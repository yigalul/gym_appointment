from pydantic import BaseModel
from typing import List, Optional

# --- User Schemas ---
class ClientDefaultSlotBase(BaseModel):
    day_of_week: int
    start_time: str

class ClientDefaultSlotCreate(ClientDefaultSlotBase):
    pass

class ClientDefaultSlot(ClientDefaultSlotBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

# UserBase
class UserBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = "client"
    weekly_workout_limit: int = 3
    workout_credits: int = 10

class UserCreate(UserBase):
    password: str
    default_slots: List[ClientDefaultSlotCreate] = []

class UserLogin(BaseModel):
    email: str
    password: str

# UserUpdate
class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    weekly_workout_limit: Optional[int] = None
    default_slots: Optional[List[ClientDefaultSlotCreate]] = None
    workout_credits: Optional[int] = None

class User(UserBase):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    weekly_workout_limit: int
    workout_credits: int
    default_slots: List[ClientDefaultSlot] = []
    
    class Config:
        from_attributes = True

# --- Availability Schemas ---
class AvailabilityBase(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_recurring: bool = True

class Availability(AvailabilityBase):
    id: int
    trainer_id: int

    class Config:
        from_attributes = True

# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    trainer_id: int
    client_name: str
    client_email: str
    start_time: str

class AppointmentCreate(AppointmentBase):
    client_id: Optional[int] = None

class Appointment(AppointmentBase):
    id: int
    status: str
    client_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Trainer Schemas ---
class TrainerBase(BaseModel):
    name: str
    role: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None

class TrainerCreate(TrainerBase):
    pass

class Trainer(TrainerBase):
    id: int
    user_id: Optional[int] = None
    availabilities: List[Availability] = []

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationBase(BaseModel):
    user_id: int
    message: str
    is_read: bool = False
    created_at: str

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    
    class Config:
        from_attributes = True

class AdminMessageRequest(BaseModel):
    user_id: int
    message: str

class SystemWeekResponse(BaseModel):
    date: str

class SystemWeekUpdate(BaseModel):
    date: str
