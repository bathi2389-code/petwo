import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/screens/home/home_screen.dart';
import 'package:petwo_customer/screens/bookings_history/bookings_screen.dart';
import 'package:petwo_customer/screens/pets/pets_list_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PetwoApp());
}

class PetwoApp extends StatelessWidget {
  const PetwoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PETWO',
      debugShowCheckedModeBanner: false,
      theme: PetwoTheme.lightTheme,
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const BookingsScreen(),
    const PetsListScreen(),
    const ProfilePlaceholderScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        indicatorColor: PetwoTheme.primaryLight,
        backgroundColor: Colors.white,
        elevation: 4,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: PetwoTheme.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month, color: PetwoTheme.primary),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.pets_outlined),
            selectedIcon: Icon(Icons.pets, color: PetwoTheme.primary),
            label: 'My Pets',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: PetwoTheme.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class ProfilePlaceholderScreen extends StatelessWidget {
  const ProfilePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Profile & Account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 28,
                  backgroundColor: PetwoTheme.primaryLight,
                  child: Text('🐾', style: TextStyle(fontSize: 24)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Pet Parent',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      SizedBox(height: 2),
                      Text('+91 98765 43210', style: TextStyle(color: PetwoTheme.textSecondary, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildTile(Icons.bookmark_border, 'Saved Clinics & Providers'),
          _buildTile(Icons.payment, 'Payment Methods & UPI'),
          _buildTile(Icons.local_offer_outlined, 'Promotions & Coupons'),
          _buildTile(Icons.support_agent, 'Help & Customer Support'),
          _buildTile(Icons.privacy_tip_outlined, 'Privacy & Settings'),
        ],
      ),
    );
  }

  Widget _buildTile(IconData icon, String title) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        leading: Icon(icon, color: PetwoTheme.primary, size: 22),
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right, size: 18, color: PetwoTheme.textMuted),
        onTap: () {},
      ),
    );
  }
}
