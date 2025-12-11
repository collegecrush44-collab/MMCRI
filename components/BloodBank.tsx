import React, { useState } from 'react';
import { Droplet, Users, FileText, Activity, Plus, Search, CheckCircle, AlertTriangle, Calendar, X, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import { HospitalName, Patient } from '../types';
import { BLOOD_STOCK } from '../services/mockData';
import SearchableSelect from './SearchableSelect';

interface BloodBankProps {
    selectedHospital: HospitalName | 'All';
    patients: Patient[];
}

interface Donor {
    id: string;
    name: string;
    bloodGroup: string;
    age: number;
    lastDonationDate: string;
    contact: string;
    status: 'Eligible' | 'Ineligible';
}

interface BloodRequest {
    id: string;
    patientId: string;
    patientName: string;
    bloodGroup: string;
    component: string;
    units: number;
    urgency: 'Routine' | 'Urgent' | 'Critical';
    status: 'Pending' | 'Cross-Matching' | 'Issued';
    requestDate: string;
}

const MOCK_DONORS: Donor[] = [
    { id: 'D001', name: 'Rajesh S', bloodGroup: 'A+', age: 28, lastDonationDate: '2023-12-10', contact: '9876543210', status: 'Eligible' },
    { id: 'D002', name: 'Amit Kumar', bloodGroup: 'O+', age: 35, lastDonationDate: '2024-04-15', contact: '8877665544', status: 'Ineligible' }, // Too recent
    { id: 'D003', name: 'Sneha P', bloodGroup: 'B-', age: 24, lastDonationDate: '2023-01-20', contact: '9988776655', status: 'Eligible' },
];

const MOCK_REQUESTS: BloodRequest[] = [
    { id: 'REQ-101', patientId: '1', patientName: 'Ramesh Kumar', bloodGroup: 'O+', component: 'PRBC', units: 2, urgency: 'Urgent', status: 'Pending', requestDate: '2024-05-18 10:30' },
    { id: 'REQ-102', patientId: '5', patientName: 'Robert D', bloodGroup: 'B+', component: 'Whole Blood', units: 1, urgency: 'Critical', status: 'Cross-Matching', requestDate: '2024-05-18 11:00' },
];

const BloodBank: React.FC<BloodBankProps> = ({ selectedHospital, patients }) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'donors' | 'requests'>('inventory');
    
    // State Management
    const [donors, setDonors] = useState<Donor[]>(MOCK_DONORS);
    const [requests, setRequests] = useState<BloodRequest[]>(MOCK_REQUESTS);
    const [stock, setStock] = useState(BLOOD_STOCK);

    // Forms
    const [showAddDonor, setShowAddDonor] = useState(false);
    const [newDonor, setNewDonor] = useState({ name: '', bloodGroup: 'A+', age: '', contact: '', lastDonationDate: '' });
    
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [newRequest, setNewRequest] = useState({ patientId: '', component: 'PRBC', units: 1, urgency: 'Routine' });

    // Handlers
    const handleAddDonor = (e: React.FormEvent) => {
        e.preventDefault();
        const donor: Donor = {
            id: `D${Date.now()}`,
            name: newDonor.name,
            bloodGroup: newDonor.bloodGroup,
            age: parseInt(newDonor.age),
            lastDonationDate: newDonor.lastDonationDate || 'Never',
            contact: newDonor.contact,
            status: 'Eligible'
        };
        setDonors([donor, ...donors]);
        setShowAddDonor(false);
        setNewDonor({ name: '', bloodGroup: 'A+', age: '', contact: '', lastDonationDate: '' });
    };

    const handleCreateRequest = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patients.find(p => p.id === newRequest.patientId);
        if (!patient) return;

        const req: BloodRequest = {
            id: `REQ-${Math.floor(Math.random()*1000)}`,
            patientId: patient.id,
            patientName: patient.name,
            bloodGroup: 'Unknown', // Ideally get from patient record, mock for now
            component: newRequest.component,
            units: newRequest.units,
            urgency: newRequest.urgency as any,
            status: 'Pending',
            requestDate: new Date().toLocaleString()
        };
        setRequests([req, ...requests]);
        setShowRequestForm(false);
    };

    const handleIssue = (reqId: string) => {
        setRequests(requests.map(r => r.id === reqId ? { ...r, status: 'Issued' } : r));
        // In real app, decrement stock here
    };

    const patientOptions = patients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));

    const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1";

    return (
        <div className="space-y-6 animate-slide-down">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Droplet className="w-8 h-8 text-red-600" /> Blood Bank Management
                    </h1>
                    <p className="text-slate-500 text-sm">Inventory, Donors, and Cross-matching</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'inventory' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Inventory</button>
                    <button onClick={() => setActiveTab('donors')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'donors' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Donors</button>
                    <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'requests' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>Requests</button>
                </div>
            </div>

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stock.map(item => (
                        <div key={item.group} className={`bg-white p-6 rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden ${item.units < 10 ? 'border-red-100' : 'border-slate-100'}`}>
                            <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold text-white ${item.units < 10 ? 'bg-red-500' : 'bg-green-500'}`}>
                                {item.status}
                            </div>
                            <div className="text-4xl font-black text-slate-800 mb-2">{item.group}</div>
                            <div className={`text-xl font-bold ${item.units < 10 ? 'text-red-600' : 'text-slate-600'}`}>{item.units} Units</div>
                            <div className="w-full mt-4 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${item.units < 10 ? 'bg-red-500' : 'bg-red-600'}`} style={{ width: `${Math.min(100, item.units)}%` }}></div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center text-[10px] text-slate-500">
                                <div className="bg-slate-50 p-1 rounded border">PRBC</div>
                                <div className="bg-slate-50 p-1 rounded border">FFP</div>
                                <div className="bg-slate-50 p-1 rounded border">PLT</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DONORS TAB */}
            {activeTab === 'donors' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> Registered Donors</h3>
                        <button onClick={() => setShowAddDonor(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Donor
                        </button>
                    </div>
                    
                    {showAddDonor && (
                        <div className="p-6 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
                            <form onSubmit={handleAddDonor} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div><label className={labelClass}>Name</label><input required className={inputClass} value={newDonor.name} onChange={e => setNewDonor({...newDonor, name: e.target.value})} /></div>
                                <div>
                                    <label className={labelClass}>Blood Group</label>
                                    <select className={inputClass} value={newDonor.bloodGroup} onChange={e => setNewDonor({...newDonor, bloodGroup: e.target.value})}>
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div><label className={labelClass}>Age</label><input required type="number" className={inputClass} value={newDonor.age} onChange={e => setNewDonor({...newDonor, age: e.target.value})} /></div>
                                <div><label className={labelClass}>Contact</label><input required className={inputClass} value={newDonor.contact} onChange={e => setNewDonor({...newDonor, contact: e.target.value})} /></div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowAddDonor(false)} className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-600 font-bold">Cancel</button>
                                    <button type="submit" className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Donor Name</th>
                                <th className="px-6 py-4">Group</th>
                                <th className="px-6 py-4">Last Donation</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {donors.map(donor => (
                                <tr key={donor.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-700">{donor.name} <span className="text-xs font-normal text-slate-400">({donor.age}Y)</span></td>
                                    <td className="px-6 py-4"><span className="bg-red-50 text-red-700 px-2 py-1 rounded font-bold text-xs border border-red-100">{donor.bloodGroup}</span></td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{donor.lastDonationDate}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{donor.contact}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${donor.status === 'Eligible' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{donor.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === 'requests' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-600"/> Blood Requests</h3>
                        <button onClick={() => setShowRequestForm(true)} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> New Request
                        </button>
                    </div>

                    {showRequestForm && (
                        <div className="p-6 bg-purple-50 border-b border-purple-100 animate-in slide-in-from-top-2">
                            <form onSubmit={handleCreateRequest} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Select Patient</label>
                                        <SearchableSelect options={patientOptions} value={newRequest.patientId} onChange={v => setNewRequest({...newRequest, patientId: v})} placeholder="Search Patient..." />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Component</label>
                                        <select className={inputClass} value={newRequest.component} onChange={e => setNewRequest({...newRequest, component: e.target.value})}>
                                            <option>Whole Blood</option><option>PRBC</option><option>FFP</option><option>Platelets</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Units Required</label>
                                        <input type="number" className={inputClass} value={newRequest.units} onChange={e => setNewRequest({...newRequest, units: parseInt(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Urgency</label>
                                        <select className={inputClass} value={newRequest.urgency} onChange={e => setNewRequest({...newRequest, urgency: e.target.value as any})}>
                                            <option>Routine</option><option>Urgent</option><option>Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setShowRequestForm(false)} className="px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-600 font-bold">Cancel</button>
                                    <button type="submit" className="px-4 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold">Create Request</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Req ID</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Requirement</th>
                                <th className="px-6 py-4">Urgency</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{req.id}</td>
                                    <td className="px-6 py-4 font-bold text-slate-700">{req.patientName}</td>
                                    <td className="px-6 py-4 text-sm">{req.units} Units {req.component} <span className="text-xs text-slate-400 block">({req.bloodGroup})</span></td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.urgency === 'Critical' ? 'bg-red-100 text-red-700 animate-pulse' : req.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                            {req.urgency}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === 'Issued' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {req.status !== 'Issued' && (
                                            <button onClick={() => handleIssue(req.id)} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-black transition-colors">
                                                Issue Blood
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BloodBank;