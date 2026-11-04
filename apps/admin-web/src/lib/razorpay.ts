/**
 * Razorpay Web Checkout Utility for Admin Portal
 */

export interface RazorpayCheckoutOptions {
  orderId: string;
  amount: number; // in paisa
  keyId: string;
  name?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayWebCheckout(options: RazorpayCheckoutOptions): Promise<boolean> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    if (options.onError) options.onError(new Error('Razorpay SDK failed to load.'));
    return false;
  }

  const rzpOptions = {
    key: options.keyId,
    amount: options.amount,
    currency: 'INR',
    name: options.name || 'PETWO Admin',
    description: options.description || 'Payment Transaction',
    order_id: options.orderId,
    prefill: {
      name: options.customerName || '',
      email: options.customerEmail || '',
      contact: options.customerPhone || '',
    },
    theme: {
      color: '#ff5c00',
    },
    handler: (response: any) => {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        if (options.onDismiss) options.onDismiss();
      },
    },
  };

  const paymentObject = new (window as any).Razorpay(rzpOptions);
  paymentObject.on('payment.failed', (response: any) => {
    if (options.onError) options.onError(response.error);
  });

  paymentObject.open();
  return true;
}
