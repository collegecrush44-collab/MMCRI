import React from 'react';
import { MessageSquare, ExternalLink, Stethoscope, ArrowRight, CheckCircle } from 'lucide-react';
import { ReferralType, Referral } from '../types';

interface DelloPlusProps {
    referrals: Referral[];
    onAcceptReferral?: (id: string) => void;
}

const DelloPlus: React.FC<DelloPlusProps> = ({ referrals, onAcceptReferral }) => {
  // Only show External Dello+ Referrals
  const externalReferrals = referrals.filter(ref => ref.type === ReferralType.EXTERNAL);

  return (
    <div className="space-y-6 animate-slide-down">
      {/* Branding Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-xl p-6 text-white shadow-md">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    Dello+ <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">PRO</span>
                </h2>
                <p className="text-indigo-100 text-sm mt-1">Cross-Facility Referral & Communication Hub</p>
            </div>
            <button className="px-4 py-2 bg-white text-indigo-800 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-indigo-50">
                Open Provider Portal <ExternalLink className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral List */}
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Incoming External Referrals</h3>
            {externalReferrals.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
                    No active external referrals.
                 </div>
            ) : (
                externalReferrals.map((ref) => (
                    <div key={ref.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 text-purple-700 p-2 rounded-full">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{ref.patientName}</h4>
                                    <p className="text-xs text-slate-500">From: {ref.referringDoctor}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ref.urgency === 'Urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {ref.urgency}
                            </span>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-3 border border-slate-100">
                            <span className="font-semibold text-slate-700 block mb-1">Clinical Note:</span>
                            {ref.notes}
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <div className="text-xs text-slate-400">Referred: {ref.date}</div>
                            <div className="flex space-x-2">
                                <button className="px-3 py-1.5 border border-slate-300 text-slate-700 text-sm rounded hover:bg-slate-50 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> Chat
                                </button>
                                {ref.status === 'Admitted' ? (
                                    <button disabled className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded font-bold flex items-center gap-1 cursor-default">
                                        <CheckCircle className="w-3 h-3" /> Admitted
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => onAcceptReferral && onAcceptReferral(ref.id)}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-1"
                                    >
                                        Accept & Admit <ArrowRight className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Chat / Context Panel */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                <h3 className="font-bold text-slate-800 text-sm">Active Consultation</h3>
                <p className="text-xs text-slate-500">Dr. K. Nair (Hunsur) • Regarding: Sunita Rao</p>
            </div>
            
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                <div className="flex justify-start">
                    <div className="bg-slate-100 text-slate-700 p-3 rounded-tr-lg rounded-bl-lg rounded-br-lg text-sm max-w-[80%]">
                        Hello Dr. Suresh, sending Mrs. Rao. Her ECG looks concerning. I've attached the strip in the file.
                    </div>
                </div>
                 <div className="flex justify-end">
                    <div className="bg-purple-600 text-white p-3 rounded-tl-lg rounded-bl-lg rounded-br-lg text-sm max-w-[80%]">
                        Thanks Dr. Nair. We have a bed ready in the CCU. Please advise her to come to Casualty directly.
                    </div>
                </div>
            </div>

            <div className="p-3 border-t border-slate-100">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Type a message..."
                        className="flex-grow px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500"
                    />
                    <button className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DelloPlus;