from pydantic import BaseModel
from typing import List, Optional

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    role: str = "client"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# --- Availability Schemas ---
class AvailabilityBase(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str

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
