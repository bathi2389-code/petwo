import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/services/api_service.dart';

class CustomerLoginScreen extends StatefulWidget {
  const CustomerLoginScreen({super.key, this.verificationPending = false});
  final bool verificationPending;
  @override
  State<CustomerLoginScreen> createState() => _CustomerLoginScreenState();
}

class _CustomerLoginScreenState extends State<CustomerLoginScreen> {
  static DateTime? _verificationResendAfter;
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _name = TextEditingController();
  bool _registerMode = false;
  bool _pending = false;
  bool _busy = false;
  String? _error;
  String? _message;
  int _resendSeconds = 0;
  Timer? _resendTimer;
  @override
  void initState() {
    super.initState();
    _pending = widget.verificationPending;
    _syncCooldown();
  }
  @override
  void dispose() { _resendTimer?.cancel(); _email.dispose(); _password.dispose(); _confirmPassword.dispose(); _name.dispose(); super.dispose(); }

  void _startCooldown() {
    if (!mounted) return;
    _resendTimer?.cancel();
    _verificationResendAfter = DateTime.now().add(const Duration(seconds: 60));
    _syncCooldown();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) { timer.cancel(); return; }
      _syncCooldown();
      if (_resendSeconds == 0) timer.cancel();
    });
  }

  void _syncCooldown() {
    final until = _verificationResendAfter;
    final seconds = until == null ? 0 : until.difference(DateTime.now()).inSeconds.ceil().clamp(0, 60).toInt();
    if (mounted) setState(() => _resendSeconds = seconds);
    else _resendSeconds = seconds;
    if (seconds > 0 && _resendTimer == null) {
      _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted) { timer.cancel(); _resendTimer = null; return; }
        final remaining = _verificationResendAfter!.difference(DateTime.now()).inSeconds.ceil().clamp(0, 60).toInt();
        setState(() => _resendSeconds = remaining);
        if (remaining == 0) { timer.cancel(); _resendTimer = null; }
      });
    }
  }

  String _friendlyError(Object error) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'invalid-email': return 'Enter a valid email address.';
        case 'user-not-found': case 'wrong-password': case 'invalid-credential': return 'Email or password is incorrect.';
        case 'email-already-in-use': return 'This email already has an account. Sign in instead.';
        case 'weak-password': return 'Choose a stronger password with at least 8 characters.';
        case 'too-many-requests': return 'Too many attempts. Wait a while, then try again.';
        case 'network-request-failed': return 'Check your internet connection and try again.';
      }
    }
    return error.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _submit() async {
    final email = _email.text.trim().toLowerCase();
    if (_registerMode && _name.text.trim().length < 2) { setState(() => _error = 'Enter your full name.'); return; }
    setState(() { _busy = true; _error = null; _message = null; });
    try {
      final auth = FirebaseAuth.instance;
      UserCredential credential;
      if (_registerMode) {
        if (_password.text.length < 8) throw StateError('Use a password with at least 8 characters.');
        if (_password.text != _confirmPassword.text) throw StateError('The passwords do not match.');
        credential = await auth.createUserWithEmailAndPassword(email: email, password: _password.text);
        await credential.user!.updateDisplayName(_name.text.trim());
        await credential.user!.sendEmailVerification();
        _startCooldown();
        if (mounted) setState(() { _pending = true; _message = 'Your PETWO account has been created. Please check your email and click the verification link to activate your account.'; });
      } else {
        credential = await auth.signInWithEmailAndPassword(email: email, password: _password.text);
        await credential.user!.reload();
        if (!credential.user!.emailVerified) {
          await credential.user!.sendEmailVerification();
          _startCooldown();
          if (mounted) setState(() { _pending = true; _message = 'Please verify your email using the link sent to ${credential.user!.email}.'; });
        } else {
          await ApiService().activateCustomerProfile(credential.user!.displayName?.trim().isNotEmpty == true ? credential.user!.displayName!.trim() : email.split('@').first);
        }
      }
    } catch (error) { if (mounted) setState(() => _error = _friendlyError(error)); }
    finally { if (mounted) setState(() => _busy = false); }
  }

  Future<void> _checkVerification() async {
    setState(() { _busy = true; _error = null; _message = null; });
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw StateError('Sign in again to check your verification status.');
      await user.reload();
      final refreshed = FirebaseAuth.instance.currentUser;
      if (refreshed == null || !refreshed.emailVerified) { setState(() => _message = 'Your email is not verified yet. Open the link in your email, then check again.'); return; }
      await ApiService().activateCustomerProfile(refreshed.displayName?.trim().isNotEmpty == true ? refreshed.displayName!.trim() : refreshed.email!.split('@').first);
      if (mounted) setState(() => _pending = false);
    } catch (error) { if (mounted) setState(() => _error = _friendlyError(error)); }
    finally { if (mounted) setState(() => _busy = false); }
  }

  Future<void> _resend() async {
    setState(() { _busy = true; _error = null; _message = null; });
    if (_resendSeconds > 0) return;
    try { await FirebaseAuth.instance.currentUser?.sendEmailVerification(); _startCooldown(); setState(() => _message = 'Verification link sent. Check your inbox and spam folder.'); }
    catch (error) { if (mounted) setState(() => _error = _friendlyError(error)); }
    finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const CircleAvatar(radius: 28, backgroundColor: PetwoTheme.primaryLight, child: Icon(Icons.pets, color: PetwoTheme.primary, size: 28)),
                      const SizedBox(height: 22),
                      const Text('WELCOME TO PETWO', style: TextStyle(fontSize: 12, letterSpacing: 1.4, color: PetwoTheme.primary, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(_pending ? 'Verify your email' : (_registerMode ? 'Create your account' : 'Welcome back'), style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text(_pending ? 'Open the verification link sent to ${FirebaseAuth.instance.currentUser?.email ?? _email.text.trim()}, then return and check status.' : 'Use your email and password for your PETWO pet-parent account.', style: const TextStyle(color: PetwoTheme.textSecondary, height: 1.5)),
                      if (_error != null) ...[
                        const SizedBox(height: 18),
                        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFFFF1F0), borderRadius: BorderRadius.circular(12)), child: Text(_error!, style: const TextStyle(color: PetwoTheme.error))),
                      ],
                      if (_message != null) ...[
                        const SizedBox(height: 14),
                        Text(_message!, style: const TextStyle(color: PetwoTheme.primaryDark, height: 1.5)),
                      ],
                      const SizedBox(height: 24),
                      if (_pending) ...[
                        FilledButton.icon(onPressed: _busy ? null : _checkVerification, icon: const Icon(Icons.verified_outlined), label: Text(_busy ? 'Checking…' : 'I verified my email')),
                        TextButton(onPressed: _busy || _resendSeconds > 0 ? null : _resend, child: Text(_resendSeconds > 0 ? 'Resend in ${_resendSeconds}s' : 'Resend verification email')),
                        TextButton(onPressed: _busy ? null : () async { await ApiService().signOut(); if (mounted) setState(() { _pending = false; _message = null; }); }, child: const Text('Sign out')),
                      ] else ...[
                        if (_registerMode) ...[
                          TextField(controller: _name, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.next, decoration: const InputDecoration(labelText: 'Your full name', prefixIcon: Icon(Icons.person_outline))),
                          const SizedBox(height: 16),
                        ],
                        TextField(controller: _email, keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.next, autofillHints: const [AutofillHints.email], decoration: const InputDecoration(labelText: 'Email address', hintText: 'you@example.com', prefixIcon: Icon(Icons.mail_outline))),
                        const SizedBox(height: 16),
                        TextField(controller: _password, obscureText: true, textInputAction: TextInputAction.done, autofillHints: [_registerMode ? AutofillHints.newPassword : AutofillHints.password], decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outline), helperText: _registerMode ? 'At least 8 characters' : null), onSubmitted: (_) => _busy ? null : _submit()),
                        if (_registerMode) ...[
                          const SizedBox(height: 16),
                          TextField(controller: _confirmPassword, obscureText: true, textInputAction: TextInputAction.done, autofillHints: const [AutofillHints.newPassword], decoration: const InputDecoration(labelText: 'Confirm password', prefixIcon: Icon(Icons.lock_outline))),
                        ],
                        const SizedBox(height: 22),
                        FilledButton.icon(onPressed: _busy ? null : _submit, icon: const Icon(Icons.arrow_forward), label: Text(_busy ? 'Please wait…' : (_registerMode ? 'Create account and verify email' : 'Sign in'))),
                        TextButton(onPressed: _busy ? null : () => setState(() { _registerMode = !_registerMode; _error = null; _message = null; }), child: Text(_registerMode ? 'Already registered? Sign in' : 'New to PETWO? Create account')),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
