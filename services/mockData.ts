
import { Patient, Department, PatientType, LabOrder, BloodStock, Referral, BedStatus, Ward, RoundNote, HospitalName, ReferralType, User, UserRole, TriagePriority } from '../types';

export const HOSPITAL_DEPARTMENTS: Record<HospitalName, Department[]> = {
  [HospitalName.KR_HOSPITAL]: [
    Department.GENERAL_MEDICINE, Department.GENERAL_SURGERY, Department.ENT, 
    Department.OPHTHALMOLOGY, Department.DERMATOLOGY, Department.PSYCHIATRY, 
    Department.RESPIRATORY_MEDICINE, Department.DENTAL, Department.BURNS_PLASTIC,
    Department.RADIOLOGY, Department.PATHOLOGY, Department.MICROBIOLOGY
  ],
  [HospitalName.CHELUVAMBA]: [
    Department.OBG, Department.PEDIATRICS, Department.NEONATOLOGY, Department.ANESTHESIA
  ],
  [HospitalName.KRISHNAJAMMANI]: [
    Department.CARDIOLOGY, Department.NEUROLOGY, Department.NEPHROLOGY, 
    Department.UROLOGY, Department.PLASTIC_SURGERY, Department.PEDIATRIC_SURGERY, 
    Department.GASTROENTEROLOGY, Department.ONCOLOGY, Department.SURGICAL_ONCOLOGY,
    Department.NEUROSURGERY
  ],
  [HospitalName.TRAUMA_CARE]: [
    Department.EMERGENCY_MEDICINE, Department.ORTHOPAEDICS, Department.TRAUMA_SURGERY, Department.ANESTHESIA
  ]
};

