import 'package:flutter/material.dart';
import 'package:petco_customer/config/theme.dart';
import 'package:petco_customer/models/pet_model.dart';

class AddPetScreen extends StatefulWidget {
  const AddPetScreen({Key? key}) : super(key: key);

  @override
  State<AddPetScreen> createState() => _AddPetScreenState();
}

class _AddPetScreenState extends State<AddPetScreen> {
  final _formKey = GlobalKey<FormState>();

  String name = '';
  String species = 'dog';
  String breed = '';
  String gender = 'male';
  double? weight;
  String? allergies;
  String? notes;

  final speciesOptions = [
    {'name': 'Dog', 'icon': '🐶', 'slug': 'dog'},
    {'name': 'Cat', 'icon': '🐱', 'slug': 'cat'},
    {'name': 'Bird', 'icon': '🦜', 'slug': 'bird'},
    {'name': 'Rabbit', 'icon': '🐰', 'slug': 'rabbit'},
    {'name': 'Other', 'icon': '🐾', 'slug': 'other'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Pet Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select Pet Species',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: PetcoTheme.textPrimary),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 80,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: speciesOptions.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final item = speciesOptions[index];
                    final isSelected = species == item['slug'];
                    return GestureDetector(
                      onTap: () => setState(() => species = item['slug']!),
                      child: Container(
                        width: 72,
                        decoration: BoxDecoration(
                          color: isSelected ? PetcoTheme.primaryLight : Colors.white,
                          border: Border.all(
                            color: isSelected ? PetcoTheme.primary : const Color(0xFFE2E8F0),
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(item['icon']!, style: const TextStyle(fontSize: 26)),
                            const SizedBox(height: 4),
                            Text(
                              item['name']!,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                color: isSelected ? PetcoTheme.primary : PetcoTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 24),

              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Pet Name *',
                  hintText: 'e.g. Simba, Bella',
                ),
                validator: (val) => val == null || val.isEmpty ? 'Please enter pet name' : null,
                onSaved: (val) => name = val ?? '',
              ),

              const SizedBox(height: 16),

              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Breed *',
                  hintText: 'e.g. Golden Retriever, Beagle, Indie',
                ),
                validator: (val) => val == null || val.isEmpty ? 'Please enter breed' : null,
                onSaved: (val) => breed = val ?? '',
              ),

              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Gender', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            ChoiceChip(
                              label: const Text('Male'),
                              selected: gender == 'male',
                              onSelected: (val) => setState(() => gender = 'male'),
                            ),
                            const SizedBox(width: 8),
                            ChoiceChip(
                              label: const Text('Female'),
                              selected: gender == 'female',
                              onSelected: (val) => setState(() => gender = 'female'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Weight (kg)',
                        hintText: 'e.g. 15.5',
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      onSaved: (val) => weight = double.tryParse(val ?? ''),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Allergies (Optional)',
                  hintText: 'e.g. Chicken protein, fleas',
                ),
                onSaved: (val) => allergies = val,
              ),

              const SizedBox(height: 16),

              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Special Notes / Behavioral Habits',
                  hintText: 'e.g. Friendly, shy around larger dogs, requires gentle handling',
                ),
                maxLines: 2,
                onSaved: (val) => notes = val,
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      _formKey.currentState!.save();
                      final pet = Pet(
                        id: 'pet-${DateTime.now().millisecondsSinceEpoch}',
                        ownerId: 'current-user',
                        name: name,
                        species: species,
                        breed: breed,
                        gender: gender,
                        weight: weight,
                        allergies: allergies != null && allergies!.isNotEmpty ? [allergies!] : [],
                        specialNotes: notes,
                      );
                      Navigator.pop(context, pet);
                    }
                  },
                  child: const Text('Save Pet Profile'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
