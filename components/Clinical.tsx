import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MOCK_LAB_ORDERS, MOCK_ROUNDS, DISCHARGE_TEMPLATES, MOCK_REFERRALS, HOSPITAL_DEPARTMENTS, MOCK_AUTH_DB } from '../services/mockData';
import { Beaker, Scissors, FileText, Printer, CheckCircle, BedDouble, ArrowRight, User as UserIcon, Calendar, Activity, AlertCircle, X, MapPin, List, ArrowRightLeft, Send, Save, Plus, TestTube, Search, Upload, Eye, Paperclip, Download, UserPlus, LogOut, Receipt, Gavel, Clock, MessageSquare, AlertTriangle, Edit2, Trash2, Mic, Maximize2, Wrench } from 'lucide-react';
import { BedStatus, Ward, HospitalName, ReferralType, Department, Patient, Bed, User, UserRole, RoundNote, LabOrder, PatientType, Invoice, OTSchedule, CareTeamMessage, Referral } from '../types';
import SearchableSelect from './SearchableSelect';

interface ClinicalProps {
    selectedHospital: HospitalName | 'All';
    patients: Patient[];
    currentUser: User | null;
    wards: Ward[];
    updateBedStatus: (wardId: string, bedId: string, status: BedStatus, patientId?: string) => void;
    onUpdatePatient: (patient: Patient) => void;
    onAddInvoice: (inv: Invoice) => void;
    referrals: Referral[];
    onAddReferral: (referral: Referral) => void;
    otSchedule: OTSchedule[];
    onAddOtSchedule: (schedule: OTSchedule) => void;
    initialTab?: 'ipd' | 'referral' | 'lab' | 'ot' | 'discharge';
}