// --- MOCK AUTH DATABASE FOR LOGIN ---
// Password for all is 'password'
export const MOCK_AUTH_DB = [
  {
    username: 'admin',
    password: 'password',
    user: {
      id: 'U001',
      name: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      avatar: 'SA'
    }
  },
  {
    username: 'krh_admin',
    password: 'password',
    user: {
      id: 'U002',
      name: 'Admin K R Hospital',
      role: UserRole.HOSPITAL_ADMIN,
      hospital: HospitalName.KR_HOSPITAL,
      avatar: 'KA'
    }
  },
  {
    username: 'casualty',
    password: 'password',
    user: {
      id: 'U999',
      name: 'Dr. Emergency (CMO)',
      role: UserRole.CASUALTY_MO,
      hospital: HospitalName.TRAUMA_CARE,
      department: Department.EMERGENCY_MEDICINE,
      avatar: 'CM'
    }
  },
  {
    username: 'reception',
    password: 'password',
    user: {
      id: 'U003',
      name: 'Mrs. Geetha (Reception)',
      role: UserRole.RECEPTIONIST,
      hospital: HospitalName.KR_HOSPITAL,
      avatar: 'RG'
    }
  },
  {
    username: 'nurse_cheluvamba',
    password: 'password',
    user: {
      id: 'U004',
      name: 'Nurse Ratna',
      role: UserRole.STAFF_NURSE,
      hospital: HospitalName.CHELUVAMBA,
      department: Department.OBG,
      avatar: 'NR'
    }
  },
  // --- K R HOSPITAL CONSULTANTS ---
  {
    username: 'dr_suresh',
    password: 'password',
    user: {
      id: 'U005',
      name: 'Dr. Suresh (Gen Surgery)',
      role: UserRole.CONSULTANT,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.GENERAL_SURGERY,
      avatar: 'DS'
    }
  },
  {
    username: 'dr_priya',
    password: 'password',
    user: {
      id: 'U103',
      name: 'Dr. Priya (Gen Surgery)',
      role: UserRole.CONSULTANT,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.GENERAL_SURGERY,
      avatar: 'DP'
    }
  },
  {
    username: 'dr_ramesh',
    password: 'password',
    user: {
      id: 'U101',
      name: 'Dr. Ramesh (Gen Med)',
      role: UserRole.CONSULTANT,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.GENERAL_MEDICINE,
      avatar: 'DR'
    }
  },
  {
    username: 'dr_vivian',
    password: 'password',
    user: {
      id: 'U102',
      name: 'Dr. Vivian (Gen Med)',
      role: UserRole.CONSULTANT,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.GENERAL_MEDICINE,
      avatar: 'DV'
    }
  },
  // --- CHELUVAMBA HOSPITAL CONSULTANTS ---
  {
    username: 'dr_savitha',
    password: 'password',
    user: {
      id: 'U201',
      name: 'Dr. Savitha (OBG)',
      role: UserRole.CONSULTANT,
      hospital: HospitalName.CHELUVAMBA,
      department: Department.OBG,
      avatar: 'DSa'
    }
  },
  // --- NEW ROLES FOR DEMO ---
  {
    username: 'pharmacist',
    password: 'password',
    user: {
      id: 'U701',
      name: 'Pharma. Rajesh',
      role: UserRole.PHARMACIST,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.PHARMACY,
      avatar: 'PR'
    }
  },
  {
    username: 'accountant',
    password: 'password',
    user: {
      id: 'U801',
      name: 'Acc. Mahesh',
      role: UserRole.ACCOUNTANT,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.ACCOUNTS,
      avatar: 'AM'
    }
  },
  {
    username: 'pathologist',
    password: 'password',
    user: {
      id: 'U901',
      name: 'Dr. Patho (Pathology)',
      role: UserRole.PATHOLOGIST,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.PATHOLOGY,
      avatar: 'DPa'
    }
  },
  {
    username: 'radiologist',
    password: 'password',
    user: {
      id: 'U902',
      name: 'Dr. Radio (Radiology)',
      role: UserRole.RADIOLOGIST,
      hospital: HospitalName.KR_HOSPITAL,
      department: Department.RADIOLOGY,
      avatar: 'DRa'
    }
  },
  // --- STAFF ---
  {
    username: 'lab_tech',
    password: 'password',
    user: {
      id: 'U006',
      name: 'Tech. Arun',
      role: UserRole.LAB_TECHNICIAN,
      hospital: HospitalName.KR_HOSPITAL,
      avatar: 'TA'
    }
  },
  {
    username: 'blood_manager',
    password: 'password',
    user: {
      id: 'U007',
      name: 'Dr. Blood Manager',
      role: UserRole.BLOOD_BANK_MANAGER,
      hospital: HospitalName.TRAUMA_CARE,
      avatar: 'BM'
    }
  },
  {
    username: 'cardio_admin',
    password: 'password',
    user: {
      id: 'U008',
      name: 'Admin Cardiology',
      role: UserRole.DEPT_ADMIN,
      hospital: HospitalName.KRISHNAJAMMANI,
      department: Department.CARDIOLOGY,
      avatar: 'AC'
    }
  }
];

export const MOCK_USERS: User[] = MOCK_AUTH_DB.map(u => u.user);

