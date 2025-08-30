import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import BookingStatus to use as an explicit type.
import type { Booking, BookingStatus } from './types';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import Header from './components/Header';
import TimeSlotGrid from './components/TimeSlotGrid';
import BookingModal from './components/BookingModal';
import MyBookings from './components/MyBookings';
import DepartmentManager from './components/DepartmentManager';
import PasswordModal from './components/PasswordModal';

const getInitialBookings = (): Booking[] => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const booking1Time = new Date(today);
    if (today.getHours() < 10) {
      booking1Time.setHours(10, 30, 0, 0);
    } else {
      booking1Time.setDate(booking1Time.getDate() + 1);
      booking1Time.setHours(10, 30, 0, 0);
    }
    
    const booking2Time = new Date(today);
    booking2Time.setHours(booking1Time.getHours() + 1, 0, 0, 0);

    return [
        {
            id: '1',
            title: '주간 팀 싱크업',
            startTime: booking1Time,
            endTime: new Date(booking1Time.getTime() + 30 * 60000),
            userName: 'Alice',
            userContact: '123-456-7890',
            department: '엔지니어링',
            status: 'scheduled',
            isExternal: false,
            delayInMinutes: 0,
        },
        {
            id: '2',
            title: '신규 프로젝트 디자인 리뷰',
            startTime: booking2Time,
            endTime: new Date(booking2Time.getTime() + 60 * 60000),
            userName: 'Bob',
            userContact: '098-765-4321',
            department: '디자인',
            memo: 'Conference Room 5',
            status: 'scheduled',
            isExternal: true,
            isUrgent: true,
            requests: '프로젝터를 준비해주세요.',
            delayInMinutes: 0,
        },
    ];
};

const initialDepartments = [
  '엔지니어링',
  '마케팅',
  '영업',
  '인사',
  '디자인',
  '재무',
  '운영',
  '고객 지원',
];

