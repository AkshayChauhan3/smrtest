import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/constants/theme.dart';
import '../../../core/widgets/coach_bar.dart';
import '../providers/train_search_provider.dart';
import '../widgets/train_position_diagram.dart';

class TrainDetailScreen extends ConsumerWidget {
  final String trainId;

  const TrainDetailScreen({super.key, required this.trainId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text('TRAIN $trainId'),
      ),
      body: Builder(
        builder: (context) {
          final trainAsync = ref.watch(trainDetailProvider(trainId));
          
          return trainAsync.when(
            data: (train) {
              final announcementsAsync = ref.watch(announcementsProvider(train.fromStationId));
              final isBlue = train.line == MetroLine.blue;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Announcements Banner
                    announcementsAsync.when(
                      data: (list) {
                        if (list.isEmpty) return const SizedBox.shrink();
                        return _buildAnnouncementBanner(list.first)
                            .animate()
                            .fadeIn()
                            .slideY(begin: -0.2, end: 0);
                      },
                      loading: () => const SizedBox.shrink(),
                      error: (_, __) => const SizedBox.shrink(),
                    ),

                    // 1. Train Position Diagram
                    Text(
                      'LIVE TRACKING',
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        fontSize: 10,
                        color: AppTheme.textMuted,
                        letterSpacing: 1.0,
                      ),
                    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1, end: 0),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x1AFFFFFF)),
                      ),
                      child: TrainPositionDiagram(
                        stations: getStationsForLine(isBlue ? MetroLine.blue : MetroLine.red),
                        currentPositionIndex: train.currentPositionIndex,
                        fromStationId: train.fromStationId,
                        toStationId: train.toStationId,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
                    
                    const SizedBox(height: 32),
                    
                    // 2. Info Card (ETA + Departure)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x1AFFFFFF)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildInfoColumn('ETA', '${train.etaMinutes} MIN', Icons.timer_outlined),
                          _buildInfoColumn('DEPARTURE', '${train.departureMinutes} MIN', Icons.exit_to_app_rounded),
                          _buildInfoColumn('STATUS', train.status.name.toUpperCase(), Icons.info_outline_rounded),
                        ],
                      ),
                    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),
                    
                    const SizedBox(height: 32),
                    
                    // 3. Coach Occupancy section
                    Text(
                      'COACH OCCUPANCY',
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        fontSize: 10,
                        color: AppTheme.textMuted,
                        letterSpacing: 1.0,
                      ),
                    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),
                    const SizedBox(height: 16),
                    ...train.coaches.asMap().entries.map((entry) {
                      return CoachBar(coach: entry.value)
                          .animate()
                          .fadeIn(delay: (500 + entry.key * 80).ms)
                          .slideY(begin: 0.1, end: 0);
                    }),
                    
                    const SizedBox(height: 32),
                    
                    // 4. Passenger Flow row
                    Text(
                      'PASSENGER FLOW (EST.)',
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        fontSize: 10,
                        color: AppTheme.textMuted,
                        letterSpacing: 1.0,
                      ),
                    ).animate().fadeIn(delay: 1000.ms).slideY(begin: 0.1, end: 0),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildFlowTile('BOARDING', '${20 + Random().nextInt(60)}', Icons.login_rounded, AppTheme.signalGreen),
                        const SizedBox(width: 16),
                        _buildFlowTile('ALIGHTING', '${15 + Random().nextInt(45)}', Icons.logout_rounded, AppTheme.signalAmber),
                      ],
                    ).animate().fadeIn(delay: 1100.ms).slideY(begin: 0.1, end: 0),
                    
                    const SizedBox(height: 40),
                  ],
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(child: Text('Error: $err')),
          );
        },
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.textMuted, size: 20),
        const SizedBox(height: 8),
        Text(
          label, 
          style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.bold, letterSpacing: 0.5)
        ),
        const SizedBox(height: 4),
        Text(
          value, 
          style: AppTheme.tabularNumberStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimary)
        ),
      ],
    );
  }

  Widget _buildFlowTile(String label, String count, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5)),
                Text(
                  count, 
                  style: AppTheme.tabularNumberStyle.copyWith(fontWeight: FontWeight.bold, fontSize: 20, color: AppTheme.textPrimary)
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildAnnouncementBanner(dynamic announcement) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.signalRed.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
        border: const Border(
          left: BorderSide(color: AppTheme.signalRed, width: 4),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppTheme.signalRed, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              announcement.message.toUpperCase(),
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
