import 'package:flutter/material.dart';
import '../constants/metro_data.dart';
import '../constants/theme.dart';

class StationSelector extends StatelessWidget {
  final List<Station> stations;
  final Station? selectedStation;
  final String label;
  final Function(Station?) onChanged;
  final IconData icon;

  const StationSelector({
    super.key,
    required this.stations,
    this.selectedStation,
    required this.label,
    required this.onChanged,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<Station>(
      value: selectedStation,
      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppTheme.textMuted),
      dropdownColor: AppTheme.surfaceElevated,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
      ),
      style: const TextStyle(
        color: AppTheme.textPrimary,
        fontWeight: FontWeight.bold,
        fontSize: 16,
      ),
      items: stations.map((station) {
        return DropdownMenuItem<Station>(
          value: station,
          child: Text(station.name),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }
}
