class ProviderModel {
  final String id;
  final String businessName;
  final String businessType;
  final String? tagline;
  final String? description;
  final String? logoURL;
  final String phone;
  final String email;
  final String verificationStatus;
  final double rating;
  final int reviewCount;
  final double? distanceKm;
  final bool isFeatured;

  ProviderModel({
    required this.id,
    required this.businessName,
    required this.businessType,
    this.tagline,
    this.description,
    this.logoURL,
    required this.phone,
    required this.email,
    required this.verificationStatus,
    required this.rating,
    required this.reviewCount,
    this.distanceKm,
    required this.isFeatured,
  });

  factory ProviderModel.fromJson(Map<String, dynamic> json) {
    final contact = json['contact'] as Map<String, dynamic>? ?? {};
    return ProviderModel(
      id: json['id'] ?? '',
      businessName: json['businessName'] ?? '',
      businessType: json['businessType'] ?? 'veterinary_clinic',
      tagline: json['tagline'],
      description: json['description'],
      logoURL: json['logoURL'],
      phone: contact['phone'] ?? '',
      email: contact['email'] ?? '',
      verificationStatus: json['verificationStatus'] ?? 'pending',
      // Never manufacture a rating for a provider without review data.
      rating: json['rating'] is num ? (json['rating'] as num).toDouble() : 0.0,
      reviewCount: json['reviewCount'] is num ? (json['reviewCount'] as num).toInt() : 0,
      distanceKm: json['distanceKm'] is num ? (json['distanceKm'] as num).toDouble() : null,
      isFeatured: json['isFeatured'] ?? false,
    );
  }
}
