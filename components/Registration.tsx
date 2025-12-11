import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Department, HospitalName, PatientType, Patient, BedStatus, Invoice, Ward, UserRole } from '../types';
import { Search, UserPlus, CreditCard, ChevronRight, Calendar, Banknote, Receipt, Plus, X, Trash2, Printer, FileText, CheckCircle, BedDouble, Activity, Shield, Users, Clock, AlertCircle, IndianRupee, Gavel } from 'lucide-react';
import { HOSPITAL_DEPARTMENTS, MOCK_AUTH_DB } from '../services/mockData';
import SearchableSelect from './SearchableSelect';

interface RegistrationProps {
  onRegister: (patient: Patient) => void;
  onAddInvoice: (inv: Invoice) => void;
  selectedHospital: HospitalName | 'All';
  patients: Patient[];
  wards: Ward[];
}

interface RegistrationReceipt {
  patient: Patient;
  invoice: Invoice;
}

const Registration: React.FC<RegistrationProps> = ({ onRegister, onAddInvoice, selectedHospital, patients, wards }) => {
  const [activeTab, setActiveTab] = useState<'OPD' | 'IPD'>('OPD');
  const [lastReceipt, setLastReceipt] = useState<RegistrationReceipt | null>(null);

  // Stats Logic
  const today = new Date().toISOString().split('T')[0];
  const stats = {
      opdToday: patients.filter(p => p.type === PatientType.OPD && p.admissionDate === today).length + 142, // Mock + Real
      ipdActive: patients.filter(p => p.type === PatientType.IPD && p.status === 'Active').length,
  };

  // --- FORM STATES ---
  const defaultHospital = selectedHospital === 'All' ? HospitalName.KR_HOSPITAL : selectedHospital;

  // Common / OPD Form State
  const [opdMode, setOpdMode] = useState<'New' | 'Existing'>('New');
  const [searchQuery, setSearchQuery] = useState('');
  const [opdForm, setOpdForm] = useState({
      uhid: '',
      name: '', age: '', gender: 'Male', mobile: '', address: '',
      idProofType: 'Aadhaar', idProofNumber: '', abha: '',
      hospital: defaultHospital, department: HOSPITAL_DEPARTMENTS[defaultHospital][0],
      doctor: '',
      visitType: 'New Case',
      paymentMode: 'Cash',
      legalStatus: 'Non-MLC' as 'MLC' | 'Non-MLC'
  });

  // OPD Billing State
  const [opdBilling, setOpdBilling] = useState({
      scheme: 'General',
      regFee: 10,
      consultFee: 50,
      discount: 0,
      tax: 0
  });

  // Calculate OPD Total - Logic: If scheme is NOT General, Bill is 0.
  const opdTotal = opdBilling.scheme === 'General' 
    ? Math.max(0, (Number(opdBilling.regFee) + Number(opdBilling.consultFee) + Number(opdBilling.tax)) - Number(opdBilling.discount))
    : 0;

  // IPD Form State
  const [ipdSearchQuery, setIpdSearchQuery] = useState('');
  const [selectedPatientForAdmission, setSelectedPatientForAdmission] = useState<Patient | null>(null);
  const [ipdForm, setIpdForm] = useState({
      admissionDate: new Date().toISOString().slice(0, 16), // datetime-local format
      doctor: '',
      wardId: '',
      bedId: '',
      admissionType: 'General', // General, Free, Ayushman, BPL, Insurance
      diagnosis: '',
      tpaName: '',
      policyNumber: '',
      emergencyName: '',
      emergencyMobile: '',
      hospital: defaultHospital,
      department: HOSPITAL_DEPARTMENTS[defaultHospital][0],
      advanceAmount: 500
  });

  // Derived Data
  const hospitalOptions = Object.values(HospitalName).map(h => ({ label: h, value: h }));
  
  // Filter Wards based on selected hospital and department in IPD form
  // Using passed 'wards' prop instead of mock data
  const availableWards = wards.filter(w => 
      (selectedHospital === 'All' || w.hospital === ipdForm.hospital) &&
      w.department === ipdForm.department
  );

  const selectedWardData = wards.find(w => w.id === ipdForm.wardId);
  const availableBeds = selectedWardData ? selectedWardData.beds.filter(b => b.status === BedStatus.AVAILABLE) : [];

  const doctorsList = MOCK_AUTH_DB
      .filter(u => u.user.role === UserRole.CONSULTANT)
      .map(u => u.user)
      .filter(u => 
        (selectedHospital === 'All' || u.hospital === (activeTab === 'OPD' ? opdForm.hospital : ipdForm.hospital)) &&
        u.department === (activeTab === 'OPD' ? opdForm.department : ipdForm.department)
      );

  // --- HANDLERS ---

  // Generate IDs
  const generateUHID = (hospital: string) => {
      const code = hospital === HospitalName.KR_HOSPITAL ? 'KRH' : hospital === HospitalName.CHELUVAMBA ? 'CHE' : 'GEN';
      return `MMC-${code}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleOpdSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Use uhid from form if Existing, else generate
      const uhid = opdMode === 'Existing' && opdForm.uhid ? opdForm.uhid : generateUHID(opdForm.hospital);
      
      const newPatient: Patient = {
          id: Date.now().toString(),
          uhid: uhid,
          name: opdForm.name,
          age: parseInt(opdForm.age),
          gender: opdForm.gender as any,
          mobile: opdForm.mobile,
          address: opdForm.address,
          type: PatientType.OPD,
          hospital: opdForm.hospital,
          department: opdForm.department,
          doctor: opdForm.doctor || 'Duty Doctor',
          status: 'Active',
          admissionDate: today,
          visitType: opdForm.visitType as any,
          opdVisitId: `OPD-${Math.floor(Math.random() * 100000)}`,
          idProof: { type: opdForm.idProofType, number: opdForm.idProofNumber },
          abhaId: opdForm.abha,
          legalStatus: opdForm.legalStatus
      };

      // Create Invoice
      const newInvoice: Invoice = {
          id: `INV-OPD-${Math.floor(Math.random() * 10000)}`,
          patientName: newPatient.name,
          uhid: newPatient.uhid,
          date: today,
          amount: opdTotal,
          status: opdTotal === 0 ? 'Waived' : 'Paid',
          mode: opdTotal === 0 ? '-' : opdForm.paymentMode,
          scheme: opdBilling.scheme,
          items: ['OPD Registration', 'Consultation Charge'],
          breakdown: {
              regFee: Number(opdBilling.regFee),
              consultFee: Number(opdBilling.consultFee),
              tax: Number(opdBilling.tax),
              discount: Number(opdBilling.discount)
          }
      };

      onRegister(newPatient);
      onAddInvoice(newInvoice);

      setLastReceipt({
          patient: newPatient,
          invoice: newInvoice
      });
      
      // Reset Form
      setOpdForm(prev => ({ ...prev, uhid: '', name: '', age: '', mobile: '', address: '', idProofNumber: '', abha: '', legalStatus: 'Non-MLC' }));
      setSearchQuery('');
      setOpdBilling({scheme: 'General', regFee: 10, consultFee: 50, discount: 0, tax: 0});
  };

  const handleIpdSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedPatientForAdmission) return;

      const admissionId = `IPD-${Math.floor(Math.random() * 100000)}`;
      const admissionType = ipdForm.admissionType;
      
      // Zero amount if not General
      const isPaid = admissionType === 'General';
      const advance = isPaid ? ipdForm.advanceAmount : 0;

      const updatedPatient: Patient = {
          ...selectedPatientForAdmission,
          type: PatientType.IPD,
          admissionDate: ipdForm.admissionDate.split('T')[0],
          admissionId: admissionId,
          doctor: ipdForm.doctor,
          ward: selectedWardData?.name,
          bedNumber: selectedWardData?.beds.find(b => b.id === ipdForm.bedId)?.number,
          diagnosis: ipdForm.diagnosis,
          admissionType: admissionType as any,
          insuranceDetails: admissionType === 'Insurance' ? {
              tpaName: ipdForm.tpaName,
              policyNumber: ipdForm.policyNumber
          } : undefined,
          emergencyContact: {
              name: ipdForm.emergencyName,
              mobile: ipdForm.emergencyMobile,
              relation: 'Relative'
          }
      };

      // Create Invoice for IPD Admission
      const newInvoice: Invoice = {
          id: `INV-IPD-${Math.floor(Math.random() * 10000)}`,
          patientName: updatedPatient.name,
          uhid: updatedPatient.uhid,
          date: today,
          amount: Number(advance),
          status: isPaid ? 'Paid' : 'Waived',
          mode: isPaid ? 'Cash' : '-',
          scheme: admissionType,
          items: ['IPD Admission Advance / Deposit'],
          breakdown: {
              other: Number(advance)
          }
      };

      onRegister(updatedPatient); 
      onAddInvoice(newInvoice);
      
      setLastReceipt({
          patient: updatedPatient,
          invoice: newInvoice
      });

      // Reset
      setSelectedPatientForAdmission(null);
      setIpdForm(prev => ({ ...prev, diagnosis: '', wardId: '', bedId: '', emergencyName: '', emergencyMobile: '', advanceAmount: 500 }));
  };

  // Search Helpers
  const searchPatients = (query: string) => {
      if (!query) return [];
      return patients.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          p.uhid.toLowerCase().includes(query.toLowerCase()) || 
          p.mobile.includes(query)
      );
  };

  // Pre-fill OPD form if existing selected
  const selectExistingOpd = (p: Patient) => {
      setOpdForm(prev => ({
          ...prev,
          uhid: p.uhid, // Store UHID
          name: p.name,
          age: p.age.toString(),
          gender: p.gender,
          mobile: p.mobile,
          address: p.address || '',
          hospital: selectedHospital === 'All' ? p.hospital : selectedHospital,
          department: p.department,
          abha: p.abhaId || '',
          legalStatus: p.legalStatus || 'Non-MLC'
      }));
      setSearchQuery(''); // Clear search query automatically
      // Adjust billing for followup if needed
      setOpdBilling(prev => ({...prev, regFee: 0}));
  };

  const inputClass = "w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-6 animate-slide-down">
        
        {/* Receipt Modal Portal */}
        {lastReceipt && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                    <div className={`${lastReceipt.invoice.amount === 0 ? 'bg-indigo-600' : 'bg-green-600'} p-6 text-center text-white`}>
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-white/90" />
                        <h2 className="text-xl font-bold">
                            {lastReceipt.patient.type === 'OPD' ? 'OPD Registration Successful' : 'IPD Admission Successful'}
                        </h2>
                        <p className="text-white/90 opacity-90 text-sm mt-1">UHID: {lastReceipt.patient.uhid}</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">Patient Name</span>
                            <span className="font-bold text-slate-800">{lastReceipt.patient.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">{lastReceipt.patient.type === 'OPD' ? 'Visit ID' : 'Admission ID'}</span>
                            <span className="font-mono text-slate-700">{lastReceipt.patient.type === 'OPD' ? lastReceipt.patient.opdVisitId : lastReceipt.patient.admissionId}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">Billing Type</span>
                            <span className="font-bold text-blue-700">{lastReceipt.invoice.scheme}</span>
                        </div>
                        {lastReceipt.patient.legalStatus === 'MLC' && (
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs text-red-500 font-bold uppercase">Case Type</span>
                                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">MEDICO-LEGAL (MLC)</span>
                            </div>
                        )}
                        {lastReceipt.patient.type === 'IPD' && (
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs text-slate-500 font-bold uppercase">Ward / Bed</span>
                                <span className="font-bold text-slate-800">{lastReceipt.patient.ward} / {lastReceipt.patient.bedNumber}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">Invoice No</span>
                            <span className="font-mono text-slate-700">{lastReceipt.invoice.id}</span>
                        </div>
                        
                        {/* Breakdown Display */}
                        {lastReceipt.invoice.breakdown && (
                             <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                                {lastReceipt.invoice.breakdown.regFee !== undefined && <div className="flex justify-between text-slate-600"><span>Registration:</span><span>₹{lastReceipt.invoice.breakdown.regFee}</span></div>}
                                {lastReceipt.invoice.breakdown.consultFee !== undefined && <div className="flex justify-between text-slate-600"><span>Consultation:</span><span>₹{lastReceipt.invoice.breakdown.consultFee}</span></div>}
                                {lastReceipt.invoice.breakdown.tax !== undefined && Number(lastReceipt.invoice.breakdown.tax) > 0 && <div className="flex justify-between text-slate-600"><span>Tax:</span><span>₹{lastReceipt.invoice.breakdown.tax}</span></div>}
                                {lastReceipt.invoice.breakdown.discount !== undefined && Number(lastReceipt.invoice.breakdown.discount) > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Discount:</span><span>-₹{lastReceipt.invoice.breakdown.discount}</span></div>}
                                {lastReceipt.invoice.breakdown.other !== undefined && <div className="flex justify-between text-slate-600"><span>Advance/Deposit:</span><span>₹{lastReceipt.invoice.breakdown.other}</span></div>}
                             </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">Total Paid</span>
                            <span className="font-bold text-xl text-slate-800">₹ {lastReceipt.invoice.amount}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={() => alert("Printing...")} className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                                <Printer className="w-4 h-4" /> Print Receipt
                            </button>
                            <button onClick={() => setLastReceipt(null)} className="flex items-center justify-center gap-2 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Top Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                <div><p className="text-xs text-slate-500 font-bold uppercase">OPD Visits Today</p><h3 className="text-xl font-bold text-slate-800">{stats.opdToday}</h3></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><BedDouble className="w-5 h-5" /></div>
                <div><p className="text-xs text-slate-500 font-bold uppercase">IPD Admissions</p><h3 className="text-xl font-bold text-slate-800">{stats.ipdActive}</h3></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Activity className="w-5 h-5" /></div>
                <div><p className="text-xs text-slate-500 font-bold uppercase">Bed Availability</p><h3 className="text-xl font-bold text-slate-800">
                    {wards.reduce((acc, w) => acc + w.beds.filter(b => b.status === BedStatus.AVAILABLE).length, 0)} 
                    <span className="text-xs font-normal text-slate-400">/ {wards.reduce((acc, w) => acc + w.beds.length, 0)}</span>
                </h3></div>
            </div>
             <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 rounded-xl shadow-md text-white flex justify-between items-center">
                <div><p className="text-xs font-bold opacity-80 uppercase">Registration Desk</p><h3 className="text-lg font-bold">Counter 01</h3></div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Clock className="w-5 h-5" /></div>
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full md:w-fit mb-6">
            <button 
                onClick={() => setActiveTab('OPD')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'OPD' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                OPD Registration
            </button>
            <button 
                onClick={() => setActiveTab('IPD')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'IPD' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                IPD Admission
            </button>
        </div>

        {/* OPD FLOW */}
        {activeTab === 'OPD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" /> New OPD Visit
                        </h3>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button onClick={() => { setOpdMode('New'); setOpdBilling(prev => ({...prev, regFee: 10})); }} className={`px-3 py-1 text-xs font-bold rounded ${opdMode === 'New' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>New Patient</button>
                            <button onClick={() => { setOpdMode('Existing'); setOpdBilling(prev => ({...prev, regFee: 0})); }} className={`px-3 py-1 text-xs font-bold rounded ${opdMode === 'Existing' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>Existing</button>
                        </div>
                    </div>

                    {opdMode === 'Existing' && (
                        <div className="mb-6 relative">
                             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                placeholder="Search UHID or Mobile Number..." 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                             />
                             {searchQuery && (
                                 <div className="absolute z-10 w-full bg-white border border-slate-200 shadow-lg mt-1 rounded-lg max-h-48 overflow-y-auto">
                                     {searchPatients(searchQuery).map(p => (
                                         <div key={p.id} onClick={() => selectExistingOpd(p)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                                             <p className="font-bold text-sm text-slate-800">{p.name} ({p.uhid})</p>
                                             <p className="text-xs text-slate-500">{p.mobile} • {p.gender}</p>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}

                    <form onSubmit={handleOpdSubmit}>
                        {/* Demographics */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Demographics</h4>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Case Status:</label>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                                        <button 
                                            type="button" 
                                            onClick={() => setOpdForm({...opdForm, legalStatus: 'Non-MLC'})}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${opdForm.legalStatus === 'Non-MLC' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Non-MLC
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setOpdForm({...opdForm, legalStatus: 'MLC'})}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${opdForm.legalStatus === 'MLC' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Gavel className="w-3 h-3" /> MLC
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div><label className={labelClass}>Full Name <span className="text-red-500">*</span></label><input required type="text" className={inputClass} value={opdForm.name} onChange={e => setOpdForm({...opdForm, name: e.target.value})} /></div>
                                <div><label className={labelClass}>Mobile <span className="text-red-500">*</span></label><input required type="tel" maxLength={10} className={inputClass} value={opdForm.mobile} onChange={e => setOpdForm({...opdForm, mobile: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div><label className={labelClass}>Age <span className="text-red-500">*</span></label><input required type="number" className={inputClass} value={opdForm.age} onChange={e => setOpdForm({...opdForm, age: e.target.value})} /></div>
                                <div>
                                    <label className={labelClass}>Gender</label>
                                    <select className={inputClass} value={opdForm.gender} onChange={e => setOpdForm({...opdForm, gender: e.target.value})}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div><label className={labelClass}>ABHA ID</label><input type="text" className={inputClass} placeholder="Optional" value={opdForm.abha} onChange={e => setOpdForm({...opdForm, abha: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClass}>Address</label><input type="text" className={inputClass} value={opdForm.address} onChange={e => setOpdForm({...opdForm, address: e.target.value})} /></div>
                                <div>
                                    <label className={labelClass}>ID Proof</label>
                                    <div className="flex gap-2">
                                        <select className={`${inputClass} w-1/3`} value={opdForm.idProofType} onChange={e => setOpdForm({...opdForm, idProofType: e.target.value})}><option>Aadhaar</option><option>Voter ID</option><option>PAN</option></select>
                                        <input type="text" className={`${inputClass} w-2/3`} placeholder="ID Number" value={opdForm.idProofNumber} onChange={e => setOpdForm({...opdForm, idProofNumber: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visit Details */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Visit Details</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={labelClass}>Hospital</label>
                                    <SearchableSelect options={hospitalOptions} value={opdForm.hospital} onChange={(v) => setOpdForm({...opdForm, hospital: v as any, department: HOSPITAL_DEPARTMENTS[v as HospitalName][0]})} disabled={selectedHospital !== 'All'} />
                                </div>
                                <div>
                                    <label className={labelClass}>Department <span className="text-red-500">*</span></label>
                                    <SearchableSelect options={HOSPITAL_DEPARTMENTS[opdForm.hospital].map(d => ({label: d, value: d}))} value={opdForm.department} onChange={(v) => setOpdForm({...opdForm, department: v as any})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Consulting Doctor</label>
                                    <SearchableSelect options={[{label: 'Duty Doctor', value: 'Duty Doctor'}, ...doctorsList.map(d => ({label: d.name, value: d.name}))]} value={opdForm.doctor} onChange={(v) => setOpdForm({...opdForm, doctor: v})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Visit Type</label>
                                    <select className={inputClass} value={opdForm.visitType} onChange={e => setOpdForm({...opdForm, visitType: e.target.value})}>
                                        <option>New Case</option>
                                        <option>Follow Up</option>
                                        <option>Emergency</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Registration Billing Section (Moved inside Form) */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 uppercase">
                                <CreditCard className="w-4 h-4 text-green-600" /> Registration Billing
                            </h3>
                            
                            <div className="space-y-3 mb-4">
                                    <div>
                                    <label className={labelClass}>Patient Type / Scheme</label>
                                    <select 
                                        className={inputClass} 
                                        value={opdBilling.scheme} 
                                        onChange={e => setOpdBilling({...opdBilling, scheme: e.target.value})}
                                    >
                                        <option value="General">General (Paid)</option>
                                        <option value="Free">Free (Zero Bill)</option>
                                        <option value="Ayushman Bharat">Ayushman Bharat</option>
                                        <option value="BPL">BPL (Below Poverty Line)</option>
                                        <option value="Staff">Hospital Staff (Waived)</option>
                                    </select>
                                    </div>

                                    <div className={`space-y-3 transition-opacity duration-300 ${opdBilling.scheme !== 'General' ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>Reg. Fee</label><input type="number" className={inputClass} value={opdBilling.regFee} onChange={e => setOpdBilling({...opdBilling, regFee: Number(e.target.value)})} /></div>
                                        <div><label className={labelClass}>Consult Fee</label><input type="number" className={inputClass} value={opdBilling.consultFee} onChange={e => setOpdBilling({...opdBilling, consultFee: Number(e.target.value)})} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className={labelClass}>Taxes</label><input type="number" className={inputClass} value={opdBilling.tax} onChange={e => setOpdBilling({...opdBilling, tax: Number(e.target.value)})} /></div>
                                        <div><label className={labelClass}>Discount</label><input type="number" className={inputClass} value={opdBilling.discount} onChange={e => setOpdBilling({...opdBilling, discount: Number(e.target.value)})} /></div>
                                    </div>
                                    </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4 mb-4">
                                    <div className="flex justify-between items-center mb-1 text-slate-500 text-sm">
                                        <span>Subtotal</span>
                                        <span>₹{opdBilling.scheme === 'General' ? (Number(opdBilling.regFee) + Number(opdBilling.consultFee)) : 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-3 text-slate-500 text-sm">
                                        <span>Tax</span>
                                        <span>₹{opdBilling.scheme === 'General' ? opdBilling.tax : 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-bold text-slate-800">
                                        <span>Total Payable</span>
                                        <span>₹{opdTotal}</span>
                                    </div>
                            </div>

                            {opdTotal > 0 && (
                                <div>
                                    <label className={labelClass}>Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Cash', 'UPI', 'Card', 'Credit'].map(mode => (
                                            <button 
                                                key={mode}
                                                type="button"
                                                onClick={() => setOpdForm({...opdForm, paymentMode: mode})}
                                                className={`py-1.5 text-xs font-bold rounded border ${opdForm.paymentMode === mode ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white border-slate-200 text-slate-500'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {opdBilling.scheme !== 'General' && (
                                    <div className="bg-indigo-50 text-indigo-700 text-xs p-2 rounded border border-indigo-100 font-medium">
                                        Bill Amount Waived under {opdBilling.scheme}
                                    </div>
                            )}
                        </div>
                        
                         <div className="flex justify-end gap-3 mt-8">
                             <button type="button" className="px-6 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Clear Form</button>
                             <button type="submit" className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                                <Receipt className="w-4 h-4" /> Register & Generate Bill
                             </button>
                         </div>
                    </form>
                </div>
            </div>
        )}

        {/* IPD FLOW */}
        {activeTab === 'IPD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <BedDouble className="w-5 h-5 text-purple-600" /> Patient Admission (IPD)
                    </h3>

                    {/* Step 1: Select Patient */}
                    {!selectedPatientForAdmission ? (
                        <div className="mb-8">
                            <label className={labelClass}>Search Patient to Admit</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Enter Name, UHID or Mobile..." 
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-purple-500 outline-none"
                                    onChange={(e) => setIpdSearchQuery(e.target.value)}
                                />
                                {ipdSearchQuery && (
                                     <div className="absolute z-10 w-full bg-white border border-slate-200 shadow-lg mt-1 rounded-lg max-h-60 overflow-y-auto">
                                         {searchPatients(ipdSearchQuery).map(p => (
                                             <div key={p.id} onClick={() => {
                                                 setSelectedPatientForAdmission(p);
                                                 setIpdForm(prev => ({...prev, hospital: p.hospital, department: p.department})); // Default to patient's OPD dept
                                             }} className="p-4 hover:bg-purple-50 cursor-pointer border-b border-slate-50 flex justify-between items-center group">
                                                 <div>
                                                     <p className="font-bold text-slate-800 group-hover:text-purple-700">{p.name} <span className="text-xs font-normal text-slate-500">({p.age} {p.gender})</span></p>
                                                     <p className="text-xs text-slate-500">{p.uhid} • {p.mobile}</p>
                                                 </div>
                                                 <ChevronRight className="w-4 h-4 text-slate-300" />
                                             </div>
                                         ))}
                                         {searchPatients(ipdSearchQuery).length === 0 && (
                                             <div className="p-4 text-center">
                                                 <p className="text-sm text-slate-500 mb-2">Patient not found.</p>
                                                 <button onClick={() => { setActiveTab('OPD'); setOpdMode('New'); }} className="text-purple-600 font-bold text-sm hover:underline">Register New Patient in OPD First</button>
                                             </div>
                                         )}
                                     </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleIpdSubmit}>
                            {/* Selected Patient Summary */}
                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-purple-900">{selectedPatientForAdmission.name}</h4>
                                    <p className="text-xs text-purple-700">{selectedPatientForAdmission.uhid} • {selectedPatientForAdmission.age}Y / {selectedPatientForAdmission.gender}</p>
                                </div>
                                <button type="button" onClick={() => setSelectedPatientForAdmission(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white px-3 py-1 rounded border border-slate-200">Change</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className={labelClass}>Admission Date & Time</label>
                                    <input type="datetime-local" className={inputClass} required value={ipdForm.admissionDate} onChange={e => setIpdForm({...ipdForm, admissionDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Admission Type / Scheme</label>
                                    <select className={inputClass} value={ipdForm.admissionType} onChange={e => setIpdForm({...ipdForm, admissionType: e.target.value})}>
                                        <option value="General">General / Cash</option>
                                        <option value="Free">Free (Zero Bill)</option>
                                        <option value="Ayushman Bharat">Ayushman Bharat</option>
                                        <option value="BPL">BPL</option>
                                        <option value="Insurance">Private Insurance</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Financial / Deposit Section */}
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Banknote className="w-4 h-4" /> Financials
                                </h4>
                                {ipdForm.admissionType === 'General' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Initial Advance / Deposit (₹)</label>
                                            <input type="number" className={inputClass} required value={ipdForm.advanceAmount} onChange={e => setIpdForm({...ipdForm, advanceAmount: Number(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Estimated Cost (Optional)</label>
                                            <input type="number" className={inputClass} placeholder="Approx amount" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 text-green-700 text-xs p-3 rounded border border-green-100 font-bold flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Bill Amount Waived / Covered under {ipdForm.admissionType}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>Pre-Auth / Card No</label>
                                                <input type="text" className={inputClass} placeholder="Card No / Pre-Auth ID" />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Approved Amount (₹)</label>
                                                <input type="number" className={inputClass} value={ipdForm.advanceAmount} onChange={e => setIpdForm({...ipdForm, advanceAmount: Number(e.target.value)})} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bed Allocation */}
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ward & Bed Allocation</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                     <div>
                                        <label className={labelClass}>Department</label>
                                        <SearchableSelect options={HOSPITAL_DEPARTMENTS[ipdForm.hospital].map(d => ({label: d, value: d}))} value={ipdForm.department} onChange={(v) => setIpdForm({...ipdForm, department: v as any, wardId: '', bedId: ''})} />
                                     </div>
                                     <div>
                                         <label className={labelClass}>Admitting Doctor <span className="text-red-500">*</span></label>
                                         <SearchableSelect options={doctorsList.map(d => ({label: d.name, value: d.name}))} value={ipdForm.doctor} onChange={v => setIpdForm({...ipdForm, doctor: v})} />
                                     </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Select Ward</label>
                                        <select className={inputClass} required value={ipdForm.wardId} onChange={e => setIpdForm({...ipdForm, wardId: e.target.value, bedId: ''})}>
                                            <option value="">-- Choose Ward --</option>
                                            {availableWards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Select Bed</label>
                                        <select className={inputClass} required value={ipdForm.bedId} onChange={e => setIpdForm({...ipdForm, bedId: e.target.value})} disabled={!ipdForm.wardId}>
                                            <option value="">-- Choose Bed --</option>
                                            {availableBeds.map(b => <option key={b.id} value={b.id}>{b.number} (Available)</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Details */}
                            {ipdForm.admissionType === 'Insurance' && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in">
                                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4">Insurance / TPA Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClass}>TPA / Provider Name</label><input required type="text" className={inputClass} placeholder="e.g. Star Health" value={ipdForm.tpaName} onChange={e => setIpdForm({...ipdForm, tpaName: e.target.value})} /></div>
                                        <div><label className={labelClass}>Policy / Card Number</label><input required type="text" className={inputClass} placeholder="Policy No." value={ipdForm.policyNumber} onChange={e => setIpdForm({...ipdForm, policyNumber: e.target.value})} /></div>
                                    </div>
                                </div>
                            )}

                            {/* Medical & Emergency */}
                            <div className="mb-6">
                                <label className={labelClass}>Provisional Diagnosis / Reason</label>
                                <textarea className={`${inputClass} h-20 resize-none`} required placeholder="Enter admission reason..." value={ipdForm.diagnosis} onChange={e => setIpdForm({...ipdForm, diagnosis: e.target.value})}></textarea>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div><label className={labelClass}>Emergency Contact Name</label><input required type="text" className={inputClass} value={ipdForm.emergencyName} onChange={e => setIpdForm({...ipdForm, emergencyName: e.target.value})} /></div>
                                <div><label className={labelClass}>Emergency Mobile</label><input required type="tel" maxLength={10} className={inputClass} value={ipdForm.emergencyMobile} onChange={e => setIpdForm({...ipdForm, emergencyMobile: e.target.value})} /></div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button type="submit" className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md flex items-center gap-2">
                                    <BedDouble className="w-5 h-5" /> Confirm Admission & Generate Bill
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase">Bed Availability Status</h3>
                        {selectedHospital === 'All' || !availableWards.length ? (
                            <div className="text-sm text-slate-500 italic">Select hospital and department in form to view specific ward availability.</div>
                        ) : (
                            <div className="space-y-3">
                                {availableWards.map(w => {
                                    const total = w.beds.length;
                                    const free = w.beds.filter(b => b.status === BedStatus.AVAILABLE).length;
                                    const percent = Math.round((free/total)*100);
                                    return (
                                        <div key={w.id} className="border-b border-slate-50 pb-2 last:border-0">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-700">{w.name}</span>
                                                <span className={`font-bold ${free === 0 ? 'text-red-500' : 'text-green-600'}`}>{free} Free</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                <div className={`h-full ${free < 2 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${percent}%`}}></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Registration;