import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import '../constants/theme.dart';
import '../../features/trains/models/coach_model.dart';

class CoachBar extends StatelessWidget {
  final CoachModel coach;

  const CoachBar({super.key, required this.coach});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.coachColor(coach.percentFull);
    final isLadies = coach.type.contains('Ladies');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'Coach ${coach.coachNumber}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  if (isLadies) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.ladiesCoachTint.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Ladies',
                        style: TextStyle(
                          color: AppTheme.ladiesCoachTint,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              Text(
                '${(coach.percentFull * 100).toInt()}% Full',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          LinearPercentIndicator(
            lineHeight: 12.0,
            percent: coach.percentFull,
            backgroundColor: Colors.grey[200],
            progressColor: color,
            barRadius: const Radius.circular(6),
            animation: true,
            animationDuration: 1000,
            padding: EdgeInsets.zero,
          ).animate().fadeIn(),
        ],
      ),
    );
  }
}
