import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/services/api_service.dart';

class ProviderDetailsScreen extends StatefulWidget {
  const ProviderDetailsScreen({super.key, required this.providerId});

  final String providerId;

  @override
  State<ProviderDetailsScreen> createState() => _ProviderDetailsScreenState();
}

class _ProviderDetailsScreenState extends State<ProviderDetailsScreen> {
  Map<String, dynamic>? _provider;
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _pets = [];
  String? _serviceId;
  String? _petId;
  DateTime? _appointmentDate;
  TimeOfDay? _appointmentTime;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ApiService().getProviderDetails(widget.providerId),
        ApiService().getProviderServices(widget.providerId),
        ApiService().getMyPets(),
      ]);
      final providerData = results[0].data['data'];
      final rawServices = results[1].data['data'];
      final rawPets = results[2].data['data'];
      if (providerData is! Map) throw StateError('Provider details are unavailable.');
      final services = rawServices is List
          ? rawServices.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList()
          : <Map<String, dynamic>>[];
      final pets = rawPets is List
          ? rawPets.whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList()
          : <Map<String, dynamic>>[];
      if (!mounted) return;
      setState(() {
        _provider = Map<String, dynamic>.from(providerData);
        _services = services;
        _pets = pets;
        _serviceId = services.isEmpty ? null : services.first['id']?.toString();
        _petId = pets.isEmpty ? null : pets.first['id']?.toString();
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = _apiError(error);
      });
    }
  }

  Future<void> _chooseDate() async {
    final now = DateTime.now();
    final initial = _appointmentDate ?? now.add(const Duration(days: 1));
    final date = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date != null && mounted) setState(() => _appointmentDate = date);
  }

  Future<void> _chooseTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _appointmentTime ?? const TimeOfDay(hour: 10, minute: 0),
    );
    if (time != null && mounted) setState(() => _appointmentTime = time);
  }

  Future<void> _submitBooking() async {
    final service = _serviceById(_serviceId);
    if (service == null || _petId == null || _appointmentDate == null || _appointmentTime == null) {
      setState(() => _error = 'Choose a service, pet, date and time to continue.');
      return;
    }
    final localAppointment = DateTime(
      _appointmentDate!.year,
      _appointmentDate!.month,
      _appointmentDate!.day,
      _appointmentTime!.hour,
      _appointmentTime!.minute,
    );
    if (!localAppointment.isAfter(DateTime.now())) {
      setState(() => _error = 'Choose a future appointment time.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final response = await ApiService().createBooking({
        'petId': _petId,
        'providerId': widget.providerId,
        'locationId': service['locationId'],
        'serviceId': service['id'],
        'bookingType': 'appointment',
        'scheduledAt': localAppointment.toUtc().toIso8601String(),
      });
      if (!mounted) return;
      final booking = response.data['data'];
      final reference = booking is Map
          ? (booking['bookingNumber'] ?? booking['id'] ?? '').toString()
          : '';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(reference.isEmpty ? 'Appointment request submitted.' : 'Request submitted · $reference'),
        backgroundColor: PetwoTheme.primary,
      ));
      Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = _apiError(error));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _apiError(Object error) {
    try {
      final responseData = (error as dynamic).response?.data;
      if (responseData is Map) {
        final apiMessage = responseData['error']?['message'];
        if (apiMessage is String && apiMessage.isNotEmpty) return apiMessage;
      }
    } catch (_) {
      // Use the generic message below for non-HTTP errors.
    }
    return 'PETWO could not complete this request. Check your connection and try again.';
  }

  Map<String, dynamic>? _serviceById(String? id) {
    for (final service in _services) {
      if (service['id']?.toString() == id) return service;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final provider = _provider;
    return Scaffold(
      appBar: AppBar(title: Text(provider?['businessName']?.toString() ?? 'Care provider')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && provider == null
              ? _loadError()
              : _content(provider ?? const {}),
    );
  }

  Widget _loadError() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: PetwoTheme.error)),
            const SizedBox(height: 12),
            OutlinedButton.icon(onPressed: _loadDetails, icon: const Icon(Icons.refresh), label: const Text('Try again')),
          ]),
        ),
      );

  Widget _content(Map<String, dynamic> provider) {
    final selectedService = _serviceById(_serviceId);
    final price = selectedService?['price'];
    final amount = price is Map && price['amount'] is num ? (price['amount'] as num).toDouble() : null;
    final appointmentLabel = _appointmentDate == null
        ? 'Choose appointment date'
        : MaterialLocalizations.of(context).formatMediumDate(_appointmentDate!);
    final timeLabel = _appointmentTime?.format(context) ?? 'Choose time';

    return ListView(padding: const EdgeInsets.all(20), children: [
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE6EAF0))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const CircleAvatar(backgroundColor: PetwoTheme.primaryLight, child: Icon(Icons.pets, color: PetwoTheme.primary)),
            const SizedBox(width: 12),
            Expanded(child: Text(provider['businessName']?.toString() ?? 'Care provider', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))),
            if (provider['verificationStatus'] == 'approved') const Icon(Icons.verified, color: PetwoTheme.primary),
          ]),
          if ((provider['tagline'] ?? provider['description']) is String && (provider['tagline'] ?? provider['description']).toString().isNotEmpty) ...[
            const SizedBox(height: 12),
            Text((provider['tagline'] ?? provider['description']).toString(), style: const TextStyle(color: PetwoTheme.textSecondary, height: 1.45)),
          ],
          const SizedBox(height: 10),
          Text((provider['businessType'] ?? 'pet care provider').toString().replaceAll('_', ' '), style: const TextStyle(color: PetwoTheme.primary, fontWeight: FontWeight.w700)),
        ]),
      ),
      const SizedBox(height: 22),
      const Text('Request an appointment', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      const SizedBox(height: 5),
      const Text('The clinic will confirm your selected time.', style: TextStyle(color: PetwoTheme.textSecondary)),
      const SizedBox(height: 16),
      if (_error != null) ...[
        Text(_error!, style: const TextStyle(color: PetwoTheme.error)),
        const SizedBox(height: 12),
      ],
      if (_services.isEmpty)
        const _EmptyMessage(message: 'This provider has not published an active service yet.')
      else
        DropdownButtonFormField<String>(
          value: _serviceId,
          decoration: const InputDecoration(labelText: 'Service'),
          items: _services.map((service) {
            final servicePrice = service['price'];
            final serviceAmount = servicePrice is Map && servicePrice['amount'] is num
                ? ((servicePrice['amount'] as num) / 100).toStringAsFixed(0)
                : null;
            final label = serviceAmount == null ? service['name'].toString() : '${service['name']} · ₹$serviceAmount';
            return DropdownMenuItem(value: service['id']?.toString(), child: Text(label, overflow: TextOverflow.ellipsis));
          }).toList(),
          onChanged: (value) => setState(() => _serviceId = value),
        ),
      const SizedBox(height: 14),
      if (_pets.isEmpty)
        const _EmptyMessage(message: 'Add a pet profile before requesting an appointment.')
      else
        DropdownButtonFormField<String>(
          value: _petId,
          decoration: const InputDecoration(labelText: 'Pet'),
          items: _pets.map((pet) => DropdownMenuItem(
            value: pet['id']?.toString(),
            child: Text('${pet['name'] ?? 'Pet'} · ${pet['species'] ?? 'Other'}'),
          )).toList(),
          onChanged: (value) => setState(() => _petId = value),
        ),
      const SizedBox(height: 14),
      Row(children: [
        Expanded(child: OutlinedButton.icon(onPressed: _chooseDate, icon: const Icon(Icons.calendar_month), label: Text(appointmentLabel))),
        const SizedBox(width: 10),
        OutlinedButton.icon(onPressed: _chooseTime, icon: const Icon(Icons.schedule), label: Text(timeLabel)),
      ]),
      if (amount != null) ...[
        const SizedBox(height: 14),
        Text('Service fee: ₹${(amount / 100).toStringAsFixed(0)} · taxes calculated by PETWO', style: const TextStyle(color: PetwoTheme.textSecondary)),
      ],
      const SizedBox(height: 20),
      FilledButton(
        onPressed: _saving || _services.isEmpty || _pets.isEmpty ? null : _submitBooking,
        child: Text(_saving ? 'Submitting request…' : 'Request appointment'),
      ),
    ]);
  }
}

class _EmptyMessage extends StatelessWidget {
  const _EmptyMessage({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: const Color(0xFFFFF7E8), borderRadius: BorderRadius.circular(14)),
        child: Text(message, style: const TextStyle(color: PetwoTheme.textSecondary)),
      );
}
