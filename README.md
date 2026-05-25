# 🛡️ SaferStreets India · Crowdsourced Safety Map & Secure Router

SaferStreets is a modern, premium full-stack crowdsourced public safety mapping and safe routing application. The platform displays real-time heatmaps of incidents, streetlights, police command centres, and active CCTV camera coverages while allowing citizens to plan routes that bypass high-risk zones.

---

## 🚀 Running the Project

The workspace includes a complete Docker Compose environment to spin up the entire database, backend, and frontend stack instantly.

### Method 1: Running with Docker Compose (Recommended)
This is the easiest way to launch the full-stack setup with PostgreSQL + PostGIS, FastAPI, and Vite React.

1. Make sure you have **Docker Desktop** installed and running.
2. From the root directory (`SafeCity`), run:
   ```bash
   docker-compose up --build
   ```
3. Access the services at:
   * 🖥️ **Frontend:** `http://localhost:5173`
   * ⚙️ **Backend API Documentations (Swagger):** `http://localhost:8000/docs`
   * 🐘 **PostgreSQL DB:** `localhost:5432`

---

### Method 2: Running Manually (Development)

#### 1. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### 2. Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and head to `http://localhost:5173`.

---

## 🔑 Google OAuth Integration

To implement secure registration and login using **Google OAuth 2.0**, follow these instructions:

### Step 1: Configure Google Cloud Console
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **SaferStreets**.
3. Navigate to **APIs & Services** > **OAuth consent screen**, select **External**, and fill in the required fields.
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
5. Select **Web Application**:
   * **Authorized JavaScript origins:** `http://localhost:5173`
   * **Authorized redirect URIs:** `http://localhost:8000/auth/google/callback`
6. Copy the generated **Client ID** and **Client Secret**.

### Step 2: Configure Backend (`backend/.env`)
Create a `.env` file in the `backend` folder and add:
```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
SECRET="SUPER_SECRET_KEY_FOR_JWT_AUTHENTICATION"
```
In your backend `users.py`, you can utilize FastAPI Users' native `httpx-oauth` Google integration:
```python
from httpx_oauth.clients.google import GoogleOAuth2

google_oauth_client = GoogleOAuth2(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
)

# Attach OAuth router to fastapi_users
app.include_router(
    fastapi_users.get_oauth_router(
        google_oauth_client,
        auth_backend,
        state_secret=SECRET,
        associate_by_email=True,
    ),
    prefix="/auth/google",
    tags=["auth"],
)
```

### Step 3: Configure Frontend (`frontend/.env`)
Add your OAuth client ID to the frontend `.env` file:
```env
VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
```
Install the `@react-oauth/google` library:
```bash
npm install @react-oauth/google
```
Wrap your React `App` in the provider and render the Google login button:
```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <GoogleLogin
    onSuccess={(credentialResponse) => {
      // Send token to FastAPI backend /auth/google/callback
      console.log(credentialResponse);
    }}
    onError={() => console.log('Login Failed')}
  />
</GoogleOAuthProvider>
```

---

## 🗺️ Google Maps API Integration

The app is pre-configured to draw high-definition, responsive roadmap tiles from the official Google Maps server using your API key:
`AIzaSyCY3Yj95om00NDNjhyv6n6deymF14tnbJg`

### Environment Configuration (`frontend/.env`)
Store the API key securely:
```env
VITE_GOOGLE_MAPS_API_KEY="AIzaSyCY3Yj95om00NDNjhyv6n6deymF14tnbJg"
```

In `frontend/src/App.jsx`, Leaflet pulls Google Maps tiles in real-time, maintaining full compatibility with overlay coordinates:
```javascript
const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCY3Yj95om00NDNjhyv6n6deymF14tnbJg';
window.L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=' + googleMapsKey, {
  attribution: '© Google Maps',
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  maxZoom: 20
}).addTo(initialMap);
```

> [!NOTE]
> Swap `lyrs=m` (Standard Roadmap) with `lyrs=y` in the Leaflet tile layer if you wish to display a high-resolution Hybrid Satellite view with streets and labels overlayed!

