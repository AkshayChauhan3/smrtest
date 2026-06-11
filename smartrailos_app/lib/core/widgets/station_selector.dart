import 'package:flutter/material.dart';
import '../constants/metro_data.dart';

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
      initialValue: selectedStation,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: const OutlineInputBorder(),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
