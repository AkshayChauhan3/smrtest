import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../constants/metro_data.dart';
import '../constants/theme.dart';
import '../../features/trains/models/train_model.dart';
import '../../features/trains/models/coach_model.dart';
import 'status_badge.dart';

class TrainCard extends StatelessWidget {
  final TrainModel train;
  final int index;

  const TrainCard({super.key, required this.train, this.index = 0});

  @override
  Widget build(BuildContext context) {
    final isBlueLine = train.line == MetroLine.blue;
    final lineColor = isBlueLine ? AppTheme.blueLine : AppTheme.redLine;
    final statusColor = train.isAtPlatform ? AppTheme.signalGreen : _getStatusColor(train.status);
    final lineNumber = isBlueLine ? '1' : '2';
    final lineName = isBlueLine ? 'Blue Line' : 'Red Line';

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
                crossAxisAlignment: CrossAxisAlignment.start,
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
                              train.trainId == 'ESP32_DEMO' ? 'ESP32 Sensor Train' : train.displayName,
                              style: AppTheme.tabularNumberStyle.copyWith(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              '$lineName · ${train.direction.toUpperCase()}${train.journeyDurationMinutes != null ? " · ${train.journeyDurationMinutes} MIN TRIP" : ""}',
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (train.isAtPlatform)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.signalGreen.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.signalGreen.withOpacity(0.3)),
                          ),
                          child: const Text(
                            'AT PLATFORM',
                            style: TextStyle(
                              color: AppTheme.signalGreen,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        )
                      else
                        StatusBadge(status: train.status),
                    ],
                  ),
                  const Divider(height: 24, color: Color(0x0DFFFFFF)),
                  if (train.isAtPlatform) ...[
                    // Currently At Platform: show departure from current station and arrival at destination
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildTimeColumn('DEPARTS HERE', train.departureTime ?? '--:--'),
                        _buildTimeColumn('ARRIVES AT ${train.destinationName?.toUpperCase() ?? "DESTINATION"}', train.arrivalTime ?? '--:--'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'ACTUAL COACH OCCUPANCY',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                        if (train.predictedStationCrowd != null && train.predictedStationCrowd! > 0)
                          Row(
                            children: [
                              const Icon(Icons.people_alt_rounded, size: 11, color: AppTheme.signalGreen),
                              const SizedBox(width: 4),
                              Text(
                                'PLATFORM: ${train.predictedStationCrowd} PAX',
                                style: const TextStyle(
                                  color: AppTheme.signalGreen,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildCoachOccupancyList(train.coaches),
                  ] else ...[
                    // Upcoming: show estimated departure from current station and arrival at destination
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildTimeColumn('EST. DEPARTURE', train.departureTime ?? '--:--'),
                        _buildTimeColumn('EST. ARRIVAL (${train.destinationName?.toUpperCase() ?? "DEST"})', train.arrivalTime ?? '--:--'),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'ETA',
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  '${train.etaMinutes}',
                                  style: AppTheme.tabularNumberStyle.copyWith(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 2),
                                const Text(
                                  'MIN',
                                  style: TextStyle(color: AppTheme.textMuted, fontSize: 8, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'PREDICTED COACH OCCUPANCY',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                        if (train.predictedStationCrowd != null && train.predictedStationCrowd! > 0)
                          Row(
                            children: [
                              const Icon(Icons.people_alt_rounded, size: 11, color: AppTheme.blueLine),
                              const SizedBox(width: 4),
                              Text(
                                'PRED. PLATFORM: ~${train.predictedStationCrowd} PAX',
                                style: const TextStyle(
                                  color: AppTheme.blueLine,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _buildCoachOccupancyList(train.coaches),
                    const Divider(height: 24, color: Color(0x0DFFFFFF)),
                    _buildStopsTimeline(context),
                  ],
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

  Widget _buildTimeColumn(String label, String time) {
    // If the time is ISO, format it to HH:MM
    String formattedTime = time;
    if (time.contains('T')) {
      try {
        final parsed = DateTime.parse(time);
        formattedTime = '${parsed.hour.toString().padLeft(2, '0')}:${parsed.minute.toString().padLeft(2, '0')}';
      } catch (_) {}
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            const Icon(Icons.access_time, size: 12, color: AppTheme.textMuted),
            const SizedBox(width: 4),
            Text(
              formattedTime,
              style: AppTheme.tabularNumberStyle.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCoachOccupancyList(List<CoachModel> coaches) {
    final list = coaches.isNotEmpty ? coaches : [
      CoachModel(coachNumber: 1, type: 'General', capacity: 400, currentPassengers: 0),
      CoachModel(coachNumber: 2, type: 'Ladies', capacity: 400, currentPassengers: 0),
      CoachModel(coachNumber: 3, type: 'General', capacity: 400, currentPassengers: 0),
    ];
    
    return Row(
      children: list.map((c) {
        final isLadies = c.type.toLowerCase().contains('ladies');
        final color = isLadies ? AppTheme.ladiesTint : AppTheme.blueLine;
        final pct = (c.percentFull * 100).round();
        final isLast = c == list.last;

        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: isLast ? 0 : 8),
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.06),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: color.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'C${c.coachNumber} ${isLadies ? "(Ladies)" : ""}',
                  style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${c.currentPassengers} pax',
                  style: AppTheme.tabularNumberStyle.copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  '$pct% full',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStopsTimeline(BuildContext context) {
    final stations = getStationsForLine(train.line);
    final fromIdx = stations.indexWhere((s) => s.id == train.fromStationId);
    final toIdx = stations.indexWhere((s) => s.id == train.toStationId);
    if (fromIdx == -1 || toIdx == -1) return const SizedBox.shrink();

    final List<Station> stops = [];
    if (fromIdx <= toIdx) {
      for (int i = fromIdx; i <= toIdx; i++) {
        stops.add(stations[i]);
      }
    } else {
      for (int i = fromIdx; i >= toIdx; i--) {
        stops.add(stations[i]);
      }
    }

    final isBlueLine = train.line == MetroLine.blue;
    final lineColor = isBlueLine ? AppTheme.blueLine : AppTheme.redLine;

    // Build the estimated passenger counts
    final List<int> pcounts = [];
    int currentP = train.totalPassengers;
    if (currentP == 0) {
      currentP = 320;
    }

    for (int i = 0; i < stops.length; i++) {
      final s = stops[i];
      if (i == 0) {
        pcounts.add(currentP);
      } else {
        final seed = (train.trainId.hashCode + s.id.hashCode) % 100;
        final isBusy = s.name.contains('Central') || s.name.contains('High Court') || s.name.contains('Stadium') || s.name.contains('University');
        final deboardPct = isBusy ? 0.15 : 0.08;
        final deboard = (currentP * deboardPct).round();
        final board = isBusy ? (80 + seed % 40) : (30 + seed % 20);
        currentP = (currentP - deboard + board).clamp(50, 1100);
        pcounts.add(currentP);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'EST. PASSENGERS AT EACH STOP',
          style: TextStyle(
            color: AppTheme.textMuted,
            fontSize: 9,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(stops.length, (i) {
              final s = stops[i];
              final count = pcounts[i];
              final isLast = i == stops.length - 1;

              return Row(
                children: [
                  Column(
                    children: [
                      // Node circle
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: lineColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(height: 6),
                      // Station name
                      Text(
                        s.id,
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Passenger count
                      Text(
                        '$count pax',
                        style: AppTheme.tabularNumberStyle.copyWith(
                          color: AppTheme.textMuted,
                          fontSize: 8,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  if (!isLast) ...[
                    // Line segment connecting stops
                    Container(
                      width: 40,
                      height: 2,
                      color: lineColor.withOpacity(0.4),
                    ),
                  ],
                ],
              );
            }),
          ),
        ),
      ],
    );
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
