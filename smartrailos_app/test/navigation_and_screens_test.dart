import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartrailos_app/core/constants/theme.dart';
import 'package:smartrailos_app/core/widgets/floating_nav.dart';
import 'package:smartrailos_app/core/widgets/metro_drawer.dart';
import 'package:smartrailos_app/features/trains/screens/lines_screen.dart';
import 'package:smartrailos_app/features/trains/screens/live_radar_screen.dart';
import 'package:smartrailos_app/features/profile/screens/profile_screen.dart';

void main() {
  testWidgets('FloatingNav renders 4 tabs with active label and railway icons', (WidgetTester tester) async {
    int tappedIndex = -1;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: Scaffold(
          body: FloatingNav(
            currentIndex: 0,
            onTap: (i) => tappedIndex = i,
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Plan'), findsOneWidget);
    expect(find.byIcon(Icons.alt_route_rounded), findsOneWidget);
    expect(find.byIcon(Icons.hub_outlined), findsOneWidget);
    expect(find.byIcon(Icons.sensors_rounded), findsOneWidget);
    expect(find.byIcon(Icons.confirmation_number_outlined), findsOneWidget);

    // Tap on the Lines tab
    await tester.tap(find.byIcon(Icons.hub_outlined));
    await tester.pump();
    expect(tappedIndex, 1);
  });

  testWidgets('MetroDrawer renders network status, corridors, and interchange info', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const Scaffold(
          body: MetroDrawer(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));

    // Verify Metro Drawer contents
    expect(find.text('SMARTRAIL OS'), findsOneWidget);
    expect(find.text('Ahmedabad Metro Transit'), findsOneWidget);
    expect(find.text('ALL SYSTEMS NOMINAL'), findsOneWidget);
    expect(find.text('Line 1 · Blue Line'), findsOneWidget);
    expect(find.text('Line 2 · Red Line'), findsOneWidget);
    expect(find.text('INTERCHANGE HUB'), findsOneWidget);
    expect(find.text('Old High Court Station'), findsOneWidget);
  });

  testWidgets('LinesScreen renders line corridors and station sequence', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: LinesScreen(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text('METRO NETWORK'), findsOneWidget);
    expect(find.text('BLUE LINE · 18 STNS'), findsOneWidget);
    expect(find.text('RED LINE · 15 STNS'), findsOneWidget);
    expect(find.text('EAST-WEST CORRIDOR'), findsOneWidget);
    expect(find.text('Vastral Gam'), findsOneWidget);
  });

  testWidgets('LiveRadarScreen renders optical sensor banner and departure boards', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: LiveRadarScreen(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text('LIVE PLATFORM RADAR'), findsOneWidget);
    expect(find.text('ESP32 DUAL-BEAM SENSOR ACTIVE'), findsOneWidget);
    expect(find.text('INFLOW SENSOR'), findsOneWidget);
    expect(find.text('OUTFLOW SENSOR'), findsOneWidget);
    expect(find.text('MAJOR HUB DEPARTURE RADAR'), findsOneWidget);
    expect(find.text('Kalupur Metro Station'), findsOneWidget);
  });

  testWidgets('ProfileScreen renders Digital Pass, QR Token, and Commuter Stats', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ProfileScreen(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text('PASS & PREFERENCES'), findsOneWidget);
    expect(find.text('AHMEDABAD METRO'), findsOneWidget);
    expect(find.text('DIGITAL COMMUTER PASS'), findsOneWidget);
    expect(find.text('₹340.00'), findsOneWidget);
    expect(find.byIcon(Icons.qr_code_2_rounded), findsOneWidget);
    expect(find.text('142'), findsOneWidget);
    expect(find.text('TRIPS COMPLETED'), findsOneWidget);
    expect(find.text('SAVED COMMUTE SHORTCUTS'), findsOneWidget);
  });
}
