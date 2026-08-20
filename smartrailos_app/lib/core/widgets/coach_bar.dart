import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../constants/theme.dart';
import '../../features/trains/models/coach_model.dart';

class CoachBar extends StatelessWidget {
  final CoachModel coach;

  const CoachBar({super.key, required this.coach});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.coachColor(coach.percentFull);
    final isLadies = coach.type.contains('Ladies');
    const segmentsCount = 10;
    final filledSegments = (coach.percentFull * segmentsCount).round();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'COACH ${coach.coachNumber}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: AppTheme.textMuted,
                      fontFamily: AppTheme.tabularNumberStyle.fontFamily,
                    ),
                  ),
                  if (isLadies) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.ladiesTint.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.ladiesTint.withOpacity(0.3)),
                      ),
                      child: const Text(
                        'LADIES',
                        style: TextStyle(
                          color: AppTheme.ladiesTint,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              Text(
                '${(coach.percentFull * 100).toInt()}%',
                style: AppTheme.tabularNumberStyle.copyWith(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            height: 14,
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
              boxShadow: isLadies 
                ? [BoxShadow(color: AppTheme.ladiesTint.withOpacity(0.15), blurRadius: 6, spreadRadius: 1)]
                : null,
            ),
            child: Row(
              children: List.generate(segmentsCount, (index) {
                final isFilled = index < filledSegments;
                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 1),
                    decoration: BoxDecoration(
                      color: isFilled ? color : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(1),
                    ),
                  )
                  .animate()
                  .fadeIn(delay: (30 * index).ms)
                  .scale(begin: const Offset(0, 1), alignment: Alignment.centerLeft, delay: (30 * index).ms),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
