import api from "./api";

export type SupportRequestInput = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  category:
    | "ACCOUNT"
    | "PAYMENT"
    | "SUBSCRIPTION"
    | "DELIVERY"
    | "STORE"
    | "TECHNICAL"
    | "OTHER";
  subject: string;
  message: string;
};

export type SupportRequestResult = {
  id: number;
  status: "NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  createdAt: string;
};

export const supportService = {
  async create(input: SupportRequestInput): Promise<SupportRequestResult> {
    return (await api.post("/v1/support/requests", input)).data;
  },
};