// --- COMPREHENSIVE BILLING CATALOG ---
export const MASTER_SERVICE_CATALOG = [
  // OPD & General
  { id: 'CON01', name: 'OPD Registration Fee', price: 10, category: 'Consultation' },
  { id: 'CON02', name: 'Super Speciality Consultation', price: 50, category: 'Consultation' },
  { id: 'CON03', name: 'Emergency / Casualty Triage Fee', price: 20, category: 'Consultation' },
  
  // IPD Admission
  { id: 'ADM01', name: 'General Ward Admission Fee', price: 250, category: 'Admission' },
  { id: 'ADM02', name: 'ICU Admission Charge (Per Day)', price: 1500, category: 'Admission' },
  { id: 'ADM03', name: 'Private Ward Charge (Per Day)', price: 1000, category: 'Admission' },
  { id: 'ADM04', name: 'Ventilator Charges (Per Day)', price: 2000, category: 'Admission' },
  
  // Lab Tests
  { id: 'LAB01', name: 'Complete Blood Count (CBC)', price: 150, category: 'Lab' },
  { id: 'LAB02', name: 'RBS / Blood Sugar', price: 50, category: 'Lab' },
  { id: 'LAB03', name: 'Liver Function Test (LFT)', price: 450, category: 'Lab' },
  { id: 'LAB04', name: 'Renal Function Test (RFT)', price: 500, category: 'Lab' },
  { id: 'LAB05', name: 'Lipid Profile', price: 600, category: 'Lab' },
  { id: 'LAB06', name: 'Thyroid Profile (T3, T4, TSH)', price: 400, category: 'Lab' },
  { id: 'LAB07', name: 'Dengue NS1 Antigen', price: 600, category: 'Lab' },
  { id: 'LAB08', name: 'Urine Routine', price: 100, category: 'Lab' },
  { id: 'LAB09', name: 'ABG Analysis', price: 350, category: 'Lab' },
  
  // Radiology
  { id: 'RAD01', name: 'X-Ray Chest PA', price: 250, category: 'Radiology' },
  { id: 'RAD02', name: 'X-Ray Limbs / Joint', price: 300, category: 'Radiology' },
  { id: 'RAD03', name: 'USG Abdomen / Pelvis', price: 600, category: 'Radiology' },
  { id: 'RAD04', name: 'CT Scan Brain (Plain)', price: 1500, category: 'Radiology' },
  { id: 'RAD05', name: 'MRI Scan (Brain/Spine)', price: 3500, category: 'Radiology' },
  { id: 'RAD06', name: 'Doppler Study', price: 1200, category: 'Radiology' },
  
  // Procedures & Nursing
  { id: 'PROC01', name: 'Injection / IV Charges', price: 50, category: 'Procedure' },
  { id: 'PROC02', name: 'Wound Dressing (Minor)', price: 100, category: 'Procedure' },
  { id: 'PROC03', name: 'Wound Dressing (Major)', price: 250, category: 'Procedure' },
  { id: 'PROC04', name: 'Nebulization', price: 80, category: 'Procedure' },
  { id: 'PROC05', name: 'ECG', price: 200, category: 'Procedure' },
  { id: 'PROC06', name: 'Ryle\'s Tube Insertion', price: 300, category: 'Procedure' },
  { id: 'PROC07', name: 'Catheterization', price: 300, category: 'Procedure' },
  { id: 'PROC08', name: 'Intubation', price: 1500, category: 'Procedure' },
  { id: 'PROC09', name: 'CPR', price: 2000, category: 'Procedure' },

  // Surgeries (Packages)
  { id: 'SURG01', name: 'Appendectomy (Laparoscopic)', price: 15000, category: 'Surgery' },
  { id: 'SURG02', name: 'Herniography', price: 12000, category: 'Surgery' },
  { id: 'SURG03', name: 'LSCS (Caesarean Section)', price: 5000, category: 'Surgery' },
  { id: 'SURG04', name: 'Normal Delivery', price: 2000, category: 'Surgery' },
  { id: 'SURG05', name: 'Cataract Surgery (Phaco)', price: 8000, category: 'Surgery' },
  { id: 'SURG06', name: 'ORIF (Fracture Fixation)', price: 10000, category: 'Surgery' },
  { id: 'SURG07', name: 'Angioplasty (Single Stent)', price: 45000, category: 'Surgery' },
  { id: 'SURG08', name: 'Dialysis (Per Session)', price: 1200, category: 'Surgery' },
];

