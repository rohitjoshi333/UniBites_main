from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(user_email, otp):
    """
    Sends an OTP to the specified user account/address.
    """
    subject = "Your UniBites Verification Code"
    message = f"""
    Hi,

    Thank you for using UniBites! Your verification code is:

    {otp}

    This code will expire in a few minutes. Please do not share it with anyone.

    If you didn't request this, you can safely ignore this email.

    Best regards,
    The UniBites Team
    """
    
    from_email = f"UniBites Account Support <{settings.DEFAULT_FROM_EMAIL}>"
    
    try:
        send_mail(
            subject,
            message,
            from_email,
            [user_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending OTP email to {user_email}: {str(e)}")
        return False
