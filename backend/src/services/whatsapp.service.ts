import axios from 'axios';
import { env } from '../config/env';

export interface WhatsAppButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private apiKey: string;
  private phoneNumberId: string;

  private constructor() {
    this.apiKey = env.WHATSAPP_API_KEY || '';
    this.phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Send Booking Confirmation Template via WhatsApp
   */
  public async sendBookingConfirmation(params: {
    recipientPhone: string;
    customerName: string;
    petName: string;
    bookingNumber: string;
    providerName: string;
    appointmentDate: string;
    appointmentTime: string;
  }): Promise<{ messageId: string; status: string }> {
    const messagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.recipientPhone.replace(/\D/g, ''),
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '🐾 PETWO Appointment Confirmed',
        },
        body: {
          text: `Hello ${params.customerName}!\n\nYour appointment for *${params.petName}* at *${params.providerName}* is confirmed.\n\n📅 Date: ${params.appointmentDate}\n⏰ Time: ${params.appointmentTime}\n🔖 Booking #: ${params.bookingNumber}\n\nPlease arrive 10 minutes prior to your slot.`,
        },
        footer: {
          text: 'PETWO Healthcare Network • Hyderabad',
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: `VIEW_${params.bookingNumber}`, title: '📍 Directions' } },
            { type: 'reply', reply: { id: `RESCHEDULE_${params.bookingNumber}`, title: '🔄 Reschedule' } },
          ],
        },
      },
    };

    if (!this.apiKey || !this.phoneNumberId) {
      throw new Error('WhatsApp delivery is not configured.');
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`,
        messagePayload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const messageId = response.data?.messages?.[0]?.id;
      if (!messageId) throw new Error('WhatsApp API did not return a message ID.');
      return { messageId, status: 'sent' };
    } catch {
      throw new Error('WhatsApp provider rejected or failed to deliver the message.');
    }
  }

  /**
   * Send Digital Prescription PDF Link via WhatsApp
   */
  public async sendPrescription(params: {
    recipientPhone: string;
    petName: string;
    doctorName: string;
    prescriptionId: string;
    pdfDownloadURL: string;
  }): Promise<void> {
    void params;
    throw new Error('Prescription WhatsApp delivery is not implemented.');
  }

  /**
   * Send Vaccination Due Reminder
   */
  public async sendVaccinationReminder(params: {
    recipientPhone: string;
    petName: string;
    vaccineName: string;
    dueDate: string;
  }): Promise<void> {
    void params;
    throw new Error('Vaccination reminder WhatsApp delivery is not implemented.');
  }
}

export const whatsapp = WhatsAppService.getInstance();
