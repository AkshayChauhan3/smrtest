import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/theme.dart';
import '../providers/esp_sensor_provider.dart';

class LiveSensorBanner extends ConsumerWidget {
  final String? filterStationId;

  const LiveSensorBanner({
    super.key,
    this.filterStationId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sensorAsync = ref.watch(espSensorLiveProvider);

    return sensorAsync.when(
      data: (sensor) {
        if (sensor == null) return const SizedBox.shrink();

        // If station filter is provided and sensor is attached to another station
        if (filterStationId != null &&
            sensor.stationId != null &&
            sensor.stationId != 'ALL' &&
            sensor.stationId != filterStationId) {
          return const SizedBox.shrink();
        }

        final isHeavy = sensor.occupancyPct >= 75;
        final isModerate = sensor.occupancyPct >= 40;
        final statusColor = isHeavy
            ? AppTheme.signalRed
            : isModerate
                ? AppTheme.signalAmber
                : AppTheme.signalGreen;

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: sensor.isActive
                  ? statusColor.withValues(alpha: 0.4)
                  : Colors.white.withValues(alpha: 0.08),
              width: 1.2,
            ),
            boxShadow: [
              if (sensor.isActive)
                BoxShadow(
                  color: statusColor.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: sensor.isActive ? AppTheme.signalGreen : Colors.grey,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'LIVE SENSOR (COACH ${sensor.coachId})',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.0,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      sensor.loadStatus.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Occupancy Main Stats
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '${sensor.occupancy}',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                fontFamily: 'monospace',
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '/ ${sensor.coachCapacity} pax',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        // Progress bar
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: (sensor.occupancyPct / 100).clamp(0.0, 1.0),
                            backgroundColor: Colors.white.withValues(alpha: 0.08),
                            valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),

                  // IN / OUT counters
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.arrow_downward, size: 12, color: AppTheme.signalGreen),
                          const SizedBox(width: 2),
                          Text(
                            'IN: ${sensor.totalIn}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.signalGreen,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.arrow_upward, size: 12, color: AppTheme.signalAmber),
                          const SizedBox(width: 2),
                          Text(
                            'OUT: ${sensor.totalOut}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.signalAmber,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}
