
import React, { useState, useMemo } from 'react';
import { Settings, Users, MapPin, BookOpen, Clock, Play, Plus, Trash2, Edit2, Check, X, Loader2, Save, GraduationCap, Upload, FileSpreadsheet, Info, Calendar as CalendarIcon, Download, AlertCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TrainerMapping, VenueMapping, CurriculumMapping, TimingRule, TrainingTypeMapping, TrainingSession, SectionDetails, Student, AcademicCalendarDay } from '../types';
import { generateSemesterSchedule } from '../services/geminiService';

interface Props {
    onScheduleGenerated: (sessions: TrainingSession[]) => void;
}

const SemesterSetup: React.FC<Props> = ({ onScheduleGenerated }) => {
    const [activeTab, setActiveTab] = useState<'curriculum' | 'sections' | 'resources' | 'rules'>('curriculum');
    const [generating, setGenerating] = useState(false);
    const [showGuidance, setShowGuidance] = useState(true);

    // --- State Management ---
    
    const [timings, setTimings] = useState<TimingRule[]>([
        { semester: 6, session: 'FULL_DAY', startTime: '09:00', endTime: '16:00' }, 
        { semester: 6, session: 'FN', startTime: '09:55', endTime: '12:40' },
        { semester: 6, session: 'AN', startTime: '13:20', endTime: '16:00' },
        { semester: 4, session: 'FN', startTime: '09:55', endTime: '12:40' },
        { semester: 4, session: 'AN', startTime: '13:20', endTime: '16:00' },
        { semester: 3, session: 'FN', startTime: '09:55', endTime: '12:40' },
        { semester: 3, session: 'AN', startTime: '13:20', endTime: '16:00' },
    ]);

    const [curriculum, setCurriculum] = useState<CurriculumMapping[]>([
        { department: 'CSE', semester: 6, courses: ['Java Full Stack', 'Aptitude', 'Soft Skills'] },
        { department: 'IT', semester: 4, courses: ['Python', 'C&DS', 'Aptitude'] },
    ]);

    const [sections, setSections] = useState<SectionDetails[]>([
         { id: 'S1', department: 'CSE', section: 'A', semester: 6, totalStrength: 60, students: [] },
         { id: 'S2', department: 'CSE', section: 'B', semester: 6, totalStrength: 60, students: [] },
    ]);

    const [trainers, setTrainers] = useState<TrainerMapping[]>([
        { trainerId: 'T001', name: 'Vikas', type: 'INTERNAL', courses: ['Java Full Stack', 'C&DS'] },
        { trainerId: 'T002', name: 'Suntek_Agent', type: 'VENDOR', courses: ['Aptitude', 'Soft Skills'] },
        { trainerId: 'T003', name: 'Priya', type: 'INTERNAL', courses: ['Python'] },
    ]);

    const [venues, setVenues] = useState<VenueMapping[]>([
        { id: 'V01', name: 'E-704', department: 'CSE', poc: 'Mr. Ramesh', isExclusiveTnP: false, capacity: 70 },
        { id: 'V02', name: 'Lab-1', department: 'IT', poc: 'Dean T&P', isExclusiveTnP: false, capacity: 70 },
    ]);

    const [trainingTypes, setTrainingTypes] = useState<TrainingTypeMapping[]>([
        { trainingType: 'REGULAR', course: 'Java Full Stack', allowedTrainerTypes: ['INTERNAL', 'EXTERNAL'] },
        { trainingType: 'ADVANCED', course: 'Aptitude', allowedTrainerTypes: ['VENDOR'] }
    ]);

    const [academicCalendar, setAcademicCalendar] = useState<AcademicCalendarDay[]>([]);

    // --- Validation Logic ---
    const validateConfiguration = (): { valid: boolean; error?: string } => {
        const errors: string[] = [];
        for (const sec of sections) {
            const mapping = curriculum.find(c => c.department === sec.department && c.semester === sec.semester);
            if (!mapping || mapping.courses.length === 0) {
                errors.push(`CRITICAL: No courses defined in 'Curriculum' for ${sec.department} Semester ${sec.semester}.`);
            }
        }
        if (errors.length > 0) return { valid: false, error: errors.join('\n') };
        return { valid: true };
    };

    const handleGenerate = async () => {
        const check = validateConfiguration();
        if (!check.valid) {
            alert(check.error);
            return;
        }

        setGenerating(true);
        try {
            // 1. Generate the Weekly Pattern (Monday - Friday) via AI
            const weeklyPattern = await generateSemesterSchedule({
                trainers,
                venues,
                curriculum,
                timings,
                trainingTypes,
                sections
            });

            let finalSchedule = weeklyPattern;

            // 2. If Calendar exists, expand the pattern to the full semester
            if (academicCalendar.length > 0) {
                finalSchedule = expandScheduleFromPattern(weeklyPattern, academicCalendar);
                
                const instructionDays = academicCalendar.filter(d => d.type === 'INSTRUCTION').length;
                const totalSessions = finalSchedule.length;
                
                alert(`✅ Full Semester Schedule Generated!\n\n- Based on Weekly Pattern of ${weeklyPattern.length} sessions.\n- Expanded to ${totalSessions} sessions.\n- Across ${instructionDays} Instruction Days defined in Almanac.`);
            } else {
                alert(`✅ Weekly Schedule Generated!\n\nCreated ${weeklyPattern.length} sessions for a generic week.\n\n⚠️ NOTE: To generate for the entire semester (2025-26), please upload the Almanac in the 'Rules' tab.`);
            }

            onScheduleGenerated(finalSchedule);
            
        } catch (e) {
            console.error(e);
            alert("Failed to generate schedule. Check console for details.");
        } finally {
            setGenerating(false);
        }
    };

    const expandScheduleFromPattern = (pattern: TrainingSession[], calendar: AcademicCalendarDay[]): TrainingSession[] => {
        const expanded: TrainingSession[] = [];
        // Group pattern by Day of Week (0=Sun, 1=Mon...)
        // Note: AI generates dates for "next week", so we extract the weekday from those.
        const patternByDay: Record<number, TrainingSession[]> = {};

        pattern.forEach(s => {
            const d = new Date(s.date).getDay();
            if (!patternByDay[d]) patternByDay[d] = [];
            patternByDay[d].push(s);
        });

        calendar.forEach(day => {
            if (day.type === 'INSTRUCTION') {
                const dateObj = new Date(day.date);
                const dayOfWeek = dateObj.getDay(); // 0-6
                
                // If the pattern has sessions for this day of the week, clone them
                const sessionsForDay = patternByDay[dayOfWeek] || [];
                
                sessionsForDay.forEach(template => {
                    expanded.push({
                        ...template,
                        id: Math.random().toString(36).substr(2, 9),
                        date: day.date, // Set the actual calendar date
                        status: 'SCHEDULED'
                    });
                });
            }
        });
        return expanded;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" /> 
                    Semester Configuration (Ops Admin)
                </h2>
                <div className="text-xs bg-slate-800 px-3 py-1 rounded text-slate-300">
                    Active Semester: 1-2025
                </div>
            </div>

            {showGuidance && (
                <div className="bg-blue-50 border-b border-blue-100 p-3 flex justify-between items-start">
                    <div className="flex gap-2">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800">
                            <strong>Setup Guidance:</strong>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5">
                                <li>Please <b>delete default sample data</b> before adding real data.</li>
                                <li><b>Curriculum</b>: Assign specific Tech (Java) & Non-Tech (Aptitude) courses.</li>
                                <li><b>Bulk Import</b>: Use the 'Bulk Import' boxes in each tab to upload Excel files.</li>
                                <li><b>Almanac</b>: Upload the Academic Almanac (PDF-like table in Excel) to map Instruction days.</li>
                            </ul>
                        </div>
                    </div>
                    <button onClick={() => setShowGuidance(false)} className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
                <TabButton id="curriculum" label="1. Curriculum (Mandatory)" icon={BookOpen} active={activeTab} setTab={setActiveTab} />
                <TabButton id="sections" label="2. Sections & Students" icon={GraduationCap} active={activeTab} setTab={setActiveTab} />
                <TabButton id="resources" label="3. Resources" icon={Users} active={activeTab} setTab={setActiveTab} />
                <TabButton id="rules" label="4. Rules & Almanac" icon={Clock} active={activeTab} setTab={setActiveTab} />
            </div>

            <div className="p-6 min-h-[400px]">
                {activeTab === 'curriculum' && (
                    <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <CurriculumManager data={curriculum} update={setCurriculum} />
                    </div>
                )}

                {activeTab === 'sections' && (
                    <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <SectionsManager data={sections} update={setSections} curriculum={curriculum} />
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        <TrainersManager data={trainers} update={setTrainers} />
                        <VenuesManager data={venues} update={setVenues} />
                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <TimingsManager data={timings} update={setTimings} />
                             <TrainingTypesManager data={trainingTypes} update={setTrainingTypes} />
                         </div>
                         <CalendarManager data={academicCalendar} update={setAcademicCalendar} />
                    </div>
                )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                <button 
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-70 shadow-lg shadow-indigo-200"
                >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {generating ? 'Validating & Scheduling...' : 'Generate Master Schedule'}
                </button>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const CalendarManager = ({ data, update }: { data: AcademicCalendarDay[], update: any }) => {
    const [processing, setProcessing] = useState(false);

    // Helper to parse DD.MM.YYYY
    const parseDate = (dateStr: any): Date | null => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        if (typeof dateStr === 'number') {
             // Excel serial date
             return new Date(Math.round((dateStr - 25569) * 86400 * 1000));
        }
        if (typeof dateStr === 'string') {
            const parts = dateStr.trim().split('.');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // YYYY-MM-DD
            }
        }
        return new Date(dateStr);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProcessing(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                // Assume first sheet
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(ws);
                
                const expandedDays: AcademicCalendarDay[] = [];
                let instructionDaysCount = 0;

                rows.forEach(row => {
                    // Try to map fields based on the Almanac Image structure
                    // Columns: "I Semester" (or Description), "From", "To"
                    const desc = row['I Semester'] || row['II Semester'] || row['Event'] || row['Description'];
                    const fromRaw = row['From'] || row['Start Date'];
                    const toRaw = row['To'] || row['End Date'];

                    if (desc && fromRaw) {
                        const fromDate = parseDate(fromRaw);
                        // If 'To' is missing, assume single day event
                        const toDate = toRaw ? parseDate(toRaw) : fromDate;

                        if (fromDate && toDate && !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
                            
                            // Determine Type
                            let type: 'INSTRUCTION' | 'HOLIDAY' | 'EXAM' = 'INSTRUCTION'; // Default
                            const d = desc.toLowerCase();
                            if (d.includes('exam') || d.includes('submission')) type = 'EXAM';
                            else if (d.includes('vacation') || d.includes('break') || d.includes('preparation')) type = 'HOLIDAY';
                            else if (d.includes('instruction')) type = 'INSTRUCTION';

                            // Loop dates
                            let current = new Date(fromDate);
                            while (current <= toDate) {
                                const dayNum = current.getDay();
                                // Skip Sundays (0)
                                if (dayNum !== 0) {
                                    expandedDays.push({
                                        date: current.toISOString().split('T')[0],
                                        dayOfWeek: current.toLocaleDateString('en-US', { weekday: 'long' }),
                                        type: type,
                                        description: desc
                                    });
                                    if (type === 'INSTRUCTION') instructionDaysCount++;
                                }
                                current.setDate(current.getDate() + 1);
                            }
                        }
                    }
                });

                if (expandedDays.length > 0) {
                    // Sort by date
                    expandedDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    update(expandedDays);
                    alert(`✅ Almanac Processed Successfully!\n\n- Expanded ${rows.length} rows into ${expandedDays.length} calendar days.\n- Found ${instructionDaysCount} Instruction Days.\n- Sundays excluded automatically.`);
                } else {
                    alert("⚠️ No valid dates found. Ensure columns: 'Description' (or I Semester), 'From', 'To' with format DD.MM.YYYY");
                }

            } catch (err) {
                console.error(err);
                alert("Failed to parse calendar file.");
            } finally {
                setProcessing(false);
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = () => {
        const headers = [
            { "S.No": 1, "I Semester": "1st spell of Instructions", "From": "30.06.2025", "To": "08.08.2025", "Duration": "6 Weeks" },
            { "S.No": 2, "I Semester": "1st Midterm Examinations", "From": "11.08.2025", "To": "13.08.2025", "Duration": "3 Days" },
            { "S.No": 9, "I Semester": "Dussera Vacation", "From": "28.09.2025", "To": "05.10.2025", "Duration": "8 Days" }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Almanac_Template");
        XLSX.writeFile(wb, "TOMS_Almanac_Template.xlsx");
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
             <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-indigo-500" /> Academic Almanac (2025-26)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Upload the semester almanac (PDF converted to Excel) to map instruction days.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownloadTemplate} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                        <Download className="w-3 h-3" /> Almanac Template
                    </button>
                    <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-slate-100">
                        {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload Excel
                        <input type="file" accept=".xlsx, .csv" className="hidden" onChange={handleUpload} disabled={processing} />
                    </label>
                </div>
            </div>
            <div className="h-64 overflow-y-auto bg-white border rounded text-xs">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        <p>No Almanac uploaded.</p>
                        <p className="text-[10px] mt-1">System will fallback to generic Mon-Fri schedule.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-2 border-b">Date</th>
                                <th className="p-2 border-b">Day</th>
                                <th className="p-2 border-b">Type</th>
                                <th className="p-2 border-b">Event</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d, i) => (
                                <tr key={i} className={`border-b hover:bg-slate-50 ${d.type === 'HOLIDAY' ? 'bg-red-50 text-red-700' : d.type === 'EXAM' ? 'bg-orange-50 text-orange-800' : ''}`}>
                                    <td className="p-2 border-r border-slate-100 font-mono">{d.date}</td>
                                    <td className="p-2 border-r border-slate-100">{d.dayOfWeek}</td>
                                    <td className="p-2 border-r border-slate-100 font-bold text-[10px] uppercase tracking-wide">{d.type}</td>
                                    <td className="p-2">{d.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const TrainersManager = ({ data, update }: { data: TrainerMapping[], update: any }) => {
    const [form, setForm] = useState({ name: '', type: 'INTERNAL', courses: '' });
    const [editId, setEditId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleDownloadTemplate = () => {
        const headers = [
            { "Name": "Vikas", "Trainer Type": "INTERNAL", "Courses": "Java, C&DS" },
            { "Name": "Suntek_T1", "Trainer Type": "VENDOR", "Courses": "Aptitude, Soft Skills" }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Trainers_Template");
        XLSX.writeFile(wb, "TOMS_Trainers_Template.xlsx");
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProcessing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const newTrainers: TrainerMapping[] = rows.map((r: any) => ({
                    trainerId: `T${Date.now()}${Math.random().toString(36).substr(2,4)}`,
                    name: r['Name'],
                    type: (r['Trainer Type'] || 'INTERNAL').toUpperCase(),
                    courses: (r['Courses'] || '').split(',').map((s: string) => s.trim()).filter(Boolean)
                })).filter(t => t.name);
                update([...data, ...newTrainers]);
                alert(`✅ Imported ${newTrainers.length} trainers.`);
            } catch (err) { alert("Failed to parse file."); } 
            finally { setProcessing(false); e.target.value = ''; }
        };
        reader.readAsBinaryString(file);
    };
    
    const handleSubmit = () => {
        if (!form.name) return;
        const coursesList = form.courses.split(',').map(s => s.trim()).filter(Boolean);
        if (editId) {
             update(data.map(t => t.trainerId === editId ? { ...t, name: form.name, type: form.type as any, courses: coursesList } : t));
             setEditId(null);
        } else {
             update([...data, {
                trainerId: `T${Date.now()}`, name: form.name, type: form.type as any, courses: coursesList
            }]);
        }
        setForm({ name: '', type: 'INTERNAL', courses: '' });
    };
    const handleEdit = (t: TrainerMapping) => {
        setForm({ name: t.name, type: t.type, courses: t.courses.join(', ') });
        setEditId(t.trainerId);
    };
    const remove = (id: string) => update(data.filter(i => i.trainerId !== id));

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Trainer Database
            </h3>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigo-800">Bulk Actions</span>
                    <button onClick={handleDownloadTemplate} className="text-xs text-indigo-600 underline">Template</button>
                </div>
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded text-xs font-bold flex justify-center items-center gap-2">
                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Upload Excel
                    <input type="file" accept=".xlsx" className="hidden" onChange={handleBulkUpload} disabled={processing} />
                </label>
            </div>
            <div className="flex gap-2 mb-3 items-end">
                <div className="flex-1 space-y-1">
                    <input className="w-full text-xs p-2 border rounded" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <select className="w-full text-xs p-2 border rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        <option value="INTERNAL">Internal</option>
                        <option value="EXTERNAL">External</option>
                        <option value="VENDOR">Vendor</option>
                    </select>
                    <input className="w-full text-xs p-2 border rounded" placeholder="Courses (comma sep)" value={form.courses} onChange={e => setForm({...form, courses: e.target.value})} />
                </div>
                <button onClick={handleSubmit} className={`p-2 rounded h-fit transition-colors ${editId ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                    {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto border-t pt-2">
                {data.map(t => (
                    <div key={t.trainerId} className={`flex justify-between items-center text-xs p-2 rounded border ${editId === t.trainerId ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-slate-50'}`}>
                        <div>
                            <span className="font-bold">{t.name}</span> <span className="text-slate-500">({t.type})</span>
                            <div className="text-slate-400">{t.courses.join(', ')}</div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(t)} className="text-blue-400 hover:text-blue-600 p-1"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => remove(t.trainerId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VenuesManager = ({ data, update }: { data: VenueMapping[], update: any }) => {
    const [form, setForm] = useState({ name: '', dept: '', poc: '', cap: '60', exclusive: false });
    const [editId, setEditId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleDownloadTemplate = () => {
        const headers = [
            { "Room Name": "E-704", "Department": "CSE", "Lab Assistant": "Mr. Ramesh", "Capacity": 70, "Exclusive T&P?": false },
            { "Room Name": "Lab-1", "Department": "IT", "Lab Assistant": "Ms. Sita", "Capacity": 60, "Exclusive T&P?": true }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Venues_Template");
        XLSX.writeFile(wb, "TOMS_Venues_Template.xlsx");
    };

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProcessing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const newVenues: VenueMapping[] = rows.map((r: any) => ({
                    id: `V${Date.now()}${Math.random().toString(36).substr(2,4)}`,
                    name: r['Room Name'],
                    department: r['Department'],
                    poc: r['Lab Assistant'] || 'Unassigned',
                    capacity: parseInt(r['Capacity'] || '60'),
                    isExclusiveTnP: !!r['Exclusive T&P?']
                })).filter(v => v.name);
                update([...data, ...newVenues]);
                alert(`✅ Imported ${newVenues.length} venues.`);
            } catch (err) { alert("Failed to parse file."); } 
            finally { setProcessing(false); e.target.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const handleSubmit = () => {
        if (!form.name) return;
        if (editId) {
            update(data.map(v => v.id === editId ? { ...v, name: form.name, department: form.dept, poc: form.poc, capacity: parseInt(form.cap), isExclusiveTnP: form.exclusive } : v));
            setEditId(null);
        } else {
            update([...data, { id: `V${Date.now()}`, name: form.name, department: form.dept, poc: form.poc, capacity: parseInt(form.cap), isExclusiveTnP: form.exclusive }]);
        }
        setForm({ name: '', dept: '', poc: '', cap: '60', exclusive: false });
    };

    const handleEdit = (v: VenueMapping) => {
        setForm({ name: v.name, dept: v.department, poc: v.poc, cap: v.capacity.toString(), exclusive: v.isExclusiveTnP });
        setEditId(v.id);
    };
    const remove = (id: string) => update(data.filter(i => i.id !== id));

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Venue Master
            </h3>
             <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigo-800">Bulk Actions</span>
                    <button onClick={handleDownloadTemplate} className="text-xs text-indigo-600 underline">Template</button>
                </div>
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded text-xs font-bold flex justify-center items-center gap-2">
                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Upload Excel
                    <input type="file" accept=".xlsx" className="hidden" onChange={handleBulkUpload} disabled={processing} />
                </label>
            </div>
            <div className="flex gap-2 mb-3 items-end">
                <div className="flex-1 grid grid-cols-2 gap-2">
                    <input className="text-xs p-2 border rounded" placeholder="Room Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <input className="text-xs p-2 border rounded" placeholder="Dept" value={form.dept} onChange={e => setForm({...form, dept: e.target.value})} />
                    <input className="text-xs p-2 border rounded" placeholder="POC Name" value={form.poc} onChange={e => setForm({...form, poc: e.target.value})} />
                    <input className="text-xs p-2 border rounded" type="number" placeholder="Cap" value={form.cap} onChange={e => setForm({...form, cap: e.target.value})} />
                    <label className="text-xs flex items-center gap-1 col-span-2">
                        <input type="checkbox" checked={form.exclusive} onChange={e => setForm({...form, exclusive: e.target.checked})} /> Exclusive T&P?
                    </label>
                </div>
                <button onClick={handleSubmit} className={`p-2 rounded h-fit mb-1 transition-colors ${editId ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                    {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto border-t pt-2">
                {data.map(v => (
                    <div key={v.id} className={`flex justify-between items-center text-xs p-2 rounded border ${editId === v.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-slate-50'}`}>
                        <div>
                            <span className="font-bold">{v.name}</span> <span className="text-slate-500">({v.department})</span>
                            <div className="text-slate-400">POC: {v.poc} | Cap: {v.capacity} {v.isExclusiveTnP && '🔒'}</div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(v)} className="text-blue-400 hover:text-blue-600 p-1"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => remove(v.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CurriculumManager = ({ data, update }: { data: CurriculumMapping[], update: any }) => {
    const [form, setForm] = useState({ dept: '', sem: '1', courses: '' });
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleDownloadTemplate = () => {
        const headers = [
            { "Department": "CSE", "Semester": 4, "Courses": "Java, QALR-II", "Passing out Year": 2028 },
            { "Department": "IT", "Semester": 6, "Courses": "Java Full Stack, VACR", "Passing out Year": 2027 }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wscols = [{wch: 15}, {wch: 10}, {wch: 40}, {wch: 20}];
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Curriculum_Template");
        XLSX.writeFile(wb, "TOMS_Curriculum_Template.xlsx");
    };

    const handleUploadCurriculum = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProcessing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                const newMappings: CurriculumMapping[] = [];
                let importedCount = 0;
                rows.forEach((row: any) => {
                    const dept = (row['Department'] || row['Dept'])?.toString().trim().toUpperCase();
                    const sem = parseInt(row['Semester'] || row['Sem']);
                    const coursesRaw = row['Courses'] || row['Subjects'];
                    if (dept && sem && coursesRaw) {
                        const coursesList = coursesRaw.toString().split(',').map((s: string) => s.trim()).filter(Boolean);
                        if (coursesList.length > 0) {
                            newMappings.push({ department: dept, semester: sem, courses: coursesList });
                            importedCount++;
                        }
                    }
                });
                if (newMappings.length > 0) {
                    const filteredCurrent = data.filter(d => 
                        !newMappings.some(n => n.department === d.department && n.semester === d.semester)
                    );
                    update([...filteredCurrent, ...newMappings]);
                    alert(`✅ Imported ${importedCount} curriculum rules.`);
                }
            } catch (error) { alert("Failed to parse file."); } 
            finally { setProcessing(false); e.target.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const handleSubmit = () => {
        if (!form.dept) return;
        const coursesList = form.courses.split(',').map(s => s.trim()).filter(Boolean);
        if (editIdx !== null) {
            const newData = [...data];
            newData[editIdx] = { department: form.dept, semester: parseInt(form.sem), courses: coursesList };
            update(newData);
            setEditIdx(null);
        } else {
            update([...data, { department: form.dept, semester: parseInt(form.sem), courses: coursesList }]);
        }
        setForm({ dept: '', sem: '1', courses: '' });
    };
    const handleEdit = (c: CurriculumMapping, idx: number) => {
        setForm({ dept: c.department, sem: c.semester.toString(), courses: c.courses.join(', ') });
        setEditIdx(idx);
    };
    const remove = (idx: number) => update(data.filter((_, i) => i !== idx));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Dept → Sem → Course Mapping
                </h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                    <h4 className="font-bold text-indigo-800 text-sm flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" /> Bulk Import
                    </h4>
                    <p className="text-xs text-indigo-600 mt-1">
                        <button onClick={handleDownloadTemplate} className="underline font-bold hover:text-indigo-900">Download Template</button>, fill, and upload.
                    </p>
                </div>
                <div className="shrink-0">
                     <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm font-bold flex items-center gap-2 text-xs">
                        {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload Excel
                        <input type="file" accept=".xlsx, .xls" onChange={handleUploadCurriculum} className="hidden" disabled={processing} />
                    </label>
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 flex gap-2">
                        <input className="w-24 text-xs p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Dept" value={form.dept} onChange={e => setForm({...form, dept: e.target.value})} />
                        <input className="w-16 text-xs p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" type="number" placeholder="Sem" value={form.sem} onChange={e => setForm({...form, sem: e.target.value})} />
                        <input className="flex-1 text-xs p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Courses (comma separated)" value={form.courses} onChange={e => setForm({...form, courses: e.target.value})} />
                    </div>
                    <button onClick={handleSubmit} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${editIdx !== null ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>{editIdx !== null ? 'Update' : 'Add'}</button>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {data.map((c, idx) => (
                    <div key={idx} className={`flex justify-between items-start text-xs p-2 rounded border ${editIdx === idx ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-slate-50'}`}>
                        <div>
                            <span className="font-bold text-indigo-700">{c.department} - Sem {c.semester}</span>
                            <div className="text-slate-500 mt-1 flex flex-wrap gap-1">
                                {c.courses.map((course, i) => {
                                    const isTech = !['aptitude', 'soft skills'].some(k => course.toLowerCase().includes(k));
                                    return <span key={i} className={`px-1 border rounded ${isTech ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>{course}</span>;
                                })}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(c, idx)} className="text-blue-400 hover:text-blue-600 p-1"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SectionsManager = ({ data, update, curriculum }: { data: SectionDetails[], update: any, curriculum: CurriculumMapping[] }) => {
    const [form, setForm] = useState({ dept: '', section: '', sem: '1', strength: '60' });
    const [students, setStudents] = useState<Student[]>([]);
    const [editId, setEditId] = useState<string | null>(null);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const currentCourses = useMemo(() => {
        const mapping = curriculum.find(c => c.department === form.dept && c.semester === parseInt(form.sem));
        return mapping ? mapping.courses : [];
    }, [form.dept, form.sem, curriculum]);

    const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBulkProcessing(true);
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const currentYear = new Date().getFullYear();
                const newSections: SectionDetails[] = [];
                let totalStudents = 0;

                wb.SheetNames.forEach(sheetName => {
                    const yearMatch = sheetName.match(/20\d{2}/);
                    const passingYear = yearMatch ? parseInt(yearMatch[0]) : null;
                    
                    let semester = 1; 
                    if (passingYear) {
                         const diff = passingYear - currentYear;
                         if (diff === 0) semester = 8;
                         else if (diff === 1) semester = 6;
                         else if (diff === 2) semester = 4;
                         else if (diff === 3) semester = 2;
                    }

                    const ws = wb.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(ws);
                    
                    const grouped: Record<string, Student[]> = {};
                    rows.forEach((row: any) => {
                        const dept = (row['Department'] || row['Dept'] || 'UNKNOWN').toUpperCase();
                        const sec = (row['Section'] || row['Sec'] || 'A').toUpperCase();
                        const roll = row['Roll Number'] || row['RollNo'] || row['Roll'];
                        const name = row['Name'] || row['Student Name'] || 'Student';

                        if (roll && dept !== 'UNKNOWN') {
                            const key = `${dept}-${sec}`;
                            if (!grouped[key]) grouped[key] = [];
                            grouped[key].push({ rollNo: String(roll), name: String(name) });
                        }
                    });

                    Object.entries(grouped).forEach(([key, studList]) => {
                        const [d, s] = key.split('-');
                        newSections.push({
                            id: `S-${d}-${s}-${sheetName}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                            department: d,
                            section: s,
                            semester: semester,
                            totalStrength: studList.length,
                            students: studList
                        });
                        totalStudents += studList.length;
                    });
                });

                if (newSections.length > 0) {
                    update([...data, ...newSections]);
                    alert(`✅ Bulk Import Successful!\n- Processed ${wb.SheetNames.length} Sheets\n- Created ${newSections.length} Sections\n- Imported ${totalStudents} Students`);
                } else {
                    alert("⚠️ No valid data found. Ensure columns: 'Department', 'Section', 'Roll Number', 'Name'.");
                }
            } catch (error) {
                console.error(error);
                alert("Failed to parse bulk file.");
            } finally {
                setBulkProcessing(false);
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                const parsedStudents: Student[] = data.map((row: any) => ({
                    rollNo: row['Roll Number'] || row['RollNo'] || row['Roll'] || 'UNKNOWN',
                    name: row['Name'] || row['Student Name'] || 'UNKNOWN'
                })).filter(s => s.rollNo !== 'UNKNOWN');
                
                setStudents(parsedStudents);
            } catch (error) {
                alert("Failed to parse student file. Check format.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSubmit = () => {
        if (!form.dept || !form.section) return;
        
        if (students.length > 0 && students.length !== parseInt(form.strength)) {
            if(!window.confirm(`⚠️ Strength Mismatch:\nDeclared: ${form.strength}\nUploaded: ${students.length}\n\nProceed?`)) {
                return;
            }
        }

        const payload: SectionDetails = {
            id: editId || `S${Date.now()}`,
            department: form.dept,
            section: form.section,
            semester: parseInt(form.sem),
            totalStrength: parseInt(form.strength),
            students: students
        };

        if (editId) {
            update(data.map(d => d.id === editId ? payload : d));
            setEditId(null);
        } else {
            update([...data, payload]);
        }
        setForm({ dept: '', section: '', sem: '1', strength: '60' });
        setStudents([]);
    };

    const handleEdit = (s: SectionDetails) => {
        setForm({ dept: s.department, section: s.section, sem: s.semester.toString(), strength: s.totalStrength.toString() });
        setStudents(s.students);
        setEditId(s.id);
    };

    const remove = (id: string) => update(data.filter(d => d.id !== id));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500" /> Section & Student Management
                </h3>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                    <h4 className="font-bold text-indigo-800 flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" /> Bulk Import Sections
                    </h4>
                    <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
                        Upload an Excel Workbook where <b>Sheet Name = Passing Year</b> (e.g., "2025", "2026").<br/>
                        System auto-creates sections grouping by <span className="font-mono bg-indigo-100 px-1">Department</span> and <span className="font-mono bg-indigo-100 px-1">Section</span> columns.
                    </p>
                </div>
                <div className="shrink-0">
                    <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-bold flex items-center gap-2 transition-all">
                        {bulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {bulkProcessing ? 'Processing Workbook...' : 'Upload Workbook'}
                        <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" disabled={bulkProcessing} />
                    </label>
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manual Entry / Override</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Department</label>
                        <input className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="e.g. CSE" value={form.dept} onChange={e => setForm({...form, dept: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Section</label>
                        <input className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="e.g. A" value={form.section} onChange={e => setForm({...form, section: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Semester</label>
                        <input className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" type="number" value={form.sem} onChange={e => setForm({...form, sem: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Total Strength</label>
                        <input className="w-full text-sm p-2 border rounded focus:ring-2 focus:ring-indigo-200 outline-none" type="number" value={form.strength} onChange={e => setForm({...form, strength: e.target.value})} />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Assigned Course (Read-Only via Curriculum)</label>
                    <div className={`p-3 border rounded text-sm min-h-[46px] flex items-center gap-2 ${currentCourses.length > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                        {currentCourses.length > 0 ? (
                            <>
                                <Check className="w-4 h-4" />
                                <span className="font-medium">{currentCourses.join(', ')}</span>
                            </>
                        ) : (
                            <span className="italic flex items-center gap-2"><AlertCircle className="w-4 h-4" /> No course mapped. Please configure 'Curriculum' tab first.</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Student List (Single Section)</label>
                        <div className="flex items-center gap-2">
                            <label className="cursor-pointer bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-slate-50">
                                <Upload className="w-4 h-4" />
                                {students.length > 0 ? `${students.length} Students Loaded` : 'Upload File'}
                                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                            </label>
                            {students.length > 0 && (
                                <span className={`text-xs font-bold flex items-center gap-1 ${students.length === parseInt(form.strength) ? 'text-green-600' : 'text-red-500'}`}>
                                    {students.length === parseInt(form.strength) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    {students.length === parseInt(form.strength) ? 'Strength Matched' : 'Mismatch'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={handleSubmit} className={`px-6 py-2 h-fit rounded font-bold transition-all ${editId ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
                        {editId ? 'Update Section' : 'Add Section'}
                    </button>
                </div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.map(s => {
                    const mapped = curriculum.find(c => c.department === s.department && c.semester === s.semester);
                    return (
                        <div key={s.id} className={`flex justify-between items-center text-sm p-3 rounded border ${editId === s.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white'}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{s.department}-{s.section}</span>
                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-bold">Sem {s.semester}</span>
                                    {!mapped && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">Missing Curriculum</span>}
                                    {s.students.length > 0 && <span className="text-xs text-green-600 flex items-center"><Check className="w-3 h-3" /> List</span>}
                                </div>
                                <div className="text-slate-500 text-xs mt-1 flex gap-4">
                                    <span>Strength: <b>{s.totalStrength}</b></span>
                                    <span>Students: <b>{s.students.length}</b></span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && <div className="text-center text-slate-400 text-xs p-4">No sections configured.</div>}
            </div>
        </div>
    );
};

const TimingsManager = ({ data, update }: { data: TimingRule[], update: any }) => {
    const [form, setForm] = useState({ sem: '6', session: 'FULL_DAY', start: '09:00', end: '16:00' });
    const [editIdx, setEditIdx] = useState<number | null>(null);

    const handleSubmit = () => {
        if (editIdx !== null) {
             const newData = [...data];
             newData[editIdx] = { semester: parseInt(form.sem), session: form.session as any, startTime: form.start, endTime: form.end };
             update(newData);
             setEditIdx(null);
        } else {
             update([...data, { semester: parseInt(form.sem), session: form.session as any, startTime: form.start, endTime: form.end }]);
        }
        setForm({ sem: '1', session: 'FN', start: '09:55', end: '12:40' });
    };

    const handleEdit = (t: TimingRule, idx: number) => {
        setForm({ sem: t.semester.toString(), session: t.session, start: t.startTime, end: t.endTime });
        setEditIdx(idx);
    };
    
    const remove = (idx: number) => update(data.filter((_, i) => i !== idx));

    return (
        <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> Sem-wise Timing Rules
            </h3>
            <div className="flex gap-2 mb-3 items-end">
                <div className="flex-1 grid grid-cols-4 gap-2">
                     <input className="text-xs p-2 border rounded" type="number" placeholder="Sem" value={form.sem} onChange={e => setForm({...form, sem: e.target.value})} />
                     <select className="text-xs p-2 border rounded" value={form.session} onChange={e => setForm({...form, session: e.target.value})}>
                        <option value="FN">FN</option>
                        <option value="AN">AN</option>
                        <option value="FULL_DAY">Full Day</option>
                     </select>
                     <input className="text-xs p-2 border rounded" type="time" value={form.start} onChange={e => setForm({...form, start: e.target.value})} />
                     <input className="text-xs p-2 border rounded" type="time" value={form.end} onChange={e => setForm({...form, end: e.target.value})} />
                </div>
                <button onClick={handleSubmit} className={`p-2 rounded transition-colors ${editIdx !== null ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                    {editIdx !== null ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.map((t, idx) => (
                    <div key={idx} className={`flex justify-between items-center text-xs p-2 rounded border ${editIdx === idx ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-slate-50'}`}>
                        <div><span className="font-bold">Sem {t.semester} ({t.session})</span>: {t.startTime} - {t.endTime}</div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(t, idx)} className="text-blue-400 hover:text-blue-600 p-1"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrainingTypesManager = ({ data, update }: { data: TrainingTypeMapping[], update: any }) => {
    const [form, setForm] = useState({ type: 'REGULAR', course: '', allowed: [] as string[] });
    const [editIdx, setEditIdx] = useState<number | null>(null);

    const toggleAllowed = (val: string) => {
        setForm(prev => ({
            ...prev,
            allowed: prev.allowed.includes(val) ? prev.allowed.filter(x => x !== val) : [...prev.allowed, val]
        }));
    };

    const handleSubmit = () => {
        if (!form.course) return;
        const allowed = form.allowed.length ? form.allowed : ['INTERNAL'];
        
        if (editIdx !== null) {
             const newData = [...data];
             newData[editIdx] = { trainingType: form.type as any, course: form.course, allowedTrainerTypes: allowed as any };
             update(newData);
             setEditIdx(null);
        } else {
             update([...data, { trainingType: form.type as any, course: form.course, allowedTrainerTypes: allowed as any }]);
        }
        setForm({ type: 'REGULAR', course: '', allowed: [] });
    };

    const handleEdit = (t: TrainingTypeMapping, idx: number) => {
        setForm({ type: t.trainingType, course: t.course, allowed: t.allowedTrainerTypes });
        setEditIdx(idx);
    };
    const remove = (idx: number) => update(data.filter((_, i) => i !== idx));

    return (
        <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-500" /> Training Type Rules
            </h3>
            <div className="space-y-2 mb-3 bg-slate-50 p-2 rounded border">
                <div className="flex gap-2">
                    <select className="text-xs p-2 border rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        <option value="REGULAR">Regular</option><option value="ADVANCED">Advanced</option>
                    </select>
                    <input className="flex-1 text-xs p-2 border rounded" placeholder="Course Name" value={form.course} onChange={e => setForm({...form, course: e.target.value})} />
                </div>
                <div className="flex gap-2 text-xs">
                    {['INTERNAL', 'EXTERNAL', 'VENDOR'].map(t => (
                        <label key={t} className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={form.allowed.includes(t)} onChange={() => toggleAllowed(t)} /> {t}
                        </label>
                    ))}
                    <button onClick={handleSubmit} className={`ml-auto px-3 py-1 rounded font-bold transition-colors ${editIdx !== null ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>
                        {editIdx !== null ? 'Update Rule' : 'Add Rule'}
                    </button>
                </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.map((t, idx) => (
                    <div key={idx} className={`flex justify-between items-center text-xs border p-2 rounded ${editIdx === idx ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white'}`}>
                        <div>
                            <span className="font-bold text-slate-700">[{t.trainingType}]</span> {t.course}
                            <div className="text-slate-500">Allowed: {t.allowedTrainerTypes.join(', ')}</div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(t, idx)} className="text-blue-400 hover:text-blue-600 p-1"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TabButton = ({ id, label, icon: Icon, active, setTab }: any) => (
    <button 
        onClick={() => setTab(id)}
        className={`flex-1 min-w-[120px] py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all ${active === id ? 'bg-white border-t-2 border-indigo-500 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
    >
        <Icon className="w-4 h-4" /> {label}
    </button>
);

export default SemesterSetup;
