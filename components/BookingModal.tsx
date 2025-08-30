import React, { useState, useEffect } from 'react';
import type { Booking } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Booking | null;
  onClose: () => void;
  onSubmit: (details: Partial<Booking>) => void;
  startTime?: Date | null;
  isAdmin: boolean;
  departments: string[];
}

const durationOptions = [
    { value: 15, label: '15분' },
    { value: 30, label: '30분' },
    { value: 45, label: '45분' },
    { value: 60, label: '1시간' },
    { value: 75, label: '1시간 15분' },
    { value: 90, label: '1시간 30분' },
    { value: 105, label: '1시간 45분' },
    { value: 120, label: '2시간' },
];

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, mode, initialData, onClose, onSubmit, startTime, isAdmin, departments }) => {
  const [title, setTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [userContact, setUserContact] = useState('');
  const [department, setDepartment] = useState(departments[0] || '');
  const [memo, setMemo] = useState('');
  const [requests, setRequests] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [duration, setDuration] = useState(30);
  const [creationMode, setCreationMode] = useState<'meeting' | 'block'>('meeting');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title);
        setUserName(initialData.userName);
        setUserContact(initialData.userContact);
        setDepartment(departments.includes(initialData.department) ? initialData.department : (departments[0] || ''));
        setMemo(initialData.memo || '');
        setRequests(initialData.requests || '');
        setIsExternal(initialData.isExternal || false);
        setIsUrgent(initialData.isUrgent || false);
        const initialDuration = (initialData.endTime.getTime() - initialData.startTime.getTime()) / 60000;
        setDuration(durationOptions.some(o => o.value === initialDuration) ? initialDuration : 30);
        setCreationMode(initialData.isBlockOut ? 'block' : 'meeting');
      } else {
        setTitle('');
        setUserName('');
        setUserContact('');
        setDepartment(departments[0] || '');
        setMemo('');
        setRequests('');
        setIsExternal(false);
        setIsUrgent(false);
        setDuration(30);
        setCreationMode('meeting');
      }
    }
  }, [isOpen, mode, initialData, departments]);

  if (!isOpen) return null;

  const bookingTime = mode === 'create' ? startTime : initialData?.startTime;
  if (!bookingTime) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const endTime = new Date(bookingTime.getTime() + duration * 60000);
    if (creationMode === 'block') {
        if(title.trim()){
            onSubmit({ title, isBlockOut: true, userName: 'Admin', department: 'System', userContact: '', endTime });
        }
    } else {
        if (title.trim() && userName.trim() && userContact.trim() && department) {
            onSubmit({ title, userName, userContact, department, memo, requests, isExternal, isUrgent, endTime });
        }
    }
  };

  const endTime = new Date(bookingTime.getTime() + duration * 60000);
  const isCreating = mode === 'create';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 ease-in-out scale-95 animate-fade-in-up my-auto">
        <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{isCreating ? (creationMode === 'meeting' ? '회의 예약' : '시간 차단') : '예약 수정'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <p className="text-slate-600 mb-6">
          시간: <span className="font-semibold text-indigo-600">{bookingTime.toLocaleDateString()}</span> <span className="font-semibold text-indigo-600">{bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> 부터 <span className="font-semibold text-indigo-600">{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> 까지
        </p>
        
        {isCreating && isAdmin && (
            <div className="mb-4 flex justify-center p-1 bg-slate-200 rounded-lg">
                <button onClick={() => setCreationMode('meeting')} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-all ${creationMode === 'meeting' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'}`}>회의 예약</button>
                <button onClick={() => setCreationMode('block')} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-all ${creationMode === 'block' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'}`}>시간 차단</button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {creationMode === 'meeting' ? (
            <>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">회의 제목</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-slate-700">이름</label>
                  <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                </div>
                <div>
                  <label htmlFor="userContact" className="block text-sm font-medium text-slate-700">연락처 (알림용)</label>
                  <input type="text" id="userContact" value={userContact} onChange={(e) => setUserContact(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="For reminders" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-700">부서</label>
                  <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                    {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-700">회의 시간</label>
                    <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                 <div className="flex items-center">
                    <input id="isExternal" type="checkbox" checked={isExternal} onChange={(e) => setIsExternal(e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="isExternal" className="ml-2 block text-sm text-slate-900">외부 손님</label>
                 </div>
                 <div className="flex items-center">
                    <input id="isUrgent" type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="h-4 w-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500" />
                    <label htmlFor="isUrgent" className="ml-2 block text-sm text-slate-900">긴급</label>
                 </div>
              </div>
              <div>
                  <label htmlFor="requests" className="block text-sm font-medium text-slate-700">요청사항 (선택)</label>
                  <textarea id="requests" value={requests} onChange={(e) => setRequests(e.target.value)} rows={2} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 빔 프로젝터 사용 필요"></textarea>
              </div>
              {isAdmin && !isCreating && (
                <div>
                  <label htmlFor="memo" className="block text-sm font-medium text-slate-700">관리자 메모 (선택)</label>
                  <textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 회의가 15분 지연되었습니다."></textarea>
                </div>
              )}
            </>
          ) : (
             <>
                <div>
                    <label htmlFor="block_title" className="block text-sm font-medium text-slate-700">차단 사유</label>
                    <input type="text" id="block_title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="예: 외부 출장, 내부 공사" required />
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-slate-700">차단 시간</label>
                    <select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
             </>
          )}
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors">취소</button>
            <button type="submit" className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors">{isCreating ? '예약 확정' : '변경 저장'}</button>
          </div>
        </form>
      </div>
      <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }`}</style>
    </div>
  );
};

export default BookingModal;