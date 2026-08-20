import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/constants/theme.dart';
import '../../../core/widgets/station_selector.dart';
import '../../../core/widgets/floating_nav.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/train_search_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;
    final selectedLine = ref.watch(selectedLineProvider);
    final fromStation = ref.watch(fromStationProvider);
    final toStation = ref.watch(toStationProvider);

    final stations = getStationsForLine(selectedLine);
    final activeColor = selectedLine == MetroLine.blue ? AppTheme.blueLine : AppTheme.redLine;

    return Scaffold(
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 160,
                floating: false,
                pinned: true,
                backgroundColor: AppTheme.surfaceDark,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    'SMARTRAIL OS',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                      fontFamily: AppTheme.tabularNumberStyle.fontFamily,
                    ),
                  ),
                  centerTitle: true,
                  background: Stack(
                    children: [
                      Positioned.fill(
                        child: Container(color: AppTheme.surfaceDark),
                      ),
                      Positioned(
                        right: -50,
                        top: -50,
                        child: Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [activeColor.withOpacity(0.15), Colors.transparent],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                actions: [
                  IconButton(
                    onPressed: () => context.push('/profile'),
                    icon: const Icon(Icons.account_circle_outlined, color: AppTheme.textPrimary),
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'WELCOME,\n${user?.name.toUpperCase() ?? "PASSENGER"}',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.0,
                        ),
                      ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 32),
                      
                      const Text(
                        'SELECT LINE',
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ).animate().fadeIn(delay: 100.ms),
                      const SizedBox(height: 12),
                      _buildLineSelector(ref, selectedLine)
                          .animate()
                          .fadeIn(delay: 200.ms)
                          .slideY(begin: 0.1, end: 0),
                      
                      const SizedBox(height: 32),
                      
                      // Find Your Train Card
                      _buildSearchCard(context, ref, selectedLine, stations, fromStation, toStation)
                          .animate()
                          .fadeIn(delay: 300.ms)
                          .slideY(begin: 0.1, end: 0),
                      
                      const SizedBox(height: 32),
                      
                      // Recent Searches
                      if (user?.email == 'test@smartrail.os') ...[
                        const Text(
                          'RECENT JOURNEYS',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                        ).animate().fadeIn(delay: 400.ms),
                        const SizedBox(height: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceElevated,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0x1AFFFFFF)),
                          ),
                          child: ListTile(
                            leading: const Icon(Icons.history, color: AppTheme.textMuted),
                            title: const Text('Sabarmati → Old High Court', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            subtitle: const Text('Red Line', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                            trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted, size: 20),
                            onTap: () {
                              context.push(
                                Uri(path: '/results', queryParameters: {
                                  'lineId': 'red',
                                  'fromStationId': 'SM',
                                  'toStationId': 'OHC',
                                }).toString(),
                              );
                            },
                          ),
                        ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1, end: 0),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: FloatingNav(
              currentIndex: 0,
              activeColor: activeColor,
              onTap: (index) {
                if (index == 2) context.push('/profile');
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLineSelector(WidgetRef ref, MetroLine selectedLine) {
    return Row(
      children: [
        Expanded(
          child: _LineTile(
            line: MetroLine.blue,
            isSelected: selectedLine == MetroLine.blue,
            onTap: () => _selectLine(ref, MetroLine.blue),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _LineTile(
            line: MetroLine.red,
            isSelected: selectedLine == MetroLine.red,
            onTap: () => _selectLine(ref, MetroLine.red),
          ),
        ),
      ],
    );
  }

  void _selectLine(WidgetRef ref, MetroLine line) {
    ref.read(selectedLineProvider.notifier).state = line;
    ref.read(fromStationProvider.notifier).state = null;
    ref.read(toStationProvider.notifier).state = null;
  }

  Widget _buildSearchCard(
    BuildContext context,
    WidgetRef ref,
    MetroLine selectedLine,
    List<Station> stations,
    Station? fromStation,
    Station? toStation,
  ) {
    final activeColor = selectedLine == MetroLine.blue ? AppTheme.blueLine : AppTheme.redLine;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTheme.borderRadius),
        color: AppTheme.surfaceElevated,
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'PLAN JOURNEY',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 10,
              color: AppTheme.textMuted,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 24),
          
          StationSelector(
            label: 'FROM STATION',
            stations: stations,
            selectedStation: fromStation,
            icon: Icons.location_on_outlined,
            onChanged: (val) => ref.read(fromStationProvider.notifier).state = val,
          ),
          
          const SizedBox(height: 16),
          
          StationSelector(
            label: 'TO STATION',
            stations: stations.where((s) => s.id != fromStation?.id).toList(),
            selectedStation: toStation,
            icon: Icons.flag_outlined,
            onChanged: (val) => ref.read(toStationProvider.notifier).state = val,
          ),
          
          const SizedBox(height: 32),
          
          ElevatedButton(
            onPressed: (fromStation != null && toStation != null)
                ? () {
                    context.push(
                      Uri(path: '/results', queryParameters: {
                        'lineId': selectedLine.name,
                        'fromStationId': fromStation.id,
                        'toStationId': toStation.id,
                      }).toString(),
                    );
                  }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: activeColor,
              minimumSize: const Size.fromHeight(56),
            ),
            child: const Text('SEARCH TRAINS'),
          ),
        ],
      ),
    );
  }
}

class _LineTile extends StatelessWidget {
  final MetroLine line;
  final bool isSelected;
  final VoidCallback onTap;

  const _LineTile({
    required this.line,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = line == MetroLine.blue ? AppTheme.blueLine : AppTheme.redLine;
    final name = line == MetroLine.blue ? "BLUE LINE" : "RED LINE";
    final lineNumber = line == MetroLine.blue ? "1" : "2";

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: 300.ms,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.08) : AppTheme.surfaceElevated,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : const Color(0x1AFFFFFF),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  child: Center(
                    child: Text(
                      lineNumber,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ),
                // Mini Diagram
                Row(
                  children: [
                    Container(width: 4, height: 4, decoration: const BoxDecoration(color: AppTheme.textMuted, shape: BoxShape.circle)),
                    Container(width: 12, height: 1, color: AppTheme.textMuted.withOpacity(0.3)),
                    Container(width: 4, height: 4, decoration: const BoxDecoration(color: AppTheme.textMuted, shape: BoxShape.circle)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              name,
              style: TextStyle(
                color: isSelected ? color : AppTheme.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 13,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              line == MetroLine.blue ? "Thaltej ↔ Vastral" : "Motera ↔ GNLU",
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}
