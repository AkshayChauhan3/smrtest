import 'package:flutter/material.dart';
import 'core/constants/theme.dart';
import 'core/router/app_router.dart';

class MetroApp extends StatelessWidget {
  const MetroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'SmartRail OS',
      theme: AppTheme.lightTheme,
      routerConfig: AppRouter.router,
      debugShowCheckedModeBanner: false,
    );
  }
}
