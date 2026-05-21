# SaferStreets Mobile App Setup

## Overview

SaferStreets mobile is built with **React Native + Expo** for cross-platform iOS and Android support. The app provides:

- Real-time street safety heatmap (MapLibre GL)
- Route calculation with faster/safest toggle
- Time-of-day and weather controls
- Segment details with safety factors
- Incident reporting (phase 2)
- Privacy-first design

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  React Native App (iOS/Android)                      │
│  - Expo Router for navigation                        │
│  - MapLibre GL for maps                              │
│  - Zustand for state management                      │
├──────────────────────────────────────────────────────┤
│  App Structure                                       │
│  app/(map)/                                          │
│    - index.tsx (main map screen)                     │
│    - route-detail.tsx (route info sheet)             │
│  app/(auth)/                                         │
│    - login.tsx (passwordless auth)                   │
│    - signup.tsx (placeholder)                        │
├──────────────────────────────────────────────────────┤
│  Shared Libraries                                    │
│  lib/api/client.ts (API calls)                       │
│  lib/stores/routeStore.ts (route state)              │
│  components/MapView.tsx (map component)              │
└──────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** 18+ (check: `node --version`)
- **npm** or **pnpm** (check: `npm --version` or `pnpm --version`)
- **Expo CLI** (install: `npm install -g expo-cli`)
- **Backend** running locally (see [BACKEND_SETUP.md](./BACKEND_SETUP.md))

### 1. Install Dependencies

```bash
cd mobile
pnpm install  # or npm install
```

**Dependencies**:
- `expo`: Managed React Native platform
- `expo-router`: File-based routing
- `react-native-mapbox-gl`: MapLibre GL Native
- `zustand`: Lightweight state management
- `axios`: HTTP client

### 2. Configure Environment

```bash
# Copy example env file
cp ../app.json ./app.json

# Update API_BASE_URL in app.json if backend is not localhost:8000
# Default assumes: http://localhost:8000
```

**For production** (TestFlight/Play Store):
```json
{
  "extra": {
    "API_BASE_URL": "https://api.saferstreets.com"
  }
}
```

### 3. Start Dev Server

```bash
# Terminal 1: Expo dev server
pnpm start

# You'll see:
# i Expo Go is now using the LAN URL: 192.168.x.x:19000
# i Metro server started at http://192.168.x.x:19000
```

### 4. Run on Device/Emulator

#### iOS (macOS only)

```bash
# Terminal 1 (from above, keep running)
# Terminal 2:
pnpm ios

# This will:
# 1. Start iOS Simulator
# 2. Build the app
# 3. Launch Expo Go on simulator
```

#### Android

```bash
# Terminal 1 (from above, keep running)
# Terminal 2:
pnpm android

# Or with Android Studio open:
# - Open android/ folder
# - Run emulator from Device Manager
# - Press 'a' in Expo CLI
```

#### Web (Development Only)

```bash
pnpm web

# Opens in browser at http://localhost:19006
# Note: Maps won't render (Mapbox GL Native only works on iOS/Android)
```

### 5. Test Integration

Once running:

1. **Verify API connectivity**: App should log `[MapScreen] API health: operational`
2. **Check map renders**: Map should show dark map tiles centered on NYC
3. **Test heatmap**: Drag/pan map → should load safety data
4. **No routes yet**: Origin/destination selection comes in phase 2

## Project Structure

```
mobile/
├── app/                      # Expo Router (file-based routing)
│   ├── (map)/               # Map screens (group layout)
│   │   ├── _layout.tsx      # Map layout
│   │   ├── index.tsx        # Main map screen
│   │   └── route-detail.tsx # Route details sheet
│   ├── (auth)/              # Auth screens
│   │   ├── _layout.tsx      # Auth layout
│   │   ├── login.tsx        # Login screen
│   │   └── signup.tsx       # Signup (stub)
│   └── _layout.tsx          # Root layout
├── lib/                      # Shared libraries
│   ├── api/
│   │   └── client.ts        # API client (axios)
│   └── stores/
│       └── routeStore.ts    # Zustand state (routes, origin, dest)
├── components/              # Reusable components
│   └── MapView.tsx          # MapLibre GL wrapper
├── assets/                  # App icons, splash screen (TODO)
├── app.json                 # Expo config
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── eas.json                 # EAS Build config (phase 2)
```

## Key Components

### MapView.tsx

Wraps MapLibre GL with:
- Origin/destination markers
- Route polyline rendering (fastest/safest)
- Region change detection (fetches heatmap)

**Props**:
- `onRegionChange`: Callback with bbox when map pans/zooms

**TODO**:
- Heatmap layer rendering (currently just fetches data)
- Incident markers with clustering
- Segment tap detection for details

### routeStore.ts (Zustand)

Global state for:
- Origin/destination locations
- Route calculation parameters (time_bucket, lambda_safety, safe_mode)
- Active route (fastest or safest)
- Loading/error states

**Usage**:
```typescript
import { useRouteStore } from '../lib/stores/routeStore';

const { origin, destination, activeRoute, setOrigin } = useRouteStore();
```

### API Client

Type-safe axios wrapper:
- Handles auth tokens (SecureStore)
- Built-in error handling
- Request/response typing

**Usage**:
```typescript
import { apiClient } from '../lib/api/client';

const route = await apiClient.getRoute({
  origin_lng: -74.005,
  origin_lat: 40.714,
  destination_lng: -73.998,
  destination_lat: 40.720,
  safe_mode: true
});
```

## Authentication (Passwordless)

### Current Status: Stubbed
- Login screen with email input
- No backend integration yet (phase 2)

