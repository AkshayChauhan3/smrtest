import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/theme.dart';
import '../../../core/constants/app_config.dart';
import '../../../core/widgets/floating_nav.dart';
import '../../../core/widgets/metro_drawer.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      drawer: const MetroDrawer(),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 140,
                pinned: true,
                floating: false,
                backgroundColor: AppTheme.surfaceDark,
                leading: Builder(
                  builder: (context) => IconButton(
                    icon: const Icon(Icons.menu_rounded, color: AppTheme.textPrimary),
                    onPressed: () => Scaffold.of(context).openDrawer(),
                    tooltip: 'Metro Menu',
                  ),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    'COMMUTER PREFERENCES',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                      fontFamily: AppTheme.tabularNumberStyle.fontFamily,
                      fontSize: 16,
                    ),
                  ),
                  centerTitle: true,
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF161C27), AppTheme.surfaceDark],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Commuter Impact Stats ───────────────────────────────
                      _buildCommuterStats()
                          .animate()
                          .fadeIn(delay: 150.ms)
                          .slideY(begin: 0.05, end: 0),

                      const SizedBox(height: 28),

                      // ── Saved Daily Routes ──────────────────────────────────
                      const Text(
                        'SAVED COMMUTE SHORTCUTS',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                          color: AppTheme.textMuted,
                          letterSpacing: 1.0,
                        ),
                      ).animate().fadeIn(delay: 200.ms),
                      const SizedBox(height: 12),

                      _buildSavedRoutes(context)
                          .animate()
                          .fadeIn(delay: 250.ms)
                          .slideY(begin: 0.05, end: 0),

                      const SizedBox(height: 28),

                      // ── Telemetry & Backend Settings ────────────────────────
                      const Text(
                        'TELEMETRY & SENSOR SYSTEM',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                          color: AppTheme.textMuted,
                          letterSpacing: 1.0,
                        ),
                      ).animate().fadeIn(delay: 300.ms),
                      const SizedBox(height: 12),

                      _buildSystemDiagnostics()
                          .animate()
                          .fadeIn(delay: 350.ms)
                          .slideY(begin: 0.05, end: 0),

                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Bottom Nav Bar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: FloatingNav(
              currentIndex: 3,
              activeColor: AppTheme.blueLine,
              onTap: (index) {
                if (index == 0) context.go('/home');
                if (index == 1) context.push('/lines');
                if (index == 2) context.push('/live');
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommuterStats() {
    return Row(
      children: [
        _buildStatTile('142', 'TRIPS COMPLETED', Icons.directions_subway_rounded, AppTheme.blueLine),
        const SizedBox(width: 10),
        _buildStatTile('38.4 kg', 'CO2 SAVED', Icons.eco_rounded, AppTheme.signalGreen),
        const SizedBox(width: 10),
        _buildStatTile('52.0 h', 'TIME SAVED', Icons.schedule_rounded, AppTheme.signalAmber),
      ],
    );
  }

  Widget _buildStatTile(String value, String label, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0x14FFFFFF)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: AppTheme.tabularNumberStyle.copyWith(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedRoutes(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: Material(
        color: Colors.transparent,
        child: Column(
          children: [
            ListTile(
              leading: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppTheme.blueLine.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.star_rounded, color: AppTheme.signalAmber, size: 20),
              ),
              title: const Text('Blue Line · Kalupur → Thaltej', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text('Daily Morning Commute · Platform 1', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              trailing: const Icon(Icons.chevron_right_rounded, size: 18, color: AppTheme.textMuted),
              onTap: () {
                context.push(
                  Uri(path: '/results', queryParameters: {
                    'lineId': 'blue',
                    'fromStationId': 'BL08',
                    'toStationId': 'BL18',
                  }).toString(),
                );
              },
            ),
            const Divider(height: 1, color: Color(0x0DFFFFFF)),
            ListTile(
              leading: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppTheme.redLine.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.star_rounded, color: AppTheme.signalAmber, size: 20),
              ),
              title: const Text('Red Line · Sabarmati → Old High Court', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text('Evening Return Route · Platform 2', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
              trailing: const Icon(Icons.chevron_right_rounded, size: 18, color: AppTheme.textMuted),
              onTap: () {
                context.push(
                  Uri(path: '/results', queryParameters: {
                    'lineId': 'red',
                    'fromStationId': 'RL02',
                    'toStationId': 'RL08',
                  }).toString(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSystemDiagnostics() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: Column(
        children: [
          _buildStatusRow('Active API Host', AppConfig.baseUrl),
          const SizedBox(height: 12),
          _buildStatusRow('Telemetry Polling Rate', '5.0s (Live Sync)'),
          const SizedBox(height: 12),
          _buildStatusRow('Sensor Telemetry Engine', 'ESP32 Real-Time Dual-Beam'),
          const SizedBox(height: 12),
          _buildStatusRow('Application Version', 'SmartRail OS v2.4 (Commuter)'),
        ],
      ),
    );
  }

  Widget _buildStatusRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
        ),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
