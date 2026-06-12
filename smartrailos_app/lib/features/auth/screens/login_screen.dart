import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  void _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await ref.read(authProvider.notifier).login(
            _emailController.text,
            _passwordController.text,
          );
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login failed: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 12,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.blueLine,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ).animate().scaleY(begin: 0, duration: 600.ms, curve: Curves.easeOutBack),
                  const SizedBox(width: 8),
                  Container(
                    width: 12,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppTheme.redLine,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ).animate().scaleY(begin: 0, duration: 600.ms, delay: 200.ms, curve: Curves.easeOutBack),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                'SMARTRAIL OS',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.0,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 400.ms),
              const SizedBox(height: 8),
              const Text(
                'Sign in to access live transit data',
                style: TextStyle(color: AppTheme.textMuted),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 600.ms),
              const SizedBox(height: 60),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'EMAIL',
                  hintText: 'test@smartrail.os',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.1, end: 0),
              const SizedBox(height: 20),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'PASSWORD',
                  hintText: '••••••••',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                obscureText: true,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ).animate().fadeIn(delay: 900.ms).slideY(begin: 0.1, end: 0),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.blueLine,
                  minimumSize: const Size.fromHeight(56),
                ),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('SIGN IN'),
              ).animate().fadeIn(delay: 1000.ms).scale(begin: const Offset(0.9, 0.9)),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('NEW TO SMARTRAIL? ', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                  TextButton(
                    onPressed: () => context.push('/register'),
                    child: const Text(
                      'CREATE ACCOUNT', 
                      style: TextStyle(color: AppTheme.blueLine, fontWeight: FontWeight.bold, fontSize: 12)
                    ),
                  ),
                ],
              ).animate().fadeIn(delay: 1200.ms),
            ],
          ),
        ),
      ),
    );
  }
}
