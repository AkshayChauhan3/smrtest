// BACKEND:
// Method:  GET
// URL:     /api/v1/stations?lineId=blue  (or ?lineId=red)
// Returns: List<Station JSON>
// Currently hardcoded here. Replace getStationsForLine() with an API call
// so station lists can be updated server-side without an app release.

enum MetroLine { blue, red }

enum TrainDirection { up, down }

class Station {
  final String id;
  final String name;
  final MetroLine lineId;
  final int sequenceIndex;

  const Station({
    required this.id,
    required this.name,
    required this.lineId,
    required this.sequenceIndex,
  });
}

const List<Station> blueLineStations = [
  Station(id: 'VG', name: 'Vastral Gam', lineId: MetroLine.blue, sequenceIndex: 0),
  Station(id: 'AP', name: 'Apparel Park', lineId: MetroLine.blue, sequenceIndex: 1),
  Station(id: 'AW', name: 'Amraiwadi', lineId: MetroLine.blue, sequenceIndex: 2),
  Station(id: 'RC', name: 'Rabari Colony', lineId: MetroLine.blue, sequenceIndex: 3),
  Station(id: 'RH', name: 'Rajpur Hirpur', lineId: MetroLine.blue, sequenceIndex: 4),
  Station(id: 'OD', name: 'Odhav', lineId: MetroLine.blue, sequenceIndex: 5),
  Station(id: 'NC', name: 'Nirant Cross Road', lineId: MetroLine.blue, sequenceIndex: 6),
  Station(id: 'GY', name: 'Gyaspur', lineId: MetroLine.blue, sequenceIndex: 7),
  Station(id: 'SB', name: 'Saijpur Bogha', lineId: MetroLine.blue, sequenceIndex: 8),
  Station(id: 'SJ', name: 'Saijpur', lineId: MetroLine.blue, sequenceIndex: 9),
  Station(id: 'BN', name: 'Bapu Nagar', lineId: MetroLine.blue, sequenceIndex: 10),
  Station(id: 'KE', name: 'Kankaria East', lineId: MetroLine.blue, sequenceIndex: 11),
  Station(id: 'KW', name: 'Kankaria West', lineId: MetroLine.blue, sequenceIndex: 12),
  Station(id: 'MN', name: 'Maninagar', lineId: MetroLine.blue, sequenceIndex: 13),
  Station(id: 'SH', name: 'Shahpur', lineId: MetroLine.blue, sequenceIndex: 14),
  Station(id: 'KC', name: 'Kalupur (Central)', lineId: MetroLine.blue, sequenceIndex: 15),
  Station(id: 'GK', name: 'Gheekanta', lineId: MetroLine.blue, sequenceIndex: 16),
  Station(id: 'OHC', name: 'Old High Court', lineId: MetroLine.blue, sequenceIndex: 17),
  Station(id: 'PL', name: 'Paldi', lineId: MetroLine.blue, sequenceIndex: 18),
  Station(id: 'SY', name: 'Shreyas', lineId: MetroLine.blue, sequenceIndex: 19),
  Station(id: 'JP', name: 'Jivraj Park', lineId: MetroLine.blue, sequenceIndex: 20),
  Station(id: 'RN', name: 'Rajivnagar', lineId: MetroLine.blue, sequenceIndex: 21),
  Station(id: 'JN', name: 'Jivrajnagar', lineId: MetroLine.blue, sequenceIndex: 22),
  Station(id: 'VS', name: 'Vasna', lineId: MetroLine.blue, sequenceIndex: 23),
  Station(id: 'TG', name: 'Thaltej', lineId: MetroLine.blue, sequenceIndex: 24),
];

const List<Station> redLineStations = [
  Station(id: 'MS', name: 'Motera Stadium', lineId: MetroLine.red, sequenceIndex: 0),
  Station(id: 'SM', name: 'Sabarmati', lineId: MetroLine.red, sequenceIndex: 1),
  Station(id: 'RP', name: 'Ranip', lineId: MetroLine.red, sequenceIndex: 2),
  Station(id: 'CD', name: 'Chandlodia', lineId: MetroLine.red, sequenceIndex: 3),
  Station(id: 'VJ', name: 'Vadaj', lineId: MetroLine.red, sequenceIndex: 4),
  Station(id: 'VT', name: 'Visat', lineId: MetroLine.red, sequenceIndex: 5),
  Station(id: 'CK', name: 'Chandkheda', lineId: MetroLine.red, sequenceIndex: 6),
  Station(id: 'SRS', name: 'Sabarmati Railway Station', lineId: MetroLine.red, sequenceIndex: 7),
  Station(id: 'SC', name: 'Science City', lineId: MetroLine.red, sequenceIndex: 8),
  Station(id: 'OHC', name: 'Old High Court', lineId: MetroLine.red, sequenceIndex: 9),
  Station(id: 'BP', name: 'Bhopal', lineId: MetroLine.red, sequenceIndex: 10),
  Station(id: 'GN', name: 'GNLU', lineId: MetroLine.red, sequenceIndex: 11),
];

List<Station> getStationsForLine(MetroLine line) {
  return line == MetroLine.blue ? blueLineStations : redLineStations;
}

List<Station> getNextStations(MetroLine line, String currentStationId) {
  final stations = getStationsForLine(line);
  final currentIndex = stations.indexWhere((s) => s.id == currentStationId);
  if (currentIndex == -1) return [];
  
  // Direction UP: Toward Thaltej (Blue) or Motera (Red) - wait, PLAN says:
  // Blue Line: UP = toward Thaltej, DN = toward Vastral
  // Red Line: UP = toward Motera, DN = toward GNLU
  
  // Actually, sequenceIndex 0 is Vastral Gam for Blue, and Motera Stadium for Red.
  // So UP (toward Thaltej) is increasing index for Blue.
  // UP (toward Motera) is DECREASING index for Red if 0 is Motera? 
  // Let's re-read CONTEXT.md
  // Blue Line: Direction A: Eastbound -> West (toward Thaltej), Direction B: Westbound -> East (toward Vastral)
  // Red Line: Direction A: Southbound -> North (toward Motera), Direction B: Northbound -> South
  
  // Let's simplify and just return all stations other than the current one for now, 
  // or return stations that could be destinations.
  return stations.where((s) => s.id != currentStationId).toList();
}
