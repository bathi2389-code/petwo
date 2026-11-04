import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/models/provider_model.dart';
import 'package:petwo_customer/services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _searchController = TextEditingController();
  List<ProviderModel> providers = [];
  bool loading = true;
  String? selectedService;
  String? errorMessage;

  static const categories = <_ServiceCategory>[
    _ServiceCategory('Vet care', 'Check-ups & treatment', Icons.medical_services_outlined, Color(0xFFEAF3FF), Color(0xFF2864B4), businessType: 'veterinary_clinic'),
    _ServiceCategory('Grooming', 'Bath, trim & styling', Icons.content_cut_rounded, Color(0xFFFFF0E8), Color(0xFFE66A32), businessType: 'grooming_salon'),
    _ServiceCategory('Physiotherapy', 'Mobility & recovery', Icons.accessibility_new_rounded, Color(0xFFEAF7F0), Color(0xFF26845A), searchTerm: 'physiotherapy'),
    _ServiceCategory('Boarding', 'A stay away from home', Icons.home_work_outlined, Color(0xFFF1EDFF), Color(0xFF7155B7), businessType: 'boarding_facility'),
    _ServiceCategory('Daycare', 'Play, care & company', Icons.wb_sunny_outlined, Color(0xFFFFF7DF), Color(0xFFB78318), businessType: 'daycare_facility'),
    _ServiceCategory('Training', 'Build good habits', Icons.school_outlined, Color(0xFFEAF5F7), Color(0xFF287A88), businessType: 'pet_trainer'),
  ];

  @override
  void initState() {
    super.initState();
    _loadProviders();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  _ServiceCategory? get _selectedCategory {
    for (final category in categories) {
      if (category.name == selectedService) return category;
    }
    return null;
  }

  Future<void> _loadProviders({String? businessType, String? query, String? serviceName}) async {
    setState(() {
      loading = true;
      errorMessage = null;
      selectedService = serviceName;
    });
    try {
      final response = await ApiService().searchProviders(businessType: businessType, query: query);
      final payload = response.data;
      final rawList = payload is Map<String, dynamic> ? payload['data'] : null;
      final result = rawList is List
          ? rawList.whereType<Map<String, dynamic>>().map(ProviderModel.fromJson).toList()
          : <ProviderModel>[];
      if (!mounted) return;
      setState(() {
        providers = result;
        loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        providers = [];
        loading = false;
        errorMessage = 'We could not load providers. Check your connection and try again.';
      });
    }
  }

  void _selectCategory(_ServiceCategory category) {
    _searchController.clear();
    _loadProviders(businessType: category.businessType, query: category.searchTerm, serviceName: category.name);
  }

  void _search(String value) {
    _loadProviders(query: value.trim().isEmpty ? null : value.trim());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PetwoTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: PetwoTheme.primary,
          onRefresh: () => _loadProviders(
            serviceName: selectedService,
            businessType: _selectedCategory?.businessType,
            query: _selectedCategory?.searchTerm,
          ),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(child: _buildHeader()),
              SliverToBoxAdapter(child: _buildSearch()),
              SliverToBoxAdapter(child: _buildHero()),
              SliverToBoxAdapter(child: _sectionHeading('Care for every kind of paw', 'Explore services')),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.72,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _serviceCard(categories[index]),
                    childCount: categories.length,
                  ),
                ),
              ),
              SliverToBoxAdapter(child: _providerHeading()),
              SliverToBoxAdapter(child: _providerContent()),
              const SliverToBoxAdapter(child: SizedBox(height: 28)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 16, 10),
      child: Row(
        children: [
          SvgPicture.asset('assets/brand/petwo-logo.svg', height: 38, fit: BoxFit.contain),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE8EAF0))),
            child: Row(children: const [
              Icon(Icons.location_on_outlined, color: PetwoTheme.primary, size: 17),
              SizedBox(width: 5),
              Text('Set location', style: TextStyle(color: PetwoTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w700)),
              SizedBox(width: 2),
              Icon(Icons.keyboard_arrow_down, size: 16, color: PetwoTheme.textSecondary),
            ]),
          ),
          const SizedBox(width: 4),
          IconButton(tooltip: 'Notifications', onPressed: () {}, icon: const Icon(Icons.notifications_none_rounded, color: PetwoTheme.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildSearch() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: TextField(
        controller: _searchController,
        textInputAction: TextInputAction.search,
        onSubmitted: _search,
        decoration: InputDecoration(
          hintText: 'Search clinics, groomers, physiotherapists...',
          hintStyle: const TextStyle(fontSize: 12, color: PetwoTheme.textMuted),
          prefixIcon: const Icon(Icons.search_rounded, color: PetwoTheme.textSecondary),
          suffixIcon: IconButton(tooltip: 'Search', onPressed: () => _search(_searchController.text), icon: const Icon(Icons.arrow_forward_rounded, color: PetwoTheme.primary)),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(vertical: 15),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE8EAF0))),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE8EAF0))),
        ),
      ),
    );
  }

  Widget _buildHero() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 26),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(20, 22, 16, 20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF172D45), Color(0xFF244A61)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
                child: const Text('PET PARENTING, MADE EASIER', style: TextStyle(color: Color(0xFFFFC18F), fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.8)),
              ),
              const SizedBox(height: 13),
              const Text('A happier,\nhealthier life for\nyour best friend.', style: TextStyle(color: Colors.white, fontSize: 22, height: 1.18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 9),
              const Text('Discover trusted care, all in one place.', style: TextStyle(color: Color(0xFFD3E0E8), fontSize: 11)),
              const SizedBox(height: 15),
              TextButton(
                onPressed: () => _selectCategory(categories[0]),
                style: TextButton.styleFrom(backgroundColor: PetwoTheme.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                child: const Text('Find pet care', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ]),
          ),
          const SizedBox(width: 8),
          Container(
            width: 104,
            height: 128,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.09), borderRadius: BorderRadius.circular(22)),
            child: const Center(child: Text('🐶', style: TextStyle(fontSize: 70))),
          ),
        ]),
      ),
    );
  }

  Widget _sectionHeading(String title, String eyebrow) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(eyebrow.toUpperCase(), style: const TextStyle(color: PetwoTheme.primary, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
        const SizedBox(height: 5),
        Text(title, style: const TextStyle(color: PetwoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w800)),
      ]),
    );
  }

  Widget _serviceCard(_ServiceCategory category) {
    final selected = selectedService == category.name;
    return Material(
      color: selected ? category.background : Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => _selectCategory(category),
        child: Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: selected ? category.iconColor.withOpacity(0.55) : const Color(0xFFE9ECF1), width: selected ? 1.4 : 1),
          ),
          child: Row(children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(color: category.background, borderRadius: BorderRadius.circular(13)),
              child: Icon(category.icon, color: category.iconColor, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(category.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: PetwoTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(category.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: PetwoTheme.textSecondary, fontSize: 9, height: 1.2)),
              ]),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _providerHeading() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 26, 20, 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(selectedService == null ? 'DISCOVER CARE' : selectedService!.toUpperCase(), style: const TextStyle(color: PetwoTheme.primary, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
            const SizedBox(height: 5),
            Text(selectedService == null ? 'Recommended providers' : 'Matching providers', style: const TextStyle(color: PetwoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w800)),
          ]),
        ),
        if (selectedService != null)
          TextButton(onPressed: () { _searchController.clear(); _loadProviders(); }, child: const Text('Clear filter', style: TextStyle(fontSize: 11))),
      ]),
    );
  }

  Widget _providerContent() {
    if (loading) {
      return const Padding(padding: EdgeInsets.all(36), child: Center(child: CircularProgressIndicator(color: PetwoTheme.primary)));
    }
    if (errorMessage != null) {
      return _messageCard(
        icon: Icons.wifi_off_rounded,
        title: 'Could not load providers',
        message: errorMessage!,
        actionLabel: 'Try again',
        onAction: () => _loadProviders(serviceName: selectedService, businessType: _selectedCategory?.businessType, query: _selectedCategory?.searchTerm),
      );
    }
    if (providers.isEmpty) {
      return _messageCard(
        icon: Icons.pets_outlined,
        title: 'No providers listed yet',
        message: selectedService == null
            ? 'Verified pet-care providers will appear here when they are available.'
            : 'There are no matching providers listed yet. Try another service or check back soon.',
      );
    }
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: providers.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) => _providerCard(providers[index]),
    );
  }

  Widget _messageCard({required IconData icon, required String title, required String message, String? actionLabel, VoidCallback? onAction}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE9ECF1))),
        child: Column(children: [
          Icon(icon, color: PetwoTheme.textMuted, size: 30),
          const SizedBox(height: 10),
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
          const SizedBox(height: 5),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: PetwoTheme.textSecondary, fontSize: 11, height: 1.45)),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 12),
            TextButton(onPressed: onAction, child: Text(actionLabel)),
          ],
        ]),
      ),
    );
  }

  Widget _providerCard(ProviderModel provider) {
    final hasReviews = provider.reviewCount > 0;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE9ECF1))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(color: PetwoTheme.primaryLight, borderRadius: BorderRadius.circular(15)),
          child: provider.logoURL != null && provider.logoURL!.isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: Image.network(provider.logoURL!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.pets, color: PetwoTheme.primary)),
                )
              : const Icon(Icons.pets, color: PetwoTheme.primary, size: 25),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(provider.businessName, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: PetwoTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w800))),
              if (provider.verificationStatus == 'approved') const Icon(Icons.verified_rounded, size: 17, color: Color(0xFF2583B8)),
            ]),
            if (provider.tagline != null && provider.tagline!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(provider.tagline!, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: PetwoTheme.textSecondary, fontSize: 10)),
            ],
            const SizedBox(height: 8),
            Row(children: [
              if (hasReviews) ...[
                const Icon(Icons.star_rounded, size: 15, color: Color(0xFFF2A900)),
                const SizedBox(width: 3),
                Text('${provider.rating.toStringAsFixed(1)} · ${provider.reviewCount} reviews', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
              ] else
                const Text('New listing · No reviews yet', style: TextStyle(fontSize: 10, color: PetwoTheme.textSecondary)),
              const Spacer(),
              const Text('Feedback-led ranking', style: TextStyle(fontSize: 9, color: PetwoTheme.textMuted)),
            ]),
          ]),
        ),
      ]),
    );
  }
}

class _ServiceCategory {
  final String name;
  final String subtitle;
  final IconData icon;
  final Color background;
  final Color iconColor;
  final String? businessType;
  final String? searchTerm;

  const _ServiceCategory(this.name, this.subtitle, this.icon, this.background, this.iconColor, {this.businessType, this.searchTerm});
}
