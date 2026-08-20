import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/trains/screens/home_screen.dart';
import '../../features/trains/screens/train_results_screen.dart';
import '../../features/trains/screens/train_detail_screen.dart';
import '../../features/profile/screens/profile_screen.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      if (state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/splash' ||
          state.matchedLocation == '/' ||
          state.matchedLocation.isEmpty) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/login',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/register',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/splash',
        redirect: (_, __) => '/home',
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/results',
        builder: (context, state) {
          final lineId = state.uri.queryParameters['lineId']!;
          final fromStationId = state.uri.queryParameters['fromStationId']!;
          final toStationId = state.uri.queryParameters['toStationId']!;
          return TrainResultsScreen(
            lineId: lineId,
            fromStationId: fromStationId,
            toStationId: toStationId,
          );
        },
      ),
      GoRoute(
        path: '/train/:trainId',
        builder: (context, state) {
          final trainId = state.pathParameters['trainId']!;
          return TrainDetailScreen(trainId: trainId);
        },
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );
}
