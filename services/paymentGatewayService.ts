import axiosInstance from "@/lib/axios";

export interface PaymentGateway {
  id: string;
  name: string;
  isActive: boolean;
  hasApiKey: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  apiKey?: string;
}

export interface PaymentGatewayConfig {
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  isActive?: boolean;
}

class PaymentGatewayService {
  private baseUrl = "/api/payment-gateway";

  async getGateways(): Promise<PaymentGateway[]> {
    const response = await axiosInstance.get(this.baseUrl);
    return response.data.data;
  }

  async updateGateway(
    gatewayName: string,
    config: PaymentGatewayConfig
  ): Promise<void> {
    await axiosInstance.put(`${this.baseUrl}/${gatewayName}`, config);
  }

  async toggleGateway(gatewayName: string, isActive: boolean): Promise<void> {
    await axiosInstance.put(`${this.baseUrl}/${gatewayName}/toggle`, {
      isActive,
    });
  }
}

export const paymentGatewayService = new PaymentGatewayService();
