import 'package:flutter/material.dart';
import '../constants/metro_data.dart';
import '../constants/theme.dart';

class LineBadge extends StatelessWidget {
  final MetroLine line;
  final bool isSmall;

  const LineBadge({super.key, required this.line, this.isSmall = false});

  @override
  Widget build(BuildContext context) {
    final color = line == MetroLine.blue ? AppTheme.blueLineColor : AppTheme.redLineColor;
    final label = line == MetroLine.blue ? 'Blue Line' : 'Red Line';

    return Container(
      padding: EdgeInsets.symmetric(horizontal: isSmall ? 8 : 12, vertical: isSmall ? 2 : 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: Colors.white,
          fontSize: isSmall ? 10 : 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
