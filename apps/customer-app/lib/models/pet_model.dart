class Pet {
  final String id;
  final String ownerId;
  final String name;
  final String species;
  final String breed;
  final String gender;
  final String? dob;
  final double? weight;
  final String? color;
  final String? photoURL;
  final String? microchipId;
  final List<String>? allergies;
  final String? specialNotes;

  Pet({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.species,
    required this.breed,
    required this.gender,
    this.dob,
    this.weight,
    this.color,
    this.photoURL,
    this.microchipId,
    this.allergies,
    this.specialNotes,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id'] ?? '',
      ownerId: json['ownerId'] ?? '',
      name: json['name'] ?? '',
      species: json['species'] ?? 'dog',
      breed: json['breed'] ?? '',
      gender: json['gender'] ?? 'unknown',
      dob: json['dob'],
      weight: json['weight'] != null ? (json['weight'] as num).toDouble() : null,
      color: json['color'],
      photoURL: json['photoURL'],
      microchipId: json['microchipId'],
      allergies: json['allergies'] != null ? List<String>.from(json['allergies']) : null,
      specialNotes: json['specialNotes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ownerId': ownerId,
      'name': name,
      'species': species,
      'breed': breed,
      'gender': gender,
      'dob': dob,
      'weight': weight,
      'color': color,
      'photoURL': photoURL,
      'microchipId': microchipId,
      'allergies': allergies,
      'specialNotes': specialNotes,
    };
  }
}
