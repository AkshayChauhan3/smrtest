# SmartRail-OS: System Integration Guide

This guide describes how to configure, connect, and run the SmartRail-OS backend services alongside the web and mobile frontend applications.

---

## 🏗️ Backend Setup & API Directory
Before connecting the frontends, start the FastAPI backend service to launch the background simulation runner (generating real-time database updates every 5 seconds).
```bash
cd backend
PYTHONPATH=. python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Shared API Endpoints Directory
The backend exposes the following endpoints under `http://<host>:8000/api/v1`:
*   `GET /stations` - Full station list catalog.
*   `GET /routes` - Route listings and line mappings.
*   `GET /trains` - Real-time active train locations, coach configs, and occupancy totals.
*   `GET /stations/{station_id}/current` - Live train at station, ETA, status, and coach details (updated every 5s).
*   `GET /stations/{station_id}/feature` - Complete predictions timeline for the **entire day** starting from the current time.
*   `GET /alerts` - Active operational and train delay logs.
*   `WS /ws` - Live WebSockets subscription channel for telemetry streaming.

---

## Part 1: Web Frontend Integration (`smartrailos_web`)

The web client is built using **React**, **Vite**, **TanStack Router**, **Tailwind CSS v4**, and **Recharts**.

### 1. Configuration & Setup
1.  Navigate to the web application directory:
    ```bash
    cd smartrailos_web
    ```
2.  Create or verify your local environment configuration file:
    ```bash
    touch .env.local
    ```
    Add the following environment variables to `.env.local`:
    ```env
    VITE_API_BASE_URL=http://localhost:8000
    VITE_REALTIME_WS_URL=ws://localhost:8000/api/v1/ws
    ```
3.  Install dependencies and start the development server:
    ```bash
    npm install
    npm run dev
    ```
    By default, the Vite dev server runs at **`http://localhost:5173`** (which is already configured in the backend CORS allowed origins list).

### 2. WebSocket Real-time Telemetry
The web client consumes real-time train positions and occupancies by subscribing to the WebSocket in the `useLiveTrains` hook located at [use-live-trains.ts](file:///home/akshaychauhan/Playground/SmartRail-OS/smartrailos_web/src/lib/use-live-trains.ts).

Here is how the React client subscribes to and processes the real-time websocket feed:
```typescript
import { useEffect, useState } from "react";
import { type Train } from "@/lib/mock/data";

export function useLiveTrains(): Train[] {
  const [trains, setTrains] = useState<Train[]>([]);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_REALTIME_WS_URL;
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        // Process payload event types: "occupancy_update" or "alert_issued"
        if (payload.event_type === "occupancy_update") {
          const update = payload.data;
          setTrains((currentTrains) => 
            currentTrains.map((t) => 
              t.id === update.train_id 
                ? { ...t, currentOccupancy: update.total_passengers } 
                : t
            )
          );
        }
      } catch (err) {
        console.error("Error reading live websocket update:", err);
      }
    };

    return () => ws.close();
  }, []);

  return trains;
}
```

---

## Part 2: Mobile Application Integration (`smartrailos_app`)

The mobile client is a **Flutter** application utilizing **Dart**, **Riverpod** for state management, **GoRouter**, and the **http** package.

### 1. Network Endpoint Configuration
Because mobile emulators run inside virtual networks, `localhost` points to the emulator itself instead of the host development computer. Configure your API base URL according to your target testing environment:

*   **Android Emulator**: Set your base URL to **`http://10.0.2.2:8000`** (this is the magic IP mapping to your host machine's loopback interface).
*   **iOS Simulator**: Set your base URL to **`http://localhost:8000`** (iOS shares the host computer's network interface directly).
*   **Physical Testing Device**: Set your base URL to **`http://<your-computer-local-ip>:8000`** (e.g. `http://192.168.1.144:8000`). Both the host machine and your mobile device must be on the same Wi-Fi network.

### 2. Setup & Execution
1.  Navigate to the mobile application directory:
    ```bash
    cd smartrailos_app
    ```
2.  Install Flutter packages:
    ```bash
    flutter pub get
    ```
3.  Launch the mobile app on a running emulator/device:
    ```bash
    flutter run
    ```

### 3. API Connection Implementation (Dart/Riverpod)
Here is how the Flutter app fetches train directory telemetry from the backend and updates the UI state using Riverpod.

#### Service Layer (`train_api_service.dart`)
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class Train {
  final String trainId;
  final String trainName;
  final String currentStation;
  final int currentOccupancy;

  Train({
    required this.trainId,
    required this.trainName,
    required this.currentStation,
    required this.currentOccupancy,
  });

  factory Train.fromJson(Map<String, dynamic> json) {
    return Train(
      trainId: json['train_id'],
      trainName: json['train_name'],
      currentStation: json['current_station'] ?? '',
      currentOccupancy: json['current_occupancy'] ?? 0,
    );
  }
}

class TrainApiService {
  // Use http://10.0.2.2:8000 for Android Emulator. Change to localhost for iOS/Desktop.
  static const String baseUrl = 'http://10.0.2.2:8000/api/v1';

  Future<List<Train>> fetchActiveTrains() async {
    final response = await http.get(Uri.parse('$baseUrl/trains'));

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Train.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load active trains from backend');
    }
  }
}
```

#### Riverpod State Provider (`train_provider.dart`)
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'train_api_service.dart';

final trainApiServiceProvider = Provider((ref) => TrainApiService());

final activeTrainsProvider = FutureProvider<List<Train>>((ref) async {
  final apiService = ref.watch(trainApiServiceProvider);
  return apiService.fetchActiveTrains();
});
```

#### UI Consumption (`train_list_screen.dart`)
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'train_provider.dart';

class TrainListScreen extends ConsumerWidget {
  const TrainListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainsAsync = ref.watch(activeTrainsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartRail Active Trains'),
      ),
      body: trainsAsync.when(
        data: (trains) => ListView.builder(
          itemCount: trains.length,
          itemBuilder: (context, index) {
            final train = trains[index];
            return ListTile(
              title: Text(train.trainName),
              subtitle: Text('Station: ${train.currentStation}'),
              trailing: Chip(
                label: Text('Occupancy: ${train.currentOccupancy}'),
                backgroundColor: train.currentOccupancy > 900 
                    ? Colors.redAccent.shade100 
                    : Colors.greenAccent.shade100,
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Connection Error: $err')),
      ),
    );
  }
}
```
