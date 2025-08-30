import React, { useMemo } from 'react';
import type { Booking } from '../types';
import { getDepartmentColorClasses } from '../utils/colors';

interface TimeSlotGridProps {
  selectedDate: Date;
  bookings: Booking[];
  onSelectSlot: (startTime: Date) => void;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({ selectedDate, bookings, onSelectSlot }) => {
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(9, 0, 0, 0); 
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(18, 0, 0, 0); 

    let currentSlot = new Date(startOfDay);

    while (currentSlot < endOfDay) {
      slots.push(new Date(currentSlot));
      currentSlot.setMinutes(currentSlot.getMinutes() + 15);
    }
    return slots;
  }, [selectedDate]);
  
  const bookingsWithEffectiveTimes = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const processedBookings = [];
    let lastEffectiveEndTime: Date | null = null;

    for (let i = 0; i < sorted.length; i++) {
        const booking = sorted[i];

        if (booking.isBlockOut) {
            const effectiveStartTime = booking.startTime;
            const effectiveEndTime = booking.endTime;
            if (lastEffectiveEndTime === null || effectiveEndTime.getTime() > lastEffectiveEndTime.getTime()) {
                lastEffectiveEndTime = effectiveEndTime;
            }
            processedBookings.push({
                ...booking,
                effectiveStartTime,
                effectiveEndTime,
            });
            continue;
        }

        const duration = booking.endTime.getTime() - booking.startTime.getTime();
        const totalDelay = booking.delayInMinutes || 0;

        let potentialStartTime = booking.startTime;
        if (lastEffectiveEndTime && booking.startTime.getTime() < lastEffectiveEndTime.getTime()) {
            potentialStartTime = new Date(lastEffectiveEndTime);
        }
        
        let potentialEndTime = new Date(potentialStartTime.getTime() + duration + (totalDelay * 60000));

        // Look ahead for conflicts with block-out times
        for (let j = i + 1; j < sorted.length; j++) {
            const futureBooking = sorted[j];
            if (futureBooking.isBlockOut && potentialEndTime.getTime() > futureBooking.startTime.getTime()) {
                // Conflict found, move this booking after the block-out
                potentialStartTime = new Date(futureBooking.endTime);
                potentialEndTime = new Date(potentialStartTime.getTime() + duration + (totalDelay * 60000));
            }
        }
        
        const effectiveStartTime = potentialStartTime;
        const effectiveEndTime = potentialEndTime;
        
        lastEffectiveEndTime = effectiveEndTime;

        processedBookings.push({
            ...booking,
            effectiveStartTime,
            effectiveEndTime,
        });
    }

    return processedBookings;
  }, [bookings]);

  const getBookingForSlot = (slot: Date): (Booking & { effectiveStartTime: Date, effectiveEndTime: Date }) | undefined => {
    return bookingsWithEffectiveTimes.find(booking => 
      slot.getTime() >= booking.effectiveStartTime.getTime() && slot.getTime() < booking.effectiveEndTime.getTime()
    );
  };
  
  const isSlotInPast = (slot: Date): boolean => {
    const now = new Date();
    // Allow a 5-minute grace period for booking
    return slot.getTime() < now.getTime() - 5 * 60 * 1000;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Available Slots for {selectedDate.toLocaleDateString()}</h3>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {timeSlots.map(slot => {
          const bookingInfo = getBookingForSlot(slot);
          const past = isSlotInPast(slot);
          const disabled = !!bookingInfo || past;

          let buttonClass = 'bg-indigo-50 text-indigo-700 hover:bg-indigo-500 hover:text-white hover:scale-105';
          if(bookingInfo) {
            if (bookingInfo.isBlockOut) {
                buttonClass = 'bg-slate-300 text-slate-600 cursor-not-allowed line-through';
            } else if (bookingInfo.status === 'in-progress') {
                buttonClass = 'bg-emerald-200 text-emerald-800 cursor-not-allowed animate-pulse';
            } else {
                const { bg, text } = getDepartmentColorClasses(bookingInfo.department);
                buttonClass = `${bg} ${text} cursor-not-allowed`;
                if (bookingInfo.status === 'completed') {
                    buttonClass += ' opacity-60 line-through';
                }
            }
          } else if (past) {
            buttonClass = 'bg-slate-200 text-slate-500 cursor-not-allowed';
          }

          return (
            <button
              key={slot.toISOString()}
              onClick={() => !disabled && onSelectSlot(slot)}
              disabled={disabled}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${buttonClass}`}
            >
              {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotGrid;