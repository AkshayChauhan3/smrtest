import 'package:device_preview/device_preview.dart';
import 'package:flutter/material.dart';
import 'core/constants/theme.dart';
import 'core/router/app_router.dart';

class MetroApp extends StatelessWidget {
  const MetroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'SmartRail OS',
      theme: AppTheme.darkTheme,
      routerConfig: AppRouter.router,
      debugShowCheckedModeBanner: false,
      // DevicePreview hooks — ignored in release builds
      locale: DevicePreview.locale(context),
      builder: DevicePreview.appBuilder,
    );
  }
}