export const DISCHARGE_TEMPLATES = {
  'General Medicine': {
    diagnosis: 'Acute Febrile Illness / Viral Pyrexia',
    treatment: 'Conservative management started.\n\n- IV Fluids: RL / NS as per hydration status.\n- Antipyretics: Paracetamol 650mg SOS.\n- Empiric Antibiotics: Inj. Ceftriaxone 1g IV BD (Stopped after culture neg).\n\nCourse in Hospital:\nPatient admitted with high grade fever and myalgia. Vitals stable throughout. Fever spikes subsided on Day 3. Patient tolerating oral diet well.',
    labResults: 'CBC: Hb 12.5, WBC 14000 (Neutrophilia), Platelets 2.5L\nDengue NS1: Negative\nWidal: Negative\nUrine Routine: Normal\nCXR: Clear fields'
  },
  'General Surgery (Appendicitis)': {
    diagnosis: 'Acute Appendicitis',
    treatment: 'Emergency Laparoscopic Appendectomy done under GA on [Date].\n\nIntra-op findings:\nInflamed, non-perforated appendix found at retrocecal position. Minimal free fluid in RIF. Base healthy.\n\nPost-op:\nUneventful recovery. Tolerating soft diet. Surgical site healthy.',
    labResults: 'USG Abdomen: Tubular non-compressible blind-ending loop in RIF with probe tenderness.\nWBC: 16,000 (Shift to left)'
  },
  'OBG (Normal Delivery)': {
    diagnosis: 'G2P1L1 with 39 wks gestation in active labor',
    treatment: 'Normal Vaginal Delivery with Right Medio-lateral Episiotomy.\n\nDelivered a healthy [Male/Female] baby on [Date] at [Time].\nBaby Weight: 2.8 kg\nCry: Good, immediate.\nLiquor: Clear.\n\nPost-natal period unevenful. Mother and baby healthy. Lactation established.',
    labResults: 'Blood Group: O Positive\nHb: 11.2 gm%\nHIV/HBsAg/VDRL: Non-reactive\nTSH: Normal'
  },
  'OBG (C-Section)': {
    diagnosis: 'Primi with Cephalopelvic Disproportions (CPD) in labor',
    treatment: 'Emergency Lower Segment Caesarean Section (LSCS) done under Spinal Anesthesia.\n\nDelivered a healthy [Male/Female] baby.\nBaby Weight: 3.1 kg.\nPlacenta: Complete removal.\n\nPost-op: Vitals stable. Urine output adequate. Wound dressing dry.',
    labResults: 'Hb: 10.5 gm%\nPlatelets: 1.8L\nCoagulation Profile: Normal'
  },
  'Pediatrics (Pneumonia)': {
    diagnosis: 'Community Acquired Pneumonia',
    treatment: 'O2 Inhalation via nasal prongs.\nNebulization with Levolin/Budecort.\nInj. Augmentin IV.\n\nCourse:\nRespiratory distress settled. SpO2 > 95% at room air. Feeding well.',
    labResults: 'CXR: Right lower zone consolidation.\nCRP: Positive (24 mg/L)\nCBC: WBC 18,000'
  },
  'Cardiology (MI)': {
    diagnosis: 'Acute Coronary Syndrome - Inferior Wall MI',
    treatment: 'Thrombolysis done with Streptokinase / Primary PCI to RCA.\n\nMedications:\n- Tab. Aspirin 75mg\n- Tab. Clopidogrel 75mg\n- Tab. Atorvastatin 40mg\n- Tab. Ramipril 2.5mg\n\nCourse: Chest pain relieved. Hemodynamically stable. No arrhythmias monitored in CCU.',
    labResults: 'ECG: ST elevation in II, III, aVF.\nTroponin I: Positive.\nEcho: Hypokinesia of inferior wall. LVEF 50%.'
  },
  'Orthopaedics (Fracture)': {
    diagnosis: 'Closed Fracture Shaft of Femur (Right)',
    treatment: 'Open Reduction and Internal Fixation (ORIF) with IL Nail done under SA on [Date].\n\nPost-op:\nDistal pulses palpable. Limb elevation maintained. Static Quadriceps exercises started. Wound clean.',
    labResults: 'X-Ray Right Thigh: Transverse fracture mid-shaft femur.\nPost-op X-Ray: Good alignment, implant in situ.\nPre-op Hb: 11.0'
  }
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    uhid: 'MMC-KR-24-001',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'Male',
    mobile: '9876543210',
    type: PatientType.IPD,
    hospital: HospitalName.KR_HOSPITAL,
    department: Department.GENERAL_SURGERY,
    admissionDate: '2024-05-10',
    ward: 'Male Surgical Ward 1',
    bedNumber: 'MS-12',
    diagnosis: 'Acute Appendicitis',
    doctor: 'Dr. Suresh',
    status: 'Active',
    abhaId: '91-2233-4455-6677',
    abhaAddress: 'ramesh@abdm',
    legalStatus: 'Non-MLC'
  },
  {
    id: '2',
    uhid: 'MMC-KR-24-002',
    name: 'Lakshmi Devi',
    age: 62,
    gender: 'Female',
    mobile: '9988776655',
    type: PatientType.IPD,
    hospital: HospitalName.KR_HOSPITAL,
    department: Department.GENERAL_MEDICINE,
    admissionDate: '2024-05-12',
    ward: 'Female Medical Ward 3',
    bedNumber: 'FM-05',
    diagnosis: 'Type 2 Diabetes Mellitus with Cellulitis',
    doctor: 'Dr. Anjali',
    status: 'Active',
    legalStatus: 'Non-MLC'
  },
  {
    id: '3',
    uhid: 'MMC-TC-24-003',
    name: 'Syed Ahmed',
    age: 28,
    gender: 'Male',
    mobile: '8877665544',
    type: PatientType.OPD,
    hospital: HospitalName.TRAUMA_CARE,
    department: Department.ORTHOPAEDICS,
    doctor: 'Dr. Mahesh',
    status: 'Active',
    diagnosis: 'Fracture Distal Radius',
    legalStatus: 'MLC'
  },
  {
    id: '4',
    uhid: 'MMC-CH-24-105',
    name: 'Priya Gowda',
    age: 26,
    gender: 'Female',
    mobile: '9900112233',
    type: PatientType.IPD,
    hospital: HospitalName.CHELUVAMBA,
    department: Department.OBG,
    admissionDate: '2024-05-15',
    ward: 'Antenatal Ward 1',
    bedNumber: 'AN-02',
    diagnosis: 'G2P1 38wks POG',
    doctor: 'Dr. Savitha',
    status: 'Active',
    legalStatus: 'Non-MLC'
  },
  {
    id: '5',
    uhid: 'MMC-KS-24-201',
    name: 'Robert D',
    age: 55,
    gender: 'Male',
    mobile: '9112233445',
    type: PatientType.IPD,
    hospital: HospitalName.KRISHNAJAMMANI,
    department: Department.CARDIOLOGY,
    admissionDate: '2024-05-14',
    ward: 'CCU',
    bedNumber: 'CCU-01',
    diagnosis: 'Acute MI - Inferior Wall',
    doctor: 'Dr. Satish',
    status: 'Active',
    legalStatus: 'Non-MLC'
  },
  {
    id: '6',
    uhid: 'MMC-TC-24-991',
    name: 'Unknown Male 45Y',
    age: 45,
    gender: 'Male',
    mobile: '0000000000',
    type: PatientType.CASUALTY,
    hospital: HospitalName.TRAUMA_CARE,
    department: Department.EMERGENCY_MEDICINE,
    doctor: 'Dr. Vikram',
    status: 'Active',
    triagePriority: TriagePriority.RED,
    casualtyArrivalDate: '2024-05-16 10:30',
    diagnosis: 'RTA with Head Injury',
    ward: 'Triage / Casualty Red Zone',
    bedNumber: 'TR-1',
    legalStatus: 'MLC'
  },
  {
    id: '7',
    uhid: 'MMC-TC-24-992',
    name: 'Anita S',
    age: 32,
    gender: 'Female',
    mobile: '9845012345',
    type: PatientType.CASUALTY,
    hospital: HospitalName.TRAUMA_CARE,
    department: Department.EMERGENCY_MEDICINE,
    doctor: 'Dr. Vikram',
    status: 'Active',
    triagePriority: TriagePriority.YELLOW,
    casualtyArrivalDate: '2024-05-16 11:15',
    diagnosis: 'Severe Abdominal Pain',
    ward: 'Triage / Casualty Red Zone',
    bedNumber: 'TR-2',
    legalStatus: 'Non-MLC'
  }
];

