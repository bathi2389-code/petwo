import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:petwo_customer/services/api_service.dart';

/// Complete Razorpay Client Service for PETWO Customer App
/// Handles order creation, SDK checkout popup, and backend signature verification.
class RazorpayService {
  static final RazorpayService _instance = RazorpayService._internal();
  factory RazorpayService() => _instance;

  Razorpay? _razorpay;

  RazorpayService._internal();

  /// Initialize listeners for payment events
  void initialize({
    required Function(PaymentSuccessResponse) onSuccess,
    required Function(PaymentFailureResponse) onFailure,
    Function(ExternalWalletResponse)? onExternalWallet,
  }) {
    _razorpay?.clear();
    _razorpay = Razorpay();

    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, onSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, onFailure);
    if (onExternalWallet != null) {
      _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, onExternalWallet);
    }
  }

  /// Starts the end-to-end payment workflow:
  /// 1. Calls PETWO backend to create a Razorpay Order
  /// 2. Launches the Razorpay UPI / Card / Netbanking checkout sheet
  /// 3. Upon success, sends cryptographic signature to backend to verify and confirm booking
  Future<void> startCheckout({
    required String bookingId,
    required String customerPhone,
    String? customerEmail,
    required Function(String paymentId) onPaymentVerified,
    required Function(String errorMessage) onError,
  }) async {
    try {
      // Step 1: Create Order on backend
      final orderRes = await ApiService().createPaymentOrder(bookingId);
      if (orderRes.statusCode != 201 && orderRes.statusCode != 200) {
        final errorMsg = orderRes.data?['error']?['message'] ?? 'Failed to initialize payment order';
        onError(errorMsg);
        return;
      }

      final orderData = orderRes.data['data'];
      final String orderId = orderData['orderId'];
      final int amount = orderData['amount'];
      final String keyId = orderData['keyId'];
      final String bookingNumber = orderData['bookingNumber'] ?? bookingId;

      // Step 2: Configure event listeners
      initialize(
        onSuccess: (PaymentSuccessResponse response) async {
          // Step 3: Cryptographic signature verification on backend
          try {
            final verifyRes = await ApiService().verifyPayment({
              'bookingId': bookingId,
              'razorpayOrderId': response.orderId ?? orderId,
              'razorpayPaymentId': response.paymentId,
              'razorpaySignature': response.signature,
            });

            if (verifyRes.statusCode == 200) {
              onPaymentVerified(response.paymentId ?? '');
            } else {
              final err = verifyRes.data?['error']?['message'] ?? 'Payment verification failed';
              onError(err);
            }
          } catch (e) {
            onError('Failed to verify payment with server: $e');
          }
        },
        onFailure: (PaymentFailureResponse response) {
          onError('Payment failed (${response.code}): ${response.message ?? "User cancelled"}');
        },
        onExternalWallet: (ExternalWalletResponse response) {
          debugPrint('External wallet selected: ${response.walletName}');
        },
      );

      // Step 4: Open Razorpay Native Checkout
      final options = {
        'key': keyId,
        'amount': amount, // in paisa (e.g. 50000 = ₹500)
        'name': 'PETWO Pet Care',
        'order_id': orderId,
        'description': 'Booking #$bookingNumber',
        'timeout': 180, // 3 minutes timeout
        'prefill': {
          'contact': customerPhone,
          if (customerEmail != null && customerEmail.isNotEmpty) 'email': customerEmail,
        },
        'theme': {
          'color': '#ff5c00', // Signature brand orange
        },
      };

      _razorpay!.open(options);
    } catch (e) {
      onError('Checkout exception: $e');
    }
  }

  /// Clean up event listeners
  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
  }
}
