import { useEffect, useRef } from 'react';
import type { Booking } from '../types';

export const useNotificationScheduler = (bookings: Booking[]) => {
  // FIX: The return type of `setTimeout` can be `NodeJS.Timeout` which is not a `number`.
  // Using `ReturnType<typeof setTimeout>` ensures the correct type for the timeout ID.
  const scheduledNotifications = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    scheduledNotifications.current.forEach(clearTimeout);
    scheduledNotifications.current = [];

    bookings.forEach(booking => {
      const notificationTime = new Date(booking.startTime.getTime() - 10 * 60 * 1000);
      const now = new Date();

      if (notificationTime > now) {
        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        
        const timeoutId = setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('Meeting Reminder', {
              body: `${booking.userName}님의 회의 "${booking.title}"가 10분 뒤 ${booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}에 시작됩니다.`,
              icon: 'https://img.icons8.com/fluency/48/000000/calendar-alarm.png',
            });
          }
        }, timeUntilNotification);
        
        scheduledNotifications.current.push(timeoutId);
      }
    });

    return () => {
      scheduledNotifications.current.forEach(clearTimeout);
    };
  }, [bookings]);
};
