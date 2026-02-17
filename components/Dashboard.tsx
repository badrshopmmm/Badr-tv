
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  ClipboardCheck,
  UserPlus,
  Trash2,
  X,
  Clock,
  ImageIcon,
  Camera,
  CheckCircle2,
  FileText,
  Stethoscope,
  Plane,
  Moon,
  Sun,
  Printer,
  Download,
  Share2,
  ArrowUpDown,
  Calendar as CalendarIcon,
  Zap,
  Users,
  Edit3,
  Upload,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { ProductionEntry, TeamLeader, ManagementMember, Employee, AttendanceRecord, AttendanceStatus } from '../types';

interface DashboardProps {
  data: ProductionEntry[];
  leaders: TeamLeader[];
  managementTeam: ManagementMember[];
  onUpdateManagementTeam: (team: ManagementMember[]) => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  onAttendanceChange: (employeeId: string, status: AttendanceStatus, date: string, attachmentUrl?: string) => void;
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteProductionRecord: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  leaders,
  managementTeam, 
  onUpdateManagementTeam,
  employees,
  attendance,
  onAttendanceChange,
  onAddEmployee,
  onDeleteEmployee
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'id' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<ManagementMember | null>(null);
  const [newEmpForm, setNewEmpForm] = useState({ id: '', name: '', department: 'Cables', role: 'Operator', supervisorId: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memberFileInputRef = useRef<HTMLInputElement>(null);
  const [activeEmpForFile, setActiveEmpForFile] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
  });

