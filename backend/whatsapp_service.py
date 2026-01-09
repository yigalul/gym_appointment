
import os
import logging
from twilio.rest import Client

# Configure Logging
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
# In a real app, these should be in a .env file
# For testing, you use the Twilio Sandbox details.

def get_twilio_client():
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        return None
    
    return Client(account_sid, auth_token)

def send_whatsapp_message(to_number: str, body_text: str):
    """
    Sends a WhatsApp message using Twilio.
    
    Args:
        to_number (str): The recipient's phone number (e.g., +1234567890).
        body_text (str): The message content.
    """
    client = get_twilio_client()
    from_number = os.getenv("TWILIO_FROM_NUMBER", "whatsapp:+14155238886") # Default is Twilio Sandbox Number
    
    # Testing Override: If set, redirect all messages here
    test_target = os.getenv("TEST_WHATSAPP_TARGET")
    if test_target:
        logger.info(f"Redirecting WhatsApp from {to_number} to {test_target} for testing.")
        to_number = test_target

    if not to_number.startswith("whatsapp:"):
        # Twilio whatsapp numbers must be prefixed
        to_number = f"whatsapp:{to_number}"

    if client:
        try:
            message = client.messages.create(
                from_=from_number,
                body=body_text,
                to=to_number
            )
            print(f"WhatsApp sent! SID: {message.sid}")
            logger.info(f"WhatsApp message sent to {to_number}: {message.sid}")
            return True
        except Exception as e:
            print(f"Failed to send WhatsApp: {e}")
            logger.error(f"Failed to send WhatsApp: {e}")
            return False
    else:
        # MOCK MODE: Just print it if no credentials
        print("\n" + "="*40)
        print(" [MOCK WHATSAPP] Integration Active (No Credentials)")
        print(f" Any actual sending is skipped.")
        print(f" FROM: {from_number}")
        print(f" TO:   {to_number}")
        print(f" BODY: {body_text}")
        print(" To enable real sending, set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.")
        print("="*40 + "\n")
        return True

def notify_appointment_created(client_name: str, date: str, time: str, trainer_name: str, client_phone: str = None):
    """
    Helper to format and send booking confirmation.
    """
    # If no phone provided, use test target or dummy
    target = client_phone or os.getenv("TEST_WHATSAPP_TARGET") or "+15550000000"
    
    message = (
        f"💪 Gym Appointment Confirmed!\n"
        f"Hello {client_name},\n"
        f"You are booked with {trainer_name}.\n"
        f"📅 Date: {date}\n"
        f"⏰ Time: {time}\n"
        f"See you there!"
    )
    
    send_whatsapp_message(target, message)
