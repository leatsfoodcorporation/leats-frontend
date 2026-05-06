import axios from "@/lib/axios";

export interface OrderScheduleSettings {
  id?: string;
  liveOrderEnabled: boolean;
  liveOrderStartTime: string;
  liveOrderEndTime: string;
  liveOrderLabel: string;
  preOrderEnabled: boolean;
  preOrderStartTime: string;
  preOrderEndTime: string;
  preOrderLabel: string;
  countdownEnabled: boolean;
  deliverySlots?: string[];
  schedulingEnabled?: boolean;
  windowStatus?: {
    activeWindow: "LIVE" | "PRE_ORDER" | "CLOSED";
    nextWindowLabel: string;
    nextWindowTime: string;
    currentTime: string;
  };
}

// Admin — fetch full settings
export const getOrderSchedule = async (): Promise<OrderScheduleSettings> => {
  const res = await axios.get("/api/online/order-schedule");
  return res.data.data;
};

// Admin — update settings
export const updateOrderSchedule = async (
  data: Partial<OrderScheduleSettings>
): Promise<OrderScheduleSettings> => {  
  const res = await axios.put("/api/online/order-schedule", data);
  return res.data.data;
};

// Public — no auth needed
export const getPublicOrderSchedule = async (): Promise<OrderScheduleSettings> => {
  const res = await axios.get("/api/online/order-schedule/active");
  return res.data.data;
};
