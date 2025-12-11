import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Patient, HospitalName, PatientType } from '../types';
import { Search, Filter, User, Calendar, MapPin, X, Activity, FileText, ShieldCheck, Clock, Gavel, ChevronLeft, ChevronRight, Edit2, Save, Trash2, UserPlus } from 'lucide-react';

interface PatientsDBProps {
  patients: Patient[];
  selectedHospital: HospitalName | 'All';
  onUpdatePatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onNavigate?: (module: string) => void;
}

const PatientsDB: React.FC<PatientsDBProps> = ({ patients, selectedHospital, onUpdatePatient, onDeletePatient, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | PatientType>('All');
  const [viewProfile, setViewProfile] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});

  const filteredPatients = patients.filter(p => {
    // Hospital Filter
    if (selectedHospital !== 'All' && p.hospital !== selectedHospital) return false;

    // Type Filter
    if (typeFilter !== 'All' && p.type !== typeFilter) return false;

    // Search Filter
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.uhid.toLowerCase().includes(searchLower) ||
      p.mobile.includes(searchLower)
    );
  });

  const handleNextPatient = () => {
      if (!viewProfile || isEditing) return;
      const currentIndex = filteredPatients.findIndex(p => p.id === viewProfile.id);
      if (currentIndex !== -1 && currentIndex < filteredPatients.length - 1) {
          setViewProfile(filteredPatients[currentIndex + 1]);
      }
  };

  const handlePrevPatient = () => {
      if (!viewProfile || isEditing) return;
      const currentIndex = filteredPatients.findIndex(p => p.id === viewProfile.id);
      if (currentIndex > 0) {
          setViewProfile(filteredPatients[currentIndex - 1]);
      }
  };

  const startEditing = () => {
      if (!viewProfile) return;
      setEditForm(viewProfile);
      setIsEditing(true);
  };

  const saveEditing = () => {
      if (!viewProfile || !onUpdatePatient || !editForm) return;
      const updatedPatient = { ...viewProfile, ...editForm } as Patient;
      onUpdatePatient(updatedPatient);
      setViewProfile(updatedPatient);
      setIsEditing(false);
  };

  const cancelEditing = () => {
      setIsEditing(false);
      setEditForm({});
  };

  const confirmDelete = () => {
      if (!viewProfile || !onDeletePatient) return;
      if (window.confirm(`Are you sure you want to permanently delete patient ${viewProfile.name}? This action cannot be undone.`)) {
          onDeletePatient(viewProfile.id);
          setViewProfile(null);
      }
  };

  const stats = {
      total: filteredPatients.length,
      opd: filteredPatients.filter(p => p.type === PatientType.OPD).length,
      ipd: filteredPatients.filter(p => p.type === PatientType.IPD).length,
      casualty: filteredPatients.filter(p => p.type === PatientType.CASUALTY).length
  };

  const inputClass = "w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-sm text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none";

  return (
    <div className="space-y-6 animate-slide-down relative">
      {/* PROFILE MODAL PORTAL */}
      {viewProfile && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl flex items-center">
                {/* Prev Button */}
                {!isEditing && (
                    <button 
                        onClick={handlePrevPatient}
                        disabled={filteredPatients.findIndex(p => p.id === viewProfile.id) <= 0}
                        className="absolute -left-12 p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-0 transition-all hidden md:block"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                )}

                <div className="bg-white rounded-xl shadow-2xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
                    <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-4 w-full">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm flex-shrink-0 ${viewProfile.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                {viewProfile.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            className="text-xl font-bold text-slate-800 border-b border-slate-300 bg-transparent focus:outline-none w-full"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        />
                                    ) : (
                                        <h2 className="text-xl font-bold text-slate-800">{viewProfile.name}</h2>
                                    )}
                                    
                                    {!isEditing && viewProfile.legalStatus === 'MLC' && (
                                        <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                                            <Gavel className="w-3 h-3" /> MLC
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 font-mono">{viewProfile.uhid}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                        viewProfile.type === PatientType.IPD ? 'bg-purple-100 text-purple-700' : 
                                        viewProfile.type === PatientType.OPD ? 'bg-blue-100 text-blue-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {viewProfile.type}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${viewProfile.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {viewProfile.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <button onClick={saveEditing} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-full transition-colors" title="Save Changes">
                                        <Save className="w-5 h-5" />
                                    </button>
                                    <button onClick={cancelEditing} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors" title="Cancel">
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={startEditing} className="p-2 hover:bg-slate-200 rounded-full text-blue-600 transition-colors" title="Edit Patient">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    {onDeletePatient && (
                                        <button onClick={confirmDelete} className="p-2 hover:bg-red-100 rounded-full text-red-500 transition-colors" title="Delete Patient Record">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => setViewProfile(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                        {/* Demographics */}
                        <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs">Age</p>
                                    {isEditing ? (
                                        <input type="number" className={inputClass} value={editForm.age} onChange={e => setEditForm({...editForm, age: parseInt(e.target.value) || 0})} />
                                    ) : (
                                        <p className="font-medium text-slate-700">{viewProfile.age} Years</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Gender</p>
                                    {isEditing ? (
                                        <select className={inputClass} value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value as any})}>
                                            <option>Male</option><option>Female</option><option>Other</option>
                                        </select>
                                    ) : (
                                        <p className="font-medium text-slate-700">{viewProfile.gender}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Mobile Number</p>
                                    {isEditing ? (
                                        <input type="text" className={inputClass} value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
                                    ) : (
                                        <p className="font-medium text-slate-700">{viewProfile.mobile}</p>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-500 text-xs">Address</p>
                                    {isEditing ? (
                                        <input type="text" className={inputClass} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                                    ) : (
                                        <p className="font-medium text-slate-700">{viewProfile.address || 'Not Recorded'}</p>
                                    )}
                                </div>
                            </div>
                        </section>
                        
                        <div className="h-px bg-slate-100"></div>

                        {/* Clinical Info */}
                        <section>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Clinical Context
                            </h3>
                             <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                    <p className="text-slate-500 text-xs">Hospital</p>
                                    <p className="font-bold text-slate-800">{viewProfile.hospital}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Department</p>
                                    <p className="font-bold text-slate-800">{viewProfile.department}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Consultant</p>
                                    <p className="font-bold text-slate-800">Dr. {viewProfile.doctor}</p>
                                </div>
                                 {viewProfile.diagnosis && (
                                    <div>
                                        <p className="text-slate-500 text-xs">Diagnosis / Complaint</p>
                                        <p className="font-medium text-slate-800">{viewProfile.diagnosis}</p>
                                    </div>
                                 )}
                            </div>
                        </section>

                        {/* Specific Details based on Type */}
                        {viewProfile.type === PatientType.IPD && (
                            <section>
                                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Admission Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 text-xs">Admission Date</p>
                                        <p className="font-medium text-slate-700">{viewProfile.admissionDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Ward / Bed</p>
                                        <p className="font-medium text-slate-700">{viewProfile.ward} / {viewProfile.bedNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Admission ID</p>
                                        <p className="font-medium text-slate-700 font-mono">{viewProfile.admissionId}</p>
                                    </div>
                                    {viewProfile.insuranceDetails && (
                                        <div className="col-span-2 bg-blue-50 p-3 rounded border border-blue-100 mt-2">
                                            <p className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Insurance Coverage</p>
                                            <p className="text-xs text-blue-700">{viewProfile.insuranceDetails.tpaName} • {viewProfile.insuranceDetails.policyNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {viewProfile.type === PatientType.CASUALTY && (
                             <section>
                                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Emergency Triage
                                </h3>
                                <div className="flex gap-4 items-center">
                                    <div className={`px-3 py-1 rounded text-sm font-bold border ${viewProfile.triagePriority === 'Red (Immediate)' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                                        {viewProfile.triagePriority}
                                    </div>
                                    <div className="text-sm">
                                         <p className="text-slate-500 text-xs">Arrival Time</p>
                                         <p className="font-medium text-slate-700">{viewProfile.casualtyArrivalDate}</p>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                         <button onClick={() => setViewProfile(null)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100">Close Profile</button>
                         <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" /> View Clinical Notes
                         </button>
                    </div>
                </div>

                {/* Next Button */}
                {!isEditing && (
                    <button 
                        onClick={handleNextPatient}
                        disabled={filteredPatients.findIndex(p => p.id === viewProfile.id) >= filteredPatients.length - 1}
                        className="absolute -right-12 p-2 text-white hover:bg-white/20 rounded-full disabled:opacity-0 transition-all hidden md:block"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                )}
            </div>
        </div>,
        document.body
      )}

      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase">Total Records</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
              <p className="text-xs text-blue-600 font-bold uppercase">OPD Patients</p>
              <h3 className="text-2xl font-bold text-blue-800">{stats.opd}</h3>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
              <p className="text-xs text-purple-600 font-bold uppercase">IPD Admissions</p>
              <h3 className="text-2xl font-bold text-purple-800">{stats.ipd}</h3>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
              <p className="text-xs text-red-600 font-bold uppercase">Casualty</p>
              <h3 className="text-2xl font-bold text-red-800">{stats.casualty}</h3>
          </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                  type="text" 
                  placeholder="Search by Name, UHID, Mobile..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                  className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                  <option value="All">All Types</option>
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                  <option value="Casualty">Casualty</option>
              </select>
              {onNavigate && (
                  <button 
                    onClick={() => onNavigate('registration')}
                    className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm whitespace-nowrap"
                  >
                      <UserPlus className="w-4 h-4" /> Add Patient
                  </button>
              )}
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Patient Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type / Dept</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status / Ward</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Admission / Visit</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No patients found matching your search.
                            </td>
                        </tr>
                    ) : (
                        filteredPatients.map(patient => (
                            <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full flex-shrink-0 ${patient.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 text-sm">{patient.name}</p>
                                                {patient.legalStatus === 'MLC' && (
                                                    <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                                        <Gavel className="w-2.5 h-2.5" /> MLC
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono">{patient.uhid}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{patient.age}Y • {patient.gender} • {patient.mobile}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase mb-1 inline-block ${
                                        patient.type === 'IPD' ? 'bg-purple-100 text-purple-700' : 
                                        patient.type === 'OPD' ? 'bg-blue-100 text-blue-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {patient.type}
                                    </span>
                                    <p className="text-xs text-slate-600 font-medium">{patient.department}</p>
                                    <p className="text-[10px] text-slate-400">{patient.hospital}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${patient.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {patient.status}
                                    </span>
                                    {patient.ward && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" /> {patient.ward} {patient.bedNumber ? `(Bed: ${patient.bedNumber})` : ''}
                                        </p>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Calendar className="w-3 h-3" />
                                        {patient.admissionDate || patient.casualtyArrivalDate || 'N/A'}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 pl-5">Dr. {patient.doctor}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setViewProfile(patient)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition-all"
                                    >
                                        View Profile
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default PatientsDB;