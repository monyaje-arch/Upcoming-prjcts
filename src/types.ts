export type BookingType = 'ride' | 'delivery' | 'lifting' | 'queue';

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  pickup: string;
  destination: string;
  vehicleType?: 'bike' | 'auto' | 'cab';
  itemType?: string;
  weight?: string;
  durationHours?: number;
  specificTask?: string;
  price: number;
  createdAt: string;
  driverId?: string;
  driverName?: string;
  progress: number; // 0 to 100 for tracking simulation
  offline?: boolean;
}

export interface DriverStats {
  totalEarnings: number;
  completedJobs: number;
  hoursOnline: number;
  rating: number;
  recentJobs: Booking[];
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'fill_form';
    data: Partial<Booking>;
  };
}
