
import React, { useState } from 'react';
import { TrainingSession, SyllabusTopic } from '../types';
import { CheckSquare, Square, TrendingUp, AlertCircle, Book, Calendar, Smile } from 'lucide-react';

interface Props {
  sessions: TrainingSession[];
  isVendor?: boolean;
}

const DashboardTrainer: React.FC<Props> = ({ sessions, isVendor = false }) => {
  // Mock Data
  const [syllabus, setSyllabus] = useState<SyllabusTopic[]>([
    { id: '1', week: 1, topic: 'Introduction to Java Syntax', isCompleted: true, completionDate: '2023-10-01' },
    { id: '2', week: 1, topic: 'Control Flow Statements', isCompleted: true, completionDate: '2023-10-02' },
    { id: '3', week: 2, topic: 'Object Oriented Programming I', isCompleted: false },
    { id: '4', week: 2, topic: 'Inheritance & Polymorphism', isCompleted: false },
  ]);

  const toggleTopic = (id: string) => {
    setSyllabus(prev => prev.map(t => 
        t.id === id ? { ...t, isCompleted: !t.isCompleted, completionDate: !t.isCompleted ? new Date().toISOString().split('T')[0] : undefined } : t
    ));
  };

  const mySessions = sessions.filter(s => s.trainerId === 'T1' || s.trainerName === 'Dr. S. Rao'); // Mock current user filter

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Book className="w-6 h-6 text-emerald-600" /> 
                {isVendor ? 'Vendor Portal' : 'Faculty Trainer Dashboard'}
            </h2>
            <p className="text-slate-500 text-sm">Welcome, Dr. S. Rao. Your EI Score: <span className="text-emerald-600 font-bold">88/100</span></p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule Column */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Upcoming Sessions
                </h3>
                {mySessions.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded text-slate-400 text-sm">No sessions scheduled today.</div>
                ) : (
                    mySessions.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-800">{s.batch}</h4>
                                    <p className="text-xs text-slate-500">{s.venue} • {s.startTime}</p>
                                </div>
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-bold">{s.status}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{s.topic}</p>
                            <button className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 rounded font-bold">
                                View Feedback
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Syllabus Tracker */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800">Syllabus Tracker</h3>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">Week 2</span>
                </div>
                
                <div className="space-y-3">
                    {syllabus.map(topic => (
                        <div 
                            key={topic.id} 
                            onClick={() => toggleTopic(topic.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${topic.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                        >
                            {topic.isCompleted ? <CheckSquare className="w-5 h-5 text-green-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-400 shrink-0" />}
                            <div>
                                <p className={`text-sm font-medium ${topic.isCompleted ? 'text-green-800 line-through' : 'text-slate-700'}`}>{topic.topic}</p>
                                <p className="text-xs text-slate-400">Week {topic.week}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {syllabus.some(t => !t.isCompleted && t.week === 1) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-xs text-red-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> You have lagging topics from Week 1.
                    </div>
                )}
            </div>

            {/* Feedback & Sentiment */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Smile className="w-4 h-4 text-purple-500" /> Feedback Sentiment
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 w-[75%] h-full"></div>
                        </div>
                        <span className="text-sm font-bold text-green-600">75% Positive</span>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs p-2 bg-slate-50 rounded border border-slate-100 text-slate-600">
                            "The Java examples were very clear today."
                        </div>
                        <div className="text-xs p-2 bg-red-50 rounded border border-red-100 text-red-600">
                            "Please slow down during the coding demo." (Action Required)
                        </div>
                    </div>
                </div>

                {isVendor && (
                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                        <h3 className="font-bold text-indigo-800 mb-2">Upload Reports</h3>
                        <p className="text-xs text-indigo-600 mb-4">Submit assessment CSVs for payment processing.</p>
                        <button className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-bold hover:bg-indigo-700">
                            Upload Assessment Data
                        </button>
                    </div>
                )}
            </div>
       </div>
    </div>
  );
};

export default DashboardTrainer;
