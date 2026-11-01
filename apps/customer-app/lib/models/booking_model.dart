class BookingModel {
  final String id;
  final String bookingNumber;
  final String bookingType;
  final String providerId;
  final String customerId;
  final String petId;
  final String serviceId;
  final String status;
  final String scheduledAt;
  final String scheduledEnd;
  final int totalAmount; // paisa
  final String? notes;

  BookingModel({
    required this.id,
    required this.bookingNumber,
    required this.bookingType,
    required this.providerId,
    required this.customerId,
    required this.petId,
    required this.serviceId,
    required this.status,
    required this.scheduledAt,
    required this.scheduledEnd,
    required this.totalAmount,
    this.notes,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final pricing = json['pricing'] as Map<String, dynamic>? ?? {};
    return BookingModel(
      id: json['id'] ?? '',
      bookingNumber: json['bookingNumber'] ?? '',
      bookingType: json['bookingType'] ?? 'appointment',
      providerId: json['providerId'] ?? '',
      customerId: json['customerId'] ?? '',
      petId: json['petId'] ?? '',
      serviceId: json['serviceId'] ?? '',
      status: json['status'] ?? 'pending_confirmation',
      scheduledAt: json['scheduledAt'] ?? '',
      scheduledEnd: json['scheduledEnd'] ?? '',
      totalAmount: pricing['totalAmount'] ?? 0,
      notes: json['notes'],
    );
  }
}
