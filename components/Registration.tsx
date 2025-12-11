import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Department, HospitalName, PatientType, Patient, BedStatus, Invoice, Ward, UserRole } from '../types';
import { Search, UserPlus, CreditCard, ChevronRight, Calendar, Banknote, Receipt, Plus, X, Trash2, Printer, FileText, CheckCircle, BedDouble, Activity, Shield, Users, Clock, AlertCircle, IndianRupee, Gavel, Mic, CalendarClock } from 'lucide-react';
import { HOSPITAL_DEPARTMENTS, MOCK_AUTH_DB } from '../services/mockData';
import SearchableSelect from './SearchableSelect';

interface RegistrationProps {
  onRegister: (patient: Patient) => void;
  onAddInvoice: (inv: Invoice) => void;
  selectedHospital: HospitalName | 'All';
  patients: Patient[];
  wards: Ward[];
  updateBedStatus?: (wardId: string, bedId: string, status: BedStatus, patientId?: string) => void;
}

interface RegistrationReceipt {
  patient: Patient;
  invoice: Invoice;
  appointment?: {
      date: string;
      time: string;
      doctor: string;
  };
}

const Registration: React.FC<RegistrationProps> = ({ onRegister, onAddInvoice, selectedHospital, patients, wards, updateBedStatus }) => {
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
  // IPD Mode State: Existing Patient vs New Direct Admission
  const [ipdMode, setIpdMode] = useState<'Existing' | 'New'>('Existing');
  
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

  // Appointment Scheduling State
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

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

  // Mock Slots Generator
  const generateSlots = () => {
      return ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM'];
  };

  // Speech Recognition Helper
  const startListening = (setter: (val: string) => void, currentVal: string = '') => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setter(currentVal ? `${currentVal} ${transcript}` : transcript);
      };
      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
    }
  };

  const scrollToTop = () => {
      const container = document.getElementById('main-scroll-container');
      if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleOpdSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Use uhid from form if Existing, else generate
      const uhid = opdMode === 'Existing' && opdForm.uhid ? opdForm.uhid : generateUHID(opdForm.hospital);
      const safeAge = parseInt(opdForm.age) || 0;

      const newPatient: Patient = {
          id: Date.now().toString(),
          uhid: uhid,
          name: opdForm.name || 'Unknown Patient',
          age: safeAge,
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
          invoice: newInvoice,
          appointment: scheduleFollowUp && appointmentDate && appointmentTime ? {
              date: appointmentDate,
              time: appointmentTime,
              doctor: opdForm.doctor || 'Duty Doctor'
          } : undefined
      });
      
      // Scroll to top
      scrollToTop();

      // Reset Form
      setOpdForm(prev => ({ ...prev, uhid: '', name: '', age: '', mobile: '', address: '', idProofNumber: '', abha: '', legalStatus: 'Non-MLC' }));
      setSearchQuery('');
      setOpdBilling({scheme: 'General', regFee: 10, consultFee: 50, discount: 0, tax: 0});
      setScheduleFollowUp(false);
      setAppointmentDate('');
      setAppointmentTime('');
  };

  const handleIpdSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Determine patient source: Existing or New Direct Admission
      let admissionPatient: Patient | null = null;

      if (ipdMode === 'Existing') {
          if (!selectedPatientForAdmission) return;
          admissionPatient = selectedPatientForAdmission;
      } else {
          // Validate New Patient Fields (using opdForm state which holds demographics)
          if (!opdForm.name) {
              alert("Please complete the patient demographics (Name, Age, Mobile) for new admission.");
              return;
          }
          
          const safeAge = parseInt(opdForm.age) || 0;

          admissionPatient = {
              id: Date.now().toString(),
              uhid: generateUHID(ipdForm.hospital),
              name: opdForm.name,
              age: safeAge,
              gender: opdForm.gender as any,
              mobile: opdForm.mobile,
              address: opdForm.address,
              type: PatientType.IPD, // Directly IPD
              hospital: ipdForm.hospital,
              department: ipdForm.department,
              doctor: ipdForm.doctor || 'Duty Doctor',
              status: 'Active',
              admissionDate: ipdForm.admissionDate.split('T')[0],
              idProof: { type: opdForm.idProofType, number: opdForm.idProofNumber },
              abhaId: opdForm.abha,
              legalStatus: opdForm.legalStatus
          };
      }

      if (!admissionPatient) return;

      // Check for Double Booking / Already Admitted
      // Strict check: if status is active IPD, block.
      if (ipdMode === 'Existing' && admissionPatient.type === PatientType.IPD && admissionPatient.status === 'Active') {
          alert(`Patient ${admissionPatient.name} is ALREADY admitted in ${admissionPatient.ward || 'a ward'} (Bed: ${admissionPatient.bedNumber || 'Unassigned'}). Cannot re-admit active patient.`);
          return;
      }

      const admissionId = `IPD-${Math.floor(Math.random() * 100000)}`;
      const admissionType = ipdForm.admissionType;
      
      // Zero amount if not General
      const isPaid = admissionType === 'General';
      const advance = isPaid ? ipdForm.advanceAmount : 0;

      const updatedPatient: Patient = {
          ...admissionPatient,
          type: PatientType.IPD,
          admissionDate: ipdForm.admissionDate.split('T')[0],
          admissionId: admissionId,
          doctor: ipdForm.doctor,
          ward: selectedWardData?.name,
          bedNumber: selectedWardData?.beds.find(b => b.id === ipdForm.bedId)?.number,
          diagnosis: ipdForm.diagnosis,
          status: 'Active', // Ensure active status
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

      // CRITICAL: Update the Bed Status to link this patient to the bed
      if (updateBedStatus && ipdForm.wardId && ipdForm.bedId) {
          updateBedStatus(ipdForm.wardId, ipdForm.bedId, BedStatus.OCCUPIED, updatedPatient.id);
      }
      
      setLastReceipt({
          patient: updatedPatient,
          invoice: newInvoice
      });

      // Scroll to top
      scrollToTop();

      // Reset
      setSelectedPatientForAdmission(null);
      setIpdForm(prev => ({ ...prev, diagnosis: '', wardId: '', bedId: '', emergencyName: '', emergencyMobile: '', advanceAmount: 500 }));
      if (ipdMode === 'New') {
          // Clear demographics if we just created a new patient
          setOpdForm(prev => ({ ...prev, name: '', age: '', mobile: '', address: '', idProofNumber: '', abha: '' }));
      }
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

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1";

  // Check active admission for selected patient
  const isSelectedPatientActiveIPD = selectedPatientForAdmission?.type === PatientType.IPD && selectedPatientForAdmission?.status === 'Active';

  return (
    <div className="space-y-6 animate-slide-down">
        
        {/* Receipt Modal Portal */}
        {lastReceipt && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="bg-green-600 p-6 text-center text-white flex-shrink-0">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-white/90" />
                        <h2 className="text-xl font-bold">
                            {lastReceipt.patient.type === 'OPD' ? 'OPD Registration Successful' : 'IPD Admission Successful'}
                        </h2>
                        <p className="text-white/90 opacity-90 text-sm mt-1">UHID: {lastReceipt.patient.uhid}</p>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
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
                                <span className="font-bold text-slate-800">{lastReceipt.patient.ward || 'Not Assigned'} / {lastReceipt.patient.bedNumber || 'N/A'}</span>
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

                        {/* Appointment Details */}
                        {lastReceipt.appointment && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2 animate-in fade-in">
                                <div className="flex items-center gap-2 mb-1">
                                    <CalendarClock className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-bold text-blue-800 uppercase">Follow-up Scheduled</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-700">
                                    <span>{new Date(lastReceipt.appointment.date).toLocaleDateString()}</span>
                                    <span className="font-bold">{lastReceipt.appointment.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Dr. {lastReceipt.appointment.doctor}</p>
                            </div>
                        )}

                        <div className="flex justify-between pt-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">Total Payable</span>
                            <div className="bg-slate-200/50 px-3 py-1 rounded text-slate-800 font-bold text-xl">₹ {lastReceipt.invoice.amount}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={() => alert("Printing...")} className="flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                                <Printer className="w-4 h-4" /> Print Receipt
                            </button>
                            <button onClick={() => {
                                setLastReceipt(null);
                                scrollToTop();
                            }} className="flex items-center justify-center gap-2 py-2 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700">
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
                             <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                placeholder="Search UHID or Mobile Number..." 
                                className={`${inputClass} pl-10`}
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
                                <div>
                                    <label className={labelClass}>Full Name <span className="text-red-500">*</span> <button type="button" onClick={() => startListening((val) => setOpdForm({...opdForm, name: val}), opdForm.name)} className="ml-2 text-blue-600 hover:bg-blue-100 p-0.5 rounded-full inline-block" title="Speech to Text"><Mic className="w-3 h-3 inline"/></button></label>
                                    <input required type="text" className={inputClass} value={opdForm.name} onChange={e => setOpdForm({...opdForm, name: e.target.value})} />
                                </div>
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
                                <div>
                                    <label className={labelClass}>Address <button type="button" onClick={() => startListening((val) => setOpdForm({...opdForm, address: val}), opdForm.address)} className="ml-2 text-blue-600 hover:bg-blue-100 p-0.5 rounded-full inline-block" title="Speech to Text"><Mic className="w-3 h-3 inline"/></button></label>
                                    <input type="text" className={inputClass} value={opdForm.address} onChange={e => setOpdForm({...opdForm, address: e.target.value})} />
                                </div>
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

                        {/* Follow-up Appointment Scheduling */}
                        <div className="mb-6 border-t border-slate-100 pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input 
                                    type="checkbox" 
                                    id="scheduleFollowUp"
                                    checked={scheduleFollowUp}
                                    onChange={(e) => setScheduleFollowUp(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="scheduleFollowUp" className="text-sm font-bold text-slate-700 select-none cursor-pointer flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4 text-blue-600" /> Schedule Follow-up Appointment
                                </label>
                            </div>

                            {scheduleFollowUp && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Select Appointment Slot</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className={labelClass}>Follow-up Date</label>
                                            <input 
                                                type="date" 
                                                min={new Date().toISOString().split('T')[0]}
                                                className={inputClass} 
                                                value={appointmentDate} 
                                                onChange={(e) => {
                                                    setAppointmentDate(e.target.value);
                                                    setAppointmentTime(''); // Reset time when date changes
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Available Slots (Dr. {opdForm.doctor || 'Duty Doctor'})</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {appointmentDate ? generateSlots().map(slot => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setAppointmentTime(slot)}
                                                        className={`px-2 py-2 text-xs font-bold rounded border transition-all ${appointmentTime === slot ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-blue-200 hover:border-blue-400'}`}
                                                    >
                                                        {slot}
                                                    </button>
                                                )) : (
                                                    <div className="col-span-3 text-xs text-slate-400 italic py-2">Select a date first.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {appointmentDate && appointmentTime && (
                                        <div className="flex items-center gap-2 text-xs text-blue-800 bg-blue-100/50 p-2 rounded border border-blue-200">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Appointment confirmed for <strong>{new Date(appointmentDate).toLocaleDateString()}</strong> at <strong>{appointmentTime}</strong> with <strong>{opdForm.doctor || 'Duty Doctor'}</strong></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Registration Billing Section (Moved inside Form) */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Billing Information</h4>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className={labelClass}>Scheme / Category</label>
                                    <select className={inputClass} value={opdBilling.scheme} onChange={e => setOpdBilling({...opdBilling, scheme: e.target.value})}>
                                        <option>General</option>
                                        <option>Ayushman Bharat</option>
                                        <option>BPL</option>
                                        <option>Staff</option>
                                        <option>Senior Citizen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Payment Mode</label>
                                    <select className={inputClass} value={opdForm.paymentMode} onChange={e => setOpdForm({...opdForm, paymentMode: e.target.value})}>
                                        <option>Cash</option>
                                        <option>UPI</option>
                                        <option>Card</option>
                                    </select>
                                </div>
                            </div>
                            {opdBilling.scheme === 'General' && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClass}>Reg Fee</label><input type="number" className={inputClass} value={opdBilling.regFee} onChange={e => setOpdBilling({...opdBilling, regFee: Number(e.target.value)})} /></div>
                                    <div><label className={labelClass}>Consultation</label><input type="number" className={inputClass} value={opdBilling.consultFee} onChange={e => setOpdBilling({...opdBilling, consultFee: Number(e.target.value)})} /></div>
                                    <div><label className={labelClass}>Total Payable</label><div className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800">₹ {opdTotal}</div></div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2">
                                <Receipt className="w-4 h-4" /> Register & Generate Invoice
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* IPD FLOW */}
        {activeTab === 'IPD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BedDouble className="w-5 h-5 text-purple-600" /> IPD Admission
                        </h3>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            <button onClick={() => setIpdMode('Existing')} className={`px-3 py-1 text-xs font-bold rounded ${ipdMode === 'Existing' ? 'bg-white shadow text-purple-700' : 'text-slate-500'}`}>Existing Patient</button>
                            <button onClick={() => { setIpdMode('New'); setSelectedPatientForAdmission(null); }} className={`px-3 py-1 text-xs font-bold rounded ${ipdMode === 'New' ? 'bg-white shadow text-purple-700' : 'text-slate-500'}`}>New (Direct)</button>
                        </div>
                    </div>

                    <form onSubmit={handleIpdSubmit}>
                        {ipdMode === 'Existing' && (
                            <div className="mb-6 relative">
                                <label className={labelClass}>Select Patient to Admit</label>
                                <SearchableSelect 
                                    options={patients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }))}
                                    value={selectedPatientForAdmission?.id || ''}
                                    onChange={(val) => {
                                        const p = patients.find(pat => pat.id === val);
                                        setSelectedPatientForAdmission(p || null);
                                    }}
                                    placeholder="Search Patient..."
                                />
                                {selectedPatientForAdmission && (
                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-blue-900">{selectedPatientForAdmission.name}</p>
                                            <p className="text-xs text-blue-700">{selectedPatientForAdmission.age}Y / {selectedPatientForAdmission.gender} • {selectedPatientForAdmission.mobile}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${selectedPatientForAdmission.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {selectedPatientForAdmission.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(ipdMode === 'New' || selectedPatientForAdmission) && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                {/* If New, show simplified demographics */}
                                {ipdMode === 'New' && (
                                    <div className="mb-6 p-4 border border-slate-200 rounded-xl bg-slate-50">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Patient Details</h4>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div><label className={labelClass}>Name</label><input required type="text" className={inputClass} value={opdForm.name} onChange={e => setOpdForm({...opdForm, name: e.target.value})} /></div>
                                            <div><label className={labelClass}>Mobile</label><input required type="tel" className={inputClass} value={opdForm.mobile} onChange={e => setOpdForm({...opdForm, mobile: e.target.value})} /></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div><label className={labelClass}>Age</label><input required type="number" className={inputClass} value={opdForm.age} onChange={e => setOpdForm({...opdForm, age: e.target.value})} /></div>
                                            <div>
                                                <label className={labelClass}>Gender</label>
                                                <select className={inputClass} value={opdForm.gender} onChange={e => setOpdForm({...opdForm, gender: e.target.value})}>
                                                    <option>Male</option><option>Female</option><option>Other</option>
                                                </select>
                                            </div>
                                            <div><label className={labelClass}>Address</label><input type="text" className={inputClass} value={opdForm.address} onChange={e => setOpdForm({...opdForm, address: e.target.value})} /></div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Admission Details</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div><label className={labelClass}>Admission Date</label><input type="datetime-local" className={inputClass} value={ipdForm.admissionDate} onChange={e => setIpdForm({...ipdForm, admissionDate: e.target.value})} /></div>
                                        <div><label className={labelClass}>Admitting Doctor</label><SearchableSelect options={doctorsList.map(d => ({label: d.name, value: d.name}))} value={ipdForm.doctor} onChange={v => setIpdForm({...ipdForm, doctor: v})} /></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className={labelClass}>Hospital Block</label>
                                            <select className={inputClass} value={ipdForm.hospital} onChange={e => setIpdForm({...ipdForm, hospital: e.target.value as any, wardId: '', bedId: ''})} disabled={selectedHospital !== 'All'}>
                                                {Object.values(HospitalName).map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Department</label>
                                            <select className={inputClass} value={ipdForm.department} onChange={e => setIpdForm({...ipdForm, department: e.target.value as any, wardId: '', bedId: ''})}>
                                                {HOSPITAL_DEPARTMENTS[ipdForm.hospital].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className={labelClass}>Select Ward</label>
                                            <select required className={inputClass} value={ipdForm.wardId} onChange={e => setIpdForm({...ipdForm, wardId: e.target.value, bedId: ''})}>
                                                <option value="">-- Choose Ward --</option>
                                                {availableWards.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Select Bed</label>
                                            <select required className={inputClass} value={ipdForm.bedId} onChange={e => setIpdForm({...ipdForm, bedId: e.target.value})} disabled={!ipdForm.wardId}>
                                                <option value="">-- Choose Bed --</option>
                                                {availableBeds.map(b => <option key={b.id} value={b.id}>{b.number}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className={labelClass}>Provisional Diagnosis</label>
                                        <input type="text" className={inputClass} value={ipdForm.diagnosis} onChange={e => setIpdForm({...ipdForm, diagnosis: e.target.value})} placeholder="Admitting Diagnosis..." />
                                    </div>
                                </div>

                                <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-3">Billing & Insurance</h4>
                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                        <div>
                                            <label className={labelClass}>Admission Type</label>
                                            <select className={inputClass} value={ipdForm.admissionType} onChange={e => setIpdForm({...ipdForm, admissionType: e.target.value})}>
                                                <option value="General">General (Cash)</option>
                                                <option value="Insurance">Insurance / TPA</option>
                                                <option value="Ayushman Bharat">Ayushman Bharat</option>
                                                <option value="Govt">Govt Scheme</option>
                                            </select>
                                        </div>
                                        {ipdForm.admissionType === 'General' ? (
                                            <div>
                                                <label className={labelClass}>Advance Deposit (₹)</label>
                                                <input type="number" className={inputClass} value={ipdForm.advanceAmount} onChange={e => setIpdForm({...ipdForm, advanceAmount: Number(e.target.value)})} />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className={labelClass}>Policy / Card Number</label>
                                                <input type="text" className={inputClass} value={ipdForm.policyNumber} onChange={e => setIpdForm({...ipdForm, policyNumber: e.target.value})} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-500/30 flex items-center gap-2">
                                        <BedDouble className="w-4 h-4" /> Admit Patient
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Registration;