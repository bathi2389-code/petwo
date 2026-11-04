import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/models/booking_model.dart';
import 'package:intl/intl.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final upcomingBookings = [
    BookingModel(
      id: 'bkg-01',
      bookingNumber: 'PTC-20241105-99A1',
      bookingType: 'appointment',
      providerId: 'provider-hyd-vetcare-01',
      customerId: 'user-01',
      petId: 'pet-01',
      serviceId: 'srv-gen-consult',
      status: 'confirmed',
      scheduledAt: '2024-11-05T10:30:00.000Z',
      scheduledEnd: '2024-11-05T11:00:00.000Z',
      totalAmount: 76700, // ₹767
      notes: 'Routine 6-month checkup for Simba',
    ),
  ];

  final completedBookings = [
    BookingModel(
      id: 'bkg-02',
      bookingNumber: 'PTC-20241018-44BC',
      bookingType: 'appointment',
      providerId: 'provider-hyd-vetcare-01',
      customerId: 'user-01',
      petId: 'pet-01',
      serviceId: 'srv-full-groom',
      status: 'completed',
      scheduledAt: '2024-10-18T14:00:00.000Z',
      scheduledEnd: '2024-10-18T15:15:00.000Z',
      totalAmount: 212400, // ₹2,124
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: PetwoTheme.primary,
          unselectedLabelColor: PetwoTheme.textSecondary,
          indicatorColor: PetwoTheme.primary,
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Past Visits'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBookingList(upcomingBookings, isUpcoming: true),
          _buildBookingList(completedBookings, isUpcoming: false),
        ],
      ),
    );
  }

  Widget _buildBookingList(List<BookingModel> list, {required bool isUpcoming}) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.calendar_month, size: 54, color: PetwoTheme.textMuted),
            SizedBox(height: 12),
            Text('No appointments found', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final b = list[index];
        final dt = DateTime.tryParse(b.scheduledAt) ?? DateTime.now();
        final formattedDate = DateFormat('EEE, d MMM yyyy • hh:mm a').format(dt);

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      b.bookingNumber,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: PetwoTheme.textPrimary),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: b.status == 'confirmed'
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        b.status.toUpperCase(),
                        style: TextStyle(
                          color: b.status == 'confirmed'
                              ? const Color(0xFF059669)
                              : PetwoTheme.textSecondary,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 16, color: PetwoTheme.primary),
                    const SizedBox(width: 8),
                    Text(formattedDate, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'TailBlazers Specialty Pet Hospital, Banjara Hills',
                  style: const TextStyle(fontSize: 12, color: PetwoTheme.textSecondary),
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '₹${(b.totalAmount / 100).toStringAsFixed(0)} Paid',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: PetwoTheme.textPrimary),
                    ),
                    if (isUpcoming)
                      Row(
                        children: [
                          TextButton(
                            onPressed: () {},
                            child: const Text('Reschedule', style: TextStyle(fontSize: 12, color: PetwoTheme.textSecondary)),
                          ),
                          TextButton(
                            onPressed: () {},
                            child: const Text('Cancel', style: TextStyle(fontSize: 12, color: PetwoTheme.error)),
                          ),
                        ],
                      )
                    else
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        ),
                        child: const Text('Book Again', style: TextStyle(fontSize: 12)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
