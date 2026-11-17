import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:intl/intl.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/models/booking_model.dart';
import 'package:petwo_customer/services/api_service.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});
  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}
class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  List<BookingModel> _bookings = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadBookings();
  }
  @override
  void dispose() { _tabController.dispose(); super.dispose(); }

  Future<void> _loadBookings() async {
    setState(() { _loading = true; _error = null; });
    try {
      final response = await ApiService().getMyBookings();
      final raw = response.data is Map ? response.data['data'] : null;
      final items = raw is List ? raw.whereType<Map<String, dynamic>>().map(BookingModel.fromJson).toList() : <BookingModel>[];
      if (!mounted) return;
      setState(() { _bookings = items; _loading = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() { _error = 'We could not load your appointments. Please check your connection and try again.'; _loading = false; });
    }
  }

  Future<void> _showReviewDialog(BookingModel booking) async {
    var rating = 5;
    final feedbackController = TextEditingController();
    final submitted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Rate your PETWO visit'),
          content: SingleChildScrollView(child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Your review must be based on this completed appointment.'),
              const SizedBox(height: 14),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (index) => IconButton(
                onPressed: () => setDialogState(() => rating = index + 1),
                icon: Icon(Icons.star, color: index < rating ? Colors.amber : Colors.grey.shade300, size: 30),
              ))),
              TextField(
                controller: feedbackController,
                maxLines: 4,
                maxLength: 2000,
                decoration: const InputDecoration(hintText: 'Share your experience (optional)', border: OutlineInputBorder()),
              ),
            ],
          )),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Submit review')),
          ],
        ),
      ),
    );
    if (submitted == true && mounted) {
      try {
        await ApiService().submitReview(bookingId: booking.id, rating: rating, body: feedbackController.text);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review submitted. It will appear after moderation.')));
      } catch (error) {
        if (!mounted) return;
        final message = error is DioException
            ? (error.response?.data is Map ? (error.response?.data['error']?['message'] ?? 'This visit may already have a review.') : 'Could not submit your review.')
            : 'Could not submit your review. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message.toString())));
      }
    }
    feedbackController.dispose();
  }

  bool _isUpcoming(BookingModel booking) {
    final date = DateTime.tryParse(booking.scheduledAt);
    return date != null && date.isAfter(DateTime.now()) && !['completed', 'cancelled', 'rejected'].contains(booking.status);
  }

  Widget _buildList(List<BookingModel> items, {required bool upcoming}) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: PetwoTheme.textSecondary)),
      const SizedBox(height: 12),
      TextButton.icon(onPressed: _loadBookings, icon: const Icon(Icons.refresh), label: const Text('Try again')),
    ])));
    if (items.isEmpty) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.calendar_month_outlined, size: 54, color: PetwoTheme.textMuted),
      const SizedBox(height: 12),
      Text(upcoming ? 'No upcoming appointments' : 'No past visits yet', style: const TextStyle(fontWeight: FontWeight.bold)),
      const SizedBox(height: 6),
      const Text('Your PETWO appointment updates will appear here.', style: TextStyle(color: PetwoTheme.textSecondary, fontSize: 12)),
    ]));
    return RefreshIndicator(
      color: PetwoTheme.primary, onRefresh: _loadBookings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16), itemCount: items.length,
        itemBuilder: (context, index) {
          final booking = items[index];
          final date = DateTime.tryParse(booking.scheduledAt)?.toLocal();
          final formatted = date == null ? 'Date to be confirmed' : DateFormat('EEE, d MMM yyyy · hh:mm a').format(date);
          final statusColor = booking.status == 'confirmed' || booking.status == 'completed' ? PetwoTheme.success : booking.status == 'cancelled' || booking.status == 'rejected' ? PetwoTheme.error : PetwoTheme.warning;
          return Card(
            margin: const EdgeInsets.only(bottom: 14), elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: Color(0xFFE2E8F0))),
            child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Expanded(child: Text(booking.bookingNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: PetwoTheme.textPrimary))),
                Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: statusColor.withOpacity(.10), borderRadius: BorderRadius.circular(20)), child: Text(booking.status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 14),
              Row(children: [const Icon(Icons.calendar_today_outlined, size: 16, color: PetwoTheme.primary), const SizedBox(width: 8), Expanded(child: Text(formatted, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)))]),
              if (booking.notes != null && booking.notes!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(booking.notes!, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: PetwoTheme.textSecondary, fontSize: 12)),
              ],
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 10),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('₹${(booking.totalAmount / 100).toStringAsFixed(0)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                Text(upcoming ? 'Appointment request' : 'Visit record', style: const TextStyle(fontSize: 11, color: PetwoTheme.textSecondary)),
              ]),
              if (booking.status == 'completed') ...[
                const SizedBox(height: 8),
                Align(alignment: Alignment.centerRight, child: TextButton.icon(
                  onPressed: () => _showReviewDialog(booking),
                  icon: const Icon(Icons.star_outline, size: 18),
                  label: const Text('Rate your visit'),
                )),
              ],
            ])),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final upcoming = _bookings.where(_isUpcoming).toList();
    final past = _bookings.where((booking) => !_isUpcoming(booking)).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('My Appointments'), bottom: TabBar(
        controller: _tabController, labelColor: PetwoTheme.primary,
        unselectedLabelColor: PetwoTheme.textSecondary, indicatorColor: PetwoTheme.primary,
        tabs: const [Tab(text: 'Upcoming'), Tab(text: 'Past visits')],
      )),
      body: TabBarView(controller: _tabController, children: [
        _buildList(upcoming, upcoming: true), _buildList(past, upcoming: false),
      ]),
    );
  }
}
