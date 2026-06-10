enum AnnouncementSeverity { info, warning, emergency }

class AnnouncementModel {
  final String message;
  final AnnouncementSeverity severity;
  final String? trainId;

  AnnouncementModel({
    required this.message,
    required this.severity,
    this.trainId,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    return AnnouncementModel(
      message: json['message'],
      severity: AnnouncementSeverity.values.firstWhere(
        (e) => e.name == json['severity'],
        orElse: () => AnnouncementSeverity.info,
      ),
      trainId: json['trainId'],
    );
  }
}
