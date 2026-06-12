import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../constants/metro_data.dart';
import '../constants/theme.dart';
import '../../features/trains/models/train_model.dart';
import 'status_badge.dart';

class TrainCard extends StatelessWidget {
  final TrainModel train;
  final int index;

  const TrainCard({super.key, required this.train, this.index = 0});

  @override
  Widget build(BuildContext context) {
    final isBlueLine = train.line == MetroLine.blue;
    final lineColor = isBlueLine ? AppTheme.blueLine : AppTheme.redLine;
    final statusColor = _getStatusColor(train.status);
    final lineNumber = isBlueLine ? '1' : '2';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(AppTheme.borderRadius),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppTheme.borderRadius),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: statusColor, width: 4),
            ),
          ),
          child: InkWell(
            onTap: () => context.push('/train/${train.trainId}'),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Line Disc
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: lineColor,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            lineNumber,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Train Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              train.trainId,
                              style: AppTheme.tabularNumberStyle.copyWith(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                            Text(
                              train.direction.toUpperCase(),
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      StatusBadge(status: train.status),
                    ],
                  ),
                  const Divider(height: 24, color: Color(0x0DFFFFFF)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'NEXT DEPARTURE',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '${train.etaMinutes}',
                            style: AppTheme.tabularNumberStyle.copyWith(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'MIN',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    )
    .animate()
    .fadeIn(delay: (80 * index).ms, duration: 400.ms)
    .slideX(begin: 0.1, end: 0, curve: Curves.easeOutCubic, delay: (80 * index).ms);
  }

  Color _getStatusColor(TrainStatus status) {
    switch (status) {
      case TrainStatus.normal: return AppTheme.signalGreen;
      case TrainStatus.moderate: return AppTheme.signalAmber;
      case TrainStatus.full: return AppTheme.signalRed;
      case TrainStatus.emergency: return AppTheme.ladiesTint;
    }
  }
}
