# UniBites 🍽️

UniBites is a custom-built solution for college canteen management, designed specifically for university students and canteen vendors. It replaces traditional, manual ordering with a modern, real-time platform that handles everything from food scheduling to secure payments via **eSewa**.

We built this to solve the common "canteen rush" by allowing students to order ahead and get notified the moment their food is ready.

---

## 🔥 What's inside?

### 📱 For Students (Mobile App)
*   **Secure College Auth**: Verified registration using your `@islingtoncollege.edu.np` email and OTP.
*   **Real-time Tracking**: Get instant push-style notifications (with custom sound alerts 🔔) when your order status changes.
*   **eSewa Integration**: Seamless, secure payments directly from the app.
*   **Ratings & Feedback**: Rate your favorite canteens and leave reviews to help others.
*   **Food Scheduling**: Choose a specific pickup time so your food is fresh when you arrive.

### 🍱 For Canteen Vendors (Web Dashboard)
*   **Live Order Management**: A high-contrast, professional order board with audible alerts for new and urgent orders.
*   **Sales Analytics**: 30-day performance charts and daily sales breakdowns.
*   **Canteen Branding**: Complete control over your canteen's image, menu, and availability.
*   **Customer Reviews**: Direct access to your ratings and customer feedback inside the dashboard.

---

## 🛠️ The Tech Behind It

We focused on a clean, scalable stack that's easy to maintain:

*   **Frontend**: React Native (Expo) with Expo Router for the mobile app; React with Lucide icons for the web dashboard.
*   **Backend**: Django REST Framework (Python) providing a RESTful API.
*   **Real-time Updates**: WebSockets (via Django Channels style logic) for instant communication between students and vendors.
*   **State Management**: Modern React Context + Hooks for clean logic sharing across components.
*   **Storage & Media**: PostgreSQL for the database and Cloudinary for high-performance image hosting.

---

## 🏗️ Getting Started

### Backend
1. `cd unibites_backend`
2. Create your virtual environment and install `requirements.txt`.
3. Run migrations: `python manage.py migrate`.
4. Fire up the server: `python manage.py runserver`.

### Mobile App
1. `cd unibites-app`
2. Install dependencies: `npm install`.
3. Start Expo: `npx expo start`.

### Web Dashboard
1. `cd web-dashboard`
2. Install dependencies: `npm install`.
3. Run the dev server: `npm run dev`.

---

## 🔒 Security First
*   **JWT Authentication**: Secure, token-based login for all users.
*   **Smart OTP**: OTPs that expire after 2 minutes and invalidate old codes automatically to prevent abuse.
*   **Data Integrity**: Server-side validation for all critical actions (like status updates and payments).

---

## 👨‍💻 Developed By
**Rohit Joshi**  
Build this tool which will actually solve University problems.
