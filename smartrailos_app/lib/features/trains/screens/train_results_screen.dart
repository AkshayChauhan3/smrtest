import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
        title: Text('Trains to ${toStation.name}'),
      ),
      body: resultsAsync.when(
        data: (trains) {
          if (trains.isEmpty) {
            return const Center(child: Text('No trains found for this route.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: trains.length,
            itemBuilder: (context, index) {
              return TrainCard(train: trains[index]);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
