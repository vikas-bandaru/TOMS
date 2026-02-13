
import React, { useState } from 'react';
import { TrainingSession } from '../types';
import { LayoutGrid, AlertTriangle, Users, MessageCircle } from 'lucide-react';

interface Props {
  sessions: TrainingSession[];
}

const DashboardCoordinator: React.FC<Props> = ({ sessions }) => {
  const [selectedDept, setSelectedDept] = useState('CSE');
  
  // Filter logic: Check if batch string contains Dept name (e.g. "CSE-A")
  const deptSessions = sessions.filter(s => s.batch.includes(selectedDept));
  
  // Mock Metrics
  const attendance = 88;
  const missingTrainers = deptSessions.filter(s => s.status === 'CANCELLED' || (!s.trainerName && s.status === 'SCHEDULED'));

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="w-6 h-6 text-indigo-600" /> Department Coordinator View
                </h2>
                <p className="text-slate-500 text-sm">Monitoring & Communication Console</p>
            </div>
            <select 
                value={selectedDept} 
                onChange={e => setSelectedDept(e.target.value)}
                className="bg-slate-100 border-none rounded-lg px-4 py-2 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
            </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Avg Attendance</p>
                    <p className="text-2xl font-bold text-slate-800">{attendance}%</p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${missingTrainers.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Issues Today</p>
                    <p className="text-2xl font-bold text-slate-800">{missingTrainers.length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:bg-slate-50">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                    <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">T&P Messages</p>
                    <p className="text-sm font-bold text-slate-800">2 Unread Circulars</p>
                </div>
            </div>
        </div>

        {/* Dept Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-slate-700">
                Today's Schedule ({selectedDept})
            </div>
            <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-xs text-slate-500 uppercase">
                    <tr>
                        <th className="px-6 py-3">Time</th>
                        <th className="px-6 py-3">Batch</th>
                        <th className="px-6 py-3">Venue</th>
                        <th className="px-6 py-3">Trainer</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {deptSessions.length === 0 ? (
                         <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-400">No classes scheduled for {selectedDept} today.</td></tr>
                    ) : (
                        deptSessions.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-slate-600">{s.startTime} - {s.endTime}</td>
                                <td className="px-6 py-4 font-bold">{s.batch}</td>
                                <td className="px-6 py-4">{s.venue}</td>
                                <td className={`px-6 py-4 ${!s.trainerName ? 'text-red-500 font-bold' : ''}`}>
                                    {s.trainerName || 'MISSING TRAINER'}
                                </td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        s.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 
                                        s.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {s.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default DashboardCoordinator;
