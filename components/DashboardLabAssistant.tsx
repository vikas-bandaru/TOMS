
import React, { useState } from 'react';
import { TrainingSession } from '../types';
import { Clock, CheckCircle, AlertTriangle, Square, CheckSquare, Calendar, User, BookOpen } from 'lucide-react';
import { calculateMinutesDifference } from '../services/logicService';

interface Props {
  sessions: TrainingSession[];
  onVerify: (id: string, data: { actualStartTime: string; actualEndTime: string; topicCovered: boolean; verifiedTopics: string[]; isLate: boolean }) => void;
}

const DashboardLabAssistant: React.FC<Props> = ({ sessions, onVerify }) => {
  // Filter for 'today' and active sessions for verification
  // For demo purposes, we show all SCHEDULED/COMPLETED sessions. 
  // In prod, filter by `s.date === today`.
  const activeSessions = sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'COMPLETED');

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-20">
      <div className="bg-indigo-600 p-6 text-white rounded-b-3xl shadow-lg mb-6">
        <h2 className="text-xl font-bold">Verification Console</h2>
        <p className="text-indigo-200 text-sm">Two-Key Syllabus Tracker</p>
      </div>

      <div className="px-4 space-y-4">
        {activeSessions.length === 0 ? (
            <div className="text-center p-8 text-slate-400">
                <p>No active sessions to verify nearby.</p>
            </div>
        ) : (
            activeSessions.map(session => (
               <VerificationCard key={session.id} session={session} onVerify={onVerify} />
            ))
        )}
      </div>
    </div>
  );
};

const VerificationCard: React.FC<{ 
    session: TrainingSession; 
    onVerify: (id: string, data: { actualStartTime: string; actualEndTime: string; topicCovered: boolean; verifiedTopics: string[]; isLate: boolean }) => void 
}> = ({ session, onVerify }) => {
    const [actualStartTime, setActualStartTime] = useState('');
    const [actualEndTime, setActualEndTime] = useState('');
    
    // Topics Logic
    const availableTopics = session.plannedTopics && session.plannedTopics.length > 0 
        ? session.plannedTopics 
        : [session.topic]; // Fallback to main topic if no granular topics
    
    const [verifiedTopics, setVerifiedTopics] = useState<string[]>([]);

    const toggleTopic = (t: string) => {
        setVerifiedTopics(prev => 
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
        );
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const handleVerifyClick = () => {
        if (!actualStartTime || !actualEndTime) {
            alert("Please record both Entry and Exit times.");
            return;
        }

        const lateMins = calculateMinutesDifference(session.startTime, actualStartTime);
        const isLate = lateMins > 5;
        const allTopicsCovered = verifiedTopics.length === availableTopics.length;

        onVerify(session.id, {
            actualStartTime,
            actualEndTime,
            topicCovered: allTopicsCovered,
            verifiedTopics,
            isLate
        });
    };

    // Calculate lateness for preview UI
    const lateMins = actualStartTime ? calculateMinutesDifference(session.startTime, actualStartTime) : 0;
    const isLatePreview = lateMins > 5;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
            {/* Header: Batch & Venue */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{session.batch}</span>
                    <h3 className="font-bold text-slate-800 mt-2 text-xl">{session.venue}</h3>
                </div>
                <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                        <Calendar className="w-3 h-3" /> {session.date}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-slate-500 text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" /> {session.startTime} - {session.endTime}
                    </div>
                </div>
            </div>
            
            {/* Trainer Info */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Assigned Trainer</p>
                    <p className="text-sm font-bold text-slate-800">{session.trainerName}</p>
                </div>
            </div>

            {/* Two-Key Syllabus Tracker */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase">Trainer's Planned Topics</h4>
                </div>
                <div className="bg-indigo-50 rounded-xl p-1 border border-indigo-100">
                    {availableTopics.map((topic, idx) => (
                        <div 
                            key={idx}
                            onClick={() => toggleTopic(topic)}
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/50 transition-colors"
                        >
                            {verifiedTopics.includes(topic) 
                                ? <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" /> 
                                : <Square className="w-5 h-5 text-slate-400 shrink-0" />
                            }
                            <span className={`text-sm font-medium ${verifiedTopics.includes(topic) ? 'text-indigo-900' : 'text-slate-600'}`}>
                                {topic}
                            </span>
                        </div>
                    ))}
                </div>
                {verifiedTopics.length < availableTopics.length && verifiedTopics.length > 0 && (
                    <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Partial coverage marked.
                    </p>
                )}
            </div>

            {/* Verification Inputs */}
            <div className="bg-slate-50 p-4 rounded-xl mb-4 space-y-4 border border-slate-100">
                {/* Entry Time */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Entry Time</label>
                        <div className="flex gap-2">
                             <input 
                                type="time" 
                                value={actualStartTime}
                                onChange={(e) => setActualStartTime(e.target.value)}
                                className={`w-full text-sm p-2 border rounded font-bold ${isLatePreview ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-300'}`}
                             />
                             <button 
                                onClick={() => setActualStartTime(getCurrentTime())}
                                className="bg-white border border-slate-200 text-indigo-600 px-3 rounded text-xs font-bold shadow-sm hover:bg-indigo-50"
                             >
                                NOW
                             </button>
                        </div>
                    </div>
                </div>
                {isLatePreview && (
                    <div className="flex items-center gap-1 text-red-600 text-xs font-bold animate-pulse bg-red-50 p-2 rounded">
                        <AlertTriangle className="w-3 h-3" /> Trainer is {lateMins} mins late!
                    </div>
                )}

                {/* Exit Time */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Exit Time</label>
                        <div className="flex gap-2">
                             <input 
                                type="time" 
                                value={actualEndTime}
                                onChange={(e) => setActualEndTime(e.target.value)}
                                className="w-full text-sm p-2 border border-slate-300 rounded font-bold"
                             />
                             <button 
                                onClick={() => setActualEndTime(getCurrentTime())}
                                className="bg-white border border-slate-200 text-indigo-600 px-3 rounded text-xs font-bold shadow-sm hover:bg-indigo-50"
                             >
                                NOW
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleVerifyClick}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
                <CheckCircle className="w-5 h-5" />
                CONFIRM & SUBMIT
            </button>
            
            {session.status === 'COMPLETED' && (
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                    Trainer Marked Complete
                </div>
            )}
        </div>
    );
};

export default DashboardLabAssistant;
