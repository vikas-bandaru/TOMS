
import React from 'react';
import { User, Activity, Star } from 'lucide-react';

const DashboardStudent: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
       {/* Profile Header */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                <User className="w-12 h-12" />
            </div>
            <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-slate-800">Rahul Sharma</h2>
                <p className="text-slate-500">Roll No: 22WJ1A0501 • CSE • 3rd Year</p>
                <div className="flex gap-2 mt-2 justify-center md:justify-start">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Python Expert</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">5 Star Coder</span>
                </div>
            </div>
            <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">88%</div>
                <div className="text-xs text-slate-500 uppercase font-bold">Attendance</div>
            </div>
       </div>

       {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" /> Recent Assessment
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Java Full Stack (Instacks)</span>
                            <span className="font-bold text-slate-800">82/100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full">
                            <div className="bg-blue-500 h-2 rounded-full w-[82%]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Aptitude Weekly (Suntek)</span>
                            <span className="font-bold text-slate-800">65/100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full">
                            <div className="bg-yellow-500 h-2 rounded-full w-[65%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> T&P Profile Status
                </h3>
                <div className="p-4 bg-green-50 border border-green-100 rounded text-center">
                    <p className="text-green-800 font-bold text-lg">Eligible for Day 1</p>
                    <p className="text-green-600 text-sm">Based on FI/EI Scores & Attendance</p>
                </div>
                <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700">
                    View Verified Resume
                </button>
            </div>
       </div>
    </div>
  );
};

export default DashboardStudent;
