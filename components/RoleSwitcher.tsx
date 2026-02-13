
import React from 'react';
import { Role } from '../types';
import { Shield, User, Users, Glasses, Briefcase, GraduationCap, School, ClipboardCheck, BookOpen, UserCheck, LayoutGrid } from 'lucide-react';

interface Props {
  currentRole: Role;
  setRole: (role: Role) => void;
}

const RoleSwitcher: React.FC<Props> = ({ currentRole, setRole }) => {
  const roles = [
    { id: Role.DIRECTOR, label: 'Director', icon: Shield, color: 'bg-red-600' },
    { id: Role.MANAGEMENT, label: 'Management', icon: Briefcase, color: 'bg-slate-800' },
    { id: Role.DEAN, label: 'Dean SoE', icon: School, color: 'bg-indigo-800' },
    { id: Role.COORDINATOR, label: 'Coordinator', icon: LayoutGrid, color: 'bg-indigo-600' },
    { id: Role.OPS_ADMIN, label: 'Operations', icon: User, color: 'bg-blue-600' },
    { id: Role.TRAINER, label: 'Trainer (Int)', icon: BookOpen, color: 'bg-emerald-600' },
    { id: Role.VENDOR_TRAINER, label: 'Trainer (Ext)', icon: BookOpen, color: 'bg-emerald-500' },
    { id: Role.LAB_ASSISTANT, label: 'Lab Asst', icon: Users, color: 'bg-green-600' },
    { id: Role.INSTACKS, label: 'Instacks', icon: ClipboardCheck, color: 'bg-orange-600' },
    { id: Role.PLACEMENT, label: 'Placement', icon: UserCheck, color: 'bg-purple-600' },
    { id: Role.STUDENT, label: 'Student', icon: GraduationCap, color: 'bg-pink-600' },
  ];

  return (
    <div className="flex gap-2 p-4 bg-slate-900 text-white items-center overflow-x-auto border-b border-slate-700 pb-6 scrollbar-thin scrollbar-thumb-slate-600">
      <div className="font-bold mr-4 flex items-center gap-2 shrink-0">
         <Glasses className="w-6 h-6 text-yellow-400" />
         <span className="hidden md:inline text-sm uppercase tracking-widest text-slate-400">View As:</span>
      </div>
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shrink-0 border border-transparent ${
            currentRole === r.id ? `${r.color} shadow-lg scale-105 border-white/20` : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
          }`}
        >
          <r.icon className="w-3 h-3" />
          {r.label}
        </button>
      ))}
    </div>
  );
};

export default RoleSwitcher;
