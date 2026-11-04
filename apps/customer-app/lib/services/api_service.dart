import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio dio;
  static const String baseUrl = 'http://localhost:4000/api/v1';

  ApiService._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (RequestOptions options, RequestInterceptorHandler handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (DioException e, ErrorInterceptorHandler handler) {
          handler.next(e);
        },
      ),
    );
  }

  // ─── Auth ───
  Future<Response> sendOtp(String phone) async {
    return dio.post('/auth/otp/send', data: {'phone': phone});
  }

  Future<Response> verifyOtp(String phone, String otp, {String? displayName}) async {
    return dio.post('/auth/otp/verify', data: {
      'phone': phone,
      'otp': otp,
      'role': 'customer',
      if (displayName != null) 'displayName': displayName,
    });
  }

  // ─── Pets ───
  Future<Response> getMyPets() async {
    return dio.get('/pets');
  }

  Future<Response> createPet(Map<String, dynamic> data) async {
    return dio.post('/pets', data: data);
  }

  // ─── Search & Providers ───
  Future<Response> searchProviders({String? category, String? businessType, String? query, double? lat, double? lng}) async {
    return dio.get('/providers/search', queryParameters: {
      if (category != null) 'category': category,
      if (businessType != null) 'businessType': businessType,
      if (query != null && query.trim().isNotEmpty) 'query': query.trim(),
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      'sortBy': 'recommended',
      'limit': 20,
    });
  }

  Future<Response> getProviderDetails(String providerId) async {
    return dio.get('/providers/$providerId');
  }

  Future<Response> getProviderServices(String providerId) async {
    return dio.get('/services', queryParameters: {'providerId': providerId});
  }

  // ─── Bookings ───
  Future<Response> createBooking(Map<String, dynamic> data) async {
    return dio.post('/bookings', data: data);
  }

  Future<Response> getMyBookings() async {
    return dio.get('/bookings/my');
  }

  // ─── Payments ───
  Future<Response> createPaymentOrder(String bookingId) async {
    return dio.post('/payments/orders', data: {'bookingId': bookingId});
  }

  Future<Response> verifyPayment(Map<String, dynamic> data) async {
    return dio.post('/payments/verify', data: data);
  }
}