const Clinical: React.FC<ClinicalProps> = ({ selectedHospital, patients, currentUser, wards, updateBedStatus, onUpdatePatient, onAddInvoice, referrals, onAddReferral, otSchedule, onAddOtSchedule, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'lab' | 'ot' | 'ipd' | 'discharge' | 'referral'>('ipd');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  
  // Preview State for Discharge
  const [showPreview, setShowPreview] = useState(false);

  // Preview State for Attachments
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);

  // Local state for Lab Orders to allow adding new tests
  const [labOrders, setLabOrders] = useState<LabOrder[]>(() => {
      try {
        const saved = localStorage.getItem('clinical_lab_orders');
        return saved ? JSON.parse(saved) : MOCK_LAB_ORDERS;
      } catch (e) {
        console.error("Error loading lab orders", e);
        return MOCK_LAB_ORDERS;
      }
  });

  useEffect(() => {
      try {
        localStorage.setItem('clinical_lab_orders', JSON.stringify(labOrders));
      } catch (e) {
        console.error("Storage limit exceeded, unable to save lab orders locally.", e);
        // Optional: Alert user or handle gracefully
      }
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
      try {
        const saved = localStorage.getItem('clinical_rounds');
        return saved ? JSON.parse(saved) : MOCK_ROUNDS;
      } catch (e) {
        return MOCK_ROUNDS;
      }
  });

  useEffect(() => {
      try {
        localStorage.setItem('clinical_rounds', JSON.stringify(rounds));
      } catch (e) {
        console.error("Storage limit exceeded for rounds", e);
      }
  }, [rounds]);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteVitals, setNewNoteVitals] = useState('');
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [editRoundForm, setEditRoundForm] = useState({ note: '', vitals: '' });

  // Care Team Chat State
  const [careTeamMessages, setCareTeamMessages] = useState<CareTeamMessage[]>(() => {
      try {
        const saved = localStorage.getItem('clinical_messages');
        return saved ? JSON.parse(saved) : [
            { id: 'M1', patientId: '1', senderName: 'Dr. Suresh', senderRole: UserRole.CONSULTANT, content: 'Please monitor BP every 2 hours. Keep NBM for tomorrow surgery.', timestamp: '2024-05-19T18:30', priority: 'Urgent' },
            { id: 'M2', patientId: '1', senderName: 'Nurse Ratna', senderRole: UserRole.STAFF_NURSE, content: 'Noted doctor. Patient anxiety is high, sedatives given as per chart.', timestamp: '2024-05-19T18:45', priority: 'Routine' }
        ];
      } catch (e) {
        return [];
      }
  });

  useEffect(() => {
      try {
        localStorage.setItem('clinical_messages', JSON.stringify(careTeamMessages));
      } catch (e) {
          console.error("Storage limit exceeded for messages", e);
      }
  }, [careTeamMessages]);

  const [newChatMsg, setNewChatMsg] = useState('');
  const [chatPriority, setChatPriority] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Filtered Wards based on Hospital AND potentially specific roles/departments
  const filteredWards = React.useMemo(() => {
      // 1. Filter by selected Hospital
      let result = selectedHospital === 'All' 
        ? wards 
        : wards.filter(w => w.hospital === selectedHospital);
      
      // 2. Filter by User Department if Lab Tech or Nurse (Mock logic: if dept matches a ward dept)
      if (currentUser?.department) {
          // If Nurse is assigned to OBG, only show OBG wards. 
          // This allows "single ward related information" rule.
          if (currentUser.role === UserRole.STAFF_NURSE || currentUser.role === UserRole.LAB_TECHNICIAN) {
              const deptWards = result.filter(w => w.department === currentUser.department);
              if (deptWards.length > 0) result = deptWards;
          }
      }
      return result;
  }, [selectedHospital, wards, currentUser]);

  // Determine which tabs are visible based on role
  const visibleTabs = React.useMemo(() => {
    if (!currentUser) return [];
    
    switch(currentUser.role) {
        case UserRole.LAB_TECHNICIAN:
        case UserRole.PATHOLOGIST:
        case UserRole.RADIOLOGIST:
            return ['lab']; // Lab Techs only see Lab tab
        case UserRole.RECEPTIONIST:
            return ['lab']; // Receptionist allowed to view/print reports
        case UserRole.STAFF_NURSE:
            return ['ipd']; // Nurses manage IPD/Wards only, no discharge summary creation
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

  // Set default tab based on initialTab prop or visibility
  useEffect(() => {
      if (initialTab && visibleTabs.includes(initialTab)) {
          setActiveTab(initialTab);
      } else if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
          setActiveTab(visibleTabs[0] as any);
      }
  }, [initialTab, visibleTabs]);

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

  // Referral State
  const [referralForm, setReferralForm] = useState({
      patientId: '',
      targetHospital: HospitalName.KR_HOSPITAL,
      targetDepartment: HOSPITAL_DEPARTMENTS[HospitalName.KR_HOSPITAL][0],
      urgency: 'Routine',
      notes: ''
  });

  const handleCreateReferral = (e: React.FormEvent) => {
      e.preventDefault();
      const patient = patients.find(p => p.id === referralForm.patientId);
      if (!patient) return;

      const newReferral: Referral = {
          id: `REF-INT-${Date.now().toString().slice(-6)}`,
          type: ReferralType.INTERNAL,
          patientId: patient.id,
          patientName: patient.name,
          sourceHospital: patient.hospital,
          sourceDepartment: patient.department,
          targetHospital: referralForm.targetHospital as HospitalName,
          targetDepartment: referralForm.targetDepartment as Department,
          urgency: referralForm.urgency as any,
          notes: referralForm.notes,
          date: new Date().toISOString(),
          status: 'New'
      };

      onAddReferral(newReferral);
      alert("Internal Referral Created Successfully.");
      setReferralForm({ ...referralForm, patientId: '', notes: '' });
  };

  // Discharge Summary State
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dischargeForm, setDischargeForm] = useState({
      diagnosis: '',
      history: '',
      course: '',
      treatment: '',
      investigations: '',
      conditionAtDischarge: 'Stable',
      advice: '',
      followUp: ''
  });

  const selectedWard = wards.find(w => w.id === selectedWardId);
  const selectedBed = selectedWard?.beds.find(b => b.id === selectedBedId);
  const bedPatient = selectedBed?.patientId ? patients.find(p => p.id === selectedBed.patientId) : null;
  const patientRounds = bedPatient ? rounds.filter(r => r.patientId === bedPatient.id) : [];
  const patientMessages = bedPatient ? careTeamMessages.filter(m => m.patientId === bedPatient.id) : [];

  // Auto-select patient for discharge if navigating from Bed View
  useEffect(() => {
      if (activeTab === 'discharge' && !selectedPatientId && bedPatient) {
          setSelectedPatientId(bedPatient.id);
          // Auto-fill form defaults
          setDischargeForm(prev => ({
              ...prev,
              diagnosis: bedPatient.diagnosis || '',
              history: 'Patient admitted with history of...', 
              course: 'Uneventful recovery.',
              treatment: '',
              investigations: '',
              conditionAtDischarge: 'Stable',
              advice: 'Take medications as prescribed.',
              followUp: 'Review after 1 week.'
          }));
      }
  }, [activeTab, bedPatient, selectedPatientId]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tmplName = e.target.value;
    setSelectedTemplate(tmplName);
    const tmpl = DISCHARGE_TEMPLATES[tmplName as keyof typeof DISCHARGE_TEMPLATES];
    
    if (tmpl) {
        setDischargeForm({
            diagnosis: tmpl.diagnosis,
            history: 'Patient admitted with history of...', // Generic filler
            course: 'Uneventful recovery.',
            treatment: tmpl.treatment,
            investigations: tmpl.labResults,
            conditionAtDischarge: 'Hemodynamically stable',
            advice: 'Take medications as prescribed.',
            followUp: 'Review after 1 week.'
        });
    } else if (tmplName === "") {
        setDischargeForm({ diagnosis: '', history: '', course: '', treatment: '', investigations: '', conditionAtDischarge: '', advice: '', followUp: '' });
    }
  };

  const handleAssignBed = () => {
      if (!selectedBed || !selectedWard || !assignPatientId) return;
      
      const existingAssignmentWard = wards.find(w => w.beds.some(b => b.patientId === assignPatientId));
      
      if (existingAssignmentWard) {
          const existingBed = existingAssignmentWard.beds.find(b => b.patientId === assignPatientId);
          alert(`Error: Patient is already assigned to Bed ${existingBed?.number} in ${existingAssignmentWard.name}. Cannot assign multiple beds.`);
          return;
      }

      updateBedStatus(selectedWard.id, selectedBed.id, BedStatus.OCCUPIED, assignPatientId);

      const patient = patients.find(p => p.id === assignPatientId);
      if (patient) {
          onUpdatePatient({
              ...patient,
              ward: selectedWard.name,
              bedNumber: selectedBed.number,
              status: 'Active'
          });
      }

      setShowAssignmentModal(false);
      setAssignPatientId('');
      alert(`Patient assigned to bed ${selectedBed.number}`);
  };

  const handleDischargePatient = () => {
      if (!selectedBed || !selectedWard || !bedPatient) {
          alert("Error: No patient information found for this bed.");
          return;
      }
      
      setSelectedPatientId(bedPatient.id);
      
      setDischargeForm(prev => ({
          ...prev,
          diagnosis: bedPatient.diagnosis || '',
          history: '',
          course: '',
          treatment: '',
          investigations: '',
          conditionAtDischarge: 'Stable',
          advice: '',
          followUp: ''
      }));

      setActiveTab('discharge');
      // No manual scroll needed if main container handles it, or use scrollToTop in App
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
      
      updateBedStatus(selectedWardId, selectedBedId!, BedStatus.AVAILABLE);
      updateBedStatus(transferTarget.wardId, transferTarget.bedId, BedStatus.OCCUPIED, bedPatient.id);

      const targetWard = wards.find(w => w.id === transferTarget.wardId);
      const targetBed = targetWard?.beds.find(b => b.id === transferTarget.bedId);
      
      if (targetWard && targetBed) {
          onUpdatePatient({
              ...bedPatient,
              ward: targetWard.name,
              bedNumber: targetBed.number,
              department: targetWard.department
          });
      }

      setShowTransferModal(false);
      alert(`Patient ${bedPatient.name} transferred successfully.`);
      setSelectedBedId(null);
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
      if (window.confirm("Are you sure you want to delete this item?")) {
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

          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              
              const now = new Date();
              const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              const isImage = file.type.startsWith('image/');

              const newRound: RoundNote = {
                  id: `R-DOC-${Date.now()}`,
                  patientId: bedPatient.id,
                  date: formattedDate,
                  doctor: currentUser.name,
                  note: file.name,
                  vitals: 'Report Attached',
                  attachmentUrl: base64String,
                  attachmentType: isImage ? 'image' : 'pdf'
              };

              setRounds([...rounds, newRound]);
              alert("Document uploaded successfully.");
          };
          reader.readAsDataURL(file);
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

      const finishSave = (attachmentUrl?: string) => {
          const updatedOrders = labOrders.map(order => {
              if (order.id === selectedOrderForResult.id) {
                 return {
                     ...order,
                     status: 'Completed' as const, // Cast to literal
                     result: labResultForm.resultText,
                     attachmentUrl: attachmentUrl || (order.attachmentUrl || undefined)
                 };
              }
              return order;
          });

          setLabOrders(updatedOrders);
          setShowResultModal(false);
          setSelectedOrderForResult(null);
      };

      if (labResultForm.attachment) {
          const reader = new FileReader();
          reader.onloadend = () => {
              finishSave(reader.result as string);
          };
          reader.readAsDataURL(labResultForm.attachment);
      } else {
          finishSave();
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setLabResultForm({ ...labResultForm, attachment: e.target.files[0] });
      }
  };

  const handlePrintReport = (order: LabOrder) => {
      const patient = patients.find(p => p.id === order.patientId);
      if (!patient) return;

      const win = window.open('', '', 'height=700,width=900');
      if (win) {
          win.document.write('<html><head><title>Print Lab Report</title>');
          win.document.write('<script src="https://cdn.tailwindcss.com"></script>'); 
          win.document.write('</head><body class="p-8 bg-white text-slate-900 font-sans">');
          
          win.document.write(`
            <div class="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold uppercase text-slate-800">MMC & RI Laboratory Services</h1>
                    <p class="text-sm font-bold text-slate-600">${order.hospital} - Department of ${order.department}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm">Report Date: ${new Date().toLocaleDateString()}</p>
                    <p class="text-sm font-mono">Order ID: ${order.id}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-8 text-sm border p-4 rounded-lg bg-slate-50">
                <div><span class="font-bold text-slate-500 uppercase">Patient Name:</span> <span class="font-bold">${patient.name}</span></div>
                <div><span class="font-bold text-slate-500 uppercase">Age/Sex:</span> <span>${patient.age} / ${patient.gender}</span></div>
                <div><span class="font-bold text-slate-500 uppercase">UHID:</span> <span class="font-mono">${patient.uhid}</span></div>
                <div><span class="font-bold text-slate-500 uppercase">Ref Doctor:</span> <span>${patient.doctor}</span></div>
            </div>

            <div class="mb-8">
                <h2 class="text-lg font-bold border-b border-slate-300 mb-4 pb-1">Test Report: ${order.testName}</h2>
                <div class="p-4 bg-white border border-slate-200 rounded min-h-[150px]">
                    <p class="whitespace-pre-wrap font-medium text-slate-800">${order.result || 'No results entered.'}</p>
                    ${order.attachmentUrl ? `<div class="mt-4"><p class="text-xs text-slate-500 mb-2">Attached Image:</p><img src="${order.attachmentUrl}" style="max-width:100%; max-height:400px; border:1px solid #eee;" /></div>` : ''}
                </div>
            </div>

            <div class="mt-12 pt-4 border-t border-slate-400 flex justify-between text-xs text-slate-500">
                <div>
                    <p>Report Generated By: ${currentUser?.name}</p>
                    <p>Role: ${currentUser?.role}</p>
                </div>
                <div class="text-center">
                    <p class="font-bold mb-8 uppercase">Technician / Pathologist Signature</p>
                </div>
            </div>
          `);

          win.document.write('</body></html>');
          win.document.close();
          
          setTimeout(() => {
              win.focus();
              win.print();
          }, 800);
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

      onAddOtSchedule(newSurgery);
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

  const activeIPDPatients = patients.filter(p => p.type === PatientType.IPD && p.status === 'Active');
  const activeIpdPatientsForDischarge = activeIPDPatients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));

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

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1";

  // STRICT FILTER for Unassigned Patients Dropdown
  // This ensures that even if patient.bedNumber says "null", we double check the wards array to be sure.
  const unassignedPatientsOptions = activeIPDPatients.filter(p => {
      // Is this patient ID found in ANY bed in ANY ward?
      const isActuallyInBed = wards.some(w => w.beds.some(b => b.patientId === p.id && b.status === BedStatus.OCCUPIED));
      return !isActuallyInBed;
  }).map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));

  return (
    <div className="space-y-6 animate-slide-down relative">
      
      {/* Transfer Modal Portal */}
      {showTransferModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800">Transfer Patient</h3>
                      <p className="text-sm text-slate-500">Current: {selectedWard?.name} • Bed: {selectedBed?.number}</p>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className={labelClass}>Target Ward</label>
                          <select 
                              className={inputClass}
                              value={transferTarget.wardId}
                              onChange={(e) => setTransferTarget({ ...transferTarget, wardId: e.target.value, bedId: '' })}
                          >
                              <option value="">Select Ward...</option>
                              {wards.filter(w => w.id !== selectedWardId && (selectedHospital === 'All' || w.hospital === selectedHospital)).map(w => (
                                  <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className={labelClass}>Target Bed</label>
                          <select 
                              className={inputClass}
                              value={transferTarget.bedId}
                              onChange={(e) => setTransferTarget({ ...transferTarget, bedId: e.target.value })}
                              disabled={!transferTarget.wardId}
                          >
                              <option value="">Select Bed...</option>
                              {wards.find(w => w.id === transferTarget.wardId)?.beds.filter(b => b.status === 'Available').map(b => (
                                  <option key={b.id} value={b.id}>{b.number}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                      <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                      <button onClick={confirmTransfer} disabled={!transferTarget.bedId} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50">Confirm Transfer</button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Edit Patient Modal Portal */}
      {showEditPatientModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800">Edit Patient Details</h3>
                  </div>
                  <form onSubmit={savePatientDetails}>
                      <div className="p-6 space-y-4">
                          <div><label className={labelClass}>Name</label><input className={inputClass} value={editPatientForm.name || ''} onChange={e => setEditPatientForm({...editPatientForm, name: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className={labelClass}>Age</label><input type="number" className={inputClass} value={editPatientForm.age || ''} onChange={e => setEditPatientForm({...editPatientForm, age: parseInt(e.target.value)})} /></div>
                              <div><label className={labelClass}>Gender</label><select className={inputClass} value={editPatientForm.gender || ''} onChange={e => setEditPatientForm({...editPatientForm, gender: e.target.value as any})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                          </div>
                          <div><label className={labelClass}>Mobile</label><input className={inputClass} value={editPatientForm.mobile || ''} onChange={e => setEditPatientForm({...editPatientForm, mobile: e.target.value})} /></div>
                          <div><label className={labelClass}>Diagnosis</label><input className={inputClass} value={editPatientForm.diagnosis || ''} onChange={e => setEditPatientForm({...editPatientForm, diagnosis: e.target.value})} /></div>
                      </div>
                      <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                          <button type="button" onClick={() => setShowEditPatientModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm">Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>,
          document.body
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="relative max-w-5xl max-h-[95vh] flex flex-col items-center">
                  <button 
                      onClick={() => setPreviewAttachment(null)}
                      className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                  >
                      <X className="w-6 h-6" />
                  </button>
                  <img src={previewAttachment} alt="Full Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
              </div>
          </div>,
          document.body
      )}

      {/* Preview Modal for Discharge Summary */}
      {(showPreview && selectedPatientId) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl flex-shrink-0">
                    <h3 className="font-bold text-slate-700">Discharge Summary Preview</h3>
                    <button onClick={() => setShowPreview(false)} className="hover:bg-slate-200 p-1 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-200 custom-scrollbar">
                    <div id="discharge-preview-content" className="bg-white shadow-xl p-10 max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 relative font-serif text-sm">
                        {/* ... (Discharge content) ... */}
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
                                        <div>
                                            <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Final Diagnosis</h4>
                                            <p className="font-medium text-base text-slate-900 ml-4">{dischargeForm.diagnosis || 'Not Recorded'}</p>
                                        </div>
                                        
                                        {dischargeForm.history && (
                                            <div>
                                                <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Brief History</h4>
                                                <p className="text-slate-800 ml-4">{dischargeForm.history}</p>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Course in Hospital & Treatment</h4>
                                            <div className="whitespace-pre-wrap text-slate-800 ml-4">
                                                {dischargeForm.treatment || 'Conservative management.'}
                                                {dischargeForm.course && <><br/><br/><strong>Course:</strong> {dischargeForm.course}</>}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Investigation Reports</h4>
                                            <div className="whitespace-pre-wrap text-slate-800 ml-4 font-mono text-xs">{dischargeForm.investigations || 'See attached lab reports.'}</div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Condition at Discharge</h4>
                                            <p className="text-slate-800 ml-4">{dischargeForm.conditionAtDischarge}</p>
                                        </div>

                                        <div className="pt-2">
                                            <h4 className="font-bold text-slate-900 uppercase mb-2 text-sm border-b border-slate-300 inline-block pr-4 tracking-wide">Discharge Advice & Medication</h4>
                                            <div className="whitespace-pre-wrap text-slate-900 font-medium ml-4">{dischargeForm.advice || 'As per prescription.'}</div>
                                            {dischargeForm.followUp && <p className="mt-2 ml-4 font-bold text-slate-800">Follow Up: {dischargeForm.followUp}</p>}
                                        </div>
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

                <div className="p-4 bg-white border-t flex justify-end gap-3 rounded-b-xl flex-shrink-0">
                    <button onClick={() => setShowPreview(false)} className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700">Close</button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30">
                        <Printer className="w-4 h-4" /> Print Summary
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <TabButton id="ipd" label="IPD & Wards" icon={BedDouble} />
        <TabButton id="referral" label="Referrals" icon={ArrowRightLeft} />
        <TabButton id="lab" label="Lab & Diagnostics" icon={Beaker} />
        <TabButton id="ot" label="OT Scheduler" icon={Scissors} />
        <TabButton id="discharge" label="Discharge Summary" icon={FileText} />
      </div>

      {activeTab === 'ipd' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ward View */}
              <div className="lg:col-span-2 space-y-6">
                  {/* Ward Selection */}
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Select Ward</label>
                          <div className="w-64">
                            <SearchableSelect
                                options={wardOptions}
                                value={selectedWardId}
                                onChange={setSelectedWardId}
                                placeholder="Search Ward..."
                            />
                          </div>
                      </div>
                      <div className="h-8 w-px bg-slate-200 mx-2"></div>
                      <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                           <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 block">
                               {selectedWard?.department || '-'}
                           </span>
                      </div>
                      <div className="h-8 w-px bg-slate-200 mx-2"></div>
                      <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                           <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border block ${selectedWard?.type === 'ICU' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                               {selectedWard?.type || '-'}
                           </span>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Bed Status Map</h4>
                          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              {selectedWard?.hospital}
                          </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {selectedWard?.beds.map(bed => {
                              const bedP = patients.find(p => p.id === bed.patientId);
                              const isOccupied = bed.status === BedStatus.OCCUPIED;
                              const isAvailable = bed.status === BedStatus.AVAILABLE;
                              const isMaintenance = bed.status === BedStatus.MAINTENANCE;

                              return (
                              <button
                                key={bed.id}
                                onClick={() => {
                                    setSelectedBedId(bed.id);
                                    if (isAvailable) {
                                        setAssignPatientId('');
                                        setShowAssignmentModal(true);
                                    } else {
                                        // Scroll to details for Occupied beds
                                        setTimeout(() => {
                                             document.getElementById('bed-details-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 50);
                                    }
                                    setIsAddingNote(false);
                                }}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-between transition-all relative h-32 ${
                                    selectedBedId === bed.id ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md' : 'shadow-sm'
                                } ${
                                    isAvailable 
                                        ? 'border-green-200 bg-green-50/50 hover:bg-green-100 text-green-700' 
                                        : isOccupied
                                        ? 'border-red-200 bg-white hover:border-red-300'
                                        : 'border-slate-200 bg-slate-100 text-slate-400 opacity-80'
                                }`}
                              >
                                  {isOccupied && bedP?.legalStatus === 'MLC' && (
                                      <div className="absolute top-1 right-1 text-red-600 bg-red-50 border border-red-100 rounded px-1" title="Medico-Legal Case">
                                          <Gavel className="w-3 h-3" />
                                      </div>
                                  )}
                                  
                                  <div className="flex flex-col items-center">
                                      {isOccupied ? <UserIcon className="w-6 h-6 mb-1 opacity-70" /> : <BedDouble className="w-6 h-6 mb-1 opacity-50" />}
                                      <span className="text-lg font-bold">{bed.number}</span>
                                  </div>

                                  {isOccupied && bedP ? (
                                      <div className="flex flex-col gap-1 mt-2 w-full text-center">
                                          <div className="text-[10px] font-bold uppercase truncate w-full px-1">{bedP.name.split(' ')[0]}</div>
                                          <div className="text-[9px] text-slate-500 truncate w-full">{bedP.diagnosis || 'No Dx'}</div>
                                      </div>
                                  ) : (
                                      <span className="text-[10px] uppercase font-bold tracking-wider mt-2">
                                          {isAvailable ? 'Available' : 'Maint.'}
                                      </span>
                                  )}
                              </button>
                              );
                          })}
                      </div>
                  </div>
              </div>
              
              {/* Right Panel: Patient Details */}
              <div id="bed-details-panel" className="lg:col-span-1">
                {selectedBedId && selectedBed ? (
                    selectedBed.status === BedStatus.OCCUPIED && bedPatient ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-right-4">
                            {/* Patient Header */}
                            <div className="p-4 bg-slate-900 text-white">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg">{bedPatient.name}</h3>
                                        <p className="text-xs text-slate-300">{bedPatient.age}Y / {bedPatient.gender} • {bedPatient.uhid}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-400">{selectedBed.number}</div>
                                        <p className="text-[10px] uppercase text-slate-400 tracking-wider">Bed No</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleTransferPatient} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 py-1.5 rounded border border-slate-700 text-slate-300">Transfer</button>
                                    <button onClick={handleDischargePatient} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 py-1.5 rounded border border-slate-700 text-slate-300">Discharge</button>
                                    <button onClick={handleEditPatient} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 py-1.5 rounded border border-slate-700 text-slate-300">Edit Info</button>
                                </div>
                            </div>
                            
                            {/* Tabs */}
                            <div className="flex border-b border-slate-200">
                                <button 
                                    onClick={() => setPatientDetailsTab('rounds')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${patientDetailsTab === 'rounds' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Clinical Rounds
                                </button>
                                <button 
                                    onClick={() => setPatientDetailsTab('chat')}
                                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${patientDetailsTab === 'chat' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                                >
                                    Care Team Chat
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
                                {patientDetailsTab === 'rounds' ? (
                                    <div className="space-y-4">
                                        {/* Add Note Input */}
                                        {isAddingNote ? (
                                            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-200 animate-in fade-in">
                                                <textarea 
                                                    autoFocus
                                                    className="w-full text-sm p-2 border border-slate-200 rounded mb-2 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800 placeholder:text-slate-400"
                                                    placeholder="Enter clinical notes..."
                                                    rows={3}
                                                    value={newNoteContent}
                                                    onChange={e => setNewNoteContent(e.target.value)}
                                                />
                                                <input 
                                                    type="text" 
                                                    className="w-full text-sm p-2 border border-slate-200 rounded mb-2 outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-slate-800 placeholder:text-slate-400"
                                                    placeholder="Vitals (e.g. BP: 120/80, HR: 72)"
                                                    value={newNoteVitals}
                                                    onChange={e => setNewNoteVitals(e.target.value)}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setIsAddingNote(false)} className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">Cancel</button>
                                                    <button onClick={handleAddRound} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700">Save Note</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center mb-2">
                                                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">History</h4>
                                                 <div className="flex gap-2">
                                                    <label className="text-xs px-2 py-1.5 rounded bg-white border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1 shadow-sm">
                                                        <Paperclip className="w-3 h-3" /> Attach
                                                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReportUpload} />
                                                    </label>
                                                    <button onClick={() => setIsAddingNote(true)} className="text-xs px-2 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1">
                                                        <Plus className="w-3 h-3" /> Add Note
                                                    </button>
                                                 </div>
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                            {patientRounds.length === 0 ? (
                                                <div className="text-center py-8 text-slate-400 text-sm pl-8">No rounds recorded yet.</div>
                                            ) : (
                                                patientRounds.slice().reverse().map(round => (
                                                    <div key={round.id} className="relative pl-10 group">
                                                        <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 z-10"></div>
                                                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-xs font-bold text-slate-700">{round.doctor}</span>
                                                                <span className="text-[10px] text-slate-400">{round.date}</span>
                                                            </div>
                                                            {editingRoundId === round.id ? (
                                                                <div className="space-y-2">
                                                                    <textarea className="w-full text-sm border p-1 rounded" value={editRoundForm.note} onChange={e => setEditRoundForm({...editRoundForm, note: e.target.value})} />
                                                                    <input className="w-full text-sm border p-1 rounded" value={editRoundForm.vitals} onChange={e => setEditRoundForm({...editRoundForm, vitals: e.target.value})} placeholder="Vitals" />
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={() => setEditingRoundId(null)} className="text-xs px-2 py-1 bg-slate-100 rounded">Cancel</button>
                                                                        <button onClick={saveEditedRound} className="text-xs px-2 py-1 bg-green-600 text-white rounded">Save</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{round.note}</p>
                                                                    {round.attachmentUrl && (
                                                                        <div className="mt-2">
                                                                            <button 
                                                                                onClick={() => setPreviewAttachment(round.attachmentUrl!)}
                                                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 p-1.5 rounded border border-blue-100 w-fit"
                                                                            >
                                                                                {round.attachmentType === 'image' ? <Eye className="w-3 h-3"/> : <FileText className="w-3 h-3"/>}
                                                                                View Attachment
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {round.vitals && (
                                                                        <div className="mt-2 text-xs font-mono bg-slate-50 p-1.5 rounded text-slate-600 border border-slate-100 inline-block">
                                                                            {round.vitals}
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                                        <button onClick={() => handleEditRound(round)} className="text-slate-400 hover:text-blue-600"><Edit2 className="w-3 h-3"/></button>
                                                                        <button onClick={() => handleDeleteRound(round.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 space-y-3 mb-4">
                                             {patientMessages.length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 text-sm">No messages yet. Start a discussion about this patient.</div>
                                             ) : (
                                                 patientMessages.map(msg => (
                                                     <div key={msg.id} className={`flex flex-col ${msg.senderName === currentUser?.name ? 'items-end' : 'items-start'}`}>
                                                         <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${
                                                             msg.priority === 'Emergency' ? 'bg-red-50 border border-red-200 text-red-900' :
                                                             msg.priority === 'Urgent' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                                                             msg.senderName === currentUser?.name ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                                                         }`}>
                                                             {msg.priority !== 'Routine' && (
                                                                 <div className="flex items-center gap-1 text-[10px] font-bold uppercase mb-1 opacity-80">
                                                                     <AlertTriangle className="w-3 h-3" /> {msg.priority}
                                                                 </div>
                                                             )}
                                                             <p>{msg.content}</p>
                                                         </div>
                                                         <span className="text-[10px] text-slate-400 mt-1 px-1">
                                                             {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                         </span>
                                                     </div>
                                                 ))
                                             )}
                                             <div ref={chatEndRef} />
                                        </div>
                                        <form onSubmit={handleSendMessage} className="mt-auto bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                            <div className="flex gap-2 mb-2">
                                                {['Routine', 'Urgent', 'Emergency'].map(p => (
                                                    <button 
                                                        key={p} 
                                                        type="button"
                                                        onClick={() => setChatPriority(p as any)}
                                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                                                            chatPriority === p 
                                                                ? (p === 'Emergency' ? 'bg-red-600 text-white' : p === 'Urgent' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white')
                                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
                                                    placeholder="Type message..."
                                                    value={newChatMsg}
                                                    onChange={e => setNewChatMsg(e.target.value)}
                                                />
                                                <button type="button" onClick={() => startListening((val) => setNewChatMsg(val), newChatMsg)} className="text-slate-400 hover:text-blue-600 p-1"><Mic className="w-4 h-4"/></button>
                                                <button type="submit" disabled={!newChatMsg.trim()} className="text-blue-600 disabled:text-slate-300 hover:bg-blue-50 p-1.5 rounded"><Send className="w-4 h-4"/></button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <BedDouble className="w-12 h-12 mb-4 opacity-20" />
                            {selectedBed.status === BedStatus.MAINTENANCE ? (
                                <>
                                    <h3 className="font-bold text-lg text-slate-500">Under Maintenance</h3>
                                    <p className="text-sm">This bed is currently out of service.</p>
                                    <button 
                                        onClick={() => updateBedStatus(selectedWard.id, selectedBed.id, BedStatus.AVAILABLE)}
                                        className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Mark as Repaired
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-bold text-lg text-slate-500">Bed is Available</h3>
                                    <p className="text-sm mb-4">Assign a patient to this bed to view details.</p>
                                    <button 
                                        onClick={() => { setAssignPatientId(''); setShowAssignmentModal(true); }}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-transform hover:-translate-y-0.5"
                                    >
                                        <UserPlus className="w-4 h-4 inline mr-2" /> Assign Patient
                                    </button>
                                    <button 
                                        onClick={() => updateBedStatus(selectedWard.id, selectedBed.id, BedStatus.MAINTENANCE)}
                                        className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline"
                                    >
                                        Mark for Maintenance
                                    </button>
                                </>
                            )}
                        </div>
                    )
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
                        <h3 className="font-bold text-lg text-slate-500">Select a Bed</h3>
                        <p className="text-sm">Click on any bed from the ward map to view details.</p>
                    </div>
                )}
              </div>
          </div>
      )}

      {/* Result Entry Modal Portal - UPDATED UI */}
      {showResultModal && selectedOrderForResult && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800">Enter Lab Results</h3>
                      <p className="text-sm text-slate-500">{selectedOrderForResult.testName} for {patients.find(p=>p.id===selectedOrderForResult.patientId)?.name}</p>
                  </div>
                  <form onSubmit={handleSaveResult}>
                      <div className="p-6 space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Result Values / Notes</label>
                              <textarea 
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all h-32 resize-none"
                                  placeholder="Enter detailed result findings..."
                                  value={labResultForm.resultText}
                                  onChange={e => setLabResultForm({...labResultForm, resultText: e.target.value})}
                              />
                          </div>
                          
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Attach Report (PDF/Image)</label>
                              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                  <input 
                                      type="file" 
                                      accept="image/*,application/pdf"
                                      onChange={handleFileChange}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  {labResultForm.attachment ? (
                                      <div className="flex flex-col items-center text-blue-600 animate-in zoom-in">
                                          <CheckCircle className="w-8 h-8 mb-2" />
                                          <p className="text-sm font-bold">{labResultForm.attachment.name}</p>
                                          <p className="text-xs opacity-70">Click to change</p>
                                      </div>
                                  ) : (
                                      <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-500 transition-colors">
                                          <Upload className="w-8 h-8 mb-2" />
                                          <p className="text-sm font-bold">Click or Drag file to upload</p>
                                          <p className="text-xs opacity-70">Supports JPG, PNG, PDF</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                      <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                          <button type="button" onClick={() => setShowResultModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm">Save & Complete</button>
                      </div>
                  </form>
              </div>
          </div>,
          document.body
      )}

      {/* Assignment Modal Portal */}
      {showAssignmentModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                      <h3 className="font-bold text-slate-800">Assign Patient to Bed</h3>
                      <p className="text-sm text-slate-500">Ward: {selectedWard?.name} • Bed: {selectedBed?.number}</p>
                  </div>
                  <div className="p-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Unassigned Patient</label>
                      <SearchableSelect
                          options={unassignedPatientsOptions}
                          value={assignPatientId}
                          onChange={setAssignPatientId}
                          placeholder="Search Patient (IPD)..."
                      />
                      {activeIPDPatients.length === 0 && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> No active IPD patients found needing a bed.
                          </p>
                      )}
                  </div>
                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                      <button onClick={() => setShowAssignmentModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100">Cancel</button>
                      <button onClick={handleAssignBed} disabled={!assignPatientId} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Confirm Assignment</button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Other Tabs (Lab, OT, Discharge, Referral) */}
      {activeTab === 'lab' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><TestTube className="w-5 h-5 text-blue-600"/> Lab Orders</h3>
                  <button onClick={() => setShowOrderModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> New Order
                  </button>
              </div>
              
              {showOrderModal && (
                  <div className="p-6 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
                      <form onSubmit={handleCreateLabOrder} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="md:col-span-1">
                              <label className={labelClass}>Patient</label>
                              <SearchableSelect options={patientOptions} value={newOrder.patientId} onChange={v => setNewOrder({...newOrder, patientId: v})} placeholder="Select Patient..." />
                          </div>
                          <div className="md:col-span-1">
                              <label className={labelClass}>Test Name</label>
                              <input required className={inputClass} value={newOrder.testName} onChange={e => setNewOrder({...newOrder, testName: e.target.value})} />
                          </div>
                          <div className="md:col-span-1">
                               <label className={labelClass}>Department</label>
                               <select className={inputClass} value={newOrder.department} onChange={e => setNewOrder({...newOrder, department: e.target.value as any})}>
                                  {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                               </select>
                          </div>
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-600 font-bold">Cancel</button>
                              <button type="submit" className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold">Order</button>
                          </div>
                      </form>
                  </div>
              )}

              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                          <th className="px-6 py-4">Order ID</th>
                          <th className="px-6 py-4">Patient</th>
                          <th className="px-6 py-4">Test Name</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {labOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-xs font-mono text-slate-500">{order.id}</td>
                              <td className="px-6 py-4 font-bold text-slate-700">{patients.find(p => p.id === order.patientId)?.name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-sm">{order.testName} <span className="text-xs text-slate-400 block">{order.department}</span></td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {order.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right flex justify-end gap-2">
                                  {order.status === 'Pending' ? (
                                      <button onClick={() => handleOpenResultEntry(order)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                                          Enter Result
                                      </button>
                                  ) : (
                                      <button onClick={() => handlePrintReport(order)} className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-50 transition-colors flex items-center gap-1">
                                          <Printer className="w-3 h-3"/> Print
                                      </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {activeTab === 'ot' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Scissors className="w-5 h-5 text-purple-600"/> OT Schedule</h3>
                  <button onClick={() => setShowOtModal(true)} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Schedule Surgery
                  </button>
              </div>

              {showOtModal && (
                  <div className="p-6 bg-purple-50 border-b border-purple-100 animate-in slide-in-from-top-2">
                       <form onSubmit={handleScheduleSurgery} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className={labelClass}>Patient</label><SearchableSelect options={patientOptions} value={otForm.patientId} onChange={handleSelectPatientForOT} placeholder="Select Patient..." /></div>
                              <div><label className={labelClass}>Procedure</label><input required className={inputClass} value={otForm.procedureName} onChange={e => setOtForm({...otForm, procedureName: e.target.value})} /></div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                              <div><label className={labelClass}>Surgeon</label><SearchableSelect options={doctorOptions} value={otForm.surgeon} onChange={v => setOtForm({...otForm, surgeon: v})} /></div>
                              <div><label className={labelClass}>Theater</label><select className={inputClass} value={otForm.theaterId} onChange={e => setOtForm({...otForm, theaterId: e.target.value})}><option>OT-1 (General)</option><option>OT-2 (Ortho)</option><option>OT-3 (Emergency)</option></select></div>
                              <div><label className={labelClass}>Date & Time</label><input type="datetime-local" className={inputClass} value={otForm.scheduledTime} onChange={e => setOtForm({...otForm, scheduledTime: e.target.value})} /></div>
                          </div>
                          <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setShowOtModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600">Cancel</button>
                              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold">Confirm Schedule</button>
                          </div>
                       </form>
                  </div>
              )}

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otSchedule.length === 0 ? <p className="text-slate-400 col-span-3 text-center py-8">No surgeries scheduled.</p> : otSchedule.map(surgery => (
                      <div key={surgery.id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">{surgery.theaterId}</span>
                              <span className="text-xs text-slate-500 font-bold">{new Date(surgery.scheduledTime).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-bold text-slate-800">{surgery.procedureName}</h4>
                          <p className="text-sm text-slate-600 mb-2">{patients.find(p => p.id === surgery.patientId)?.name}</p>
                          <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
                              <span>Dr. {surgery.surgeon}</span>
                              <span className="text-slate-400">{surgery.anesthesiaType}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'referral' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 max-w-2xl mx-auto">
              <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-indigo-600"/> Internal Referral</h3>
              <form onSubmit={handleCreateReferral} className="space-y-6">
                  <div>
                      <label className={labelClass}>Select Patient</label>
                      <SearchableSelect options={patientOptions} value={referralForm.patientId} onChange={v => setReferralForm({...referralForm, patientId: v})} placeholder="Search Patient..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className={labelClass}>Target Hospital</label>
                          <select className={inputClass} value={referralForm.targetHospital} onChange={e => setReferralForm({...referralForm, targetHospital: e.target.value as any, targetDepartment: HOSPITAL_DEPARTMENTS[e.target.value as HospitalName][0]})}>
                              {Object.values(HospitalName).map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className={labelClass}>Target Department</label>
                          <select className={inputClass} value={referralForm.targetDepartment} onChange={e => setReferralForm({...referralForm, targetDepartment: e.target.value as any})}>
                              {HOSPITAL_DEPARTMENTS[referralForm.targetHospital].map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className={labelClass}>Urgency</label>
                          <select className={inputClass} value={referralForm.urgency} onChange={e => setReferralForm({...referralForm, urgency: e.target.value})}>
                              <option>Routine</option><option>Urgent</option><option>Emergency</option>
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className={labelClass}>Referral Notes</label>
                      <textarea className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" rows={3} value={referralForm.notes} onChange={e => setReferralForm({...referralForm, notes: e.target.value})} placeholder="Reason for referral..." />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">Create Referral</button>
              </form>
          </div>
      )}

      {activeTab === 'discharge' && (
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-8 max-w-4xl mx-auto">
                {/* Patient Selector */}
                <div className="mb-6">
                    <label className={labelClass}>Select Patient for Discharge Summary</label>
                    <SearchableSelect 
                        options={activeIpdPatientsForDischarge} 
                        value={selectedPatientId} 
                        onChange={(val) => {
                            setSelectedPatientId(val);
                            const p = patients.find(pat => pat.id === val);
                            if(p) {
                                 setDischargeForm(prev => ({
                                    ...prev,
                                    diagnosis: p.diagnosis || '',
                                    history: 'Patient admitted with history of...', 
                                    course: 'Uneventful recovery.',
                                    treatment: '',
                                    investigations: '',
                                    conditionAtDischarge: 'Stable',
                                    advice: 'Take medications as prescribed.',
                                    followUp: 'Review after 1 week.'
                                 }));
                            }
                        }}
                        placeholder="Search Admitted Patient..."
                    />
                </div>

                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600"/> Discharge Summary</h3>
                        <p className="text-sm text-slate-500 mt-1">Generate automated summary for {patients.find(p => p.id === selectedPatientId)?.name || '...'}</p>
                    </div>
                    {/* Template Selector */}
                    <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 font-medium" value={selectedTemplate} onChange={handleTemplateChange}>
                        <option value="">-- Load Template --</option>
                        {Object.keys(DISCHARGE_TEMPLATES).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>

                {selectedPatientId ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className={labelClass}>Final Diagnosis</label>
                                <input className={inputClass} value={dischargeForm.diagnosis} onChange={e => setDischargeForm({...dischargeForm, diagnosis: e.target.value})} />
                            </div>
                             <div>
                                <label className={labelClass}>Brief History</label>
                                <textarea className={`${inputClass} h-20`} value={dischargeForm.history} onChange={e => setDischargeForm({...dischargeForm, history: e.target.value})} />
                            </div>
                            <div>
                                <label className={labelClass}>Treatment Given</label>
                                <textarea className={`${inputClass} h-24 font-mono text-xs`} value={dischargeForm.treatment} onChange={e => setDischargeForm({...dischargeForm, treatment: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Course in Hospital</label>
                                    <textarea className={`${inputClass} h-24`} value={dischargeForm.course} onChange={e => setDischargeForm({...dischargeForm, course: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Investigation Summary</label>
                                    <textarea className={`${inputClass} h-24 font-mono text-xs`} value={dischargeForm.investigations} onChange={e => setDischargeForm({...dischargeForm, investigations: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Condition at Discharge</label>
                                    <input className={inputClass} value={dischargeForm.conditionAtDischarge} onChange={e => setDischargeForm({...dischargeForm, conditionAtDischarge: e.target.value})} />
                                </div>
                                <div>
                                    <label className={labelClass}>Follow Up Advice</label>
                                    <input className={inputClass} value={dischargeForm.followUp} onChange={e => setDischargeForm({...dischargeForm, followUp: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Discharge Medication & Advice</label>
                                <textarea className={`${inputClass} h-32 font-mono text-sm`} value={dischargeForm.advice} onChange={e => setDischargeForm({...dischargeForm, advice: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowPreview(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 flex items-center gap-2">
                                <Maximize2 className="w-4 h-4" /> Preview & Print
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Select a patient above or from Clinical Wards to generate discharge summary.</p>
                    </div>
                )}
           </div>
      )}

    </div>
  );
};

export default Clinical;