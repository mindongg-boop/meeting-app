import React, { useMemo } from 'react';
import type { Booking, BookingStatus } from '../types';
import StatusBadge from './StatusBadge';
import { getDepartmentColorClasses } from '../utils/colors';

interface MyBookingsProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => void;
  onEditBooking: (booking: Booking) => void;
  onDelayBooking: (bookingId: string, minutes: number) => void;
  onResetDelay: (bookingId: string) => void;
  isAdmin: boolean;
}

const MyBookings: React.FC<MyBookingsProps> = ({ bookings, onCancelBooking, onEditBooking, onDelayBooking, onResetDelay, isAdmin }) => {

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
                isCascadingDelayed: false,
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

        const isCascadingDelayed = effectiveStartTime.getTime() > booking.startTime.getTime();

        processedBookings.push({
            ...booking,
            effectiveStartTime,
            effectiveEndTime,
            isCascadingDelayed,
        });
    }

    return processedBookings.sort((a, b) => a.effectiveStartTime.getTime() - b.effectiveStartTime.getTime());
  }, [bookings]);


  const getStatusBorder = (booking: Booking): string => {
    if (booking.isBlockOut) return 'border-slate-400';

    switch(booking.status) {
        case 'in-progress': return 'border-emerald-500';
        case 'delayed': return 'border-amber-500';
        case 'completed': return 'border-slate-300';
        case 'scheduled':
        default:
            return getDepartmentColorClasses(booking.department).border;
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Today's Schedule</h3>
      {bookingsWithEffectiveTimes.length > 0 ? (
        <ul className="space-y-4">
          {bookingsWithEffectiveTimes.map(booking => {
            const isCompleted = booking.status === 'completed';
            return (
            <li key={booking.id} className={`p-4 rounded-lg border-l-4 transition-shadow hover:shadow-md ${getStatusBorder(booking)} ${isCompleted ? 'bg-slate-50' : 'bg-white'}`}>
              
              {booking.isBlockOut ? (
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <div>
                        <p className="font-semibold text-slate-600 line-through">{booking.title}</p>
                        <p className="text-sm text-slate-500">
                            {booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className={`flex-grow ${isCompleted ? 'text-slate-500' : ''}`}>
                      <div className="flex items-center mb-1">
                        {booking.isUrgent && <span title="긴급 회의" className="mr-2 text-lg">🔥</span>}
                        {booking.isExternal && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        <p className={`font-semibold ${isCompleted ? 'line-through' : 'text-slate-900'}`}>{booking.title}</p>
                      </div>

                      <p className="text-sm">
                        예약자: <span className="font-medium">{booking.userName} ({booking.department})</span>
                      </p>
                      <p className="text-sm">
                        예약 시간: {booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {(booking.delayInMinutes || booking.isCascadingDelayed) && (
                        <p className="text-sm text-rose-600 font-semibold">
                          실제 시간: {booking.effectiveStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.effectiveEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                        <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  {booking.isCascadingDelayed && (
                     <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 text-amber-800 text-sm rounded-r-lg">
                        <p><span className="font-semibold">안내:</span> 이전 회의 지연 또는 시간 차단으로 자동 조정되었습니다.</p>
                    </div>
                  )}
                  
                  {booking.requests && (
                     <div className="mt-2 p-2 bg-indigo-50 border-l-4 border-indigo-300 text-indigo-800 text-sm rounded-r-lg">
                        <p><span className="font-semibold">요청사항:</span> {booking.requests}</p>
                    </div>
                  )}

                  {booking.memo && (
                     <div className="mt-2 p-2 bg-slate-100 border-l-4 border-slate-400 text-slate-800 text-sm rounded-r-lg">
                        <p><span className="font-semibold">Admin Memo:</span> {booking.memo}</p>
                    </div>
                  )}

                  {isAdmin && !isCompleted && (
                    <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                        {(booking.status === 'in-progress' || booking.status === 'scheduled') && 
                            <div className="flex items-center space-x-1">
                               <span className="text-sm font-medium text-slate-700">지연:</span>
                               <button onClick={() => onDelayBooking(booking.id, 15)} className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors">+15분</button>
                               <button onClick={() => onDelayBooking(booking.id, 30)} className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded-md hover:bg-amber-200 transition-colors">+30분</button>
                               {(booking.delayInMinutes || 0) > 0 && (
                                  <button onClick={() => onResetDelay(booking.id)} className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300 transition-colors">초기화</button>
                               )}
                            </div>
                        }
                        <div className="flex space-x-2 flex-shrink-0">
                            <button onClick={() => onEditBooking(booking)} className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors">수정</button>
                            <button onClick={() => onCancelBooking(booking.id)} className="px-3 py-1 text-sm font-medium text-rose-700 bg-rose-100 rounded-md hover:bg-rose-200 transition-colors">취소</button>
                        </div>
                    </div>
                  )}
                </>
              )}
            </li>
          )})}
        </ul>
      ) : (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="mt-2 text-slate-500">오늘 예정된 회의가 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default MyBookings;