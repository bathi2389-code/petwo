import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/screens/auth/login_screen.dart';
import 'package:petwo_customer/screens/home/home_screen.dart';
import 'package:petwo_customer/screens/bookings_history/bookings_screen.dart';
import 'package:petwo_customer/screens/pets/pets_list_screen.dart';
import 'package:petwo_customer/services/api_service.dart';

const _apiKey = String.fromEnvironment('PETWO_FIREBASE_API_KEY');
const _appId = String.fromEnvironment('PETWO_FIREBASE_APP_ID');
const _senderId = String.fromEnvironment('PETWO_FIREBASE_MESSAGING_SENDER_ID');
const _projectId = String.fromEnvironment('PETWO_FIREBASE_PROJECT_ID');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  var configured = _apiKey.isNotEmpty && _appId.isNotEmpty && _senderId.isNotEmpty && _projectId.isNotEmpty;
  if (configured) {
    try {
      await Firebase.initializeApp(options: const FirebaseOptions(apiKey: _apiKey, appId: _appId, messagingSenderId: _senderId, projectId: _projectId));
    } catch (_) { configured = false; }
  }
  runApp(PetwoApp(firebaseConfigured: configured));
}

class PetwoApp extends StatelessWidget {
  const PetwoApp({super.key, required this.firebaseConfigured});
  final bool firebaseConfigured;
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'PETWO', debugShowCheckedModeBanner: false, theme: PetwoTheme.lightTheme,
    home: firebaseConfigured ? StreamBuilder<User?>(
      stream: FirebaseAuth.instance.userChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Scaffold(body: Center(child: CircularProgressIndicator()));
        final user = snapshot.data;
        if (user == null) return const CustomerLoginScreen();
        if (!user.emailVerified) return const CustomerLoginScreen(verificationPending: true);
        return CustomerProfileGate(key: ValueKey(user.uid), user: user);
      },
    ) : const FirebaseSetupScreen(),
  );
}

class CustomerProfileGate extends StatefulWidget {
  const CustomerProfileGate({super.key, required this.user});
  final User user;
  @override
  State<CustomerProfileGate> createState() => _CustomerProfileGateState();
}

class _CustomerProfileGateState extends State<CustomerProfileGate> {
  late Future<void> _profileFuture;
  @override
  void initState() { super.initState(); _profileFuture = _activate(); }
  Future<void> _activate() async {
    await widget.user.reload();
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || !user.emailVerified) throw StateError('Verify your email before using PETWO.');
    final name = user.displayName?.trim().isNotEmpty == true ? user.displayName!.trim() : (user.email?.split('@').first ?? 'PETWO Customer');
    await ApiService().activateCustomerProfile(name);
  }
  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _profileFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (!snapshot.hasError) return const MainNavigationShell();
        return Scaffold(
          body: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 460),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.pets, size: 48, color: PetwoTheme.primary),
                      const SizedBox(height: 18),
                      const Text('Finish setting up PETWO', style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      Text(snapshot.error.toString().replaceFirst('Exception: ', ''), textAlign: TextAlign.center, style: const TextStyle(color: PetwoTheme.textSecondary)),
                      const SizedBox(height: 18),
                      FilledButton(onPressed: () => setState(() => _profileFuture = _activate()), child: const Text('Try again')),
                      TextButton(onPressed: () async => ApiService().signOut(), child: const Text('Sign out')),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class FirebaseSetupScreen extends StatelessWidget {
  const FirebaseSetupScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Padding(
    padding: const EdgeInsets.all(28),
    child: Column(mainAxisSize: MainAxisSize.min, children: const [
      Icon(Icons.pets, size: 48, color: PetwoTheme.primary),
      SizedBox(height: 18),
      Text('Connect PETWO to Firebase', style: TextStyle(fontSize: 21, fontWeight: FontWeight.bold)),
      SizedBox(height: 10),
      Text('Register the Android/iOS app in Firebase, then run with PETWO_FIREBASE_API_KEY, PETWO_FIREBASE_APP_ID, PETWO_FIREBASE_MESSAGING_SENDER_ID and PETWO_FIREBASE_PROJECT_ID dart-defines.', textAlign: TextAlign.center),
    ]),
  )));
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});
  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}
class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  final List<Widget> _screens = const [HomeScreen(), BookingsScreen(), PetsListScreen(), ProfileScreen()];
  @override
  Widget build(BuildContext context) => Scaffold(
    body: IndexedStack(index: _currentIndex, children: _screens),
    bottomNavigationBar: NavigationBar(selectedIndex: _currentIndex, onDestinationSelected: (index) => setState(() => _currentIndex = index), indicatorColor: PetwoTheme.primaryLight, backgroundColor: Colors.white, destinations: const [
      NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home, color: PetwoTheme.primary), label: 'Home'),
      NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month, color: PetwoTheme.primary), label: 'Bookings'),
      NavigationDestination(icon: Icon(Icons.pets_outlined), selectedIcon: Icon(Icons.pets, color: PetwoTheme.primary), label: 'My Pets'),
      NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: PetwoTheme.primary), label: 'Profile'),
    ]),
  );
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('My Profile')),
    body: ListView(padding: const EdgeInsets.all(20), children: [
      const CircleAvatar(radius: 34, backgroundColor: PetwoTheme.primaryLight, child: Icon(Icons.person, color: PetwoTheme.primary, size: 32)),
      const SizedBox(height: 12),
      Text(FirebaseAuth.instance.currentUser?.phoneNumber ?? 'PETWO pet parent', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
      const SizedBox(height: 24),
      Card(child: ListTile(leading: const Icon(Icons.logout, color: PetwoTheme.error), title: const Text('Sign out'), onTap: () async { await ApiService().signOut(); })),
    ]),
  );
}
