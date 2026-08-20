class CoachModel {
  final int coachNumber;
  final String type; // "General" or "Ladies/General"
  final int capacity; // 175
  final int currentPassengers;

  CoachModel({
    required this.coachNumber,
    required this.type,
    required this.capacity,
    required this.currentPassengers,
  });

  double get percentFull => currentPassengers / capacity;

  factory CoachModel.fromJson(Map<String, dynamic> json) {
    return CoachModel(
      coachNumber: json['coachNumber'],
      type: json['type'],
      capacity: json['capacity'],
      currentPassengers: json['currentPassengers'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'coachNumber': coachNumber,
      'type': type,
      'capacity': capacity,
      'currentPassengers': currentPassengers,
    };
  }
}