export const MOCK_LAB_ORDERS: LabOrder[] = [
  {
    id: 'L-101',
    patientId: '1',
    testName: 'Complete Blood Count (CBC)',
    orderDate: '2024-05-14 09:30',
    status: 'Completed',
    result: 'Hb: 12.5, WBC: 11000',
    department: Department.GENERAL_SURGERY,
    hospital: HospitalName.KR_HOSPITAL
  },
  {
    id: 'L-102',
    patientId: '2',
    testName: 'Random Blood Sugar',
    orderDate: '2024-05-14 10:15',
    status: 'Pending',
    department: Department.GENERAL_MEDICINE,
    hospital: HospitalName.KR_HOSPITAL
  },
  {
    id: 'L-103',
    patientId: '5',
    testName: 'Troponin I',
    orderDate: '2024-05-14 11:00',
    status: 'Completed',
    result: 'Positive (1.5 ng/ml)',
    department: Department.CARDIOLOGY,
    hospital: HospitalName.KRISHNAJAMMANI
  }
];

export const BLOOD_STOCK: BloodStock[] = [
  { group: 'A+', units: 45, status: 'Normal' },
  { group: 'A-', units: 5, status: 'Critical' },
  { group: 'B+', units: 60, status: 'Normal' },
  { group: 'B-', units: 8, status: 'Low' },
  { group: 'O+', units: 55, status: 'Normal' },
  { group: 'O-', units: 4, status: 'Critical' },
  { group: 'AB+', units: 20, status: 'Normal' },
  { group: 'AB-', units: 3, status: 'Critical' },
];

