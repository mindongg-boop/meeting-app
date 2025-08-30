import React from 'react';
import type { BookingStatus } from '../types';

interface StatusBadgeProps {
  status: BookingStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<BookingStatus, string> = {
    scheduled: 'bg-indigo-100 text-indigo-800',
    'in-progress': 'bg-emerald-100 text-emerald-800 animate-pulse',
    completed: 'bg-slate-200 text-slate-700',
    delayed: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  const statusText: Record<BookingStatus, string> = {
    scheduled: '예정',
    'in-progress': '진행중',
    completed: '완료',
    delayed: '지연',
    cancelled: '취소',
  };

  return (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || ''}`}>
      {statusText[status] || 'Unknown'}
    </span>
  );
};

export default StatusBadge;