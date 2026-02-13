import React, { useState } from 'react';
import { Mic, Upload, FileText, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { analyzeMeetingMinutes, transcribeAudio } from '../services/geminiService';
import { MeetingRecord } from '../types';

interface Props {
  onPolicyExtracted: (record: MeetingRecord) => void;
}

const MeetingSentinel: React.FC<Props> = ({ onPolicyExtracted }) => {
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'DONE'>('IDLE');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('PROCESSING');

    try {
      // 1. Convert file to Base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // 2. Transcribe Audio (Simulating audio process if it's audio, or just text)
        let extractedText = '';
        if (file.type.startsWith('audio')) {
           extractedText = await transcribeAudio(base64, file.type) || "";
        } else {
           // Assume text file for simplicity in this demo branch
           extractedText = atob(base64); 
        }
        
        setTranscript(extractedText);

        // 3. Analyze Policy
        const analysis = await analyzeMeetingMinutes(extractedText);
        
        if (analysis) {
            const newRecord: MeetingRecord = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                title: file.name,
                summary: analysis.summary,
                decisions: analysis.decisions || [],
                deadlines: analysis.deadlines || [],
                isUrgent: analysis.isUrgent || false,
                rawText: extractedText
            };
            onPolicyExtracted(newRecord);
            setStatus('DONE');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setStatus('IDLE');
      alert("Failed to process meeting file.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldIcon /> Meeting Sentinel
          </h2>
          <p className="text-sm text-slate-500">Upload Minutes/Audio. Gemini extracts policy & detects triggers.</p>
        </div>
        {status === 'PROCESSING' && <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded animate-pulse">Analyzing...</span>}
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
        <input 
            type="file" 
            accept="audio/*,.txt" 
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {loading ? (
             <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-slate-600">Sentinel is analyzing policy compliance...</p>
             </div>
        ) : (
            <div className="flex flex-col items-center">
                <Mic className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">Drop Audio or Text Minutes here</p>
                <p className="text-xs text-slate-400 mt-1">Supports MP3, WAV, TXT</p>
            </div>
        )}
      </div>

      {status === 'DONE' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
                <p className="text-sm font-semibold text-green-800">Policy Extracted Successfully</p>
                <p className="text-xs text-green-700">Decisions synchronized with Scheduler. Backup sent to Director.</p>
            </div>
        </div>
      )}
    </div>
  );
};

const ShieldIcon = () => (
  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default MeetingSentinel;