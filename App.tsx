
import React, { useState } from 'react';
import RoleSwitcher from './components/RoleSwitcher';
import DashboardDirector from './components/DashboardDirector';
import DashboardOps from './components/DashboardOps';
import DashboardLabAssistant from './components/DashboardLabAssistant';
import DashboardTrainer from './components/DashboardTrainer';
import DashboardCoordinator from './components/DashboardCoordinator';
import DashboardDean from './components/DashboardDean';
import DashboardStudent from './components/DashboardStudent';
import DashboardPlacement from './components/DashboardPlacement';
import ChatBot from './components/ChatBot';
import { Role, TrainingSession, MeetingRecord } from './types';

// Mock Initial Data
const INITIAL_SESSIONS: TrainingSession[] = [
    {
        id: '1',
        topic: 'Advanced Graph Algorithms',
        plannedTopics: ['BFS Implementation', 'DFS Recursive', 'Shortest Path Intro'],
        batch: 'CSE-A',
        year: 3,
        venue: 'E-301',
        trainerId: 'T1',
        trainerName: 'Dr. S. Rao',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:40',
        status: 'SCHEDULED'
    },
    {
        id: '2',
        topic: 'React Hooks Deep Dive',
        plannedTopics: ['useState & useEffect', 'Custom Hooks Pattern', 'Rules of Hooks'],
        batch: 'IT-B',
        year: 2,
        venue: 'Lab-4',
        trainerId: 'T2',
        trainerName: 'K. Priya',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:55',
        endTime: '12:40',
        status: 'SCHEDULED'
    }
];

const INITIAL_MEETINGS: MeetingRecord[] = [
    {
        id: 'm1',
        date: '2023-10-25',
        title: 'Weekly Ops Review',
        summary: 'Discussed vendor payments and placement drive overlap.',
        decisions: ['Prioritize placement drives over regular classes'],
        deadlines: ['Vendor invoices by Friday'],
        isUrgent: true,
        rawText: '...'
    }
];

function App() {
  const [role, setRole] = useState<Role>(Role.OPS_ADMIN);
  const [sessions, setSessions] = useState<TrainingSession[]>(INITIAL_SESSIONS);
  const [meetings, setMeetings] = useState<MeetingRecord[]>(INITIAL_MEETINGS);

  const handleVerifySession = (id: string, data: { actualStartTime: string; actualEndTime: string; topicCovered: boolean; verifiedTopics: string[]; isLate: boolean }) => {
    setSessions(prev => prev.map(s => 
        s.id === id ? { 
            ...s, 
            status: 'VERIFIED',
            actualStartTime: data.actualStartTime,
            actualEndTime: data.actualEndTime,
            topicCovered: data.topicCovered,
            verifiedTopics: data.verifiedTopics,
            isLate: data.isLate
        } : s
    ));
  };

  const addMeetingRecord = (record: MeetingRecord) => {
    setMeetings(prev => [record, ...prev]);
  };

  const resetDatabase = () => {
      setSessions([]);
      setMeetings([]);
      alert("Database Reset: All scheduled sessions and meetings have been cleared.");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <RoleSwitcher currentRole={role} setRole={setRole} />
      
      <main className="container mx-auto p-4 md:p-6 pb-24">
        <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Anurag University <span className="text-indigo-600">TOMS</span>
            </h1>
            <p className="text-slate-500 mt-1">
                Training Operations Management System • <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">v3.0 Multi-Stakeholder</span>
            </p>
        </header>

        {role === Role.DIRECTOR && <DashboardDirector meetings={meetings} sessions={sessions} />}
        
        {role === Role.OPS_ADMIN && (
            <DashboardOps 
                sessions={sessions} 
                setSessions={setSessions} 
                addMeetingRecord={addMeetingRecord}
                onReset={resetDatabase}
            />
        )}
        
        {role === Role.LAB_ASSISTANT && <DashboardLabAssistant sessions={sessions} onVerify={handleVerifySession} />}
        
        {(role === Role.TRAINER || role === Role.VENDOR_TRAINER) && <DashboardTrainer sessions={sessions} isVendor={role === Role.VENDOR_TRAINER} />}
        
        {role === Role.COORDINATOR && <DashboardCoordinator sessions={sessions} />}
        
        {(role === Role.DEAN || role === Role.MANAGEMENT) && <DashboardDean sessions={sessions} meetings={meetings} />}
        
        {role === Role.STUDENT && <DashboardStudent />}
        
        {role === Role.PLACEMENT && <DashboardPlacement />}

        {role === Role.INSTACKS && (
             <div className="p-8 text-center bg-white rounded-xl shadow-sm">
                <h2 className="text-xl font-bold text-orange-600">Instacks Admin Console</h2>
                <p className="text-slate-500">Assessment Configuration & Question Bank Upload</p>
                <div className="mt-4 p-4 border border-dashed rounded bg-slate-50">Feature coming in next sprint: API Integration for Q-Bank.</div>
             </div>
        )}

      </main>

      {/* Global AI Chat Assistant available to Executive/Ops Roles */}
      {['DIRECTOR', 'OPS_ADMIN', 'DEAN', 'COORDINATOR'].includes(role) && (
          <ChatBot sessions={sessions} meetings={meetings} />
      )}
    </div>
  );
}

export default App;
