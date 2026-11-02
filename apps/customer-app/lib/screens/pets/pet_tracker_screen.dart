import 'package:flutter/material.dart';
import 'package:petwo_customer/config/theme.dart';
import 'package:dio/dio.dart';

class PetTrackerScreen extends StatefulWidget {
  final String petId;
  final String petName;

  const PetTrackerScreen({
    super.key,
    required this.petId,
    required this.petName,
  });

  @override
  State<PetTrackerScreen> createState() => _PetTrackerScreenState();
}

class _PetTrackerScreenState extends State<PetTrackerScreen> {
  bool isConnected = true;
  int batteryPercent = 92;
  double latitude = 17.4239;
  double longitude = 78.4378;
  int heartRate = 94;
  double temperature = 38.6;
  int steps = 5420;
  String activity = 'Walking';
  String locationName = 'KBR National Park, Jubilee Hills, Hyderabad';
  bool isInsideGeofence = true;
  bool isSimulating = false;

  Future<void> simulateLiveTelemetry() async {
    setState(() => isSimulating = true);
    try {
      final dio = Dio();
      final res = await dio.post('http://localhost:4000/api/v1/iot/simulate/${widget.petId}');
      if (!mounted) return;
      if (res.data != null && res.data['data'] != null) {
        final d = res.data['data'];
        setState(() {
          latitude = (d['lat'] as num).toDouble();
          longitude = (d['lng'] as num).toDouble();
          heartRate = d['heartRateBpm'] ?? 98;
          steps = d['dailySteps'] ?? 5600;
          locationName = d['locationName'] ?? locationName;
        });
      }
    } catch (_) {
      if (!mounted) return;
      // Offline local simulation
      setState(() {
        latitude += 0.0005;
        longitude += 0.0003;
        heartRate = 102;
        steps += 120;
      });
    } finally {
      if (mounted) {
        setState(() => isSimulating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.petName}\'s Smart Collar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Collar Status Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    height: 48,
                    width: 48,
                    decoration: BoxDecoration(
                      color: PetwoTheme.primaryLight,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Icon(Icons.gps_fixed, color: PetwoTheme.primary),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'PETWO SmartCollar Pro',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              height: 8,
                              width: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Battery: $batteryPercent% • Firmware v2.1.0',
                          style: const TextStyle(fontSize: 12, color: PetwoTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: isSimulating ? null : simulateLiveTelemetry,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    child: Text(isSimulating ? 'Pinging...' : 'Ping Collar', style: const TextStyle(fontSize: 11)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Live Location & Geofence Card
            Container(
              height: 220,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Stylized Map Representation
                  Positioned.fill(
                    child: Opacity(
                      opacity: 0.15,
                      child: GridPaper(
                        color: Colors.white,
                        divisions: 2,
                        subdivisions: 2,
                      ),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: PetwoTheme.primary.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Container(
                            height: 24,
                            width: 24,
                            decoration: const BoxDecoration(
                              color: PetwoTheme.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Text('🐾', style: TextStyle(fontSize: 12)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          widget.petName,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          locationName,
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 14,
                    left: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isInsideGeofence
                            ? const Color(0xFF065F46)
                            : const Color(0xFF991B1B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isInsideGeofence ? Icons.check_circle : Icons.warning,
                            size: 12,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isInsideGeofence ? 'Inside Safe Zone' : 'Breach Alert!',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              'Real-Time Health & Biometrics',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: PetwoTheme.textPrimary),
            ),
            const SizedBox(height: 12),

            // Vitals Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.35,
              children: [
                _buildVitalCard(
                  title: 'Heart Rate',
                  value: '$heartRate BPM',
                  subtitle: 'Resting Normal',
                  icon: Icons.favorite,
                  iconColor: const Color(0xFFEF4444),
                ),
                _buildVitalCard(
                  title: 'Body Temp',
                  value: '$temperature °C',
                  subtitle: 'Target: 38.3 - 39.2°C',
                  icon: Icons.thermostat,
                  iconColor: const Color(0xFFF59E0B),
                ),
                _buildVitalCard(
                  title: 'Daily Steps',
                  value: '$steps',
                  subtitle: 'Goal: 8,000 steps',
                  icon: Icons.directions_walk,
                  iconColor: const Color(0xFF10B981),
                ),
                _buildVitalCard(
                  title: 'Current State',
                  value: activity,
                  subtitle: 'No excessive scratching',
                  icon: Icons.pets,
                  iconColor: PetwoTheme.primary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVitalCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, color: PetwoTheme.textSecondary, fontWeight: FontWeight.w600)),
              Icon(icon, size: 18, color: iconColor),
            ],
          ),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: PetwoTheme.textPrimary)),
          Text(subtitle, style: const TextStyle(fontSize: 10, color: PetwoTheme.textMuted)),
        ],
      ),
    );
  }
}
