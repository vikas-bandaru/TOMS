
import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const DashboardPlacement: React.FC = () => {
  // Mock Student Data
  const students = [
    { id: '1', name: 'Rahul Sharma', roll: '22A01', dept: 'CSE', score: 85, skills: ['Java', 'React'] },
    { id: '2', name: 'Priya P', roll: '22A02', dept: 'IT', score: 92, skills: ['Python', 'ML'] },
    { id: '3', name: 'Amit K', roll: '22A03', dept: 'ECE', score: 78, skills: ['Embedded', 'C'] },
    { id: '4', name: 'Sneha R', roll: '22A04', dept: 'CSE', score: 88, skills: ['Java', 'Spring'] },
  ];

  const [minScore, setMinScore] = useState(75);
  const [skillFilter, setSkillFilter] = useState('');

  const filtered = students.filter(s => 
    s.score >= minScore && 
    (skillFilter === '' || s.skills.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase())))
  );

  const downloadReport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eligible_Students");
    XLSX.writeFile(wb, "Recruitment_List.xlsx");
  };

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Placement Recruitment Console</h2>
            <p className="text-slate-500 text-sm">Filter students for company drives.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex gap-4 mb-6 flex-wrap items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min Avg Score</label>
                    <input 
                        type="number" 
                        value={minScore} 
                        onChange={e => setMinScore(Number(e.target.value))}
                        className="p-2 border rounded w-32 font-bold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Skill</label>
                    <input 
                        type="text" 
                        value={skillFilter} 
                        onChange={e => setSkillFilter(e.target.value)}
                        placeholder="e.g. Java"
                        className="p-2 border rounded w-48"
                    />
                </div>
                <button onClick={downloadReport} className="ml-auto bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-700">
                    <Download className="w-4 h-4" /> Export List
                </button>
            </div>

            <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Dept</th>
                        <th className="p-3">Avg Score</th>
                        <th className="p-3">Top Skills</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {filtered.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-600">{s.roll}</td>
                            <td className="p-3 font-bold">{s.name}</td>
                            <td className="p-3">{s.dept}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${s.score >= 90 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {s.score}%
                                </span>
                            </td>
                            <td className="p-3 text-slate-500">{s.skills.join(', ')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default DashboardPlacement;
