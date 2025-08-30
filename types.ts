export type BookingStatus = 'scheduled' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';

export interface Booking {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  userName: string;
  userContact: string;
  department: string;
  memo?: string;
  status: BookingStatus;
  isExternal?: boolean;
  isBlockOut?: boolean;
  isUrgent?: boolean;
  requests?: string;
  delayInMinutes?: number;
}