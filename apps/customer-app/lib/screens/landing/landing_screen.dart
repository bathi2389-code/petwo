import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/screens/auth/login_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  static final GlobalKey _careKey = GlobalKey();
  static final GlobalKey _howKey = GlobalKey();
  static final GlobalKey _providersKey = GlobalKey();
  static const _providerUrl = 'https://petwo-provider-av04vuus7-dragon-4898.vercel.app';

  void _signIn(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CustomerLoginScreen()));
  }

  Future<void> _openProviderPortal() async {
    final uri = Uri.parse(_providerUrl);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFCFBF8),
      body: LayoutBuilder(builder: (context, constraints) {
        final wide = constraints.maxWidth >= 900;
        final horizontal = wide ? (constraints.maxWidth - 1160) / 2 : 22.0;
        return SingleChildScrollView(
          child: Column(
            children: [
              _nav(context, wide, horizontal),
              _hero(context, wide, horizontal),
              _intro(wide, horizontal),
              _careCards(wide, horizontal),
              _howItWorks(wide, horizontal),
              _providerBanner(context, wide, horizontal),
              _footer(horizontal),
            ],
          ),
        );
      }),
    );
  }

  Widget _nav(BuildContext context, bool wide, double pad) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(horizontal: pad.clamp(22, 90), vertical: 17),
      child: Row(children: [
        const _Brand(),
        const Spacer(),
        if (wide) ...[
          _navLink('Explore care', () => _scroll(context, 'care')),
          _navLink('How it works', () => _scroll(context, 'how')),
          _navLink('For providers', () => _scroll(context, 'providers')),
          const SizedBox(width: 18),
          OutlinedButton(
            onPressed: () => _signIn(context),
            style: OutlinedButton.styleFrom(foregroundColor: PetwoTheme.primary, side: const BorderSide(color: Color(0xFFD7E7E2)), padding: const EdgeInsets.symmetric(horizontal: 17, vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Pet parent sign in', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 9),
          FilledButton(
            onPressed: _openProviderPortal,
            style: FilledButton.styleFrom(backgroundColor: PetwoTheme.primary, padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Provider login', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ] else PopupMenuButton<String>(
          icon: const Icon(Icons.menu_rounded),
          onSelected: (v) {
            if (v == 'signin') _signIn(context);
            if (v == 'provider') _openProviderPortal();
            if (v == 'care') _scroll(context, 'care');
            if (v == 'how') _scroll(context, 'how');
            if (v == 'providers') _scroll(context, 'providers');
          },
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'care', child: Text('Explore care')),
            PopupMenuItem(value: 'how', child: Text('How it works')),
            PopupMenuItem(value: 'providers', child: Text('For providers')),
            PopupMenuItem(value: 'signin', child: Text('Pet parent sign in')),
            PopupMenuItem(value: 'provider', child: Text('Provider login')),
          ],
        ),
      ]),
    );
  }

  Widget _navLink(String label, VoidCallback onTap) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 12),
    child: TextButton(onPressed: onTap, style: TextButton.styleFrom(foregroundColor: const Color(0xFF40534F)), child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
  );

  Widget _hero(BuildContext context, bool wide, double pad) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFF1F7F3),
      padding: EdgeInsets.fromLTRB(pad.clamp(22, 90), wide ? 76 : 48, pad.clamp(22, 90), wide ? 78 : 48),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1160),
          child: wide
            ? Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                Expanded(flex: 6, child: _heroCopy(context, true)),
                const SizedBox(width: 42),
                const Expanded(flex: 5, child: _PetIllustration()),
              ])
            : Column(children: [
                _heroCopy(context, false),
                const SizedBox(height: 34),
                const _PetIllustration(),
              ]),
        ),
      ),
    );
  }

  Widget _heroCopy(BuildContext context, bool wide) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const _Eyebrow('EXPLORE PETWO'),
      const SizedBox(height: 19),
      Text('A happier way to care for pets', style: TextStyle(fontSize: wide ? 56 : 39, height: 1.08, letterSpacing: -1.8, fontWeight: FontWeight.w800, color: const Color(0xFF183B32))),
      const SizedBox(height: 17),
      Text('Every paw deserves the best care.', style: TextStyle(fontSize: wide ? 23 : 19, height: 1.35, fontWeight: FontWeight.w700, color: const Color(0xFF37564D))),
      const SizedBox(height: 14),
      const Text('PETWO is building a simpler connection between pet parents and the people who care for their furry family — from veterinary visits to everyday wellbeing.', style: TextStyle(fontSize: 16, height: 1.75, color: Color(0xFF61736D))),
      const SizedBox(height: 27),
      Wrap(spacing: 12, runSpacing: 12, children: [
        FilledButton.icon(onPressed: () => _scroll(context, 'care'), icon: const Icon(Icons.pets_rounded, size: 18), label: const Text('Explore pet care'), style: FilledButton.styleFrom(backgroundColor: PetwoTheme.primary, padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 17), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)))),
        OutlinedButton(onPressed: () => _signIn(context), style: OutlinedButton.styleFrom(foregroundColor: PetwoTheme.primary, side: const BorderSide(color: PetwoTheme.primary), padding: const EdgeInsets.symmetric(horizontal: 21, vertical: 17), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text('Create a pet-parent account')),
      ]),
      const SizedBox(height: 28),
      const Wrap(spacing: 10, runSpacing: 9, children: [
        _Pill(Icons.favorite_outline, 'Pet-first experience'),
        _Pill(Icons.verified_outlined, 'Care-focused platform'),
      ]),
    ],
  );

  Widget _intro(bool wide, double pad) => Padding(
    key: const ValueKey('intro'),
    padding: EdgeInsets.fromLTRB(pad.clamp(22, 90), 76, pad.clamp(22, 90), 30),
    child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1160), child: Column(children: [
      const _Eyebrow('CARE STARTS WITH CONNECTION'),
      const SizedBox(height: 13),
      Text('Helping pets and their people thrive', textAlign: TextAlign.center, style: TextStyle(fontSize: wide ? 38 : 29, height: 1.2, letterSpacing: -0.8, fontWeight: FontWeight.w800, color: const Color(0xFF183B32))),
      const SizedBox(height: 14),
      const Text('Made around their wellbeing', textAlign: TextAlign.center, style: TextStyle(fontSize: 17, color: Color(0xFF61736D), fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      const Text('Care for every stage of their journey.', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, color: Color(0xFF61736D))),
      const SizedBox(height: 10),
      const SizedBox(width: 700, child: Text('A single place designed to make finding and managing pet care feel more straightforward.', textAlign: TextAlign.center, style: TextStyle(fontSize: 15, height: 1.7, color: Color(0xFF71817B)))),
    ]))),
  );

  Widget _careCards(bool wide, double pad) => Container(
    key: _careKey,
    width: double.infinity,
    padding: EdgeInsets.fromLTRB(pad.clamp(22, 90), 28, pad.clamp(22, 90), 76),
    child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1160), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const _Eyebrow('EXPLORE PETWO'),
      const SizedBox(height: 18),
      GridView.count(
        crossAxisCount: wide ? 3 : 1,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 18,
        crossAxisSpacing: 18,
        childAspectRatio: wide ? 1.12 : 2.0,
        children: const [
          _CareCard(icon: Icons.local_hospital_outlined, title: 'Veterinary care', body: 'Find approved veterinary clinics and pet-care professionals.'),
          _CareCard(icon: Icons.calendar_month_outlined, title: 'Easy appointments', body: 'Choose a clinic, select a service and request an appointment online.'),
          _CareCard(icon: Icons.verified_user_outlined, title: 'Care you can trust', body: 'Browse approved providers and compare published ratings.'),
        ],
      ),
    ]))),
  );

  Widget _howItWorks(bool wide, double pad) => Container(
    key: _howKey,
    width: double.infinity,
    color: const Color(0xFFF1F7F3),
    padding: EdgeInsets.fromLTRB(pad.clamp(22, 90), 70, pad.clamp(22, 90), 76),
    child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1160), child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
      const _Eyebrow('SIMPLE BY DESIGN'),
      const SizedBox(height: 14),
      Text('Less searching. More tail wags.', textAlign: TextAlign.center, style: TextStyle(fontSize: wide ? 38 : 29, fontWeight: FontWeight.w800, letterSpacing: -0.8, color: const Color(0xFF183B32))),
      const SizedBox(height: 15),
      const SizedBox(width: 720, child: Text('Our goal is to make it easier for pet parents to find the right care and for care teams to spend more time doing what matters.', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, height: 1.7, color: Color(0xFF61736D)))),
      const SizedBox(height: 34),
      Wrap(alignment: WrapAlignment.center, spacing: 22, runSpacing: 22, children: const [
        _StepCard(number: '01', title: 'Discover', body: 'Explore pet-care services and provider information.'),
        _StepCard(number: '02', title: 'Connect', body: 'Move toward a more convenient care experience.'),
      ]),
    ]))),
  );

  Widget _providerBanner(BuildContext context, bool wide, double pad) => Container(
    key: _providersKey,
    width: double.infinity,
    padding: EdgeInsets.fromLTRB(pad.clamp(22, 90), 68, pad.clamp(22, 90), 68),
    child: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 1160), child: Container(
      width: double.infinity,
      padding: EdgeInsets.all(wide ? 42 : 26),
      decoration: BoxDecoration(color: const Color(0xFF183B32), borderRadius: BorderRadius.circular(26)),
      child: wide ? Row(children: [
        const Expanded(child: _ProviderCopy()),
        const SizedBox(width: 20),
        FilledButton(onPressed: _openProviderPortal, style: FilledButton.styleFrom(backgroundColor: const Color(0xFFE6B98B), foregroundColor: const Color(0xFF183B32), padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text('Open provider portal', style: TextStyle(fontWeight: FontWeight.w800))),
      ]) : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const _ProviderCopy(),
        const SizedBox(height: 22),
        FilledButton(onPressed: _openProviderPortal, style: FilledButton.styleFrom(backgroundColor: const Color(0xFFE6B98B), foregroundColor: const Color(0xFF183B32), padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 17)), child: const Text('Open provider portal')),
      ]),
    ))),
  );

  Widget _footer(double pad) => Container(
    width: double.infinity,
    color: Colors.white,
    padding: EdgeInsets.symmetric(horizontal: pad.clamp(22, 90), vertical: 25),
    child: const Center(child: Text('© 2026 PETWO. Made for every paw.', style: TextStyle(color: Color(0xFF7A8983), fontSize: 13))),
  );

  void _scroll(BuildContext context, String section) {
    // Scroll navigation is handled by the landing page's section positions below.
    final key = switch (section) {
      'care' => _careKey,
      'how' => _howKey,
      'providers' => _providersKey,
      _ => _careKey,
    };
    Scrollable.ensureVisible(
      _sectionContext(context, key) ?? context,
      duration: const Duration(milliseconds: 550),
      curve: Curves.easeInOutCubic,
      alignment: 0.04,
    );
  }

  BuildContext? _sectionContext(BuildContext context, Key key) {
    if (identical(key, _careKey)) return _careKey.currentContext;
    if (identical(key, _howKey)) return _howKey.currentContext;
    if (identical(key, _providersKey)) return _providersKey.currentContext;
    return null;
  }
}

