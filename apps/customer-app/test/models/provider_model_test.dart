import 'package:flutter_test/flutter_test.dart';
import 'package:petwo_customer/models/provider_model.dart';

void main() {
  group('ProviderModel.fromJson', () {
    test('parses an approved physiotherapy provider and its distance', () {
      final provider = ProviderModel.fromJson({
        'id': 'provider-physio-01',
        'businessName': 'Sample Physio Centre',
        'businessType': 'physiotherapy_centre',
        'verificationStatus': 'approved',
        'rating': 4.6,
        'reviewCount': 27,
        'distanceKm': 3.25,
        'contact': {
          'phone': '+919876543210',
          'email': 'hello@example.test',
        },
      });

      expect(provider.id, 'provider-physio-01');
      expect(provider.businessType, 'physiotherapy_centre');
      expect(provider.verificationStatus, 'approved');
      expect(provider.rating, 4.6);
      expect(provider.reviewCount, 27);
      expect(provider.distanceKm, 3.25);
      expect(provider.phone, '+919876543210');
      expect(provider.email, 'hello@example.test');
    });

    test('does not invent ratings or distances when the API omits them', () {
      final provider = ProviderModel.fromJson({
        'id': 'new-provider',
        'businessName': 'New clinic',
      });

      expect(provider.rating, 0.0);
      expect(provider.reviewCount, 0);
      expect(provider.distanceKm, isNull);
      expect(provider.verificationStatus, 'pending');
      expect(provider.isFeatured, isFalse);
    });

    test('handles numeric API values without assuming integer JSON types', () {
      final provider = ProviderModel.fromJson({
        'id': 'numeric-provider',
        'businessName': 'Numeric clinic',
        'rating': 4,
        'reviewCount': 12.0,
        'distanceKm': 1,
      });

      expect(provider.rating, 4.0);
      expect(provider.reviewCount, 12);
      expect(provider.distanceKm, 1.0);
    });
  });
}
