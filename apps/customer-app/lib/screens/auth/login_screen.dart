import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/services/api_service.dart';

class CustomerLoginScreen extends StatefulWidget {
  const CustomerLoginScreen({super.key});
  @override
  State<CustomerLoginScreen> createState() => _CustomerLoginScreenState();
}
class _CustomerLoginScreenState extends State<CustomerLoginScreen> {
  final _phone = TextEditingController(), _otp = TextEditingController(), _name = TextEditingController();
  bool _otpStep = false, _busy = false;
  String? _error, _devOtp, _message;
  @override
  void dispose() { _phone.dispose(); _otp.dispose(); _name.dispose(); super.dispose(); }

  Future<void> _sendOtp() async {
    final phone = _phone.text.trim();
    if (!RegExp(r'^[6-9][0-9]{9}$').hasMatch(phone)) { setState(() => _error = 'Enter a valid 10-digit Indian mobile number.'); return; }
    setState(() { _busy = true; _error = null; });
    try {
      final response = await ApiService().sendOtp('+91$phone');
      final data = response.data['data'] as Map<String, dynamic>? ?? {};
      if (!mounted) return;
      setState(() { _devOtp = data['otp']?.toString(); _message = data['message']?.toString(); _otpStep = true; });
    } catch (error) { if (mounted) setState(() => _error = error.toString()); }
    finally { if (mounted) setState(() => _busy = false); }
  }

  Future<void> _verifyOtp() async {
    if (!RegExp(r'^[0-9]{6}$').hasMatch(_otp.text.trim())) { setState(() => _error = 'Enter the 6-digit OTP.'); return; }
    setState(() { _busy = true; _error = null; });
    try { await ApiService().verifyOtp('+91${_phone.text.trim()}', _otp.text.trim(), displayName: _name.text.trim()); }
    catch (error) { if (mounted) setState(() => _error = error.toString()); }
    finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) => Scaffold(body: SafeArea(child: Center(child: SingleChildScrollView(
    padding: const EdgeInsets.all(24),
    child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 440), child: Card(
      elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28), side: const BorderSide(color: Color(0xFFE2E8F0))),
      child: Padding(padding: const EdgeInsets.all(26), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const CircleAvatar(radius: 28, backgroundColor: PetwoTheme.primaryLight, child: Icon(Icons.pets, color: PetwoTheme.primary, size: 28)),
        const SizedBox(height: 22),
        const Text('Welcome to PETWO', style: TextStyle(fontSize: 13, color: PetwoTheme.primary, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(_otpStep ? 'Verify your number' : 'Sign in with your phone', style: const TextStyle(fontSize: 25, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text(_otpStep ? 'Enter the code sent to +91 ${_phone.text}.' : 'We’ll send a one-time code to your mobile number.', style: const TextStyle(color: PetwoTheme.textSecondary, height: 1.5)),
        if (_error != null) ...[const SizedBox(height: 18), Text(_error!, style: const TextStyle(color: PetwoTheme.error))],
        const SizedBox(height: 24),
        if (!_otpStep) ...[
          TextField(controller: _phone, keyboardType: TextInputType.phone, maxLength: 10, decoration: const InputDecoration(labelText: 'Mobile number', prefixText: '+91 ', counterText: '')),
          const SizedBox(height: 18),
          FilledButton(onPressed: _busy ? null : _sendOtp, child: Text(_busy ? 'Sending…' : 'Send OTP')),
        ] else ...[
          TextField(controller: _name, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Your name (optional)')),
          const SizedBox(height: 14),
          TextField(controller: _otp, keyboardType: TextInputType.number, maxLength: 6, textAlign: TextAlign.center, decoration: const InputDecoration(labelText: '6-digit OTP', counterText: '')),
          if (_message != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_message!, style: const TextStyle(color: PetwoTheme.primaryDark, fontSize: 12))),
          if (_devOtp != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text('Development OTP: $_devOtp', style: const TextStyle(color: PetwoTheme.warning, fontWeight: FontWeight.bold))),
          const SizedBox(height: 18),
          FilledButton(onPressed: _busy ? null : _verifyOtp, child: Text(_busy ? 'Verifying…' : 'Verify and continue')),
          TextButton(onPressed: _busy ? null : () => setState(() { _otpStep = false; _otp.clear(); _error = null; }), child: const Text('Change mobile number')),
        ],
      ])),
    )),
  ))));
}