// Helper to format a local date into YYYY-MM-DD string to avoid timezone issues with input[type=date]
const localDateToYMD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ADMIN_PASSWORD = 'admin123'; // Hardcoded admin password for simplicity

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(getInitialBookings());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [departments, setDepartments] = useState<string[]>(initialDepartments);
  
  useNotificationScheduler(bookings);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setBookings(prevBookings =>
        prevBookings.map(booking => {
          if (booking.isBlockOut || booking.status === 'completed' || booking.status === 'cancelled') {
            return booking;
          }
          
          let newStatus: BookingStatus = booking.status;
          if (now >= booking.startTime && now < booking.endTime) {
            newStatus = 'in-progress';
          } else if (now >= booking.endTime) {
            newStatus = 'completed';
          } else if (now < booking.startTime && booking.status === 'in-progress'){
            newStatus = 'scheduled';
          }

          if (newStatus !== booking.status) {
            return { ...booking, status: newStatus };
          }
          return booking;
        })
      );
    }, 5000); // Update status every 5 seconds

    return () => clearInterval(interval);
  }, []);


  const handleSelectSlot = (startTime: Date) => {
    setModalMode('create');
    setSelectedSlot(startTime);
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBookingClick = (booking: Booking) => {
    setModalMode('edit');
    setEditingBooking(booking);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setEditingBooking(null);
  };

  const handleBookingSubmit = (details: Partial<Booking>) => {
    const startTime = modalMode === 'create' ? selectedSlot : editingBooking?.startTime;
    const endTime = details.endTime;
    
    if (!startTime || !endTime) return;

    // Check for overlaps
    const isOverlap = bookings.some(b => {
      if (modalMode === 'edit' && b.id === editingBooking?.id) {
        return false;
      }
      return startTime.getTime() < b.endTime.getTime() && endTime.getTime() > b.startTime.getTime();
    });

    if (isOverlap) {
      alert('선택하신 시간대에 이미 다른 예약이 있습니다. 시간이나 예약 길이를 조정해주세요.');
      return;
    }

    if (modalMode === 'create') {
        const newBooking: Booking = {
          id: crypto.randomUUID(),
          status: 'scheduled',
          userName: '', 
          userContact: '',
          department: '',
          delayInMinutes: 0,
          ...details,
          startTime,
          endTime,
        } as Booking;
        setBookings(prev => [...prev, newBooking].sort((a,b) => a.startTime.getTime() - b.startTime.getTime()));
    } else if (modalMode === 'edit' && editingBooking) {
        setBookings(prev => prev.map(b => b.id === editingBooking.id ? {...b, ...details} : b));
    }
    handleCloseModal();
  };
  
  const handleCancelBooking = (bookingId: string) => {
      setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
  }
  
  const handleDelayMeeting = useCallback((bookingId: string, minutes: number) => {
    setBookings(currentBookings => {
      return currentBookings.map(b => {
        if (b.id === bookingId) {
          const currentDelay = b.delayInMinutes || 0;
          const newDelay = currentDelay + minutes;
          return {
            ...b,
            delayInMinutes: newDelay,
            memo: (b.memo ? b.memo + '\n' : '') + `관리자가 ${minutes}분 지연을 추가했습니다. (총 ${newDelay}분 지연)`
          };
        }
        return b;
      });
    });
  }, []);

  const handleResetDelay = useCallback((bookingId: string) => {
    setBookings(currentBookings => {
      return currentBookings.map(b => {
        if (b.id === bookingId) {
          const oldDelay = b.delayInMinutes || 0;
          if (oldDelay === 0) return b;
          return {
            ...b,
            delayInMinutes: 0,
            memo: (b.memo ? b.memo + '\n' : '') + `관리자가 지연(${oldDelay}분)을 초기화했습니다.`
          };
        }
        return b;
      });
    });
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date();
    newDate.setFullYear(year, month - 1, day);
    newDate.setHours(0, 0, 0, 0);
    setSelectedDate(newDate);
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else {
      alert('암호가 올바르지 않습니다.');
    }
    setIsPasswordModalOpen(false);
  };

  const handleAddDepartment = (department: string) => {
    if (department.trim() && !departments.includes(department.trim())) {
      setDepartments(prev => [...prev, department.trim()]);
    }
  };

  const handleDeleteDepartment = (departmentToDelete: string) => {
    setDepartments(prev => prev.filter(dep => dep !== departmentToDelete));
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center">
                    <label htmlFor="date-picker" className="text-lg font-medium text-slate-700 mr-4">날짜 선택</label>
                    <input
                        id="date-picker"
                        type="date"
                        value={localDateToYMD(selectedDate)}
                        onChange={handleDateChange}
                        className="border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        min={localDateToYMD(new Date())}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <label htmlFor="admin-toggle" className="text-sm font-medium text-slate-900">Admin Mode</label>
                    <button
                        role="switch"
                        aria-checked={isAdmin}
                        onClick={handleAdminToggle}
                        className={`${isAdmin ? 'bg-indigo-600' : 'bg-slate-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        id="admin-toggle"
                    >
                        <span className={`${isAdmin ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out`} />
                    </button>
                </div>
            </div>
            <TimeSlotGrid
              selectedDate={selectedDate}
              bookings={bookings}
              onSelectSlot={handleSelectSlot}
            />
            {isAdmin && (
              <DepartmentManager
                departments={departments}
                onAdd={handleAddDepartment}
                onDelete={handleDeleteDepartment}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <MyBookings 
              bookings={bookings.filter(b => 
                b.startTime.getFullYear() === selectedDate.getFullYear() &&
                b.startTime.getMonth() === selectedDate.getMonth() &&
                b.startTime.getDate() === selectedDate.getDate()
              )} 
              onCancelBooking={handleCancelBooking}
              onEditBooking={handleEditBookingClick}
              onDelayBooking={handleDelayMeeting}
              onResetDelay={handleResetDelay}
              isAdmin={isAdmin}
            />
          </div>

        </div>
      </main>
      <BookingModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={editingBooking}
        onClose={handleCloseModal}
        onSubmit={handleBookingSubmit}
        startTime={modalMode === 'create' ? selectedSlot : editingBooking?.startTime}
        isAdmin={isAdmin}
        departments={departments}
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
};

export default App;