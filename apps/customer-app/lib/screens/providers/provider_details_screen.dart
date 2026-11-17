import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
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
  List<Map<String, dynamic>> _slots = [];
  String? _serviceId;
  String? _petId;
  String? _selectedSlot;
  DateTime _appointmentDate = DateTime.now();
  bool _loading = true;
  bool _slotsLoading = false;
  bool _saving = false;
  String? _error;
  String? _slotMessage;

  @override
  void initState() {
    super.initState();
    _appointmentDate = DateTime.now().add(const Duration(days: 1));
    _loadDetails();
  }

  String get _dateKey => DateFormat('yyyy-MM-dd').format(_appointmentDate);

  Future<void> _loadDetails() async {
    setState(() { _loading = true; _error = null; });
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
      if (_serviceId != null) await _loadSlots();
    } catch (error) {
      if (!mounted) return;
      setState(() { _loading = false; _error = _apiError(error); });
    }
  }

  Future<void> _loadSlots() async {
    final serviceId = _serviceId;
    if (serviceId == null) return;
    setState(() { _slotsLoading = true; _slots = []; _selectedSlot = null; _slotMessage = null; });
    try {
      final response = await ApiService().getProviderAvailability(
        widget.providerId, date: _dateKey, serviceId: serviceId,
      );
      final payload = response.data is Map ? response.data['data'] : null;
      final rawSlots = payload is Map ? payload['slots'] : null;
      final slots = rawSlots is List
          ? rawSlots.whereType<Map>().map((item) => Map<String, dynamic>.from(item))
              .where((slot) => slot['isBooked'] != true).toList()
          : <Map<String, dynamic>>[];
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _slotMessage = payload is Map ? payload['message']?.toString() : null;
        _slotsLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() { _slotsLoading = false; _error = _apiError(error); });
    }
  }

  Future<void> _chooseDate() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _appointmentDate.isBefore(DateTime(now.year, now.month, now.day))
          ? DateTime(now.year, now.month, now.day) : _appointmentDate,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 30)),
    );
    if (date != null && mounted) {
      setState(() { _appointmentDate = date; _error = null; });
      await _loadSlots();
    }
  }

  Future<void> _submitBooking() async {
    final service = _serviceById(_serviceId);
    final slot = _selectedSlot;
    if (service == null || _petId == null || slot == null) {
      setState(() => _error = 'Choose your pet and an available time slot.');
      return;
    }
    final parts = slot.split(':').map(int.parse).toList();
    final localAppointment = DateTime(_appointmentDate.year, _appointmentDate.month, _appointmentDate.day, parts[0], parts[1]);
    if (!localAppointment.isAfter(DateTime.now())) {
      setState(() => _error = 'That time has passed. Please choose another slot.');
      await _loadSlots();
      return;
    }

    setState(() { _saving = true; _error = null; });
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
      final reference = booking is Map ? (booking['bookingNumber'] ?? booking['id'] ?? '').toString() : '';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(reference.isEmpty ? 'Appointment confirmed!' : 'Appointment confirmed · $reference'),
        backgroundColor: PetwoTheme.primary,
      ));
      Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) {
        setState(() => _error = _apiError(error));
        await _loadSlots();
      }
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
    } catch (_) {}
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
      body: _loading ? const Center(child: CircularProgressIndicator(color: PetwoTheme.primary))
          : _error != null && provider == null ? _loadError() : _content(provider ?? const {}),
    );
  }

  Widget _loadError() => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: PetwoTheme.error)),
      const SizedBox(height: 12),
      OutlinedButton.icon(onPressed: _loadDetails, icon: const Icon(Icons.refresh), label: const Text('Try again')),
    ]),
  ));

  Widget _content(Map<String, dynamic> provider) {
    final selectedService = _serviceById(_serviceId);
    final price = selectedService?['price'];
    final amount = price is Map && price['amount'] is num ? (price['amount'] as num).toDouble() : null;
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
      const Text('Book an appointment', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      const SizedBox(height: 5),
      const Text('Choose an available time. Your booking is confirmed instantly when the slot is still free.', style: TextStyle(color: PetwoTheme.textSecondary)),
      const SizedBox(height: 16),
      if (_error != null) ...[
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFFFEEEE), borderRadius: BorderRadius.circular(12)), child: Text(_error!, style: const TextStyle(color: PetwoTheme.error))),
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
                ? ((servicePrice['amount'] as num) / 100).toStringAsFixed(0) : null;
            final label = serviceAmount == null ? service['name'].toString() : '${service['name']} · ₹$serviceAmount';
            return DropdownMenuItem(value: service['id']?.toString(), child: Text(label, overflow: TextOverflow.ellipsis));
          }).toList(),
          onChanged: (value) { setState(() { _serviceId = value; _error = null; }); _loadSlots(); },
        ),
      const SizedBox(height: 14),
      if (_pets.isEmpty)
        const _EmptyMessage(message: 'Add a pet profile before booking an appointment.')
      else
        DropdownButtonFormField<String>(
          value: _petId,
          decoration: const InputDecoration(labelText: 'Your pet'),
          items: _pets.map((pet) => DropdownMenuItem(value: pet['id']?.toString(), child: Text('${pet['name'] ?? 'Pet'} · ${pet['species'] ?? 'Other'}'))).toList(),
          onChanged: (value) => setState(() => _petId = value),
        ),
      const SizedBox(height: 20),
      Row(children: [
        const Expanded(child: Text('Select a date', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800))),
        TextButton.icon(onPressed: _chooseDate, icon: const Icon(Icons.calendar_month, size: 18), label: Text(DateFormat('EEE, d MMM').format(_appointmentDate))),
      ]),
      if (_slotsLoading)
        const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: PetwoTheme.primary)))
      else if (_slots.isEmpty)
        _EmptyMessage(message: _slotMessage ?? 'No available slots on this date. Please choose another date.')
      else
        Wrap(spacing: 9, runSpacing: 9, children: _slots.map((slot) {
          final start = slot['startTime']?.toString() ?? '';
          final end = slot['endTime']?.toString() ?? '';
          final selected = _selectedSlot == start;
          final time = DateFormat('h:mm a').format(DateTime(2020, 1, 1, int.parse(start.split(':')[0]), int.parse(start.split(':')[1])));
          return ChoiceChip(
            label: Text(time),
            selected: selected,
            selectedColor: PetwoTheme.primary,
            backgroundColor: Colors.white,
            labelStyle: TextStyle(color: selected ? Colors.white : PetwoTheme.textPrimary, fontWeight: FontWeight.w700),
            side: BorderSide(color: selected ? PetwoTheme.primary : const Color(0xFFDCE7DE)),
            onSelected: (_) => setState(() { _selectedSlot = start; _error = null; }),
          );
        }).toList()),
      if (amount != null) ...[
        const SizedBox(height: 18),
        Text('Service fee: ₹${(amount / 100).toStringAsFixed(0)} · taxes calculated by PETWO', style: const TextStyle(color: PetwoTheme.textSecondary)),
      ],
      const SizedBox(height: 20),
      SizedBox(width: double.infinity, child: FilledButton.icon(
        onPressed: _saving || _services.isEmpty || _pets.isEmpty || _selectedSlot == null || _slotsLoading ? null : _submitBooking,
        icon: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.check_circle_outline),
        label: Text(_saving ? 'Confirming booking…' : 'Confirm appointment'),
      )),
    ]);
  }
}

class _EmptyMessage extends StatelessWidget {
  const _EmptyMessage({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: PetwoTheme.primaryLight, borderRadius: BorderRadius.circular(14)),
    child: Text(message, style: const TextStyle(color: PetwoTheme.textSecondary)),
  );
}
