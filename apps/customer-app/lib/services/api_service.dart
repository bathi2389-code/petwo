import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  late final Dio dio;
  static const String baseUrl = String.fromEnvironment('PETWO_API_BASE_URL', defaultValue: 'http://10.0.2.2:4000/api/v1');

  ApiService._internal() {
    dio = Dio(BaseOptions(baseUrl: baseUrl, connectTimeout: const Duration(seconds: 15), receiveTimeout: const Duration(seconds: 20), headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}));
    dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final token = await user.getIdToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
      } else {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    }, onError: (error, handler) => handler.next(error)));
  }

  Future<Response> sendOtp(String phone) => dio.post('/auth/otp/send', data: {'phone': phone});

  Future<Response> verifyOtp(String phone, String otp, {String? displayName}) async {
    final response = await dio.post('/auth/otp/verify', data: {'phone': phone, 'otp': otp, 'role': 'customer', if (displayName != null && displayName.trim().isNotEmpty) 'displayName': displayName.trim()});
    final data = response.data['data'] as Map<String, dynamic>?;
    final customToken = data?['customToken'] as String?;
    if (data?['role'] != 'customer') throw StateError('This number belongs to a provider account. Please use provider login.');
    if (customToken == null || customToken.isEmpty) throw StateError('The server did not return a Firebase sign-in token.');
    final credential = await FirebaseAuth.instance.signInWithCustomToken(customToken);
    final idToken = await credential.user?.getIdToken(true);
    if (idToken == null) throw StateError('Firebase could not create a sign-in session.');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', idToken);
    return response;
  }

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Future<Response> getMyPets() => dio.get('/pets');
  Future<Response> createPet(Map<String, dynamic> data) => dio.post('/pets', data: data);
  Future<Response> searchProviders({String? category, String? businessType, String? query, double? lat, double? lng}) => dio.get('/providers/search', queryParameters: {if (category != null) 'category': category, if (businessType != null) 'businessType': businessType, if (query != null && query.trim().isNotEmpty) 'query': query.trim(), if (lat != null) 'lat': lat, if (lng != null) 'lng': lng, 'sortBy': 'recommended', 'limit': 20});
  Future<Response> getProviderDetails(String providerId) => dio.get('/providers/$providerId');
  Future<Response> getProviderServices(String providerId) => dio.get('/services', queryParameters: {'providerId': providerId});
  Future<Response> createBooking(Map<String, dynamic> data) => dio.post('/bookings', data: data);
  Future<Response> getMyBookings() => dio.get('/bookings/my');

  // Existing payment integration remains unchanged.
  Future<Response> createPaymentOrder(String bookingId) => dio.post('/payments/orders', data: {'bookingId': bookingId});
  Future<Response> verifyPayment(Map<String, dynamic> data) => dio.post('/payments/verify', data: data);
}
