import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/theme.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  void _navigateToNext() async {
    await Future.delayed(const Duration(milliseconds: 2000));
    if (!mounted) return;
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceDark,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              height: 100,
              width: 140,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned(
                    left: 0,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: AppTheme.blueLine,
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate()
                    .slideX(begin: -2, end: 0.2, duration: 1000.ms, curve: Curves.elasticOut),
                  ),
                  Positioned(
                    right: 0,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: AppTheme.redLine,
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate()
                    .slideX(begin: 2, end: -0.2, duration: 1000.ms, curve: Curves.elasticOut),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
            Text(
              'SMARTRAIL OS',
              style: GoogleFonts.spaceGrotesk(
                color: AppTheme.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 6.0,
              ),
            ).animate().fadeIn(delay: 600.ms),
            const SizedBox(height: 8),
            const Text(
              'INTELLIGENT TRANSIT SYSTEM',
              style: TextStyle(
                color: AppTheme.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 2.0,
              ),
            ).animate().fadeIn(delay: 1000.ms),
          ],
        ),
      ),
    );
  }
}