### Future Flow
1. User enters email
2. Backend sends magic link
3. User clicks link → app authenticates
4. Token stored in SecureStore (encrypted on device)
5. All API calls include `Authorization: Bearer <token>`

**Implementation** (phase 2):
```typescript
// lib/auth/passwordless.ts
export async function sendMagicLink(email: string) {
  const response = await apiClient.post('/auth/magic-link', { email });
  // Link sent; wait for user to click it
}

export async function verifyToken(token: string) {
  await apiClient.setAuthToken(token);
}
```

## Debugging

### Logs

```bash
# Console logs appear in:
# Terminal running Expo CLI (pnpm start)
# OR
# XCode console (iOS)
# OR
# Android Studio logcat (Android)

# Example log statements:
console.log('[MapScreen] Heatmap loaded:', data);
console.error('[API] Failed to calculate route:', error);
```

### Network Inspector

```bash
# Install Flipper: https://fbflipper.com
# Connect Flipper desktop to running dev server
# Inspect network requests in real-time
```

### React Native Debugger

```bash
# Install: https://github.com/jhen0409/react-native-debugger
# Start debugger
# In Expo CLI, press 'j' to open debugger
```

### Common Issues

**Issue**: "Cannot find native module"
- Solution: Make sure you're in iOS/Android simulator, not web

**Issue**: "API unreachable"
- Solution: Check backend is running (docker-compose up -d) at http://localhost:8000
- Verify `API_BASE_URL` in `app.json` matches your backend

**Issue**: "MapLibre GL not rendering"
- Solution: Mapbox token is required. For MVP, mock token is OK but won't show tiles.
- Get free token: https://account.mapbox.com/auth/signup/

**Issue**: "Expo Go app not showing output"
- Solution: Make sure you're on same WiFi as dev machine
- Try `pnpm start --tunnel` for remote dev

## Development Workflow

### Adding a New Screen

```typescript
// 1. Create file: app/(groupName)/newscreen.tsx
import { Stack } from 'expo-router';

export default function NewScreen() {
  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
}

// 2. Routing works automatically (file-based)
// 3. Navigate with: useRouter().push('/(groupName)/newscreen')
```

### Adding State

```typescript
// 1. Create store: lib/stores/myStore.ts
import { create } from 'zustand';

export const useMyStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));

// 2. Use in component:
import { useMyStore } from '../lib/stores/myStore';

const { count, increment } = useMyStore();
```

### Adding API Endpoints

```typescript
// 1. Add to lib/api/client.ts
async myNewEndpoint(param: string) {
  const response = await this.client.get(`/api/new?param=${param}`);
  return response.data;
}

// 2. Call from component:
const data = await apiClient.myNewEndpoint('value');
```

## Testing (Phase 2)

```bash
# Unit tests (Jest)
pnpm test

# E2E tests (Detox)
pnpm e2e
```

## Building for Production

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to TestFlight/Play Store
eas submit --platform ios
eas submit --platform android
```

### Manual Build

#### iOS
```bash
# Requires macOS + Xcode
pnpm ios --configuration Release
```

#### Android
```bash
# Requires Android Studio + NDK
pnpm android --mode release
```

## Performance Optimization

### Current Status
- No optimization yet (MVP)

### Phase 2 Goals
- Vector tile caching on device (50 MB limit)
- Route response caching (Redis backend)
- Map layer culling (only render visible segments)
- Route calculation timeout (prevent hanging)

## Accessibility

### Current Status
- Basic screen reader support (React Native built-in)

### Phase 2 Goals
- High-contrast theme option
- Large touch targets (48x48 dp minimum)
- Voice prompts for alerts
- Text scaling support

## Privacy & Security

### Current Implementation
- No precise location stored locally
- Auth tokens in SecureStore (encrypted)
- No analytics by default (opt-in only)

### Phase 2
- Certificate pinning for API calls
- Incident photos encrypted before upload
- Option to disable location access after initial setup

## Troubleshooting

### Build Errors

**"Cannot resolve '@react-native-mapbox-gl/maps'"**
```bash
# Ensure pod dependencies installed (iOS)
cd ios
pod install
cd ..

# Rebuild
pnpm ios
```

**"Unsupported platform version"**
- Update minimum iOS/Android version in `app.json`:
```json
{
  "ios": { "minimumVersion": "13.0" },
  "android": { "minSdk": 24 }
}
```

### Runtime Errors

**"Cannot read property 'latitude' of null"**
- Check location permission granted: `Settings → SaferStreets → Allow Location`

**"Heatmap fails to load"**
- Verify backend API is running: `curl http://localhost:8000/health`
- Check browser console for CORS errors

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for code style, testing, and PR guidelines.

## Next Steps

### Immediate (Phase 2)
- [ ] Implement search box (Nominatim/Mapbox Geocoding)
- [ ] Route calculation UI (origin/destination input)
- [ ] Faster/safest toggle + route comparison
- [ ] Time-of-day slider
- [ ] Bottom sheet for route details
- [ ] Settings screen (auth, privacy preferences)

### Medium Term
- [ ] Heatmap layer rendering (not just data fetch)
- [ ] Incident reporting modal
- [ ] Segment tap detection
- [ ] Offline maps
- [ ] Wearables integration

### Long Term
- [ ] Web companion (Next.js)
- [ ] Community features
- [ ] ML-based predictions
- [ ] Analytics dashboard

## Resources

- **Expo**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **MapLibre GL**: https://maplibre.org/
- **Zustand**: https://github.com/pmndrs/zustand
- **EAS Build**: https://docs.expo.dev/build/introduction/

## Support

For issues:
1. Check logs: `pnpm start` terminal output
2. Search GitHub issues
3. Open new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (macOS/Linux, iOS/Android simulator version)

---

**Happy coding!** 🚀
