import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color blueLineColor = Color(0xFF1565C0);
  static const Color redLineColor = Color(0xFFC62828);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Colors.white;
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  
  static const Color occupancyLow = Color(0xFF43A047);
  static const Color occupancyMedium = Color(0xFFFFB300);
  static const Color occupancyHigh = Color(0xFFE53935);
  static const Color ladiesCoachTint = Color(0xFFF48FB1);

  static Color coachColor(double percent) {
    if (percent < 0.5) return occupancyLow;
    if (percent < 0.8) return occupancyMedium;
    return occupancyHigh;
  }

  static const double borderRadius = 14.0;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: blueLineColor,
        primary: blueLineColor,
        secondary: redLineColor,
        surface: surfaceColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      textTheme: GoogleFonts.poppinsTextTheme(),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
