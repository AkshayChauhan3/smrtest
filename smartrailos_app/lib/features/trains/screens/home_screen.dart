import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/metro_data.dart';
import '../../../core/constants/theme.dart';
import '../../../core/widgets/station_selector.dart';
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartRail OS'),
        actions: [
          IconButton(
            onPressed: () => context.push('/profile'),
            icon: const Icon(Icons.account_circle_outlined, color: AppTheme.blueLineColor),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Good morning, ${user?.name ?? "Passenger"}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            
            // Find Your Train Card
            Card(
              elevation: 4,
              shadowColor: Colors.black12,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Find Your Train',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                    ),
                    const SizedBox(height: 20),
                    
                    // Line Toggle
                    SegmentedButton<MetroLine>(
                      segments: const [
                        ButtonSegment(value: MetroLine.blue, label: Text('Blue Line'), icon: Icon(Icons.circle, color: AppTheme.blueLineColor, size: 12)),
                        ButtonSegment(value: MetroLine.red, label: Text('Red Line'), icon: Icon(Icons.circle, color: AppTheme.redLineColor, size: 12)),
                      ],
                      selected: {selectedLine},
                      onSelectionChanged: (set) {
                        ref.read(selectedLineProvider.notifier).state = set.first;
                        ref.read(fromStationProvider.notifier).state = null;
                        ref.read(toStationProvider.notifier).state = null;
                      },
                      style: SegmentedButton.styleFrom(
                        selectedBackgroundColor: selectedLine == MetroLine.blue ? AppTheme.blueLineColor.withOpacity(0.1) : AppTheme.redLineColor.withOpacity(0.1),
                        selectedForegroundColor: selectedLine == MetroLine.blue ? AppTheme.blueLineColor : AppTheme.redLineColor,
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    StationSelector(
                      label: 'From Station',
                      stations: stations,
                      selectedStation: fromStation,
                      icon: Icons.location_on_outlined,
                      onChanged: (val) => ref.read(fromStationProvider.notifier).state = val,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    StationSelector(
                      label: 'To Station',
                      stations: stations.where((s) => s.id != fromStation?.id).toList(),
                      selectedStation: toStation,
                      icon: Icons.flag_outlined,
                      onChanged: (val) => ref.read(toStationProvider.notifier).state = val,
                    ),
                    
                    const SizedBox(height: 24),
                    
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
                        backgroundColor: AppTheme.blueLineColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Find Trains', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Recent Searches (Mocked for Test User)
            if (user?.email == 'test@smartrail.os') ...[
              const Text(
                'Recent Searches',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.history, color: AppTheme.textSecondary),
                title: const Text('Sabarmati → Old High Court'),
                subtitle: const Text('Red Line'),
                trailing: const Icon(Icons.chevron_right),
                contentPadding: EdgeInsets.zero,
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
            ],
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        selectedItemColor: AppTheme.blueLineColor,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.train_outlined), label: 'Saved'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
        onTap: (index) {
          if (index == 2) context.push('/profile');
        },
      ),
    );
  }
}
