import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  id: number;
  status: string; // 'success' | 'failed' | 'abandoned'
  reference: string;
  amount: number; // in kobo
  currency: string;
  channel: string;
  paid_at: string;
  customer: {
    email: string;
  };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('paystack.secretKey');
    this.baseUrl = this.config.get<string>('paystack.baseUrl') ?? 'https://api.paystack.co';

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // ── Initialize transaction ────────────────────────────────────────
  async initializeTransaction(params: {
    email: string;
    amount: number; // in kobo (NGN × 100)
    reference: string;
    orderId: string;
    callbackUrl?: string;
  }): Promise<PaystackInitResponse> {
    try {
      const { data } = await this.http.post<{
        status: boolean;
        message: string;
        data: PaystackInitResponse;
      }>('/transaction/initialize', {
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callback_url: params.callbackUrl ?? this.config.get<string>('paystack.callbackUrl'),
        metadata: {
          orderId: params.orderId,
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: params.orderId,
            },
          ],
        },
      });

      if (!data.status) {
        throw new BadRequestException(`Paystack initialization failed: ${data.message}`);
      }

      this.logger.log(`Paystack initialized | ref: ${params.reference} | order: ${params.orderId}`);

      return data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        this.logger.error(`Paystack API error: ${message}`);
        throw new BadRequestException(`Payment initiation failed: ${message}`);
      }
      throw err;
    }
  }

  // ── Verify transaction ────────────────────────────────────────────
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const { data } = await this.http.get<{
        status: boolean;
        message: string;
        data: PaystackVerifyResponse;
      }>(`/transaction/verify/${reference}`);

      if (!data.status) {
        throw new BadRequestException(`Paystack verification failed: ${data.message}`);
      }

      return data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message ?? err.message;
        this.logger.error(`Paystack verify error: ${message}`);
        throw new BadRequestException(`Payment verification failed: ${message}`);
      }
      throw err;
    }
  }

  // ── Validate webhook signature ────────────────────────────────────
  validateWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto') as typeof import('crypto');
    const secret = this.config.get<string>('paystack.webhookSecret') ?? '';
    const hash = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    return hash === signature;
  }

  // ── Create transfer recipient ─────────────────────────────────────
  async createTransferRecipient(params: {
    accountName: string;
    accountNumber: string;
    bankCode: string;
    currency?: string;
  }): Promise<{
    recipient_code: string;
    id: number;
    details: { bank_name: string };
  }> {
    try {
      const { data } = await this.http.post<{
        status: boolean;
        message: string;
        data: {
          recipient_code: string;
          id: number;
          details: { bank_name: string };
        };
      }>('/transferrecipient', {
        type: 'nuban',
        name: params.accountName,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: params.currency ?? 'NGN',
      });

      if (!data.status) {
        throw new BadRequestException(`Failed to create transfer recipient: ${data.message}`);
      }

      return data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new BadRequestException(
          `Transfer recipient creation failed: ${err.response?.data?.message ?? err.message}`,
        );
      }
      throw err;
    }
  }

  // ── Initiate transfer ─────────────────────────────────────────────
  async initiateTransfer(params: {
    amount: number; // in kobo
    recipient: string; // recipient_code
    reference: string;
    reason?: string;
  }): Promise<{
    transfer_code: string;
    id: number;
    status: string;
  }> {
    // ── TEST MODE BYPASS ─────────────────────────────────────────
    // Remove this block once Paystack account is verified
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`TEST MODE: Simulating transfer for ref ${params.reference}`);
      return {
        transfer_code: `TRF_test_${Date.now()}`,
        id: Math.floor(Math.random() * 999999),
        status: 'pending',
      };
    }
    // ───────────────────────────────────────────────────────────
    try {
      const { data } = await this.http.post<{
        status: boolean;
        message: string;
        data: { transfer_code: string; id: number; status: string };
      }>('/transfer', {
        source: 'balance',
        amount: params.amount,
        recipient: params.recipient,
        reference: params.reference,
        reason: params.reason ?? 'EaseWaybill seller payout',
      });

      if (!data.status) {
        throw new BadRequestException(`Transfer initiation failed: ${data.message}`);
      }

      return data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        throw new BadRequestException(
          `Transfer failed: ${err.response?.data?.message ?? err.message}`,
        );
      }
      throw err;
    }
  }
}