class _Brand extends StatelessWidget {
  const _Brand();
  @override
  Widget build(BuildContext context) => Row(children: [
    Container(width: 38, height: 38, decoration: BoxDecoration(color: PetwoTheme.primary, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.pets, color: Colors.white, size: 22)),
    const SizedBox(width: 10),
    const Text('PETWO', style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900, letterSpacing: 1.1, color: Color(0xFF183B32))),
  ]);
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(text, style: const TextStyle(color: PetwoTheme.primary, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.8));
}

class _Pill extends StatelessWidget {
  const _Pill(this.icon, this.text);
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: const Color(0xFFDCE9E3)), borderRadius: BorderRadius.circular(30)), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 15, color: PetwoTheme.primary), const SizedBox(width: 7), Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF52665E), fontWeight: FontWeight.w700))]));
}

class _PetIllustration extends StatelessWidget {
  const _PetIllustration();
  @override
  Widget build(BuildContext context) => Container(
    height: 340,
    constraints: const BoxConstraints(maxWidth: 500),
    decoration: BoxDecoration(color: const Color(0xFFE2EEE6), borderRadius: BorderRadius.circular(32)),
    child: Stack(alignment: Alignment.center, children: [
      Positioned(top: 25, right: 30, child: Icon(Icons.favorite, color: Colors.white.withOpacity(.8), size: 34)),
      Positioned(bottom: 22, left: 28, child: Icon(Icons.pets, color: const Color(0xFFB9D2C3), size: 48)),
      const Text('🐶   🐱', style: TextStyle(fontSize: 94)),
      const Positioned(bottom: 32, child: Text('♥  Care • Comfort • Wellbeing', style: TextStyle(color: Color(0xFF42665A), fontWeight: FontWeight.w700, fontSize: 14))),
      const Positioned(top: 28, left: 28, child: _FloatingTag(icon: Icons.medical_services_outlined, text: 'Vet care')),
      const Positioned(top: 88, right: 20, child: _FloatingTag(icon: Icons.content_cut, text: 'Grooming')),
    ]),
  );
}

