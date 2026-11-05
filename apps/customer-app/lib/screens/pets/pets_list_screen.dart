import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:petwo_customer/models/pet_model.dart';
import 'package:petwo_customer/screens/pets/add_pet_screen.dart';
import 'package:petwo_customer/services/api_service.dart';

class PetsListScreen extends StatefulWidget {
  const PetsListScreen({super.key});
  @override
  State<PetsListScreen> createState() => _PetsListScreenState();
}
class _PetsListScreenState extends State<PetsListScreen> {
  List<Pet> pets = [];
  bool loading = true;
  String? error;

  @override
  void initState() { super.initState(); _loadPets(); }

  Future<void> _loadPets() async {
    setState(() { loading = true; error = null; });
    try {
      final response = await ApiService().getMyPets();
      final raw = response.data is Map ? response.data['data'] : null;
      final loaded = raw is List ? raw.whereType<Map<String, dynamic>>().map(Pet.fromJson).toList() : <Pet>[];
      if (!mounted) return;
      setState(() { pets = loaded; loading = false; });
    } catch (_) {
      if (!mounted) return;
      setState(() { error = 'We could not load your pets. Check your connection and try again.'; loading = false; });
    }
  }

  Future<void> _addPet() async {
    final saved = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const AddPetScreen()));
    if (saved == true) _loadPets();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('My Furry Family'), actions: [
      IconButton(tooltip: 'Add pet', icon: const Icon(Icons.add_circle_outline, color: PetwoTheme.primary), onPressed: _addPet),
    ]),
    body: RefreshIndicator(
      color: PetwoTheme.primary, onRefresh: _loadPets,
      child: loading
        ? const Center(child: CircularProgressIndicator())
        : error != null
          ? ListView(children: [const SizedBox(height: 100), Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(error!, textAlign: TextAlign.center))), Center(child: TextButton.icon(onPressed: _loadPets, icon: const Icon(Icons.refresh), label: const Text('Try again')))])
          : pets.isEmpty
            ? ListView(children: [
                const SizedBox(height: 90),
                const Icon(Icons.pets, size: 58, color: PetwoTheme.textMuted),
                const SizedBox(height: 16),
                const Center(child: Text('No pets added yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
                const Padding(padding: EdgeInsets.all(18), child: Text('Add your pet profile to keep their details together and request appointments with trusted care providers.', textAlign: TextAlign.center, style: TextStyle(color: PetwoTheme.textSecondary))),
                Center(child: ElevatedButton.icon(onPressed: _addPet, icon: const Icon(Icons.add), label: const Text('Add your first pet'))),
              ])
            : ListView.builder(
                padding: const EdgeInsets.all(16), itemCount: pets.length,
                itemBuilder: (context, index) {
                  final pet = pets[index];
                  final emoji = pet.species == 'dog' ? '🐶' : pet.species == 'cat' ? '🐱' : '🐾';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 14), elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: Color(0xFFE2E8F0))),
                    child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [
                      Container(width: 58, height: 58, decoration: BoxDecoration(color: PetwoTheme.primaryLight, borderRadius: BorderRadius.circular(16)), child: Center(child: Text(emoji, style: const TextStyle(fontSize: 30)))),
                      const SizedBox(width: 14),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(pet.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                        Text('${pet.species} · ${pet.breed}', style: const TextStyle(color: PetwoTheme.textSecondary, fontSize: 13)),
                        if (pet.weight != null) Text('${pet.weight} kg', style: const TextStyle(color: PetwoTheme.textMuted, fontSize: 12)),
                      ])),
                      const Icon(Icons.chevron_right, color: PetwoTheme.textMuted),
                    ])),
                  );
                },
              ),
    ),
    floatingActionButton: pets.isNotEmpty && !loading ? FloatingActionButton.extended(onPressed: _addPet, backgroundColor: PetwoTheme.primary, foregroundColor: Colors.white, icon: const Icon(Icons.add), label: const Text('Add pet')) : null,
  );
}
