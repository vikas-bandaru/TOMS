import React from 'react';
import { MeetingRecord, TrainingSession } from '../types';
import { AlertTriangle, TrendingUp, DollarSign, Lock, UserX, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  meetings: MeetingRecord[];
  sessions: TrainingSession[];
}

const DashboardDirector: React.FC<Props> = ({ meetings, sessions }) => {
  const urgentMeetings = meetings.filter(m => m.isUrgent);
  const verifiedCount = sessions.filter(s => s.status === 'VERIFIED').length;
  const projectedPayout = verifiedCount * 1500; // Mock rate

  // Behavioral Analysis: Trainer Lateness
  const trainerLatenessStats = sessions.reduce<Record<string, number>>((acc, session) => {
    if (session.isLate && session.trainerName) {
        const name = session.trainerName;
        if (!acc[name]) {
            acc[name] = 0;
        }
        acc[name]++;
    }
    return acc;
  }, {});

  const repeatOffenders = Object.entries(trainerLatenessStats)
    .filter(([_, count]) => (count as number) > 0) // Show anyone late for now, real app might verify count > 1
    .map(([name, count]) => ({ name, count: count as number }));

  // Analysis: Topic Coverage Gaps
  const topicGaps = sessions.filter(s => s.status === 'VERIFIED' && s.topicCovered === false);

  const data = [
    { name: 'CSE', fi: 75, ei: 60 },
    { name: 'ECE', fi: 65, ei: 55 },
    { name: 'IT', fi: 80, ei: 70 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
            label="Verified Hours" 
            value={verifiedCount} 
            icon={TrendingUp} 
            color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
            label="Projected Payout" 
            value={`₹${projectedPayout.toLocaleString()}`} 
            icon={DollarSign} 
            color="bg-green-50 text-green-600" 
        />
        <StatCard 
            label="Shadow Alerts" 
            value={urgentMeetings.length} 
            icon={AlertTriangle} 
            color="bg-red-50 text-red-600" 
        />
         <StatCard 
            label="Sentinel Active" 
            value="ON" 
            icon={Lock} 
            color="bg-indigo-50 text-indigo-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Normalized Performance (FI vs EI)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="fi" fill="#4f46e5" name="Foundation Index" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="ei" fill="#06b6d4" name="Efficiency Index" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Behavioral Anomalies */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserX className="w-5 h-5 text-orange-500" /> Behavioral Anomalies (Zero-Trust Logic)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <h4 className="font-bold text-orange-800 text-sm mb-2">Repeated Lateness ({'>'}5 mins)</h4>
                        {repeatOffenders.length === 0 ? (
                            <p className="text-sm text-orange-400">No repeated lateness detected.</p>
                        ) : (
                            <ul className="space-y-2">
                                {repeatOffenders.map((offender, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-sm">
                                        <span className="font-medium text-slate-700">{offender.name}</span>
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                            {offender.count} incidents
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-bold text-slate-800 text-sm mb-2">Topic Coverage Gaps</h4>
                         {topicGaps.length === 0 ? (
                            <p className="text-sm text-slate-400">All verified topics marked as covered.</p>
                        ) : (
                            <ul className="space-y-2">
                                {topicGaps.map(g => (
                                    <li key={g.id} className="text-sm text-red-600 bg-white p-2 rounded border border-red-100">
                                        Trainer <b>{g.trainerName}</b> failed to cover topic in {g.batch}.
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                 </div>
            </div>
        </div>

        {/* Shadow Alerts Feed */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" /> Shadow Alerts
             </h3>
             <div className="space-y-3">
                {urgentMeetings.length === 0 ? (
                    <p className="text-slate-400 text-sm">No critical alerts detected.</p>
                ) : (
                    urgentMeetings.map(m => (
                        <div key={m.id} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm">
                            <p className="font-bold text-red-800">{m.title}</p>
                            <p className="text-red-600 mt-1">{m.summary.substring(0, 80)}...</p>
                            <div className="mt-2 flex gap-2">
                                {m.decisions.slice(0, 2).map((d, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white text-xs rounded border border-red-100">{d}</span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-slate-500 text-sm">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export default DashboardDirector;