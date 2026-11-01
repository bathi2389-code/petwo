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
      rating: json['rating'] != null ? (json['rating'] as num).toDouble() : 4.8,
      reviewCount: json['reviewCount'] ?? 0,
      isFeatured: json['isFeatured'] ?? false,
    );
  }
}
