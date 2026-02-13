
import React from 'react';
import { TrainingSession, MeetingRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { School, FileText, Award } from 'lucide-react';

interface Props {
  sessions: TrainingSession[];
  meetings: MeetingRecord[];
}

const DashboardDean: React.FC<Props> = ({ sessions, meetings }) => {
  // Mock Aggregate Data
  const deptPerformance = [
    { name: 'CSE', attendance: 85, avgScore: 72 },
    { name: 'ECE', attendance: 78, avgScore: 68 },
    { name: 'IT', attendance: 88, avgScore: 75 },
    { name: 'EEE', attendance: 70, avgScore: 65 },
    { name: 'MECH', attendance: 65, avgScore: 60 },
  ];

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <School className="w-6 h-6 text-indigo-800" /> Dean's Console (SoE)
            </h2>
            <p className="text-slate-500 text-sm">Consolidated Reports & Governance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">Department-wise Performance</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptPerformance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="attendance" fill="#4f46e5" name="Attendance %" />
                            <Bar dataKey="avgScore" fill="#06b6d4" name="Avg Assessment Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Circulars & MoUs */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" /> Recent Meeting Decisions
                    </h3>
                    <ul className="space-y-3">
                        {meetings.slice(0, 3).map(m => (
                            <li key={m.id} className="text-sm border-l-2 border-indigo-500 pl-3">
                                <span className="font-bold block text-slate-800">{m.date} - {m.title}</span>
                                <span className="text-slate-600">{m.decisions[0]}</span>
                            </li>
                        ))}
                         {meetings.length === 0 && <li className="text-slate-400 text-sm italic">No recent meetings recorded.</li>}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-orange-500" /> Action Required (Feedback)
                    </h3>
                    <div className="space-y-2">
                         <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                            <strong>CSE-C:</strong> Low feedback score (2.1/5) for "Data Structures" (Vendor: Instacks).
                         </div>
                         <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-100">
                            <strong>ECE-A:</strong> Lab Hardware complaints reported by Lab Assistant.
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardDean;
