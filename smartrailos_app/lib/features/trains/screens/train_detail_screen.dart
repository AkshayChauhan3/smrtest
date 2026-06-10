import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    final trainAsync = ref.watch(trainDetailProvider(trainId));

    return Scaffold(
      appBar: AppBar(
        title: Text('Train $trainId'),
      ),
      body: trainAsync.when(
        data: (train) {
          final announcementsAsync = ref.watch(announcementsProvider(train.fromStationId));
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Announcements Banner
                announcementsAsync.when(
                  data: (list) {
                    if (list.isEmpty) return const SizedBox.shrink();
                    final announcement = list.first;
                    return _buildAnnouncementBanner(announcement);
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),

                // 1. Train Position Diagram
                const Text(
                  'Current Position',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                TrainPositionDiagram(
                  stations: getStationsForLine(train.line),
                  currentPositionIndex: train.currentPositionIndex,
                  fromStationId: train.fromStationId,
                  toStationId: train.toStationId,
                ),
                
                const SizedBox(height: 24),
                
                // 2. Info Card (ETA + Departure)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildInfoColumn('ETA', '${train.etaMinutes} min', Icons.access_time),
                        _buildInfoColumn('DEPARTURE', '${train.departureMinutes} min', Icons.exit_to_app),
                        _buildInfoColumn('STATUS', train.status.name.toUpperCase(), Icons.info_outline),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // 3. Coach Occupancy section
                const Text(
                  'Coach Occupancy',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 16),
                ...train.coaches.map((coach) => CoachBar(coach: coach)),
                
                const SizedBox(height: 32),
                
                // 4. Passenger Flow row
                const Text(
                  'Passenger Flow (Est.)',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildFlowTile('Boarding', '${20 + Random().nextInt(60)}', Icons.login, Colors.green),
                    const SizedBox(width: 16),
                    _buildFlowTile('Alighting', '${15 + Random().nextInt(45)}', Icons.logout, Colors.orange),
                  ],
                ),
                
                const SizedBox(height: 40),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppTheme.textSecondary, size: 20),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }

  Widget _buildFlowTile(String label, String count, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: color.withOpacity(0.8))),
                Text(count, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildAnnouncementBanner(dynamic announcement) {
    // BACKEND: Announcements are pushed by the admin panel and fetched via
    // ApiService.getActiveAnnouncements(stationId). Currently returns [].
    // No code change needed here once the backend populates the endpoint.
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.amber),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.amber),
          const SizedBox(width: 12),
          Expanded(child: Text(announcement.message)),
        ],
      ),
    );
  }
}
