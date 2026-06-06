export interface PaystackWebhookPayload {
  event: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number; // in kobo
    currency: string;
    channel: string;
    paid_at: string;
    created_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    metadata?: {
      orderId?: string;
      custom_fields?: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
    };
    authorization?: {
      authorization_code: string;
      card_type: string;
      last4: string;
      bank: string;
      channel: string;
    };
  };
}
