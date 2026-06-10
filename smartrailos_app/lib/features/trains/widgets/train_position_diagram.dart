import 'package:flutter/material.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/constants/theme.dart';

class TrainPositionDiagram extends StatelessWidget {
  final List<Station> stations;
  final int currentPositionIndex;
  final String fromStationId;
  final String toStationId;

  const TrainPositionDiagram({
    super.key,
    required this.stations,
    required this.currentPositionIndex,
    required this.fromStationId,
    required this.toStationId,
  });

  @override
  Widget build(BuildContext context) {
    // Show ±4 stations around current position
    final startIndex = (currentPositionIndex - 4).clamp(0, stations.length - 1);
    final endIndex = (currentPositionIndex + 4).clamp(0, stations.length - 1);
    final visibleStations = stations.sublist(startIndex, endIndex + 1);

    return Container(
      height: 120,
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: visibleStations.length,
        itemBuilder: (context, index) {
          final station = visibleStations[index];
          final globalIndex = startIndex + index;
          final isCurrent = globalIndex == currentPositionIndex;
          final isUserFrom = station.id == fromStationId;
          final isUserTo = station.id == toStationId;
          
          final color = station.lineId == MetroLine.blue ? AppTheme.blueLineColor : AppTheme.redLineColor;

          return SizedBox(
            width: 100,
            child: Column(
              children: [
                // Station name
                Text(
                  station.name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: (isUserFrom || isUserTo) ? FontWeight.bold : FontWeight.normal,
                    color: (isUserFrom || isUserTo) ? AppTheme.textPrimary : AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                // Line and dot
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Horizontal line
                    Container(
                      height: 4,
                      width: 100,
                      color: color.withOpacity(0.3),
                    ),
                    // Dot
                    Container(
                      width: isCurrent ? 24 : 12,
                      height: isCurrent ? 24 : 12,
                      decoration: BoxDecoration(
                        color: isCurrent ? color : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: color,
                          width: isCurrent ? 4 : 2,
                        ),
                        boxShadow: isCurrent ? [
                          BoxShadow(
                            color: color.withOpacity(0.4),
                            blurRadius: 8,
                            spreadRadius: 2,
                          )
                        ] : null,
                      ),
                      child: isCurrent ? const Icon(Icons.train, size: 12, color: Colors.white) : null,
                    ),
                  ],
                ),
                const Spacer(),
                // Label for user stations
                if (isUserFrom) 
                  const Text('YOUR STOP', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.blueLineColor)),
                if (isUserTo)
                  const Text('DESTINATION', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.red)),
              ],
            ),
          );
        },
      ),
    );
  }
}
