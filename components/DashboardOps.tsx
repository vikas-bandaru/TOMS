
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { TrainingSession, MeetingRecord } from '../types';
import MeetingSentinel from './MeetingSentinel';
import SemesterSetup from './SemesterSetup';
import { Calendar, Upload, FileSpreadsheet, Cloud, Loader2, FileIcon, X, Check, AlertTriangle, LayoutDashboard, Trash2, Filter, Edit2, Ban, Save } from 'lucide-react';
import { inferStudentYear, getTimeSlot, checkConflict } from '../services/logicService';

interface Props {
  sessions: TrainingSession[];
  setSessions: React.Dispatch<React.SetStateAction<TrainingSession[]>>;
  addMeetingRecord: (r: MeetingRecord) => void;
  onReset: () => void;
}

const DashboardOps: React.FC<Props> = ({ sessions, setSessions, addMeetingRecord, onReset }) => {
  const [viewMode, setViewMode] = useState<'DAILY' | 'SETUP'>('DAILY');
  
  // -- Edit State --
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ start: string; end: string; topic: string }>({ start: '', end: '', topic: '' });

  // -- Cancel State --
  const [cancelingSessionId, setCancelingSessionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // -- Filters State --
  const [filters, setFilters] = useState({
      venue: '',
      trainer: '',
      year: '',
      status: '',
      batch: '',
      date: ''
  });

  const filteredSessions = useMemo(() => {
      return sessions.filter(s => {
          return (
              (!filters.venue || s.venue.includes(filters.venue)) &&
              (!filters.trainer || s.trainerName.toLowerCase().includes(filters.trainer.toLowerCase())) &&
              (!filters.year || s.year.toString() === filters.year) &&
              (!filters.status || s.status === filters.status) &&
              (!filters.batch || s.batch.includes(filters.batch)) &&
              (!filters.date || s.date === filters.date)
          );
      });
  }, [sessions, filters]);

  // -- Edit Logic --
  const handleEditClick = (s: TrainingSession) => {
      setEditingSessionId(s.id);
      setEditForm({ start: s.startTime, end: s.endTime, topic: s.topic });
  };

  const handleSaveEdit = () => {
      if (!editingSessionId) return;
      setSessions(prev => prev.map(s => 
          s.id === editingSessionId 
            ? { ...s, startTime: editForm.start, endTime: editForm.end, topic: editForm.topic } 
            : s
      ));
      setEditingSessionId(null);
  };

  // -- Cancel Logic --
  const handleCancelClick = (id: string) => {
      setCancelingSessionId(id);
      setCancelReason('');
  };

  const confirmCancel = () => {
      if (!cancelingSessionId || !cancelReason) return;
      setSessions(prev => prev.map(s => 
          s.id === cancelingSessionId 
            ? { ...s, status: 'CANCELLED', cancellationReason: cancelReason } 
            : s
      ));
      setCancelingSessionId(null);
  };

  const handleScheduleGenerated = (newSchedule: TrainingSession[]) => {
      setSessions(prev => [...prev, ...newSchedule]);
      setViewMode('DAILY'); // Automatically switch to view the generated schedule
  };

  return (
    <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <div className="flex gap-4">
                <button 
                    onClick={() => setViewMode('DAILY')} 
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === 'DAILY' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <LayoutDashboard className="w-4 h-4" /> Daily Operations
                </button>
                <button 
                    onClick={() => setViewMode('SETUP')} 
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === 'SETUP' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Calendar className="w-4 h-4" /> Semester Setup
                </button>
            </div>
            
            <button 
                onClick={onReset}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg font-bold flex items-center gap-2 transition-all text-sm"
            >
                <Trash2 className="w-4 h-4" /> Reset Database
            </button>
        </div>

        {viewMode === 'SETUP' && (
             <SemesterSetup onScheduleGenerated={handleScheduleGenerated} />
        )}

        {viewMode === 'DAILY' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MeetingSentinel onPolicyExtracted={(record) => {
                    addMeetingRecord(record);
                    if(record.isUrgent) alert("⚠️ URGENT: Director has been notified of high-priority keywords.");
                }} />
                
                {/* Active Schedule Panel */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-blue-600" /> Active Schedule
                         </h3>
                         <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            Visible: {filteredSessions.length} / {sessions.length}
                         </span>
                     </div>
                     
                     {/* Filters Toolbar */}
                     <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                        <input className="p-2 border rounded" placeholder="Venue..." value={filters.venue} onChange={e => setFilters({...filters, venue: e.target.value})} />
                        <input className="p-2 border rounded" placeholder="Trainer..." value={filters.trainer} onChange={e => setFilters({...filters, trainer: e.target.value})} />
                        <input className="p-2 border rounded" placeholder="Batch..." value={filters.batch} onChange={e => setFilters({...filters, batch: e.target.value})} />
                        <select className="p-2 border rounded" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}>
                            <option value="">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                        <select className="p-2 border rounded" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                            <option value="">All Status</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <input className="p-2 border rounded" type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
                     </div>

                     <div className="flex-1 overflow-y-auto border rounded-lg">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="text-slate-600 text-xs font-bold border-b border-slate-200">
                                    <th className="p-3">Date/Time</th>
                                    <th className="p-3">Batch/Venue</th>
                                    <th className="p-3">Trainer/Topic</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredSessions.map(s => {
                                    const isEditing = editingSessionId === s.id;
                                    const isCanceling = cancelingSessionId === s.id;
                                    
                                    if (isCanceling) {
                                        return (
                                            <tr key={s.id} className="bg-red-50 border-b border-red-100">
                                                <td colSpan={5} className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <input 
                                                            className="flex-1 p-2 border border-red-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-300" 
                                                            placeholder="Reason for cancellation..." 
                                                            value={cancelReason}
                                                            onChange={e => setCancelReason(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button onClick={confirmCancel} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">Confirm Cancel</button>
                                                        <button onClick={() => setCancelingSessionId(null)} className="text-slate-500 text-xs hover:underline">Back</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50 ${s.status === 'CANCELLED' ? 'opacity-50 bg-slate-50' : ''}`}>
                                            <td className="p-3 text-xs whitespace-nowrap">
                                                {isEditing ? (
                                                    <div className="space-y-1">
                                                        <input type="time" className="border rounded p-1 w-full" value={editForm.start} onChange={e => setEditForm({...editForm, start: e.target.value})} />
                                                        <input type="time" className="border rounded p-1 w-full" value={editForm.end} onChange={e => setEditForm({...editForm, end: e.target.value})} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="font-bold text-slate-700">{s.date}</div>
                                                        <div className="text-slate-500 font-mono">{s.startTime} - {s.endTime}</div>
                                                    </>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-bold">{s.batch}</div>
                                                <div className="text-xs text-indigo-600 font-bold">{s.venue}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-slate-800">{s.trainerName}</div>
                                                {isEditing ? (
                                                     <input className="border rounded p-1 w-full text-xs mt-1" value={editForm.topic} onChange={e => setEditForm({...editForm, topic: e.target.value})} />
                                                ) : (
                                                     <div className="text-xs text-slate-500 truncate max-w-[120px]" title={s.topic}>{s.topic}</div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                    s.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 
                                                    s.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                    s.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {s.status}
                                                </span>
                                                {s.status === 'CANCELLED' && <div className="text-[10px] text-red-500 mt-1 italic">{s.cancellationReason}</div>}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={handleSaveEdit} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Save className="w-4 h-4" /></button>
                                                            <button onClick={() => setEditingSessionId(null)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                                        </>
                                                    ) : s.status !== 'CANCELLED' ? (
                                                        <>
                                                            <button onClick={() => handleEditClick(s)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Edit Time/Topic"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleCancelClick(s.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Cancel Class"><Ban className="w-4 h-4" /></button>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default DashboardOps;
