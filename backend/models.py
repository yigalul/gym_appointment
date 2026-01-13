from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(String)  # 'admin', 'trainer', 'client'
    phone_number = Column(String, nullable=True)
    weekly_workout_limit = Column(Integer, default=3)

    trainer_profile = relationship("Trainer", back_populates="user", uselist=False)
    client_appointments = relationship("Appointment", back_populates="client")
    default_slots = relationship("ClientDefaultSlot", back_populates="client")
    notifications = relationship("Notification", back_populates="user")


class ClientDefaultSlot(Base):
    __tablename__ = "client_default_slots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    day_of_week = Column(Integer) # 0-6
    start_time = Column(String) # HH:MM

    client = relationship("User", back_populates="default_slots")


class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    role = Column(String)
    bio = Column(String)
    photo_url = Column(String)

    user = relationship("User", back_populates="trainer_profile")
    availabilities = relationship("Availability", back_populates="trainer")
    appointments = relationship("Appointment", back_populates="trainer")


class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    day_of_week = Column(Integer)  # 0-6
    start_time = Column(String)  # HH:MM
    end_time = Column(String)  # HH:MM
    is_recurring = Column(Boolean, default=True)

    trainer = relationship("Trainer", back_populates="availabilities")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    client_id = Column(Integer, ForeignKey("users.id"))
    client_name = Column(String)
    client_email = Column(String)
    start_time = Column(String)  # ISO 8601
    status = Column(String, default="confirmed")

    trainer = relationship("Trainer", back_populates="appointments")
    client = relationship("User", back_populates="client_appointments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(String) # ISO format

    user = relationship("User", back_populates="notifications")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