export const MOCK_REFERRALS: Referral[] = [
  // External Dello+ Referrals
  {
    id: 'REF-EXT-001',
    type: ReferralType.EXTERNAL,
    patientName: 'Sunita Rao',
    referringDoctor: 'Dr. K. Nair (Hunsur Clinic)',
    targetDepartment: Department.CARDIOLOGY,
    urgency: 'Urgent',
    notes: 'Patient c/o chest pain radiating to left arm. ECG shows ST elevation.',
    date: '2024-05-14 11:20',
    status: 'New'
  },
  {
    id: 'REF-EXT-002',
    type: ReferralType.EXTERNAL,
    patientName: 'John Doe',
    referringDoctor: 'Dr. P. Singh (Private Practice)',
    targetDepartment: Department.NEUROLOGY,
    urgency: 'Routine',
    notes: 'Recurring migraines for 6 months. Needs MRI.',
    date: '2024-05-13 14:00',
    status: 'Accepted'
  },
  // Internal HMIS Referrals
  {
    id: 'REF-INT-101',
    type: ReferralType.INTERNAL,
    patientId: '2', // Lakshmi Devi
    patientName: 'Lakshmi Devi',
    sourceHospital: HospitalName.KR_HOSPITAL,
    sourceDepartment: Department.GENERAL_MEDICINE,
    targetHospital: HospitalName.KRISHNAJAMMANI,
    targetDepartment: Department.CARDIOLOGY,
    urgency: 'Routine',
    notes: 'Diabetic patient with new onset palpitation. Request ECHO screening.',
    date: '2024-05-15 09:30',
    status: 'New'
  },
  {
    id: 'REF-INT-102',
    type: ReferralType.INTERNAL,
    patientId: '3', // Syed Ahmed
    patientName: 'Syed Ahmed',
    sourceHospital: HospitalName.TRAUMA_CARE,
    sourceDepartment: Department.ORTHOPAEDICS,
    targetHospital: HospitalName.KR_HOSPITAL,
    targetDepartment: Department.PLASTIC_SURGERY,
    urgency: 'Urgent',
    notes: 'Complex soft tissue injury over forearm. Needs flap cover assessment.',
    date: '2024-05-15 10:15',
    status: 'Accepted'
  }
];

