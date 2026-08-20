import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Dark-First Transit Palette
  static const Color surfaceDark = Color(0xFF0E1116);
  static const Color surfaceElevated = Color(0xFF171B22);
  static const Color surfaceCard = Color(0xFF1C212B);
  static const Color surfaceGlass = Color(0xCC171B22);
  static const Color surfaceGlassBorder = Color(0x26FFFFFF); // 15% white
  
  static const Color blueLine = Color(0xFF2D7DFF);
  static const Color blueLineGlow = Color(0x402D7DFF);
  static const Color redLine = Color(0xFFFF3B5C);
  static const Color redLineGlow = Color(0x40FF3B5C);
  
  static const Color signalGreen = Color(0xFF00E6A0);
  static const Color signalAmber = Color(0xFFFFC857);
  static const Color signalRed = Color(0xFFFF4D4D);
  static const Color ladiesTint = Color(0xFFFF7AB6);
  
  static const Color textPrimary = Color(0xFFF5F7FA);
  static const Color textSecondary = Color(0xFFC0C7D5);
  static const Color textMuted = Color(0xFF8A93A6);

  static const double borderRadius = 16.0;

  static TextStyle get tabularNumberStyle => TextStyle(
    fontFeatures: const [FontFeature.tabularFigures()],
    fontFamily: GoogleFonts.spaceGrotesk().fontFamily,
  );

  static Color coachColor(double percent) {
    if (percent < 0.4) return signalGreen;
    if (percent < 0.7) return signalAmber;
    return signalRed;
  }

  static BoxDecoration glassBoxDecoration({
    Color? color,
    double radius = borderRadius,
    Color borderColor = surfaceGlassBorder,
    double borderWidth = 1.0,
    List<BoxShadow>? shadows,
  }) {
    return BoxDecoration(
      color: color ?? surfaceElevated,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: borderColor, width: borderWidth),
      boxShadow: shadows ?? [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.35),
          blurRadius: 16,
          offset: const Offset(0, 6),
        ),
      ],
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: surfaceDark,
      colorScheme: const ColorScheme.dark(
        primary: blueLine,
        secondary: redLine,
        surface: surfaceElevated,
        onSurface: textPrimary,
      ),
      textTheme: GoogleFonts.interTextTheme(
        ThemeData.dark().textTheme.apply(
          bodyColor: textPrimary,
          displayColor: textPrimary,
        ),
      ).copyWith(
        displayLarge: GoogleFonts.spaceGrotesk(color: textPrimary, fontWeight: FontWeight.bold),
        displayMedium: GoogleFonts.spaceGrotesk(color: textPrimary, fontWeight: FontWeight.bold),
        displaySmall: GoogleFonts.spaceGrotesk(color: textPrimary, fontWeight: FontWeight.bold),
        headlineLarge: GoogleFonts.spaceGrotesk(color: textPrimary, fontWeight: FontWeight.bold),
        headlineMedium: GoogleFonts.spaceGrotesk(color: textPrimary, fontWeight: FontWeight.bold),
        headlineSmall: GoogleFonts.spaceGrotesk(color: textPrimary, fontWeight: FontWeight.bold),
      ),
      cardTheme: CardThemeData(
        color: surfaceElevated,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
          side: const BorderSide(color: Color(0x1AFFFFFF)), // 10% white border
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: textPrimary),
        titleTextStyle: GoogleFonts.spaceGrotesk(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          backgroundColor: blueLine,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.5),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: blueLine,
        unselectedItemColor: textMuted,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceElevated,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0x1AFFFFFF)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0x1AFFFFFF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: blueLine, width: 2),
        ),
        labelStyle: const TextStyle(color: textMuted, fontSize: 13),
        hintStyle: const TextStyle(color: textMuted, fontSize: 14),
        prefixIconColor: textMuted,
      ),
    );
  }
}
