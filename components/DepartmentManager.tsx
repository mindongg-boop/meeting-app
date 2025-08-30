import React, { useState } from 'react';

interface DepartmentManagerProps {
  departments: string[];
  onAdd: (department: string) => void;
  onDelete: (department: string) => void;
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({ departments, onAdd, onDelete }) => {
  const [newDepartment, setNewDepartment] = useState('');

  const handleAddClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDepartment.trim()) {
      onAdd(newDepartment.trim());
      setNewDepartment('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">부서 관리</h3>
      <form onSubmit={handleAddClick} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
          placeholder="새 부서 이름"
          className="flex-grow px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
        >
          추가
        </button>
      </form>
      <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {departments.map(dep => (
          <li key={dep} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg hover:bg-slate-100">
            <span className="text-slate-800">{dep}</span>
            <button
              type="button"
              onClick={() => onDelete(dep)}
              className="text-rose-500 hover:text-rose-700 p-1 rounded-full hover:bg-rose-100 transition-colors"
              aria-label={`Delete ${dep}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DepartmentManager;