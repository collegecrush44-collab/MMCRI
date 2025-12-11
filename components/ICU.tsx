import React, { useState, useEffect } from 'react';
import { Ward, Patient, BedStatus, HospitalName, Department } from '../types';
import { HeartPulse, Activity, Wind, Thermometer, Droplet, User, AlertTriangle, CheckCircle, Clock, Battery, Zap, BedDouble, Wrench } from 'lucide-react';

interface ICUProps {
    wards: Ward[];
    patients: Patient[];
    selectedHospital: HospitalName | 'All';
    updateBedStatus: (wardId: string, bedId: string, status: BedStatus, patientId?: string) => void;
}

// Mock Vitals Generator
const generateVitals = () => ({
    hr: 60 + Math.floor(Math.random() * 40), // 60-100
    spo2: 90 + Math.floor(Math.random() * 10), // 90-100
    bpSys: 100 + Math.floor(Math.random() * 40), // 100-140
    bpDia: 60 + Math.floor(Math.random() * 30), // 60-90
    rr: 12 + Math.floor(Math.random() * 10), // 12-22
    temp: (98 + Math.random() * 2).toFixed(1) // 98.0 - 100.0
});

const ICU: React.FC<ICUProps> = ({ wards, patients, selectedHospital, updateBedStatus }) => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'ventilators'>('monitor');
    // Store vitals in state to keep them consistent between renders, update every few seconds
    const [patientVitals, setPatientVitals] = useState<Record<string, any>>({});

    // Filter for ICU wards only
    const icuWards = wards.filter(w => 
        w.type === 'ICU' && 
        (selectedHospital === 'All' || w.hospital === selectedHospital)
    );

    const allIcuBeds = icuWards.flatMap(w => w.beds.map(b => ({ ...b, wardName: w.name, hospital: w.hospital })));
    const occupiedBeds = allIcuBeds.filter(b => b.status === BedStatus.OCCUPIED);
    const totalBeds = allIcuBeds.length;
    const occupiedCount = occupiedBeds.length;
    const availableCount = totalBeds - occupiedCount;
    const ventilatorCount = Math.floor(occupiedCount * 0.4); // Mock: 40% of patients on Ventilator

    // Simulating live vitals updates
    useEffect(() => {
        const interval = setInterval(() => {
            const newVitals: Record<string, any> = {};
            occupiedBeds.forEach(bed => {
                if (bed.patientId) {
                    newVitals[bed.patientId] = generateVitals();
                }
            });
            setPatientVitals(newVitals);
        }, 3000);

        return () => clearInterval(interval);
    }, [occupiedBeds.length]); // Re-run if bed count changes, though really we depend on patient IDs

    const getPatient = (id?: string) => patients.find(p => p.id === id);

    const getStatusColor = (vitals: any) => {
        if (!vitals) return 'bg-slate-100 border-slate-200';
        if (vitals.spo2 < 92 || vitals.hr > 110 || vitals.hr < 50) return 'bg-red-50 border-red-200 animate-pulse';
        if (vitals.spo2 < 95) return 'bg-amber-50 border-amber-200';
        return 'bg-white border-slate-200';
    };

    return (
        <div className="space-y-6 animate-slide-down">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><HeartPulse className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Total ICU Capacity</p>
                        <h3 className="text-xl font-bold text-slate-800">{totalBeds} Beds</h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-full"><Activity className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Occupied</p>
                        <h3 className="text-xl font-bold text-slate-800">{occupiedCount} <span className="text-xs font-normal text-slate-400">/ {totalBeds}</span></h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full"><CheckCircle className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Available</p>
                        <h3 className="text-xl font-bold text-slate-800">{availableCount} Beds</h3>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><Wind className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Active Ventilators</p>
                        <h3 className="text-xl font-bold text-slate-800">{ventilatorCount} Units</h3>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 w-fit">
                <button 
                    onClick={() => setActiveTab('monitor')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'monitor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Activity className="w-4 h-4" /> Live Patient Monitor
                </button>
                <button 
                    onClick={() => setActiveTab('ventilators')}
                    className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab === 'ventilators' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Wind className="w-4 h-4" /> Ventilator Management
                </button>
            </div>

            {/* Main Content */}
            {activeTab === 'monitor' && (
                <div className="space-y-6">
                    {icuWards.map(ward => (
                        <div key={ward.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {ward.name} <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{ward.hospital}</span>
                                    </h3>
                                </div>
                                <div className="text-xs font-bold text-slate-500 uppercase">
                                    Capacity: {ward.beds.length} | Free: {ward.beds.filter(b => b.status === BedStatus.AVAILABLE).length}
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ward.beds.map(bed => {
                                    const patient = getPatient(bed.patientId);
                                    const vitals = bed.patientId ? patientVitals[bed.patientId] : null;
                                    const isCritical = vitals && (vitals.spo2 < 92 || vitals.hr > 120);
                                    const isMaintenance = bed.status === BedStatus.MAINTENANCE;

                                    return (
                                        <div key={bed.id} className={`rounded-xl border p-4 flex flex-col justify-between min-h-[200px] transition-all relative 
                                            ${isMaintenance ? 'bg-slate-100 border-slate-300 opacity-70' : getStatusColor(vitals)} 
                                            ${bed.status === BedStatus.AVAILABLE ? 'border-dashed border-slate-300 bg-green-50/30 opacity-80 hover:opacity-100 hover:bg-green-50' : 'shadow-sm'}`}>
                                            
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-white/80 px-2 py-1 rounded text-xs font-bold border border-slate-200 shadow-sm">
                                                    {bed.number}
                                                </div>
                                                {bed.status === BedStatus.AVAILABLE && (
                                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">AVAILABLE</span>
                                                )}
                                                {isMaintenance && (
                                                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded flex items-center gap-1">
                                                        <Wrench className="w-3 h-3" /> MAINT
                                                    </span>
                                                )}
                                                {isCritical && !isMaintenance && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100 shadow-sm animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" /> CRITICAL
                                                    </span>
                                                )}
                                            </div>

                                            {patient ? (
                                                <>
                                                    <div className="mb-4">
                                                        <h4 className="font-bold text-slate-800 truncate">{patient.name}</h4>
                                                        <p className="text-xs text-slate-500">{patient.age}Y / {patient.gender} • {patient.uhid}</p>
                                                        <p className="text-xs text-slate-400 mt-1 truncate">{patient.diagnosis}</p>
                                                    </div>

                                                    {vitals ? (
                                                        <div className="grid grid-cols-3 gap-2 text-center">
                                                            <div className="bg-white/60 p-2 rounded-lg border border-slate-100">
                                                                <div className="flex justify-center text-red-500 mb-1"><HeartPulse className="w-4 h-4 animate-pulse" /></div>
                                                                <div className="text-lg font-black text-slate-800">{vitals.hr}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">HR</div>
                                                            </div>
                                                            <div className="bg-white/60 p-2 rounded-lg border border-slate-100">
                                                                <div className="flex justify-center text-blue-500 mb-1"><Droplet className="w-4 h-4" /></div>
                                                                <div className={`text-lg font-black ${vitals.spo2 < 92 ? 'text-red-600' : 'text-slate-800'}`}>{vitals.spo2}%</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">SpO2</div>
                                                            </div>
                                                            <div className="bg-white/60 p-2 rounded-lg border border-slate-100">
                                                                <div className="flex justify-center text-indigo-500 mb-1"><Activity className="w-4 h-4" /></div>
                                                                <div className="text-lg font-black text-slate-800">{vitals.bpSys}/{vitals.bpDia}</div>
                                                                <div className="text-[10px] text-slate-400 font-bold">BP</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-20 text-slate-400 text-xs">
                                                            Connecting Monitor...
                                                        </div>
                                                    )}
                                                </>
                                            ) : isMaintenance ? (
                                                <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                                                    <Wrench className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-sm font-medium">Out of Service</p>
                                                </div>
                                            ) : (
                                                <div className="flex-grow flex flex-col items-center justify-center text-green-600/60">
                                                    <BedDouble className="w-8 h-8 mb-2 opacity-80" />
                                                    <p className="text-sm font-bold">Ready for Admission</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'ventilators' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Wind className="w-5 h-5 text-purple-600" /> Ventilator Allocation
                        </h3>
                        <div className="space-y-4">
                            {icuWards.map(ward => {
                                const ventCount = Math.ceil(ward.beds.length * 0.5); // Assume 50% beds have vents
                                const inUse = ward.beds.filter(b => b.status === BedStatus.OCCUPIED && parseInt(b.number.split('-')[1] || '0') % 2 === 0).length; // Mock usage
                                
                                return (
                                    <div key={ward.id} className="border-b border-slate-50 pb-4 last:border-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-slate-700">{ward.name}</span>
                                            <span className="text-xs font-medium text-slate-500">{inUse} / {ventCount} In Use</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${(inUse / ventCount) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4">Device Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Zap className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">12</div>
                                    <div className="text-xs text-slate-500">Active Mode</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Battery className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">4</div>
                                    <div className="text-xs text-slate-500">On Backup Power</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">8</div>
                                    <div className="text-xs text-slate-500">Standby / Clean</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">1</div>
                                    <div className="text-xs text-slate-500">Maintenance Req</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ICU;