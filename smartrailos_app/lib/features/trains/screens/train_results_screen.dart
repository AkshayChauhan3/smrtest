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
    final toStation = stations.firstWhere((s) => s.id == toStationId);

    return Scaffold(
      appBar: AppBar(
        title: Text('TO ${toStation.name.toUpperCase()}'),
      ),
      body: resultsAsync.when(
        data: (trains) {
          final activeTrains = trains.where((t) => t.etaMinutes < 120).toList();
          final hasRealTrains = activeTrains.any((t) => t.trainId != 'ESP32_DEMO');
          final displayTrains = hasRealTrains 
              ? activeTrains.where((t) => t.trainId != 'ESP32_DEMO').toList() 
              : activeTrains;

          if (!hasRealTrains && displayTrains.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.power_off, size: 64, color: AppTheme.textMuted),
                  const SizedBox(height: 16),
                  const Text(
                    'SYSTEM OFFLINE',
                    style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold, letterSpacing: 1.0, fontSize: 18),
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
          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            itemCount: displayTrains.length,
            itemBuilder: (context, index) {
              return TrainCard(train: displayTrains[index], index: index);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.blueLine)),
        error: (err, stack) => Center(child: Text('ERROR: $err', style: const TextStyle(color: AppTheme.signalRed))),
      ),
    );
  }
}
