import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../constants/theme.dart';
import '../../features/trains/models/train_model.dart';
import 'line_badge.dart';

class TrainCard extends StatelessWidget {
  final TrainModel train;

  const TrainCard({super.key, required this.train});

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(train.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => context.push('/train/${train.trainId}'),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  LineBadge(line: train.line, isSmall: true),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      train.status.name.toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.train, size: 20, color: AppTheme.textPrimary),
                  const SizedBox(width: 8),
                  Text(
                    train.trainId,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const Spacer(),
                  const Icon(Icons.access_time, size: 16, color: AppTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    'ETA: ${train.etaMinutes} min',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.blueLineColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                train.direction,
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(TrainStatus status) {
    switch (status) {
      case TrainStatus.normal: return AppTheme.occupancyLow;
      case TrainStatus.moderate: return AppTheme.occupancyMedium;
      case TrainStatus.full: return AppTheme.occupancyHigh;
      case TrainStatus.emergency: return Colors.black;
    }
  }
}
