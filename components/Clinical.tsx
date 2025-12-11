import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MOCK_LAB_ORDERS, MOCK_ROUNDS, DISCHARGE_TEMPLATES, MOCK_REFERRALS, HOSPITAL_DEPARTMENTS, MOCK_AUTH_DB } from '../services/mockData';
import { generateDischargeSummary } from '../services/geminiService';
import { Beaker, Scissors, FileText, Sparkles, Printer, CheckCircle, BedDouble, ArrowRight, User as UserIcon, Calendar, Activity, AlertCircle, X, MapPin, List, ArrowRightLeft, Send, Save, Plus, TestTube, Search, Upload, Eye, Paperclip, Download, UserPlus, LogOut, Receipt, Gavel, Clock, MessageSquare, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { BedStatus, Ward, HospitalName, ReferralType, Department, Patient, Bed, User, UserRole, RoundNote, LabOrder, PatientType, Invoice, OTSchedule, CareTeamMessage } from '../types';
import SearchableSelect from './SearchableSelect';

interface ClinicalProps {
    selectedHospital: HospitalName | 'All';
    patients: Patient[];
    currentUser: User | null;
    wards: Ward[];
    updateBedStatus: (wardId: string, bedId: string, status: BedStatus, patientId?: string) => void;
    onUpdatePatient: (patient: Patient) => void;
    onAddInvoice: (inv: Invoice) => void;
}

const Clinical: React.FC<ClinicalProps> = ({ selectedHospital, patients, currentUser, wards, updateBedStatus, onUpdatePatient, onAddInvoice }) => {
  const [activeTab, setActiveTab] = useState<'lab' | 'ot' | 'ipd' | 'discharge' | 'referral'>('ipd');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Local state for Lab Orders to allow adding new tests
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => {
      const saved = localStorage.getItem('clinical_lab_orders');
      return saved ? JSON.parse(saved) : MOCK_LAB_ORDERS;
  });

  useEffect(() => {
      localStorage.setItem('clinical_lab_orders', JSON.stringify(labOrders));
  }, [labOrders]);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
      patientId: '',
      testName: 'Complete Blood Count (CBC)',
      department: Department.PATHOLOGY
  });

  // Lab Result Entry State
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOrderForResult, setSelectedOrderForResult] = useState<LabOrder | null>(null);
  const [labResultForm, setLabResultForm] = useState({
      resultText: '',
      attachment: null as File | null
  });

  // IPD States
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [patientDetailsTab, setPatientDetailsTab] = useState<'rounds' | 'chat'>('rounds');
  
  // Bed Assignment/Transfer Form
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignPatientId, setAssignPatientId] = useState('');

  // Patient Transfer (Occupied to New)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState({ wardId: '', bedId: '' });

  // Patient Edit (Demographics)
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState<Partial<Patient>>({});

  // Rounds State
  const [rounds, setRounds] = useState<RoundNote[]>(() => {
      const saved = localStorage.getItem('clinical_rounds');
      return saved ? JSON.parse(saved) : MOCK_ROUNDS;
  });

  useEffect(() => {
      localStorage.setItem('clinical_rounds', JSON.stringify(rounds));
  }, [rounds]);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteVitals, setNewNoteVitals] = useState('');
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [editRoundForm, setEditRoundForm] = useState({ note: '', vitals: '' });

  // Care Team Chat State
  const [careTeamMessages, setCareTeamMessages] = useState<CareTeamMessage[]>(() => {
      const saved = localStorage.getItem('clinical_messages');
      return saved ? JSON.parse(saved) : [
          { id: 'M1', patientId: '1', senderName: 'Dr. Suresh', senderRole: UserRole.CONSULTANT, content: 'Please monitor BP every 2 hours. Keep NBM for tomorrow surgery.', timestamp: '2024-05-19T18:30', priority: 'Urgent' },
          { id: 'M2', patientId: '1', senderName: 'Nurse Ratna', senderRole: UserRole.STAFF_NURSE, content: 'Noted doctor. Patient anxiety is high, sedatives given as per chart.', timestamp: '2024-05-19T18:45', priority: 'Routine' }
      ];
  });

  useEffect(() => {
      localStorage.setItem('clinical_messages', JSON.stringify(careTeamMessages));
  }, [careTeamMessages]);

  const [newChatMsg, setNewChatMsg] = useState('');
  const [chatPriority, setChatPriority] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // OT Scheduler State
  const [otSchedule, setOtSchedule] = useState<OTSchedule[]>(() => {
      const saved = localStorage.getItem('clinical_ot_schedule');
      return saved ? JSON.parse(saved) : [
          {
              id: 'OT-101',
              patientId: '1',
              procedureName: 'Laparoscopic Appendectomy',
              diagnosis: 'Acute Appendicitis',
              theaterId: 'OT-1 (General)',
              surgeon: 'Dr. Suresh',
              scheduledTime: '2024-05-20T09:00',
              status: 'Scheduled',
              hospital: HospitalName.KR_HOSPITAL,
              anesthesiaType: 'GA'
          }
      ];
  });

  useEffect(() => {
      localStorage.setItem('clinical_ot_schedule', JSON.stringify(otSchedule));
  }, [otSchedule]);

  const [showOtModal, setShowOtModal] = useState(false);
  const [otForm, setOtForm] = useState({
      patientId: '',
      procedureName: '',
      diagnosis: '',
      theaterId: 'OT-1 (General)',
      surgeon: '',
      scheduledTime: '',
      anesthesiaType: 'GA'
  });

  // Filtered Wards based on Hospital
  // Using passed props `wards`
  const filteredWards = selectedHospital === 'All' 
    ? wards 
    : wards.filter(w => w.hospital === selectedHospital);

  // Determine which tabs are visible based on role
  const visibleTabs = React.useMemo(() => {
    if (!currentUser) return [];
    
    switch(currentUser.role) {
        case UserRole.LAB_TECHNICIAN:
        case UserRole.PATHOLOGIST:
        case UserRole.RADIOLOGIST:
            return ['lab'];
        case UserRole.STAFF_NURSE:
            return ['ipd'];
        case UserRole.CONSULTANT:
        case UserRole.SUPER_ADMIN:
        case UserRole.HOSPITAL_ADMIN:
        case UserRole.DEPT_ADMIN:
            return ['ipd', 'referral', 'lab', 'ot', 'discharge'];
        case UserRole.CASUALTY_MO:
            return ['ipd', 'lab', 'ot'];
        default:
            return ['ipd']; // Default fallback
    }
  }, [currentUser]);

  // Set default tab based on visibility
  useEffect(() => {
      if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
          setActiveTab(visibleTabs[0] as any);
      }
  }, [visibleTabs]);

  // Initialize selection when wards change
  useEffect(() => {
    if (filteredWards.length > 0) {
        if (!filteredWards.find(w => w.id === selectedWardId)) {
            setSelectedWardId(filteredWards[0].id);
            setSelectedBedId(null);
        }
    } else {
        setSelectedWardId('');
        setSelectedBedId(null);
    }
  }, [selectedHospital, filteredWards.length, wards]); 

  // Auto-scroll chat to bottom
  useEffect(() => {
      if (patientDetailsTab === 'chat' && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [patientDetailsTab, careTeamMessages]);

  // Referral State
  const [referralForm, setReferralForm] = useState({
      patientId: '',
      targetHospital: HospitalName.KR_HOSPITAL,
      targetDepartment: HOSPITAL_DEPARTMENTS[HospitalName.KR_HOSPITAL][0],
      urgency: 'Routine',
      notes: ''
  });

  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [notes, setNotes] = useState({
    diagnosis: '',
    treatment: '',
    labResults: ''
  });

  const selectedWard = wards.find(w => w.id === selectedWardId);
  const selectedBed = selectedWard?.beds.find(b => b.id === selectedBedId);
  const bedPatient = selectedBed?.patientId ? patients.find(p => p.id === selectedBed.patientId) : null;
  const patientRounds = bedPatient ? rounds.filter(r => r.patientId === bedPatient.id) : [];
  const patientMessages = bedPatient ? careTeamMessages.filter(m => m.patientId === bedPatient.id) : [];

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tmplName = e.target.value;
    setSelectedTemplate(tmplName);
    const tmpl = DISCHARGE_TEMPLATES[tmplName as keyof typeof DISCHARGE_TEMPLATES];
    
    if (tmpl) {
        setNotes({
            diagnosis: tmpl.diagnosis,
            treatment: tmpl.treatment,
            labResults: tmpl.labResults
        });
    } else if (tmplName === "") {
        setNotes({ diagnosis: '', treatment: '', labResults: '' });
    }
  };

  const handleGenerateAI = async () => {
    const p = patients.find(pt => pt.id === selectedPatientId);
    if(!p) return;
    setIsGenerating(true);
    const summary = await generateDischargeSummary(
        p.name,
        notes.diagnosis || p.diagnosis || "Not specified",
        notes.treatment,
        notes.labResults
    );
    setGeneratedSummary(summary);
    setIsGenerating(false);
  };

  const handleAssignBed = () => {
      if (!selectedBed || !selectedWard || !assignPatientId) return;
      
      updateBedStatus(selectedWard.id, selectedBed.id, BedStatus.OCCUPIED, assignPatientId);

      setShowAssignmentModal(false);
      setAssignPatientId('');
      alert(`Patient assigned to bed ${selectedBed.number}`);
  };

  const handleDischargePatient = () => {
      if (!selectedBed || !selectedWard || !bedPatient) {
          alert("Error: No patient information found for this bed.");
          return;
      }
      
      // 1. Select the patient
      setSelectedPatientId(bedPatient.id);
      
      // 2. Pre-fill diagnosis from patient record if available
      setNotes(prev => ({
          ...prev,
          diagnosis: bedPatient.diagnosis || '',
          treatment: '',
          labResults: ''
      }));
      setGeneratedSummary(''); // Clear any previous AI content

      // 3. Switch tab and scroll
      setActiveTab('discharge');
      setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
  };

  const handleTransferPatient = () => {
      if (!selectedBed || !selectedWard || !bedPatient) return;
      setTransferTarget({ wardId: '', bedId: '' });
      setShowTransferModal(true);
  };

  const handleEditPatient = () => {
      if (!bedPatient) return;
      setEditPatientForm(bedPatient);
      setShowEditPatientModal(true);
  };

  const savePatientDetails = (e: React.FormEvent) => {
      e.preventDefault();
      if (!bedPatient || !editPatientForm) return;
      
      const updatedPatient = { ...bedPatient, ...editPatientForm } as Patient;
      onUpdatePatient(updatedPatient);
      setShowEditPatientModal(false);
  };

  const confirmTransfer = () => {
      if (!transferTarget.wardId || !transferTarget.bedId || !bedPatient) return;
      
      // 1. Vacate current bed
      updateBedStatus(selectedWardId, selectedBedId!, BedStatus.AVAILABLE);
      
      // 2. Occupy new bed
      updateBedStatus(transferTarget.wardId, transferTarget.bedId, BedStatus.OCCUPIED, bedPatient.id);

      // 3. Update Patient record
      const targetWard = wards.find(w => w.id === transferTarget.wardId);
      const targetBed = targetWard?.beds.find(b => b.id === transferTarget.bedId);
      
      if (targetWard && targetBed) {
          onUpdatePatient({
              ...bedPatient,
              ward: targetWard.name,
              bedNumber: targetBed.number,
              // Optionally update department if ward is in different dept
              department: targetWard.department
          });
      }

      setShowTransferModal(false);
      alert(`Patient ${bedPatient.name} transferred successfully.`);
      setSelectedBedId(null); // Clear selection as patient moved
  };

  const calculateDuration = (dateStr?: string) => {
      if (!dateStr) return '0 Days';
      const start = new Date(dateStr);
      const end = new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
  };

  const handleAddRound = () => {
    if (!newNoteContent.trim() || !bedPatient || !currentUser) return;
    
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRound: RoundNote = {
      id: `R-${Date.now()}`,
      patientId: bedPatient.id,
      date: formattedDate,
      doctor: currentUser.name,
      note: newNoteContent,
      vitals: newNoteVitals || undefined
    };

    setRounds([...rounds, newRound]);
    setIsAddingNote(false);
    setNewNoteContent('');
    setNewNoteVitals('');
  };

  const handleEditRound = (round: RoundNote) => {
      setEditingRoundId(round.id);
      setEditRoundForm({ note: round.note, vitals: round.vitals || '' });
  };

  const handleDeleteRound = (roundId: string) => {
      if (window.confirm("Are you sure you want to delete this clinical note?")) {
          setRounds(prev => prev.filter(r => r.id !== roundId));
      }
  };

  const saveEditedRound = () => {
      setRounds(prev => prev.map(r => r.id === editingRoundId ? { ...r, note: editRoundForm.note, vitals: editRoundForm.vitals || undefined } : r));
      setEditingRoundId(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newChatMsg.trim() || !bedPatient || !currentUser) return;

      const newMessage: CareTeamMessage = {
          id: `M-${Date.now()}`,
          patientId: bedPatient.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          content: newChatMsg,
          timestamp: new Date().toISOString(),
          priority: chatPriority
      };

      setCareTeamMessages([...careTeamMessages, newMessage]);
      setNewChatMsg('');
      setChatPriority('Routine');
  };

  const handleReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (!bedPatient || !currentUser) return;

          const now = new Date();
          const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newRound: RoundNote = {
              id: `R-DOC-${Date.now()}`,
              patientId: bedPatient.id,
              date: formattedDate,
              doctor: currentUser.name,
              note: `📄 Uploaded Clinical Document: ${file.name}`,
              vitals: 'Report Attached'
          };

          setRounds([...rounds, newRound]);
          alert("Document uploaded to patient timeline.");
      }
  };

  // Lab Order Functions
  const handleCreateLabOrder = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newOrder.patientId) return;

      const patient = patients.find(p => p.id === newOrder.patientId);
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const order: LabOrder = {
          id: `L-${Date.now()}`,
          patientId: newOrder.patientId,
          testName: newOrder.testName,
          orderDate: formattedDate,
          status: 'Pending',
          department: newOrder.department,
          hospital: patient?.hospital || selectedHospital as HospitalName || HospitalName.KR_HOSPITAL
      };

      setLabOrders([order, ...labOrders]);
      setShowOrderModal(false);
      alert('Lab Test Ordered Successfully');
      setNewOrder({ patientId: '', testName: 'Complete Blood Count (CBC)', department: Department.PATHOLOGY });
  };

  const handleOpenResultEntry = (order: LabOrder) => {
      setSelectedOrderForResult(order);
      setLabResultForm({ resultText: order.result || '', attachment: null });
      setShowResultModal(true);
  };

  const handleSaveResult = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedOrderForResult) return;

      const updatedOrders = labOrders.map(order => {
          if (order.id === selectedOrderForResult.id) {
             return {
                 ...order,
                 status: 'Completed' as const, // Cast to literal
                 result: labResultForm.resultText,
                 // Create mock URL for the file
                 attachmentUrl: labResultForm.attachment ? URL.createObjectURL(labResultForm.attachment) : (order.attachmentUrl || undefined)
             };
          }
          return order;
      });

      setLabOrders(updatedOrders);
      setShowResultModal(false);
      setSelectedOrderForResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLabResultForm({ ...labResultForm, attachment: e.target.files[0] });
      }
  };

  // OT Scheduler Functions
  const handleScheduleSurgery = (e: React.FormEvent) => {
      e.preventDefault();
      if (!otForm.patientId) return;

      const patient = patients.find(p => p.id === otForm.patientId);
      
      const newSurgery: OTSchedule = {
          id: `OT-${Date.now().toString().slice(-4)}`,
          patientId: otForm.patientId,
          procedureName: otForm.procedureName,
          diagnosis: otForm.diagnosis,
          theaterId: otForm.theaterId,
          surgeon: otForm.surgeon || patient?.doctor || 'Duty Surgeon',
          scheduledTime: otForm.scheduledTime,
          status: 'Scheduled',
          hospital: patient?.hospital || HospitalName.KR_HOSPITAL,
          anesthesiaType: otForm.anesthesiaType
      };

      setOtSchedule([...otSchedule, newSurgery]);
      setShowOtModal(false);
      setOtForm({
          patientId: '',
          procedureName: '',
          diagnosis: '',
          theaterId: 'OT-1 (General)',
          surgeon: '',
          scheduledTime: '',
          anesthesiaType: 'GA'
      });
      alert('Surgery scheduled successfully.');
  };

  const handleSelectPatientForOT = (patientId: string) => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
          setOtForm(prev => ({
              ...prev,
              patientId: patientId,
              diagnosis: patient.diagnosis || '', // Auto-fill diagnosis
              surgeon: patient.doctor // Auto-fill surgeon
          }));
      } else {
          setOtForm(prev => ({ ...prev, patientId: patientId }));
      }
  };

  // Preview & Print Logic
  const handlePrint = () => {
    const printContent = document.getElementById('discharge-preview-content');
    if (!printContent) return;

    const win = window.open('', '', 'height=700,width=900');
    if (win) {
        win.document.write('<html><head><title>Print Discharge Summary</title>');
        win.document.write('<script src="https://cdn.tailwindcss.com"></script>'); // Ensure Tailwind styles are available
        win.document.write('</head><body class="p-4 bg-white text-slate-900">');
        win.document.write(printContent.outerHTML);
        win.document.write('</body></html>');
        win.document.close();
        
        // Timeout to allow styles to load
        setTimeout(() => {
            win.focus();
            win.print();
            // win.close();
        }, 800);
    }
  };

  // --- PREPARE OPTIONS ---

  // Patient Options
  const patientOptions = patients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));
  
  // Doctor Options
  const doctorOptions = MOCK_AUTH_DB.filter(u => u.user.role === UserRole.CONSULTANT).map(u => ({ label: u.user.name, value: u.user.name }));

  // Ward Options
  const wardOptions = filteredWards.map(w => ({ label: `${w.name} (${w.hospital})`, value: w.id }));

  // Referral Target Options
  const referralHospitalOptions = Object.values(HospitalName).map(h => ({ label: h, value: h }));
  const referralDeptOptions = HOSPITAL_DEPARTMENTS[referralForm.targetHospital].map(d => ({ label: d, value: d }));

  const activeIPDPatients = patients.filter(p => p.type === PatientType.IPD && p.status === 'Active');

  const TabButton = ({ id, label, icon: Icon }: any) => {
    if (!visibleTabs.includes(id)) return null;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`pb-3 px-4 text-sm font-medium transition-all flex items-center gap-2 ${activeTab === id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'}`}
        >
            <Icon className="w-4 h-4" /> {label}
        </button>
    );
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-6 animate-slide-down relative">
      
      {/* ... (Existing Preview Modal) ... */}
      {showPreview && selectedPatientId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="font-bold text-slate-700">Discharge Summary Preview</h3>
                    <button onClick={() => setShowPreview(false)} className="hover:bg-slate-200 p-1 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-200 custom-scrollbar">
                    <div id="discharge-preview-content" className="bg-white shadow-xl p-10 max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 relative font-serif text-sm">
                        {(() => {
                            const patient = patients.find(p => p.id === selectedPatientId);
                            if (!patient) return null;
                            const hospitalName = patient.hospital || (selectedHospital === 'All' ? HospitalName.KR_HOSPITAL : selectedHospital);

                            return (
                                <>
                                    {/* Header */}
                                    <div className="flex items-center gap-6 border-b-4 border-slate-800 pb-4 mb-6">
                                        <div className="w-24 h-24 bg-blue-900 text-white flex items-center justify-center rounded-full text-4xl font-bold border-4 border-double border-white shadow-sm print:bg-blue-900 print:text-white">M</div>
                                        <div className="flex-1 text-center">
                                            <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900 leading-none mb-2">Mysore Medical College & Research Institute</h1>
                                            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide border-b border-slate-300 inline-block pb-1 mb-1">{hospitalName}</h2>
                                            <p className="text-sm text-slate-600 font-medium">Irwin Road, Mysore - 570001 | Phone: 0821-2424242</p>
                                        </div>
                                        <div className="w-24">
                                            {/* Stamp if MLC */}
                                            {patient.legalStatus === 'MLC' && (
                                                <div className="border-4 border-red-700 text-red-700 font-bold rounded-lg p-1 text-center rotate-12 opacity-80 print:opacity-100">
                                                    <div className="text-xs border-b border-red-700">MEDICO-LEGAL</div>
                                                    <div className="text-lg">CASE</div>
                                                </div>
                                            )}
                                        </div> 
                                    </div>

                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold uppercase underline decoration-2 underline-offset-4 tracking-widest text-slate-900">Discharge Summary</h2>
                                    </div>

                                    {/* Patient Details Grid */}
                                    <div className="border-2 border-slate-800 mb-8">
                                        <div className="grid grid-cols-2">
                                            <div className="p-2 border-r-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Patient Name</span> <span className="font-bold text-lg text-slate-900 uppercase">{patient.name}</span></div>
                                            <div className="p-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">UHID / IP No</span> <span className="font-bold font-mono text-lg">{patient.uhid} / {patient.admissionId || 'IP-PENDING'}</span></div>
                                            
                                            <div className="p-2 border-r-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Age / Sex</span> <span className="font-medium">{patient.age} Years / {patient.gender}</span></div>
                                            <div className="p-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Mobile</span> <span className="font-medium font-mono">{patient.mobile}</span></div>

                                            <div className="p-2 border-r-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Date of Admission</span> <span className="font-medium">{patient.admissionDate}</span></div>
                                            <div className="p-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Date of Discharge</span> <span className="font-medium">{new Date().toISOString().split('T')[0]}</span></div>

                                            <div className="p-2 border-r-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Department</span> <span className="font-medium">{patient.department}</span></div>
                                            <div className="p-2 border-b border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Unit / Ward</span> <span className="font-medium">{patient.ward} / {patient.bedNumber}</span></div>

                                            <div className="p-2 border-r-2 border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Consultant</span> <span className="font-bold uppercase text-slate-900">{patient.doctor}</span></div>
                                            <div className="p-2 border-slate-800 flex"><span className="font-bold w-32 uppercase text-xs text-slate-500 pt-0.5">Case Type</span> <span className={`font-bold uppercase ${patient.legalStatus === 'MLC' ? 'text-red-700' : 'text-slate-900'}`}>{patient.legalStatus || 'Non-MLC'}</span></div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-6 text-sm leading-relaxed text-justify">
                                        {generatedSummary ? (
                                            <div className="whitespace-pre-wrap font-serif text-base text-slate-900">{generatedSummary}</div>
                                        ) : (
                                            <>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Final Diagnosis</h4>
                                                    <p className="font-medium text-base text-slate-900 ml-4">{notes.diagnosis || 'Not Recorded'}</p>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">History of Present Illness</h4>
                                                    <p className="text-slate-800 ml-4">Patient admitted with complaints as per case sheet. Evaluated and managed accordingly.</p>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Course in Hospital & Treatment Given</h4>
                                                    <div className="whitespace-pre-wrap text-slate-800 ml-4">{notes.treatment || 'Conservative management. Vitals stable.'}</div>
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Investigation Reports</h4>
                                                    <div className="whitespace-pre-wrap text-slate-800 ml-4 font-mono text-xs">{notes.labResults || 'All routine blood investigations are within normal limits.'}</div>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Condition at Discharge</h4>
                                                    <p className="text-slate-800 ml-4">Hemodynamically stable. Afebrile. Tolerating oral diet. Wound healthy (if applicable).</p>
                                                </div>

                                                <div className="pt-2">
                                                    <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Discharge Advice & Medication</h4>
                                                    <ul className="list-disc pl-9 space-y-1 text-slate-900 font-medium">
                                                        <li>Review in OPD after 1 week (on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}).</li>
                                                        <li>Take prescribed medications regularly as per prescription.</li>
                                                        <li>Emergency SOS if symptoms recur (Fever / Pain / Breathlessness).</li>
                                                        <li>Diet: As advised by dietician.</li>
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-24 grid grid-cols-2 gap-12">
                                        <div className="text-center">
                                            <p className="font-bold text-sm mb-12">Signature of Post-Graduate / Duty Doctor</p>
                                            <div className="border-t border-slate-400 w-2/3 mx-auto"></div>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-sm mb-12 uppercase">{patient.doctor}</p>
                                            <div className="border-t border-slate-400 w-2/3 mx-auto mb-1"></div>
                                            <p className="text-xs font-bold uppercase">Consultant Signature</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-12 text-center text-[10px] text-slate-400 border-t pt-2 flex justify-between">
                                        <span>Generated electronically by MMC&RI HMIS</span>
                                        <span>Date: {new Date().toLocaleString()}</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                <div className="p-4 bg-white border-t flex justify-end gap-3 rounded-b-xl">
                    <button onClick={() => setShowPreview(false)} className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">Close</button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30">
                        <Printer className="w-4 h-4" /> Print Summary
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* ... (Existing OT and Lab Tabs) ... */}
      {activeTab === 'ot' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase">Operation Theater Planner</h3>
              </div>
              <button 
                onClick={() => setShowOtModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
              >
                  <Plus className="w-4 h-4" /> Schedule Case
              </button>
          </div>
          <div className="p-0">
              {otSchedule.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No surgeries scheduled.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 divide-y divide-slate-100">
                      {otSchedule.map(schedule => {
                          const patient = patients.find(p => p.id === schedule.patientId);
                          return (
                              <div key={schedule.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="text-center w-16">
                                          <div className="text-xs font-bold text-slate-500 uppercase">{new Date(schedule.scheduledTime).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                                          <div className="text-lg font-black text-slate-800">{new Date(schedule.scheduledTime).toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'})}</div>
                                      </div>
                                      <div className="w-px h-10 bg-slate-200"></div>
                                      <div>
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="font-bold text-slate-800">{patient?.name || 'Unknown Patient'}</span>
                                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{schedule.theaterId}</span>
                                          </div>
                                          <div className="text-sm text-blue-700 font-medium">{schedule.procedureName}</div>
                                          <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                                              <span>Dx: {schedule.diagnosis}</span>
                                              <span>•</span>
                                              <span>Surgeon: {schedule.surgeon}</span>
                                              <span>•</span>
                                              <span>Anesthesia: {schedule.anesthesiaType}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                          schedule.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                          schedule.status === 'In-Progress' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                          'bg-amber-100 text-amber-700'
                                      }`}>
                                          {schedule.status}
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
        </div>
      )}

      {/* Lab Tab */}
      {activeTab === 'lab' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search orders..." className="bg-transparent text-sm outline-none text-slate-700" />
              </div>
              <button 
                onClick={() => setShowOrderModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                  <Plus className="w-4 h-4" /> New Lab Order
              </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Order ID</th>
                <th className="px-6 py-4 border-b border-slate-100">Patient</th>
                <th className="px-6 py-4 border-b border-slate-100">Test</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {labOrders.filter(o => selectedHospital === 'All' || o.hospital === selectedHospital).map((order) => {
                const p = patients.find(pt => pt.id === order.patientId);
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {p?.name || 'Unknown'}
                        <div className="text-xs text-slate-400 font-normal">{order.hospital}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.testName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        {order.status === 'Completed' ? (
                            <button onClick={() => handleOpenResultEntry(order)} className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1">
                                <Eye className="w-4 h-4" /> View
                            </button>
                        ) : (
                            <button onClick={() => handleOpenResultEntry(order)} className="text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center gap-1 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg">
                                <Upload className="w-3 h-3" /> Enter Result
                            </button>
                        )}
                    </td>
                  </tr>
                );
              })}
              {labOrders.filter(o => selectedHospital === 'All' || o.hospital === selectedHospital).length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No lab orders found for {selectedHospital}</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Clinical;