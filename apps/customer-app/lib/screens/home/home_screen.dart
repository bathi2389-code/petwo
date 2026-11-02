import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/models/provider_model.dart';
import 'package:petwo_customer/services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String selectedLocation = 'Banjara Hills, Hyderabad';
  List<ProviderModel> featuredProviders = [];
  bool loading = true;

  final categories = [
    {'name': 'Vet Care', 'icon': '🏥', 'slug': 'veterinary'},
    {'name': 'Grooming', 'icon': '✂️', 'slug': 'grooming'},
    {'name': 'Boarding', 'icon': '🏨', 'slug': 'boarding'},
    {'name': 'Daycare', 'icon': '🌞', 'slug': 'daycare'},
    {'name': 'Training', 'icon': '🎓', 'slug': 'training'},
    {'name': 'Doorstep Vet', 'icon': '🏠', 'slug': 'home-services'},
  ];

  @override
  void initState() {
    super.initState();
    loadFeatured();
  }

  Future<void> loadFeatured() async {
    try {
      final res = await ApiService().searchProviders();
      if (!mounted) return;
      if (res.data != null && res.data['data'] != null) {
        final list = res.data['data'] as List;
        setState(() {
          featuredProviders = list.map((e) => ProviderModel.fromJson(e)).toList();
          loading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      // Fallback for offline/preview
      setState(() {
        featuredProviders = [
          ProviderModel(
            id: 'provider-hyd-vetcare-01',
            businessName: 'TailBlazers Specialty Pet Hospital',
            businessType: 'veterinary_hospital',
            tagline: 'World-Class Care For Your Furry Family',
            phone: '+919876543210',
            email: 'care@tailblazershyd.com',
            verificationStatus: 'approved',
            rating: 4.9,
            reviewCount: 142,
            isFeatured: true,
          ),
        ];
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'LOCATION',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: PetwoTheme.primary),
            ),
            Row(
              children: [
                const Icon(Icons.location_on, size: 16, color: PetwoTheme.primary),
                const SizedBox(width: 4),
                Text(
                  selectedLocation,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: PetwoTheme.textPrimary),
                ),
                const Icon(Icons.keyboard_arrow_down, size: 18, color: PetwoTheme.textSecondary),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: PetwoTheme.textPrimary),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.search, color: PetwoTheme.textSecondary),
                    SizedBox(width: 12),
                    Text(
                      'Search veterinarians, salons, clinics...',
                      style: TextStyle(color: PetwoTheme.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),

            // Promo Banner
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF7A00), Color(0xFFFF5000)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'WELCOME TO HYDERABAD',
                              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Flat 20% OFF Your First Pet Care Visit',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Use code PAWFIRST at checkout',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const Text('🐶', style: TextStyle(fontSize: 48)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Categories
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: const Text(
                'Explore Services',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: PetwoTheme.textPrimary),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.95,
                ),
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  final cat = categories[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(cat['icon']!, style: const TextStyle(fontSize: 32)),
                        const SizedBox(height: 8),
                        Text(
                          cat['name']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: PetwoTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            // Featured Providers
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: const [
                  Text(
                    'Top Rated in Hyderabad',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: PetwoTheme.textPrimary),
                  ),
                  Text(
                    'See All',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: PetwoTheme.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: featuredProviders.length,
              itemBuilder: (context, index) {
                final p = featuredProviders[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 56,
                          width: 56,
                          decoration: BoxDecoration(
                            color: PetwoTheme.primaryLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Text('🏥', style: TextStyle(fontSize: 24)),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      p.businessName,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: PetwoTheme.textPrimary,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.verified, size: 16, color: Color(0xFF0284C7)),
                                ],
                              ),
                              if (p.tagline != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  p.tagline!,
                                  style: const TextStyle(fontSize: 11, color: PetwoTheme.textSecondary),
                                ),
                              ],
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.star, size: 14, color: Colors.amber),
                                  const SizedBox(width: 2),
                                  Text(
                                    '${p.rating} (${p.reviewCount} reviews)',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(width: 10),
                                  const Text('• 2.4 km away', style: TextStyle(fontSize: 11, color: PetwoTheme.textMuted)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