// GENERATOR HELPER FOR BEDS
const generateBeds = (prefix: string, count: number, occupiedIndices: number[] = [], patientIds: string[] = []) => {
  return Array.from({ length: count }, (_, i) => {
    const isOccupied = occupiedIndices.includes(i);
    return {
      id: `B-${prefix}-${i + 1}`,
      number: `${prefix}-${i + 1}`,
      status: isOccupied ? BedStatus.OCCUPIED : BedStatus.AVAILABLE,
      patientId: isOccupied && patientIds.length ? patientIds.shift() : undefined
    };
  });
};

export const MOCK_WARDS: Ward[] = [
    // --- K R HOSPITAL WARDS ---
    {
        id: 'W-KR-MS1',
        name: 'Male Surgical Ward 1',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.GENERAL_SURGERY,
        type: 'General',
        beds: generateBeds('MS', 10, [1, 5], ['1']) // Patient 1 is here
    },
    {
        id: 'W-KR-FM3',
        name: 'Female Medical Ward 3',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.GENERAL_MEDICINE,
        type: 'General',
        beds: generateBeds('FM', 10, [2], ['2']) // Patient 2 is here
    },
    {
        id: 'W-KR-ENT1',
        name: 'ENT Ward',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.ENT,
        type: 'General',
        beds: generateBeds('ENT', 8, [0, 1])
    },
    {
        id: 'W-KR-OPH1',
        name: 'Ophthalmology Ward',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.OPHTHALMOLOGY,
        type: 'General',
        beds: generateBeds('OPH', 8, [3])
    },
    {
        id: 'W-KR-MICU',
        name: 'Medical ICU (MICU)',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.GENERAL_MEDICINE,
        type: 'ICU',
        beds: generateBeds('MICU', 6, [0, 1, 2])
    },
    {
        id: 'W-KR-SICU',
        name: 'Surgical ICU (SICU)',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.GENERAL_SURGERY,
        type: 'ICU',
        beds: generateBeds('SICU', 6, [4])
    },
    {
        id: 'W-KR-RESP',
        name: 'Respiratory / TB Ward',
        hospital: HospitalName.KR_HOSPITAL,
        department: Department.RESPIRATORY_MEDICINE,
        type: 'General',
        beds: generateBeds('RESP', 8, [1, 2])
    },
    
    // --- CHELUVAMBA HOSPITAL WARDS ---
    {
        id: 'W-CH-AN1',
        name: 'Antenatal Ward 1',
        hospital: HospitalName.CHELUVAMBA,
        department: Department.OBG,
        type: 'General',
        beds: generateBeds('AN', 12, [1, 5], ['4']) // Patient 4 is here
    },
    {
        id: 'W-CH-PN1',
        name: 'Postnatal Ward 1',
        hospital: HospitalName.CHELUVAMBA,
        department: Department.OBG,
        type: 'General',
        beds: generateBeds('PN', 15, [0, 1, 2, 3, 4, 5])
    },
    {
        id: 'W-CH-LR',
        name: 'Labor Room Complex',
        hospital: HospitalName.CHELUVAMBA,
        department: Department.OBG,
        type: 'General',
        beds: generateBeds('LR', 6, [0, 2])
    },
    {
        id: 'W-CH-PED1',
        name: 'Pediatric Medical Ward',
        hospital: HospitalName.CHELUVAMBA,
        department: Department.PEDIATRICS,
        type: 'General',
        beds: generateBeds('PED', 12, [1, 3, 5, 7])
    },
    {
        id: 'W-CH-NICU',
        name: 'NICU (Neonatal ICU)',
        hospital: HospitalName.CHELUVAMBA,
        department: Department.NEONATOLOGY,
        type: 'ICU',
        beds: generateBeds('NICU', 8, [0, 1, 2, 3, 4])
    },
    {
        id: 'W-CH-PICU',
        name: 'PICU (Pediatric ICU)',
        hospital: HospitalName.CHELUVAMBA,
        department: Department.PEDIATRICS,
        type: 'ICU',
        beds: generateBeds('PICU', 6, [1])
    },

    // --- KRISHNAJAMMANI SUPER SPECIALITY WARDS ---
    {
        id: 'W-KS-CCU',
        name: 'CCU (Cardiology)',
        hospital: HospitalName.KRISHNAJAMMANI,
        department: Department.CARDIOLOGY,
        type: 'ICU',
        beds: generateBeds('CCU', 8, [0], ['5']) // Patient 5 is here
    },
    {
        id: 'W-KS-CARD',
        name: 'Cardiology General Ward',
        hospital: HospitalName.KRISHNAJAMMANI,
        department: Department.CARDIOLOGY,
        type: 'General',
        beds: generateBeds('CW', 10, [1, 2, 3])
    },
    {
        id: 'W-KS-NEURO',
        name: 'Neurology Ward',
        hospital: HospitalName.KRISHNAJAMMANI,
        department: Department.NEUROLOGY,
        type: 'General',
        beds: generateBeds('NEURO', 10, [4, 5])
    },
    {
        id: 'W-KS-NEPHRO',
        name: 'Nephrology / Dialysis Unit',
        hospital: HospitalName.KRISHNAJAMMANI,
        department: Department.NEPHROLOGY,
        type: 'General',
        beds: generateBeds('DIA', 10, [0, 1, 2, 3, 4, 5, 6, 7])
    },
    {
        id: 'W-KS-URO',
        name: 'Urology Ward',
        hospital: HospitalName.KRISHNAJAMMANI,
        department: Department.UROLOGY,
        type: 'General',
        beds: generateBeds('URO', 8, [1])
    },
    {
        id: 'W-KS-ONCO',
        name: 'Oncology Day Care',
        hospital: HospitalName.KRISHNAJAMMANI,
        department: Department.ONCOLOGY,
        type: 'General',
        beds: generateBeds('ONC', 6, [0, 1])
    },

    // --- TRAUMA CARE CENTER WARDS ---
    {
        id: 'W-TC-TRIAGE',
        name: 'Triage / Casualty Red Zone',
        hospital: HospitalName.TRAUMA_CARE,
        department: Department.EMERGENCY_MEDICINE,
        type: 'Casualty',
        beds: generateBeds('TR', 6, [0, 1], ['6', '7']) 
    },
    {
        id: 'W-TC-ORTHO',
        name: 'Trauma Ortho Ward',
        hospital: HospitalName.TRAUMA_CARE,
        department: Department.ORTHOPAEDICS,
        type: 'General',
        beds: generateBeds('TO', 8, [0], ['3']) // Patient 3 is here (TC Ortho)
    }
];

export const MOCK_ROUNDS: RoundNote[] = [
  {
    id: 'R-001',
    patientId: '1',
    date: '2024-05-11 08:30',
    doctor: 'Dr. Suresh',
    note: 'Patient stable. Pain subsided. Plan to start soft diet.',
    vitals: 'BP: 120/80, HR: 78'
  },
  {
    id: 'R-002',
    patientId: '1',
    date: '2024-05-12 09:00',
    doctor: 'Dr. Suresh',
    note: 'Tolerating soft diet well. Surgical site clean. Plan discharge tomorrow.',
    vitals: 'BP: 118/76, HR: 80'
  },
  {
    id: 'R-003',
    patientId: '2',
    date: '2024-05-13 10:15',
    doctor: 'Dr. Anjali',
    note: 'Blood sugars fluctuating. Insulin dose adjusted. Cellulitis responding to antibiotics.',
    vitals: 'BP: 130/84, RBS: 240'
  },
  {
    id: 'R-004',
    patientId: '5',
    date: '2024-05-14 08:00',
    doctor: 'Dr. Satish',
    note: 'Hemodynamically stable. No fresh chest pain. ECG shows evolving changes. Continue anti-platelets.',
    vitals: 'BP: 110/70, HR: 88'
  }
];
