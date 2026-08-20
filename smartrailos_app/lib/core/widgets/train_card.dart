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
    final isBlueLine = train.line == MetroLine.blue;
    final lineColor = isBlueLine ? AppTheme.blueLine : AppTheme.redLine;

    // Use live stops timeline if provided by backend, otherwise generate fallback stops
    final List<JourneyStopModel> stops = train.stopsTimeline.isNotEmpty
        ? train.stopsTimeline
        : () {
            final stations = getStationsForLine(train.line);
            final fromIdx = stations.indexWhere((s) => s.id == train.fromStationId);
            final toIdx = stations.indexWhere((s) => s.id == train.toStationId);
            if (fromIdx == -1 || toIdx == -1) return <JourneyStopModel>[];
            final list = <JourneyStopModel>[];
            final step = fromIdx <= toIdx ? 1 : -1;
            for (int i = fromIdx; (step > 0 ? i <= toIdx : i >= toIdx); i += step) {
              final st = stations[i];
              list.add(JourneyStopModel(
                stationId: st.id,
                stationName: st.name,
                arrivalTime: '--:--',
                departureTime: '--:--',
                isUserOrigin: st.id == train.fromStationId,
                isUserDestination: st.id == train.toStationId,
                predictedStationCrowd: 120,
                estimatedTrainOccupancy: train.totalPassengers,
              ));
            }
            return list;
          }();

    if (stops.isEmpty) return const SizedBox.shrink();

    // Determine current live status label
    String liveStatusBanner = '';
    Color statusColor = AppTheme.signalGreen;
    if (train.liveStatus == 'AT_STATION') {
      liveStatusBanner = 'AT STATION: ${train.liveCurrentStationName ?? train.liveCurrentStationId ?? "Platform"}';
      statusColor = AppTheme.signalGreen;
    } else if (train.liveStatus == 'IN_TRANSIT') {
      liveStatusBanner = 'EN ROUTE ➔ ${train.liveNextStationName ?? train.liveNextStationId ?? "Next Station"} (${train.etaMinutes}m ETA)';
      statusColor = isBlueLine ? AppTheme.blueLine : AppTheme.redLine;
    } else if (train.liveStatus == 'WAITING_AT_TERMINAL') {
      liveStatusBanner = 'AT TERMINAL (${train.liveCurrentStationName ?? "Origin"})';
      statusColor = AppTheme.signalAmber;
    } else {
      liveStatusBanner = 'SCHEDULED (${train.departureTime ?? "On Time"})';
      statusColor = AppTheme.textMuted;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'LIVE ROUTE & CROWD TIMELINE',
              style: TextStyle(
                color: AppTheme.textMuted,
                fontSize: 9,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: statusColor.withOpacity(0.3), width: 0.8),
                ),
                child: Text(
                  liveStatusBanner,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: List.generate(stops.length, (i) {
              final s = stops[i];
              final isLast = i == stops.length - 1;
              final isPassed = s.isPassed;
              final isCurrent = s.isCurrent;
              final isUserStop = s.isUserOrigin || s.isUserDestination;

              final nodeColor = isCurrent
                  ? AppTheme.signalGreen
                  : isPassed
                      ? AppTheme.textMuted.withOpacity(0.4)
                      : isUserStop
                          ? lineColor
                          : lineColor.withOpacity(0.7);

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Node Icon / Circle
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          if (isCurrent)
                            Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                color: AppTheme.signalGreen.withOpacity(0.25),
                                shape: BoxShape.circle,
                              ),
                            ),
                          Container(
                            width: isUserStop || isCurrent ? 12 : 8,
                            height: isUserStop || isCurrent ? 12 : 8,
                            decoration: BoxDecoration(
                              color: nodeColor,
                              shape: BoxShape.circle,
                              border: isUserStop
                                  ? Border.all(color: Colors.white, width: 1.5)
                                  : null,
                            ),
                            child: isPassed
                                ? const Icon(Icons.check, size: 6, color: Colors.black)
                                : null,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Station ID
                      Text(
                        s.stationId,
                        style: TextStyle(
                          color: isPassed
                              ? AppTheme.textMuted.withOpacity(0.5)
                              : isCurrent || isUserStop
                                  ? Colors.white
                                  : AppTheme.textPrimary,
                          fontSize: 10,
                          fontWeight: isUserStop || isCurrent ? FontWeight.bold : FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Arrival Time
                      Text(
                        s.arrivalTime.isNotEmpty ? s.arrivalTime : '--:--',
                        style: AppTheme.tabularNumberStyle.copyWith(
                          color: isPassed
                              ? AppTheme.textMuted.withOpacity(0.4)
                              : isUserStop
                                  ? lineColor
                                  : AppTheme.textMuted,
                          fontSize: 8,
                          fontWeight: isUserStop ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      const SizedBox(height: 2),
                      // Platform crowd badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: isPassed
                              ? Colors.transparent
                              : AppTheme.surfaceElevated,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(
                          isPassed ? 'Passed' : '${s.predictedStationCrowd} pax',
                          style: TextStyle(
                            color: isPassed
                                ? AppTheme.textMuted.withOpacity(0.4)
                                : AppTheme.textMuted,
                            fontSize: 7.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (!isLast) ...[
                    // Track connector line
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      width: 44,
                      height: 2,
                      decoration: BoxDecoration(
                        color: isPassed
                            ? AppTheme.textMuted.withOpacity(0.2)
                            : lineColor.withOpacity(0.4),
                      ),
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
