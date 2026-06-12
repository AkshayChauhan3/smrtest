import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/theme.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;

    return Scaffold(
      appBar: AppBar(title: const Text('PROFILE')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Avatar
            CircleAvatar(
              radius: 60,
              backgroundColor: AppTheme.blueLine.withOpacity(0.1),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.blueLine.withOpacity(0.3), width: 2),
                ),
                alignment: Alignment.center,
                child: Text(
                  user?.name.substring(0, 1).toUpperCase() ?? 'U',
                  style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppTheme.blueLine),
                ),
              ),
            ).animate().scale(duration: 400.ms, curve: Curves.easeOutBack),
            const SizedBox(height: 24),
            Text(
              user?.name?.toUpperCase() ?? 'USER',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 1.0),
            ).animate().fadeIn(delay: 200.ms),
            Text(
              user?.email ?? '',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
            ).animate().fadeIn(delay: 300.ms),
            
            const SizedBox(height: 60),
            
            // Saved Routes section
            Row(
              children: [
                const Icon(Icons.bookmark_outline, color: AppTheme.textMuted, size: 20),
                const SizedBox(width: 8),
                Text(
                  'SAVED JOURNEYS',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.textMuted, letterSpacing: 1.0),
                ),
              ],
            ).animate().fadeIn(delay: 400.ms),
            const SizedBox(height: 16),
            
            if (user?.email == 'test@smartrail.os') ...[
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0x1AFFFFFF)),
                ),
                child: ListTile(
                  leading: const Icon(Icons.star, color: AppTheme.signalAmber),
                  title: const Text('Blue Line · Old High Court → Thaltej', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Daily Commute', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textMuted),
                  onTap: () {
                    context.push(
                      Uri(path: '/results', queryParameters: {
                        'lineId': 'blue',
                        'fromStationId': 'OHC',
                        'toStationId': 'TG',
                      }).toString(),
                    );
                  },
                ),
              ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1, end: 0),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 48),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0x1AFFFFFF), style: BorderStyle.solid),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.bookmark_border, size: 48, color: AppTheme.textMuted),
                    SizedBox(height: 16),
                    Text(
                      'No saved routes yet', 
                      style: TextStyle(color: AppTheme.textMuted, fontWeight: FontWeight.bold)
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 500.ms),
            ],
            
            const SizedBox(height: 60),
            
            // Logout
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('SIGN OUT', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.0)),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.signalRed,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: AppTheme.signalRed.withOpacity(0.3)),
                  ),
                ),
              ),
            ).animate().fadeIn(delay: 700.ms),
          ],
        ),
      ),
    );
  }
}
