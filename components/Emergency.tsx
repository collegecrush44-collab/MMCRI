import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Patient, HospitalName, Department, TriagePriority, PatientType, Ward, BedStatus, Invoice } from '../types';
import { AlertCircle, Plus, Search, Clock, Activity, ArrowRight, BedDouble, Siren, UserPlus, Gavel, X, Edit2 } from 'lucide-react';
import { HOSPITAL_DEPARTMENTS } from '../services/mockData';
import SearchableSelect from './SearchableSelect';

interface EmergencyProps {
    patients: Patient[];
    onRegister: (patient: Patient) => void;
    onAddInvoice: (inv: Invoice) => void;
    onUpdatePatient: (patient: Patient) => void;
    wards: Ward[];
    updateBedStatus: (wardId: string, bedId: string, status: BedStatus, patientId?: string) => void;
    selectedHospital: HospitalName | 'All';
}

const Emergency: React.FC<EmergencyProps> = ({ patients, onRegister, onAddInvoice, onUpdatePatient, wards, updateBedStatus, selectedHospital }) => {
    const [view, setView] = useState<'triage' | 'register'>('triage');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showIcuModal, setShowIcuModal] = useState(false);
    
    // Quick Reg State
    const [regForm, setRegForm] = useState({
        name: '', age: '', gender: 'Male', mobile: '', complaint: '', triage: TriagePriority.RED,
        doctor: 'Duty Doctor',
        legalStatus: 'MLC' as 'MLC' | 'Non-MLC'
    });

    // ICU Admit State
    const [icuForm, setIcuForm] = useState({
        wardId: '',
        bedId: '',
        doctor: ''
    });

    // Edit Patient State
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [editForm, setEditForm] = useState<Partial<Patient>>({});

    const casualtyPatients = patients.filter(p => p.type === PatientType.CASUALTY && p.status === 'Active');
    
    // Filtered ICU Wards
    const icuWards = wards.filter(w => 
        w.type === 'ICU' && 
        (selectedHospital === 'All' || w.hospital === selectedHospital)
    );

    const getPriorityColor = (p: TriagePriority) => {
        switch(p) {
            case TriagePriority.RED: return 'bg-red-100 text-red-800 border-red-200';
            case TriagePriority.YELLOW: return 'bg-amber-100 text-amber-800 border-amber-200';
            case TriagePriority.GREEN: return 'bg-green-100 text-green-800 border-green-200';
            case TriagePriority.BLACK: return 'bg-slate-800 text-slate-100 border-slate-700';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleQuickRegister = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Find a bed in Casualty/Triage ward automatically if possible
        const casualtyWard = wards.find(w => w.type === 'Casualty' && w.beds.some(b => b.status === BedStatus.AVAILABLE));
        const bed = casualtyWard?.beds.find(b => b.status === BedStatus.AVAILABLE);

        const newPatient: Patient = {
            id: Date.now().toString(),
            uhid: `MMC-EM-${Math.floor(10000 + Math.random() * 90000)}`,
            name: regForm.name || 'Unknown Patient',
            age: parseInt(regForm.age) || 0,
            gender: regForm.gender as any,
            mobile: regForm.mobile || '0000000000',
            type: PatientType.CASUALTY,
            hospital: HospitalName.TRAUMA_CARE, // Default to Trauma Center for Casualty
            department: Department.EMERGENCY_MEDICINE,
            doctor: regForm.doctor,
            status: 'Active',
            triagePriority: regForm.triage,
            casualtyArrivalDate: new Date().toLocaleString(),
            diagnosis: regForm.complaint,
            ward: casualtyWard?.name,
            bedNumber: bed?.number,
            legalStatus: regForm.legalStatus
        };

        if (casualtyWard && bed) {
            updateBedStatus(casualtyWard.id, bed.id, BedStatus.OCCUPIED, newPatient.id);
        }

        // Generate Casualty Bill
        const newInvoice: Invoice = {
            id: `INV-EM-${Math.floor(Math.random() * 10000)}`,
            patientName: newPatient.name,
            uhid: newPatient.uhid,
            date: new Date().toISOString().split('T')[0],
            amount: 20, // Triage Fee
            status: 'Pending',
            mode: '-',
            scheme: 'General',
            items: ['Emergency Triage / Casualty Reg'],
            breakdown: { regFee: 20 }
        };

        onRegister(newPatient);
        onAddInvoice(newInvoice);
        setRegForm({ name: '', age: '', gender: 'Male', mobile: '', complaint: '', triage: TriagePriority.RED, doctor: 'Duty Doctor', legalStatus: 'MLC' });
        setView('triage');
    };

    const handleIcuAdmission = () => {
        if (!selectedPatient || !icuForm.wardId || !icuForm.bedId) return;

        const ward = wards.find(w => w.id === icuForm.wardId);
        const bed = ward?.beds.find(b => b.id === icuForm.bedId);

        if (ward && bed) {
            // Update Bed Status (Occupy New)
            updateBedStatus(ward.id, bed.id, BedStatus.OCCUPIED, selectedPatient.id);
            
            // Free up old bed if any
            const oldWard = wards.find(w => w.name === selectedPatient.ward);
            const oldBed = oldWard?.beds.find(b => b.number === selectedPatient.bedNumber);
            if (oldWard && oldBed) {
                updateBedStatus(oldWard.id, oldBed.id, BedStatus.AVAILABLE);
            }

            // Update Patient
            const updatedPatient: Patient = {
                ...selectedPatient,
                type: PatientType.IPD, // Convert to IPD
                department: ward.department,
                ward: ward.name,
                bedNumber: bed.number,
                doctor: icuForm.doctor || selectedPatient.doctor,
                admissionDate: new Date().toISOString().split('T')[0],
                admissionType: 'Cash' // Default
            };

            onUpdatePatient(updatedPatient);
            
            // Generate ICU Admission Bill
            const newInvoice: Invoice = {
                id: `INV-ICU-${Math.floor(Math.random() * 10000)}`,
                patientName: updatedPatient.name,
                uhid: updatedPatient.uhid,
                date: new Date().toISOString().split('T')[0],
                amount: 1500, // ICU Advance
                status: 'Pending',
                mode: '-',
                scheme: 'General',
                items: ['ICU Admission Deposit'],
                breakdown: { other: 1500 }
            };
            onAddInvoice(newInvoice);

            setShowIcuModal(false);
            setSelectedPatient(null);
            setIcuForm({ wardId: '', bedId: '', doctor: '' });
            alert("Patient Admitted to ICU Successfully");
        }
    };

    const openEditPatient = (p: Patient) => {
        setEditingPatient(p);
        setEditForm({ name: p.name, age: p.age, gender: p.gender, mobile: p.mobile, diagnosis: p.diagnosis });
    };

    const saveEditedPatient = () => {
        if (!editingPatient) return;
        onUpdatePatient({ ...editingPatient, ...editForm } as Patient);
        setEditingPatient(null);
    };

    return (
        <div className="space-y-6 animate-slide-down">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-red-50 p-4 rounded-xl border border-red-100">
                <div>
                    <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2">
                        <Siren className="w-8 h-8 animate-pulse" /> Emergency & Casualty
                    </h1>
                    <p className="text-red-900/60 text-sm">Trauma Center • Triage • Critical Care</p>
                </div>
                <button 
                    onClick={() => setView(view === 'triage' ? 'register' : 'triage')}
                    className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm ${view === 'triage' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-slate-700 border border-slate-300'}`}
                >
                    {view === 'triage' ? <><Plus className="w-5 h-5" /> Quick Registration</> : 'Back to Dashboard'}
                </button>
            </div>

            {view === 'register' && (
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-red-600" /> New Casualty Registration
                    </h2>
                    <form onSubmit={handleQuickRegister} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Triage Priority</label>
                                <select 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm"
                                    value={regForm.triage}
                                    onChange={e => setRegForm({...regForm, triage: e.target.value as TriagePriority})}
                                >
                                    {Object.values(TriagePriority).map(t => (
                                        <option key={t} value={t} className={getPriorityColor(t as TriagePriority)}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Doctor</label>
                                <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={regForm.doctor} onChange={e => setRegForm({...regForm, doctor: e.target.value})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label><input required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Name or Unknown" value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age & Gender</label>
                                <div className="flex gap-2">
                                    <input required type="number" className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Age" value={regForm.age} onChange={e => setRegForm({...regForm, age: e.target.value})} />
                                    <select className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={regForm.gender} onChange={e => setRegForm({...regForm, gender: e.target.value})}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Legal Case Status (MLC)</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded border border-slate-200 hover:border-slate-300">
                                    <input
                                        type="radio"
                                        name="legalStatus"
                                        value="Non-MLC"
                                        checked={regForm.legalStatus === 'Non-MLC'}
                                        onChange={() => setRegForm({ ...regForm, legalStatus: 'Non-MLC' })}
                                        className="w-4 h-4 text-slate-600 focus:ring-slate-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Non-MLC</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer bg-red-50 px-4 py-2 rounded border border-red-200 hover:border-red-300">
                                    <input
                                        type="radio"
                                        name="legalStatus"
                                        value="MLC"
                                        checked={regForm.legalStatus === 'MLC'}
                                        onChange={() => setRegForm({ ...regForm, legalStatus: 'MLC' })}
                                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-sm font-bold text-red-700 flex items-center gap-2">
                                        <Gavel className="w-3 h-3" /> Medico-Legal Case (MLC)
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chief Complaint / Injury</label><input required type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. RTA, Chest Pain..." value={regForm.complaint} onChange={e => setRegForm({...regForm, complaint: e.target.value})} /></div>
                        
                        <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-md">Register & Triage</button>
                    </form>
                </div>
            )}

            {view === 'triage' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Patients List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800">Active Casualty Patients ({casualtyPatients.length})</h3>
                        </div>
                        {casualtyPatients.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No active patients in casualty.</p>
                            </div>
                        ) : (
                            casualtyPatients.map(p => (
                                <div key={p.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center group hover:border-blue-300 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${p.triagePriority === TriagePriority.RED ? 'bg-red-50 border-red-500 text-red-600' : p.triagePriority === TriagePriority.YELLOW ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-green-50 border-green-500 text-green-600'}`}>
                                            {p.triagePriority === TriagePriority.RED ? 'R' : p.triagePriority === TriagePriority.YELLOW ? 'Y' : 'G'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                {p.name} 
                                                <span className="text-sm font-normal text-slate-500">({p.age} {p.gender})</span>
                                                <button onClick={() => openEditPatient(p)} className="text-slate-300 hover:text-blue-600 p-1 rounded-full hover:bg-slate-100" title="Edit Patient Details"><Edit2 className="w-3.5 h-3.5"/></button>
                                                {p.legalStatus === 'MLC' && (
                                                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wide">MLC</span>
                                                )}
                                            </h4>
                                            <p className="text-sm text-slate-600 mb-1">{p.diagnosis}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.casualtyArrivalDate}</span>
                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{p.uhid}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => { setSelectedPatient(p); setShowIcuModal(true); }}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 shadow-sm flex items-center gap-2"
                                        >
                                            Admit to ICU <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <button className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50">
                                            Move to OT
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Stats & Beds */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Triage Status</h3>
                            <div className="grid grid-cols-3 gap-2 text-center mb-6">
                                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div className="text-2xl font-bold text-red-600">{casualtyPatients.filter(p => p.triagePriority === TriagePriority.RED).length}</div>
                                    <div className="text-[10px] font-bold text-red-400 uppercase">Red</div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <div className="text-2xl font-bold text-amber-600">{casualtyPatients.filter(p => p.triagePriority === TriagePriority.YELLOW).length}</div>
                                    <div className="text-[10px] font-bold text-amber-400 uppercase">Yellow</div>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                    <div className="text-2xl font-bold text-green-600">{casualtyPatients.filter(p => p.triagePriority === TriagePriority.GREEN).length}</div>
                                    <div className="text-[10px] font-bold text-green-400 uppercase">Green</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" /> ICU Availability
                            </h3>
                            <div className="space-y-3">
                                {icuWards.map(w => {
                                    const free = w.beds.filter(b => b.status === BedStatus.AVAILABLE).length;
                                    return (
                                        <div key={w.id} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{w.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase">{w.hospital}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${free > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {free} Available
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Patient Modal */}
            {editingPatient && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Edit Patient Details</h3>
                            <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input type="text" className="w-full p-2 border rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                                    <input type="number" className="w-full p-2 border rounded" value={editForm.age} onChange={e => setEditForm({...editForm, age: parseInt(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                                    <select className="w-full p-2 border rounded" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value as any})}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                                <input type="text" className="w-full p-2 border rounded" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis</label>
                                <input type="text" className="w-full p-2 border rounded" value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} />
                            </div>
                            <button onClick={saveEditedPatient} className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 mt-2">Save Changes</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ICU Admission Modal Portal */}
            {showIcuModal && selectedPatient && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 bg-red-50">
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <BedDouble className="w-5 h-5" /> Admit to Critical Care (ICU)
                            </h3>
                            <p className="text-sm text-red-600 mt-1">Transferring: {selectedPatient.name} ({selectedPatient.uhid})</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select ICU Ward</label>
                                <select 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={icuForm.wardId}
                                    onChange={e => setIcuForm({...icuForm, wardId: e.target.value, bedId: ''})}
                                >
                                    <option value="">-- Choose ICU --</option>
                                    {icuWards.map(w => <option key={w.id} value={w.id}>{w.name} ({w.beds.filter(b => b.status === 'Available').length} Free)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Bed</label>
                                <select 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={icuForm.bedId}
                                    onChange={e => setIcuForm({...icuForm, bedId: e.target.value})}
                                    disabled={!icuForm.wardId}
                                >
                                    <option value="">-- Choose Bed --</option>
                                    {icuForm.wardId && wards.find(w => w.id === icuForm.wardId)?.beds.filter(b => b.status === 'Available').map(b => (
                                        <option key={b.id} value={b.id}>{b.number}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admitting Specialist</label>
                                <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Doctor Name" value={icuForm.doctor} onChange={e => setIcuForm({...icuForm, doctor: e.target.value})} />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowIcuModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
                                <button onClick={handleIcuAdmission} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md">Confirm Transfer</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Emergency;