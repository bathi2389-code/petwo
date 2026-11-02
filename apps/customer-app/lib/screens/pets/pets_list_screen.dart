import 'package:flutter/material.dart';
import 'package:petco_customer/config/theme.dart';
import 'package:petco_customer/models/pet_model.dart';
import 'package:petco_customer/screens/pets/add_pet_screen.dart';

class PetsListScreen extends StatefulWidget {
  const PetsListScreen({super.key});

  @override
  State<PetsListScreen> createState() => _PetsListScreenState();
}

class _PetsListScreenState extends State<PetsListScreen> {
  List<Pet> pets = [
    Pet(
      id: 'pet-01',
      ownerId: 'owner-01',
      name: 'Simba',
      species: 'dog',
      breed: 'Golden Retriever',
      gender: 'male',
      dob: '2022-04-12',
      weight: 28.5,
      allergies: ['Chicken byproduct'],
      specialNotes: 'Very friendly, likes ear scratches',
    ),
    Pet(
      id: 'pet-02',
      ownerId: 'owner-01',
      name: 'Luna',
      species: 'cat',
      breed: 'Persian Longhair',
      gender: 'female',
      dob: '2023-01-08',
      weight: 4.2,
      allergies: [],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Furry Family'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: PetcoTheme.primary),
            onPressed: () async {
              final newPet = await Navigator.push<Pet>(
                context,
                MaterialPageRoute(builder: (context) => const AddPetScreen()),
              );
              if (newPet != null) {
                if (!mounted) return;
                setState(() => pets.add(newPet));
              }
            },
          ),
        ],
      ),
      body: pets.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🐾', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  const Text(
                    'No pets added yet',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Add your pet profiles to track vaccinations,\nmedical history & book appointments.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: PetcoTheme.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AddPetScreen()),
                      );
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add Your First Pet'),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: pets.length,
              itemBuilder: (context, index) {
                final pet = pets[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              height: 60,
                              width: 60,
                              decoration: BoxDecoration(
                                color: PetcoTheme.primaryLight,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Center(
                                child: Text(
                                  pet.species == 'dog' ? '🐶' : pet.species == 'cat' ? '🐱' : '🐰',
                                  style: const TextStyle(fontSize: 32),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pet.name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: PetcoTheme.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${pet.breed} • ${pet.gender.toUpperCase()}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: PetcoTheme.textSecondary,
                                    ),
                                  ),
                                  if (pet.weight != null)
                                    Text(
                                      '${pet.weight} kg',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: PetcoTheme.primary,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined, size: 20, color: PetcoTheme.textMuted),
                              onPressed: () {},
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Divider(height: 1),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.vaccines, size: 16, color: PetcoTheme.primary),
                              label: const Text(
                                'Vaccines (Up to date)',
                                style: TextStyle(fontSize: 12, color: PetcoTheme.primary),
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () {},
                              icon: const Icon(Icons.history, size: 16, color: PetcoTheme.textSecondary),
                              label: const Text(
                                'Medical History',
                                style: TextStyle(fontSize: 12, color: PetcoTheme.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