---

## 🗄️ Database Architecture (Production Setup)

The current local development setup uses a PostgreSQL/PostGIS container. For production hosting and crowdsourcing scale, you must migrate to a cloud-native spatial database.

### Recommended Choices
1. **Supabase (Recommended):** Built on PostgreSQL, supports the **PostGIS** extension out-of-the-box, provides a robust auto-scaling connection pooler (Supavisor), and includes built-in JWT-based authentication.
2. **Amazon RDS for PostgreSQL:** Secure, highly available managed service. You can enable spatial capabilities instantly by running:
   ```sql
   CREATE EXTENSION postgis;
   ```

### 🗑️ Removing Mock/Seed Data
Once you connect your live production database, you will want to disable the mockup seed data that pre-populates coordinates on app startup.

To do this, edit **`backend/main.py`** and comment out or remove the call to `seed_data()` at line 76:
```python
# comment out or delete this line to launch with an empty database:
# seed_data()
```

---

## 📱 Mobile Compiling (Android Play Store & Apple App Store)

Since the frontend is a highly reactive Single Page Application (SPA) built with React + Vite, the absolute best, most robust, and highest-performing way to package it into a native Android and iOS mobile app is **CapacitorJS**. 

Capacitor wraps your web app inside a native web view container and provides JavaScript bindings to access native hardware (Camera, GPS, Push Notifications, Secure Storage).

### 🛠️ Step-by-Step Mobile Packaging

#### Step 1: Install Capacitor CLI & Core
Run these commands inside your `frontend` directory:
```bash
cd frontend
npm install @capacitor/core @capacitor/cli
```

#### Step 2: Initialize Capacitor
Initialize the Capacitor project configuration:
```bash
npx cap init SaferStreets com.saferstreets.app --web-dir=dist
```
* **App Name:** `SaferStreets`
* **App Package ID:** `com.saferstreets.app` (This is your unique store identifier)
* **Web Directory:** `dist` (This is where Vite outputs production compiled assets)

#### Step 3: Install Android and iOS Platforms
Install the native wrappers:
```bash
npm install @capacitor/android @capacitor/ios
```

#### Step 4: Add Mobile Platforms
Integrate the native project files:
```bash
# Add Android Studio template files
npx cap add android

# Add Xcode template files (requires macOS)
npx cap add ios
```

#### Step 5: Build and Sync Assets
Compile your React production build and synchronize the compiled assets directly to Android Studio and Xcode:
```bash
# 1. Compile React code to dist/
npm run build

# 2. Copy compiled JS, CSS, and HTML into Capacitor native folders
npx cap sync
```

---

### 📦 Compiling and Publishing

#### 🤖 Android (Google Play Store)
1. Open the project inside **Android Studio**:
   ```bash
   npx cap open android
   ```
2. Android Studio will open the native project structure. Let Gradle synchronize dependencies (it will automatically package your Leaflet map, websocket hooks, and Google API layers).
3. To test on a physical Android device or Emulator:
   * Click the **Run** button (green arrow) in Android Studio.
4. To compile the production release:
   * Go to **Build** > **Generate Signed Bundle / APK**.
   * Select **Android App Bundle (AAB)** (which is mandatory for Google Play Store submissions).
   * Generate your keystore signature, compile the release bundle, and upload the `.aab` file directly to the [Google Play Console](https://play.google.com/console).

#### 🍏 iOS (Apple App Store)
*(Requires macOS with Xcode installed)*
1. Open the project inside **Xcode**:
   ```bash
   npx cap open ios
   ```
2. Set up your Apple Developer signature credentials under **Signing & Capabilities**.
3. Choose **Any iOS Device (arm64)** as the target.
4. Go to **Product** > **Archive** to bundle the application.
5. Click **Distribute App** to upload the native bundle directly to [App Store Connect](https://appstoreconnect.apple.com/) for TestFlight and Apple App Store review.