class _FloatingTag extends StatelessWidget {
  const _FloatingTag({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(.06), blurRadius: 18, offset: const Offset(0, 5))]), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 17, color: PetwoTheme.primary), const SizedBox(width: 7), Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Color(0xFF36564A)))]));
}

class _CareCard extends StatelessWidget {
  const _CareCard({required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(25),
    decoration: BoxDecoration(color: Colors.white, border: Border.all(color: const Color(0xFFE6ECE8)), borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF183B32).withOpacity(.035), blurRadius: 20, offset: const Offset(0, 8))]),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(width: 48, height: 48, decoration: BoxDecoration(color: const Color(0xFFEAF4EE), borderRadius: BorderRadius.circular(15)), child: Icon(icon, color: PetwoTheme.primary, size: 24)),
      const SizedBox(height: 19),
      Text(title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Color(0xFF203E34))),
      const SizedBox(height: 9),
      Text(body, style: const TextStyle(fontSize: 14, height: 1.65, color: Color(0xFF71817B))),
      const Spacer(),
      const Row(children: [Text('Explore now', style: TextStyle(color: PetwoTheme.primary, fontWeight: FontWeight.w800)), SizedBox(width: 7), Icon(Icons.arrow_forward, size: 16, color: PetwoTheme.primary)]),
    ]),
  );
}

