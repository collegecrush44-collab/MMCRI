import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Search, Trash2, FileText, CheckCircle, Clock, IndianRupee, User, ShoppingCart, ShieldCheck, Save, Printer, LogOut, BedDouble, AlertCircle, Gavel, Edit2, X } from 'lucide-react';
import { MOCK_PATIENTS, MASTER_SERVICE_CATALOG } from '../services/mockData';
import { Invoice, Patient, Ward, BedStatus, PatientType } from '../types';
import SearchableSelect from './SearchableSelect';

interface BillingProps {
    invoices: Invoice[];
    onAddInvoice: (inv: Invoice) => void;
    onUpdateInvoice?: (inv: Invoice) => void;
    patients?: Patient[];
    wards?: Ward[];
    onUpdatePatient?: (patient: Patient) => void;
    updateBedStatus?: (wardId: string, bedId: string, status: BedStatus, patientId?: string) => void;
}

const Billing: React.FC<BillingProps> = ({ invoices, onAddInvoice, onUpdateInvoice, patients = [], wards = [], onUpdatePatient, updateBedStatus }) => {
    const [activeView, setActiveView] = useState<'create' | 'history' | 'discharge'>('create');
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [cart, setCart] = useState<{id: string, name: string, price: number, qty: number, category: string}[]>([]);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [billingScheme, setBillingScheme] = useState('General'); 
    const [lastInvoice, setLastInvoice] = useState<any>(null);
    const [dischargePatientId, setDischargePatientId] = useState('');
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('');
    
    // Editing State
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    const patientsOptions = patients.length > 0 ? patients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id })) : MOCK_PATIENTS.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));
    const activeIPDPatients = patients.filter(p => p.type === PatientType.IPD && p.status === 'Active');
    const ipdOptions = activeIPDPatients.map(p => ({ label: `${p.name} (${p.uhid})`, value: p.id }));

    const serviceOptions = MASTER_SERVICE_CATALOG
        .filter(s => !cart.some(item => item.id === s.id))
        .map(s => ({ 
            label: `${s.name} - ₹${s.price}`, 
            value: s.id,
            group: s.category 
        }));

    const selectedPatient = (patients.length > 0 ? patients : MOCK_PATIENTS).find(p => p.id === selectedPatientId);
    
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const isSchemeApplied = billingScheme !== 'General';
    const total = isSchemeApplied ? 0 : subtotal;

    const calculateDuration = (dateStr?: string) => {
        if (!dateStr) return '0 Days';
        const start = new Date(dateStr);
        const end = new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
    };

    const dischargeBillDetails = useMemo(() => {
        if (!dischargePatientId) return null;
        const p = patients.find(pt => pt.id === dischargePatientId);
        if (!p) return null;

        const daysNum = parseInt(calculateDuration(p.admissionDate).split(' ')[0]) || 1;
        const roomRate = 500; // Mock rate
        const roomCharge = roomRate * daysNum;
        const nursing = 1000;
        const consumables = 1500;
        const dischargeTotal = roomCharge + nursing + consumables;

        return { days: daysNum, roomCharge, nursing, consumables, total: dischargeTotal, patient: p };
    }, [dischargePatientId, patients]);

    const handleAddItem = (serviceId: string) => {
        const service = MASTER_SERVICE_CATALOG.find(s => s.id === serviceId);
        if (!service) return;
        
        const existing = cart.find(i => i.id === serviceId);
        if (existing) {
            setCart(cart.map(i => i.id === serviceId ? { ...i, qty: i.qty + 1 } : i));
        } else {
            setCart([...cart, { id: service.id, name: service.name, price: service.price, qty: 1, category: service.category }]);
        }
    };

    const handleRemoveItem = (id: string) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const handleUpdateQty = (id: string, delta: number) => {
        setCart(cart.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.qty + delta);
                return { ...i, qty: newQty };
            }
            return i;
        }));
    };

    const handleGenerateBill = (action: 'collect' | 'save' | 'print') => {
        if (!selectedPatient || cart.length === 0) return;

        let status = 'Pending';
        let mode = paymentMode;

        if (total === 0) {
            status = 'Waived';
            mode = billingScheme;
        } else {
            if (action === 'collect') {
                status = 'Paid';
            } else if (action === 'save') {
                status = 'Pending';
                mode = '-';
            } else if (action === 'print') {
                status = 'Paid'; 
            }
        }

        const newInvoice: Invoice = {
            id: `INV-24-${Math.floor(1000 + Math.random() * 9000)}`,
            patientName: selectedPatient.name,
            uhid: selectedPatient.uhid,
            date: new Date().toISOString().split('T')[0],
            amount: total,
            status: status,
            mode: mode,
            scheme: billingScheme,
            items: cart.map(i => i.name),
            breakdown: {
                other: total
            }
        };

        onAddInvoice(newInvoice);
        setLastInvoice({ ...newInvoice, autoPrint: action === 'print' });
        
        setCart([]);
        setSelectedPatientId('');
        setBillingScheme('General');
        setPaymentMode('Cash');
    };

    const handleConfirmDischarge = () => {
        if (!dischargeBillDetails || !onUpdatePatient || !updateBedStatus) return;
        const { patient, total: dischargeTotal, days } = dischargeBillDetails;

        // Check if admission was under a free scheme
        const scheme = patient.admissionType || 'General';
        const isFreeScheme = ['Free', 'Ayushman Bharat', 'BPL', 'Staff', 'Govt Scheme'].includes(scheme);
        const finalAmount = isFreeScheme ? 0 : dischargeTotal;
        const status = isFreeScheme ? 'Waived' : 'Paid';
        const mode = isFreeScheme ? scheme : 'Cash'; // Default Cash for demo

        const newInvoice: Invoice = {
            id: `INV-FINAL-${Math.floor(Math.random() * 10000)}`,
            patientName: patient.name,
            uhid: patient.uhid,
            date: new Date().toISOString().split('T')[0],
            amount: finalAmount,
            status: status,
            mode: mode,
            scheme: scheme,
            items: [`IPD Charges (${days} Days)`, 'Nursing Charges', 'Discharge Meds'],
            breakdown: { other: finalAmount }
        };
        onAddInvoice(newInvoice);

        const ward = wards.find(w => w.name === patient.ward);
        const bed = ward?.beds.find(b => b.number === patient.bedNumber);
        if (ward && bed) {
            updateBedStatus(ward.id, bed.id, BedStatus.AVAILABLE);
        }

        onUpdatePatient({ ...patient, status: 'Discharged' });

        alert(`Discharge Successful! Final Bill of ₹${finalAmount} settled (${scheme}).`);
        setDischargePatientId('');
        setShowDischargeModal(false);
    };

    const saveEditedInvoice = () => {
        if (editingInvoice && onUpdateInvoice) {
            onUpdateInvoice(editingInvoice);
            setEditingInvoice(null);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysInvoices = invoices.filter(i => i.date === todayStr);
    const totalCollection = todaysInvoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.amount, 0);
    const pendingAmount = todaysInvoices.filter(i => i.status === 'Pending').reduce((acc, i) => acc + i.amount, 0);
    const transactionCount = todaysInvoices.length;

    const filteredInvoices = invoices.filter(inv => 
        inv.patientName.toLowerCase().includes(historyFilter.toLowerCase()) || 
        inv.id.toLowerCase().includes(historyFilter.toLowerCase())
    );

    const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 ml-1";

    return (
        <div className="space-y-6 animate-slide-down">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Collection</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">₹ {totalCollection.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Dues</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">₹ {pendingAmount.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Transactions</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{transactionCount}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveView('create')}
                    className={`pb-3 px-4 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeView === 'create' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <CreditCard className="w-4 h-4" /> New Invoice
                </button>
                <button
                    onClick={() => setActiveView('discharge')}
                    className={`pb-3 px-4 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeView === 'discharge' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <LogOut className="w-4 h-4" /> IPD Discharge Settlement
                </button>
                <button
                    onClick={() => setActiveView('history')}
                    className={`pb-3 px-4 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeView === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Clock className="w-4 h-4" /> Transaction History
                </button>
            </div>

            {/* View: Create Invoice */}
            {activeView === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Invoice Success Modal Portal */}
                    {lastInvoice && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col">
                                <div className={`p-6 text-center text-white ${lastInvoice.amount === 0 ? 'bg-indigo-600' : 'bg-green-600'} flex-shrink-0`}>
                                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold">
                                        {lastInvoice.autoPrint ? 'Printing Receipt...' : 'Invoice Generated!'}
                                    </h2>
                                    <p className="text-white/90 text-sm mt-1">Transaction recorded successfully.</p>
                                </div>
                                <div className="p-6 bg-slate-50 overflow-y-auto custom-scrollbar flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Total Amount</span>
                                        <span className="text-lg font-bold text-slate-800">₹ {lastInvoice.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Status</span>
                                        <span className={`text-sm font-bold ${lastInvoice.amount === 0 ? 'text-indigo-600' : 'text-green-600'}`}>{lastInvoice.status}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Scheme</span>
                                        <span className="text-sm font-medium text-slate-700">{lastInvoice.scheme}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Invoice ID</span>
                                        <span className="text-sm font-mono text-slate-700">{lastInvoice.id}</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            alert("Printing receipt...");
                                            setLastInvoice(null);
                                        }}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-100 shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> {lastInvoice.autoPrint ? 'Re-Print Receipt' : 'Print Receipt'}
                                    </button>
                                    <button 
                                        onClick={() => setLastInvoice(null)}
                                        className="w-full mt-3 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg"
                                    >
                                        Start New Bill
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    {/* Left Column: Bill Builder */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px] flex flex-col">
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
                                        <ShoppingCart className="w-5 h-5 text-blue-600" /> Bill Items
                                    </h3>
                                    <div className="w-full sm:w-64">
                                        <SearchableSelect
                                            options={patientsOptions}
                                            value={selectedPatientId}
                                            onChange={setSelectedPatientId}
                                            placeholder="Select Patient (Name/UHID)..."
                                        />
                                    </div>
                                </div>
                                <div className="w-full md:w-64">
                                    <SearchableSelect
                                        options={serviceOptions}
                                        value=""
                                        onChange={handleAddItem}
                                        placeholder="Add Service..."
                                    />
                                </div>
                             </div>

                             <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3">Category</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                                <th className="px-4 py-3 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {cart.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                                        <div className="flex flex-col items-center">
                                                            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                                            <p>Cart is empty. Add services to begin billing.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                cart.map((item) => (
                                                    <tr key={item.id} className="bg-white hover:bg-blue-50/50">
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">
                                                            <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{item.category}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-slate-600">₹{item.price}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => handleUpdateQty(item.id, -1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">-</button>
                                                                <span className="w-4 text-center text-sm font-bold">{item.qty}</span>
                                                                <button onClick={() => handleUpdateQty(item.id, 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">+</button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-right text-slate-800">₹{item.price * item.qty}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                             </div>

                             <div className="flex flex-col items-end space-y-2 text-sm">
                                 <div className="flex justify-between w-72 text-slate-500">
                                     <span>Subtotal:</span>
                                     <span>₹ {subtotal}</span>
                                 </div>
                                 <div className="flex justify-between w-72 text-slate-500">
                                     <span>Scheme Discount:</span>
                                     <span className={isSchemeApplied ? 'text-green-600 font-bold' : ''}>
                                         {isSchemeApplied ? `- ₹ ${subtotal}` : '₹ 0'}
                                     </span>
                                 </div>
                                 {isSchemeApplied && (
                                     <div className="w-72 text-right text-xs text-green-600 italic font-medium bg-green-50 p-1 rounded">
                                         Applied Scheme: {billingScheme}
                                     </div>
                                 )}
                                 <div className="flex justify-between w-72 text-xl font-bold text-slate-800 pt-2 border-t border-slate-200">
                                     <span>Net Payable:</span>
                                     <span>₹ {total}</span>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Right Column: Patient & Payment */}
                    <div className="space-y-6">
                        {/* Patient Selection Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <User className="w-4 h-4 text-blue-600" /> Patient Details
                            </h3>
                            
                            {selectedPatient ? (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-2 animate-in fade-in">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800">{selectedPatient.name}</p>
                                            <p className="text-xs text-slate-500">{selectedPatient.uhid}</p>
                                        </div>
                                        <span className="text-[10px] bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded font-bold uppercase">{selectedPatient.type}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-blue-200/50">
                                        <div><span className="text-slate-400">Age:</span> {selectedPatient.age} Y</div>
                                        <div><span className="text-slate-400">Gender:</span> {selectedPatient.gender}</div>
                                        <div><span className="text-slate-400">Mobile:</span> {selectedPatient.mobile}</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No patient selected
                                </div>
                            )}
                        </div>

                        {/* Payment Details */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <CreditCard className="w-4 h-4 text-green-600" /> Payment & Scheme
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Billing Scheme</label>
                                    <select 
                                        className={inputClass}
                                        value={billingScheme}
                                        onChange={(e) => setBillingScheme(e.target.value)}
                                    >
                                        <option value="General">General (Cash/Card)</option>
                                        <option value="Ayushman Bharat">Ayushman Bharat (Free)</option>
                                        <option value="BPL">BPL (Free)</option>
                                        <option value="EHS">EHS (Govt Employee)</option>
                                        <option value="Staff">Hospital Staff (Waived)</option>
                                    </select>
                                </div>

                                {billingScheme === 'General' && (
                                    <div>
                                        <label className={labelClass}>Payment Mode</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Cash', 'Card', 'UPI', 'NEFT'].map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setPaymentMode(mode)}
                                                    className={`py-3 text-xs font-bold rounded-xl border transition-all ${paymentMode === mode ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                                <button 
                                    onClick={() => handleGenerateBill('save')}
                                    disabled={!selectedPatient || cart.length === 0}
                                    className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save as Pending
                                </button>
                                <button 
                                    onClick={() => handleGenerateBill('print')}
                                    disabled={!selectedPatient || cart.length === 0}
                                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Printer className="w-4 h-4" /> Generate & Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View: Discharge Settlement */}
            {activeView === 'discharge' && (
                <div>
                     {/* Discharge Modal Portal */}
                     {showDischargeModal && dischargeBillDetails && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <LogOut className="w-5 h-5 text-red-600" /> Final Discharge Bill
                                    </h3>
                                    <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-5 h-5 rotate-45" /></button>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-8 overflow-y-auto custom-scrollbar flex-1">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 border-b pb-1">Patient Details</h4>
                                        <p className="font-bold text-lg text-slate-800">{dischargeBillDetails.patient.name}</p>
                                        <p className="text-sm text-slate-500 mb-2">{dischargeBillDetails.patient.uhid}</p>
                                        <div className="space-y-1 text-sm text-slate-600">
                                            <p>Ward: <span className="font-medium">{dischargeBillDetails.patient.ward}</span></p>
                                            <p>Admission Date: <span className="font-medium">{dischargeBillDetails.patient.admissionDate}</span></p>
                                            <p>Duration: <span className="font-bold text-blue-600">{dischargeBillDetails.days} Days</span></p>
                                            <p>Scheme: <span className="font-bold text-purple-600">{dischargeBillDetails.patient.admissionType}</span></p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 border-b pb-1">Bill Summary</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Room Charges ({dischargeBillDetails.days}d):</span>
                                                <span className="font-medium">₹{dischargeBillDetails.roomCharge}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Nursing Charges:</span>
                                                <span className="font-medium">₹{dischargeBillDetails.nursing}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Consumables:</span>
                                                <span className="font-medium">₹{dischargeBillDetails.consumables}</span>
                                            </div>
                                            
                                            {/* Logic to show waived amount */}
                                            {['Free', 'Ayushman Bharat', 'BPL', 'Staff', 'Govt Scheme'].includes(dischargeBillDetails.patient.admissionType || '') ? (
                                                <>
                                                    <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-400 line-through">
                                                        <span>Calculated Total:</span>
                                                        <span>₹{dischargeBillDetails.total}</span>
                                                    </div>
                                                    <div className="flex justify-between text-lg font-bold text-green-600">
                                                        <span>Net Payable:</span>
                                                        <span>₹0 (Waived)</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex justify-between pt-2 border-t border-slate-200 text-lg font-bold text-slate-800">
                                                    <span>Total Payable:</span>
                                                    <span>₹{dischargeBillDetails.total}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
                                    <button onClick={() => setShowDischargeModal(false)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-600">Cancel</button>
                                    <button onClick={handleConfirmDischarge} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm">
                                        Confirm Payment & Discharge
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                     )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-6">Select Patient for Final Settlement</h3>
                        <div className="max-w-md mb-8">
                            <SearchableSelect
                                options={ipdOptions}
                                value={dischargePatientId}
                                onChange={(val) => {
                                    setDischargePatientId(val);
                                    setShowDischargeModal(true);
                                }}
                                placeholder="Search Admitted Patient..."
                            />
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800">IPD Discharge Process</h4>
                                <p className="text-xs text-blue-700 mt-1">
                                    Finalizing the bill will automatically generate the final invoice, 
                                    mark the invoice as 'Paid', and release the bed in the ward. 
                                    Ensure all lab and pharmacy dues are cleared before proceeding.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View: History */}
            {activeView === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                    {editingInvoice && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-slate-800">Edit Invoice</h3>
                                    <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Invoice Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            className={inputClass}
                                            value={editingInvoice.amount}
                                            onChange={(e) => setEditingInvoice({...editingInvoice, amount: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Payment Status</label>
                                        <select 
                                            className={inputClass}
                                            value={editingInvoice.status}
                                            onChange={(e) => setEditingInvoice({...editingInvoice, status: e.target.value})}
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Waived">Waived</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Payment Mode</label>
                                        <select 
                                            className={inputClass}
                                            value={editingInvoice.mode}
                                            onChange={(e) => setEditingInvoice({...editingInvoice, mode: e.target.value})}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="Card">Card</option>
                                            <option value="UPI">UPI</option>
                                            <option value="-">-</option>
                                        </select>
                                    </div>
                                    <button onClick={saveEditedInvoice} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Save Changes</button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <div className="relative w-64">
                             <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                placeholder="Search Invoice No / Name..." 
                                className={`${inputClass} pl-10`}
                                value={historyFilter}
                                onChange={e => setHistoryFilter(e.target.value)}
                             />
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">Export CSV</button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-white text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-100">Invoice ID</th>
                                <th className="px-6 py-4 border-b border-slate-100">Date</th>
                                <th className="px-6 py-4 border-b border-slate-100">Patient</th>
                                <th className="px-6 py-4 border-b border-slate-100">Amount</th>
                                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 border-b border-slate-100">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No invoices found.</td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{inv.id}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{inv.date}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800">{inv.patientName}</p>
                                            <p className="text-xs text-slate-500">{inv.uhid}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">₹{inv.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                                inv.status === 'Waived' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1">
                                                    <Printer className="w-3 h-3" /> Print
                                                </button>
                                                <button onClick={() => setEditingInvoice(inv)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit Invoice">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Billing;