  const statusOptions: { value: AttendanceStatus; label: string; activeClass: string; icon?: any }[] = [
    { value: 'present', label: 'Present', activeClass: 'bg-green-500 text-white shadow-lg shadow-green-100', icon: CheckCircle2 },
    { value: 'absent', label: 'Absent', activeClass: 'bg-red-500 text-white shadow-lg shadow-red-100', icon: X },
    { value: 'tl', label: 'TL', activeClass: 'bg-slate-800 text-white shadow-lg shadow-slate-200', icon: Users },
    { value: 'et', label: 'ET', activeClass: 'bg-purple-500 text-white shadow-lg shadow-purple-100', icon: Clock },
    { value: 'cr', label: 'CR', activeClass: 'bg-orange-500 text-white shadow-lg shadow-orange-100', icon: Sun },
    { value: 'TE', label: 'TE', activeClass: 'bg-cyan-500 text-white shadow-lg shadow-cyan-100', icon: Plane },
    { value: 'AP', label: 'AP', activeClass: 'bg-rose-500 text-white shadow-lg shadow-rose-100', icon: FileText },
    { value: 'MT', label: 'MT', activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-100', icon: Stethoscope },
    { value: 'ctp', label: 'CTP', activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-100', icon: Zap },
    { value: 'ctn', label: 'CTN', activeClass: 'bg-indigo-500 text-white shadow-lg shadow-indigo-100', icon: Moon },
  ];

  const getAttendanceRecord = (empId: string) => {
    return attendance.find(a => a.employeeId === empId && a.date === selectedDate);
  };

  const sortedAndFilteredEmployees = useMemo(() => {
    let result = employees.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.id.includes(searchTerm);
      const matchesLeader = leaderFilter === 'all' || e.supervisorId === leaderFilter;
      return matchesSearch && matchesLeader;
    });

    result.sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'name') { valA = a.name; valB = b.name; }
      else if (sortField === 'id') { valA = a.id; valB = b.id; }
      else if (sortField === 'status') {
        valA = getAttendanceRecord(a.id)?.status || 'absent';
        valB = getAttendanceRecord(b.id)?.status || 'absent';
      }
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return result;
  }, [employees, searchTerm, leaderFilter, sortField, sortOrder, attendance, selectedDate]);

  const summaryStats = useMemo(() => {
    const total = employees.length;
    const records = employees.map(e => getAttendanceRecord(e.id));
    const present = records.filter(r => r?.status === 'present').length;
    const absent = records.filter(r => !r || r.status === 'absent').length;
    const others = total - present - absent;
    return { total, present, absent, others, percent: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [employees, attendance, selectedDate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeEmpForFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        onAttendanceChange(activeEmpForFile, getAttendanceRecord(activeEmpForFile)?.status || 'absent', selectedDate, base64);
        setActiveEmpForFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && memberForm) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMemberForm({ ...memberForm, imageUrl: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMemberEdit = (member: ManagementMember) => {
    setMemberForm({ ...member });
    setEditingMemberId(member.id);
  };

  const handleMemberSave = () => {
    if (memberForm) {
      onUpdateManagementTeam(managementTeam.map(m => m.id === memberForm.id ? memberForm : m));
      setEditingMemberId(null);
      setMemberForm(null);
    }
  };

  const handleAddSubmit = () => {
    if (newEmpForm.id.trim() && newEmpForm.name.trim()) {
      onAddEmployee({ ...newEmpForm });
      setNewEmpForm({ id: '', name: '', department: 'Cables', role: 'Operator', supervisorId: '' });
      setIsAddingEmployee(false);
    }
  };

  const toggleSort = (field: 'name' | 'id' | 'status') => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const shareSummaryWhatsApp = () => {
    let message = `*📊 APTIV Field Attendance Report - ${formattedSelectedDate}*\n\n`;
    message += `✅ Present: ${summaryStats.present}\n`;
    message += `❌ Absent: ${summaryStats.absent}\n`;
    message += `👥 Total: ${summaryStats.total}\n`;
    message += `📈 Attendance: ${summaryStats.percent}%\n\n`;
    message += `*Supervisor Breakdown:*\n`;
    leaders.forEach(l => {
      const managed = employees.filter(e => e.supervisorId === l.id);
      const pres = managed.filter(e => getAttendanceRecord(e.id)?.status === 'present').length;
      message += `• ${l.name}: ${pres}/${managed.length} present\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      <input type="file" ref={memberFileInputRef} className="hidden" accept="image/*" onChange={handleMemberPhotoUpload} />

      <div className="flex flex-col gap-6 no-print">
         <div className="flex items-center justify-between bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 text-white rounded-2xl">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Command Leadership Team</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Authorized Management Personnel</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <CalendarIcon className="text-orange-500" size={20} />
               <input 
                 type="date" 
                 className="bg-transparent font-black text-slate-900 outline-none" 
                 value={selectedDate} 
                 onChange={(e) => setSelectedDate(e.target.value)} 
               />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {managementTeam.map(member => (
              <div key={member.id} className="bg-white border border-slate-200 rounded-[3rem] p-8 flex flex-col items-center text-center shadow-sm relative group hover:shadow-xl transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-xl group-hover:scale-105 transition-transform duration-500">
                    <img src={member.imageUrl} className="w-full h-full object-cover" alt={member.name} />
                  </div>
                  <button 
                    onClick={() => handleMemberEdit(member)}
                    className="absolute -bottom-2 -right-2 p-3 bg-orange-600 text-white rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block bg-orange-50 px-4 py-1 rounded-full mb-2">
                    {member.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{member.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.role}</p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-50 w-full">
                  <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed group-hover:text-slate-600 transition-colors">
                    "{member.motto}"
                  </p>
                </div>
              </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
         {[
           { label: 'Total Workforce', val: summaryStats.total, sub: 'Registered Staff', color: 'bg-slate-900', icon: Users },
           { label: 'Attendance Today', val: summaryStats.present, sub: `${summaryStats.percent}% Attendance rate`, color: 'bg-green-500', icon: CheckCircle2 },
           { label: 'Absenteeism', val: summaryStats.absent, sub: 'Needs justification', color: 'bg-red-500', icon: X },
           { label: 'Other Status', val: summaryStats.others, sub: 'Leaves/Missions', color: 'bg-orange-500', icon: Zap },
         ].map((stat, i) => (
           <div key={i} className={`${stat.color} text-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100 flex items-center justify-between group hover:scale-105 transition-all`}>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                 <p className="text-4xl font-black tracking-tighter">{stat.val}</p>
                 <p className="text-[9px] font-bold opacity-80 mt-2">{stat.sub}</p>
              </div>
              <stat.icon size={40} className="opacity-20 group-hover:scale-110 transition-transform" />
           </div>
         ))}
      </div>

      <div id="attendance-section" className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-sm relative overflow-hidden">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-green-50 text-green-500 rounded-[1.5rem] border border-green-100">
              <ClipboardCheck size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Field Attendance Matrix</h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <p className="text-green-600 text-[10px] font-black uppercase tracking-[0.4em]">{formattedSelectedDate}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center no-print">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
               <button onClick={shareSummaryWhatsApp} className="p-3 text-green-600 hover:bg-white rounded-xl transition-all" title="WhatsApp"><Share2 size={18} /></button>
               <button onClick={() => window.print()} className="p-3 text-slate-600 hover:bg-white rounded-xl transition-all" title="Print"><Printer size={18} /></button>
            </div>
            <select 
              className="bg-slate-50 border border-slate-100 px-6 py-3 rounded-xl text-[10px] font-black uppercase outline-none focus:border-orange-500"
              value={leaderFilter}
              onChange={(e) => setLeaderFilter(e.target.value)}
            >
              <option value="all">All Supervisors</option>
              {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" placeholder="Search by name or ID..."
                className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-green-500 outline-none w-64"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsAddingEmployee(true)} className="p-3 bg-orange-500 text-white rounded-xl shadow-lg hover:scale-110 transition-all">
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-50 rounded-[2.5rem] bg-white">
           <table className="w-full text-left border-collapse print:table">
              <thead>
                 <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                    <th className="p-6 cursor-pointer" onClick={() => toggleSort('id')}>ID <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th className="p-6 cursor-pointer" onClick={() => toggleSort('name')}>Employee <ArrowUpDown size={12} className="inline ml-1" /></th>
                    <th className="p-6">Direct Supervisor</th>
                    <th className="p-6 text-center no-print">Attachment</th>
                    <th className="p-6 text-center">Status Matrix</th>
                    <th className="p-6 text-center no-print w-16"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {sortedAndFilteredEmployees.map(emp => {
                    const record = getAttendanceRecord(emp.id);
                    const currentStatus = record?.status || 'absent';
                    const supervisor = leaders.find(l => l.id === emp.supervisorId);
                    return (
                       <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="p-6 text-left font-black text-[10px] text-slate-400">{emp.id}</td>
                          <td className="p-6">
                             <div className="flex flex-col">
                                <span className="font-black text-slate-900 text-sm tracking-tight">{emp.name}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{emp.department} • {emp.role}</span>
                             </div>
                          </td>
                          <td className="p-6">
                             <div className="flex items-center gap-3">
                                <img src={supervisor?.imageUrl} className="w-8 h-8 rounded-xl object-cover" />
                                <span className="text-[10px] font-black text-slate-500 uppercase">{supervisor?.name.split(' ')[0]}</span>
                             </div>
                          </td>
                          <td className="p-6 text-center no-print">
                             {record?.attachmentUrl ? (
                                <button onClick={() => setPreviewImage(record.attachmentUrl!)} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-500 hover:text-white transition-all"><ImageIcon size={16} /></button>
                             ) : (
                                <button onClick={() => { setActiveEmpForFile(emp.id); fileInputRef.current?.click(); }} className="p-3 bg-slate-50 text-slate-300 rounded-2xl hover:bg-orange-500 hover:text-white transition-all"><Camera size={16} /></button>
                             )}
                          </td>
                          <td className="p-6">
                             <div className="flex flex-wrap items-center justify-center gap-1.5 no-print">
                                {statusOptions.map(opt => (
                                   <button
                                      key={opt.value}
                                      onClick={() => onAttendanceChange(emp.id, opt.value, selectedDate)}
                                      className={`px-3 py-2 rounded-xl text-[8px] font-black transition-all flex flex-col items-center gap-1 ${
                                         currentStatus === opt.value ? opt.activeClass : 'bg-slate-50 text-slate-300 border border-slate-100 hover:bg-white'
                                      }`}
                                   >
                                      {opt.icon && <opt.icon size={12} />}
                                      {opt.label}
                                   </button>
                                ))}
                             </div>
                             <div className="hidden print:block text-center font-black text-sm uppercase">
                                {statusOptions.find(o => o.value === currentStatus)?.label}
                             </div>
                          </td>
                          <td className="p-6 text-center no-print">
                             <button onClick={() => onDeleteEmployee(emp.id)} className="p-3 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                          </td>
                       </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      </div>

      {editingMemberId && memberForm && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-8 no-print">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setEditingMemberId(null)}></div>
           <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 relative z-10 animate-in zoom-in-95 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Edit Leadership Profile</h2>
                 <button onClick={() => setEditingMemberId(null)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                 <div className="flex flex-col items-center gap-6 mb-4">
                   <div className="w-24 h-24 rounded-3xl overflow-hidden border border-slate-100 shadow-md">
                    <img src={memberForm.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                   </div>
                   <button 
                     onClick={() => memberFileInputRef.current?.click()}
                     className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-orange-600 transition-all shadow-lg"
                   >
                     <Upload size={14} />
                     <span>Upload Profile Photo</span>
                   </button>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-black text-slate-900" value={memberForm.name} onChange={(e) => setMemberForm({...memberForm, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Job Title</label>
                    <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold" value={memberForm.role} onChange={(e) => setMemberForm({...memberForm, role: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Personal Motto</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold" rows={2} value={memberForm.motto} onChange={(e) => setMemberForm({...memberForm, motto: e.target.value})} />
                 </div>
                 <button onClick={handleMemberSave} className="w-full bg-orange-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all mt-4 hover:bg-slate-900">Confirm Updates</button>
              </div>
           </div>
        </div>
      )}

      {isAddingEmployee && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in" onClick={() => setIsAddingEmployee(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-12 relative z-10 animate-in zoom-in-95 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Register New Employee</h2>
                <button onClick={() => setIsAddingEmployee(false)} className="p-4 bg-slate-100 text-slate-400 rounded-3xl hover:text-red-500 transition-all"><X size={24} /></button>
             </div>
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Employee ID</label>
                      <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-black" value={newEmpForm.id} onChange={(e) => setNewEmpForm({...newEmpForm, id: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Department</label>
                      <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-black" value={newEmpForm.department} onChange={(e) => setNewEmpForm({...newEmpForm, department: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Full Name</label>
                   <input className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold" value={newEmpForm.name} onChange={(e) => setNewEmpForm({...newEmpForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Assigned Supervisor</label>
                   <select 
                    className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl font-bold appearance-none"
                    value={newEmpForm.supervisorId}
                    onChange={(e) => setNewEmpForm({...newEmpForm, supervisorId: e.target.value})}
                   >
                     <option value="">Select Supervisor...</option>
                     {leaders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                   </select>
                </div>
                <button onClick={handleAddSubmit} className="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all mt-4">Confirm Registration</button>
             </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md no-print" onClick={() => setPreviewImage(null)}>
           <button className="absolute top-10 right-10 p-5 bg-white/10 text-white rounded-full hover:bg-red-500 transition-all"><X size={32} /></button>
           <img src={previewImage} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/20" alt="Attachment" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