class _StepCard extends StatelessWidget {
  const _StepCard({required this.number, required this.title, required this.body});
  final String number;
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => SizedBox(width: 330, child: Container(padding: const EdgeInsets.all(25), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2EAE5))), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(number, style: const TextStyle(color: PetwoTheme.primary, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.2)),
    const SizedBox(height: 14),
    Text(title, style: const TextStyle(color: Color(0xFF203E34), fontWeight: FontWeight.w800, fontSize: 21)),
    const SizedBox(height: 8),
    Text(body, style: const TextStyle(color: Color(0xFF71817B), fontSize: 14, height: 1.65)),
  ])));
}

class _ProviderCopy extends StatelessWidget {
  const _ProviderCopy();
  @override
  Widget build(BuildContext context) => const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text('FOR CLINICS AND CARE TEAMS', style: TextStyle(color: Color(0xFFE6B98B), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.7)),
    SizedBox(height: 14),
    Text('Bring your pet-care business to PETWO.', style: TextStyle(color: Colors.white, fontSize: 29, height: 1.2, fontWeight: FontWeight.w800)),
    SizedBox(height: 12),
    Text('Manage your services, appointments and customer relationships from the provider portal.', style: TextStyle(color: Color(0xFFD3E1DA), fontSize: 15, height: 1.7)),
  ]);
}
