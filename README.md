# UniBites 🍽️

UniBites is a university-focused food ordering and canteen management application designed to simplify campus dining. The system allows students to securely register using their college email, verify their account via OTP, browse available canteens, and interact with the platform efficiently. It also provides a robust backend architecture for authentication, verification, and future scalability.

---

## 🚀 Features

### 🔐 Authentication & Security
- College email–based registration
- OTP-based email verification
- Resend OTP functionality (only latest OTP is valid)
- Secure login using JWT authentication
- Password reset with OTP verification
- Prevention of password reuse during reset

### 📱 User Features
- Clean and modern mobile UI built with React Native
- Nepali phone number validation (`+977`, 10 digits, starting with 9)
- Responsive and consistent authentication screens
- Proper error handling and validation feedback

### 🛠️ Backend Features
- Built with Django REST Framework
- Secure password hashing
- OTP expiration handling
- Strict OTP validation (old OTPs invalidated on resend)
- Role-based user support (USER, ADMIN, etc.)
- Scalable API structure

---

## 🧱 Tech Stack

### Frontend
- React Native (Expo)
- Expo Router
- Fetch API for backend communication

### Backend
- Django
- Django REST Framework
- Simple JWT for authentication
- PostgreSQL

---

## 🔁 OTP Flow (How It Works)

1. User registers with college email
2. Backend generates a 6-digit OTP and sends it via email
3. User verifies OTP
4. If OTP expires or is lost, user can resend OTP
5. Old OTP is invalidated immediately when a new OTP is generated
6. Only the latest OTP is accepted

---

## 🔒 Security Considerations

- OTPs expire after a fixed time window
- OTPs are invalidated after use
- Resending OTP overrides previous OTP
- Password reset blocks reuse of old passwords
- Backend acts as the single source of truth for validation

---

## 🧪 Future Improvements
- In-app food ordering & cart system
- Vendor dashboards
- Admin analytics panel
- Push notifications
- SMS-based OTP support
- Rate limiting for OTP requests

---

## 👨‍💻 Author
Rohit Joshi
