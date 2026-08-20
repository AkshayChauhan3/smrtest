import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../constants/theme.dart';

class FloatingNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;
  final Color activeColor;

  const FloatingNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.activeColor = AppTheme.blueLine,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      height: 64,
      decoration: BoxDecoration(
        color: AppTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0x1AFFFFFF)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Sliding Indicator
          AnimatedAlign(
            duration: 350.ms,
            curve: Curves.easeOutBack,
            alignment: Alignment(-1 + (currentIndex * 1), 0),
            child: Container(
              width: 48,
              height: 32,
              margin: EdgeInsets.symmetric(horizontal: (MediaQuery.of(context).size.width - 48 - 64) / 6),
              decoration: BoxDecoration(
                color: activeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: activeColor.withOpacity(0.2),
                    blurRadius: 10,
                    spreadRadius: 1,
                  ),
                ],
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildNavItem(0, Icons.search_rounded),
              _buildNavItem(1, Icons.bookmark_outline_rounded),
              _buildNavItem(2, Icons.person_outline_rounded),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon) {
    final isSelected = currentIndex == index;
    
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 60,
        height: 64,
        child: Center(
          child: Icon(
            icon,
            color: isSelected ? activeColor : AppTheme.textMuted,
            size: 26,
          ),
        ),
      ),
    );
  }
}
