import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/constants/theme.dart';
import '../../../core/widgets/train_card.dart';
import '../providers/train_search_provider.dart';

class TrainResultsScreen extends ConsumerWidget {
  final String lineId;
  final String fromStationId;
  final String toStationId;

  const TrainResultsScreen({
    super.key,
    required this.lineId,
    required this.fromStationId,
    required this.toStationId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultsAsync = ref.watch(trainResultsProvider((
      lineId: lineId,
      fromStationId: fromStationId,
      toStationId: toStationId,
    )));

    final line = MetroLine.values.firstWhere((e) => e.name == lineId);
    final stations = getStationsForLine(line);
    final fromStation = stations.firstWhere(
      (s) => s.id == fromStationId,
      orElse: () => stations.first,
    );
    final toStation = stations.firstWhere((s) => s.id == toStationId);

    return Scaffold(
      appBar: AppBar(
        title: Text('TO ${toStation.name.toUpperCase()}'),
      ),
      body: resultsAsync.when(
        data: (trains) {
          // Separate dwelling train (at platform) from upcoming trains
          final platformTrains = trains.where((t) => t.isAtPlatform).toList();
          final upcomingTrains = trains
              .where((t) => !t.isAtPlatform && t.etaMinutes < 120)
              .toList();

          final hasAnyTrain = platformTrains.isNotEmpty || upcomingTrains.isNotEmpty;

          if (!hasAnyTrain) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.power_off, size: 64, color: AppTheme.textMuted),
                  const SizedBox(height: 16),
                  const Text(
                    'SYSTEM OFFLINE',
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Operations resume at 06:20 AM.',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                ],
              ),
            ).animate().fadeIn();
          }

          return ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            children: [
              // ── Section 1: Live At Station ─────────────────────────────
              if (platformTrains.isNotEmpty) ...[
                _buildSectionHeader(
                  context,
                  icon: Icons.sensors_rounded,
                  label: 'LIVE AT ${fromStation.name.toUpperCase()}',
                  color: AppTheme.signalGreen,
                  dotColor: AppTheme.signalGreen,
                  isLive: true,
                ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0),
                const SizedBox(height: 12),
                ...platformTrains.asMap().entries.map((e) =>
                  TrainCard(train: e.value, index: e.key),
                ),
              ],

              // ── Divider between sections ───────────────────────────────
              if (platformTrains.isNotEmpty && upcomingTrains.isNotEmpty)
                _buildSectionDivider(context),

              // ── Section 2: Upcoming Trains ─────────────────────────────
              if (upcomingTrains.isNotEmpty) ...[
                _buildSectionHeader(
                  context,
                  icon: Icons.schedule_rounded,
                  label: 'UPCOMING TRAINS',
                  color: AppTheme.blueLine,
                  dotColor: AppTheme.blueLine,
                  isLive: false,
                ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: -0.1, end: 0),
                const SizedBox(height: 12),
                ...upcomingTrains.asMap().entries.map((e) =>
                  TrainCard(train: e.value, index: e.key),
                ),
              ],

              const SizedBox(height: 24),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.blueLine)),
        error: (err, stack) => Center(
          child: Text('ERROR: $err', style: const TextStyle(color: AppTheme.signalRed)),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required Color dotColor,
    required bool isLive,
  }) {
    return Row(
      children: [
        // Animated live dot (only for the platform section)
        if (isLive) ...[
          SizedBox(
            width: 10,
            height: 10,
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ).animate(onPlay: (c) => c.repeat()).scaleXY(
                  begin: 1.0, end: 1.6,
                  duration: 900.ms,
                  curve: Curves.easeOut,
                ).fadeOut(delay: 600.ms, duration: 300.ms),
                Container(
                  width: 7,
                  height: 7,
                  margin: const EdgeInsets.all(1.5),
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
        ],
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionDivider(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 1,
              color: const Color(0x1AFFFFFF),
            ),
          ),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.surfaceElevated,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0x1AFFFFFF)),
            ),
            child: const Text(
              'NEXT TRAINS',
              style: TextStyle(
                color: AppTheme.textMuted,
                fontSize: 8,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
              ),
            ),
          ),
          Expanded(
            child: Container(
              height: 1,
              color: const Color(0x1AFFFFFF),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms);
  }
}

