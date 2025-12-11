
export enum HospitalName {
  KR_HOSPITAL = 'K R Hospital',
  CHELUVAMBA = 'Cheluvamba Hospital',
  KRISHNAJAMMANI = 'Krishnajammani Super Speciality',
  TRAUMA_CARE = 'Trauma Care Center',
}

export enum Department {
  // KR Hospital
  GENERAL_MEDICINE = 'General Medicine',
  GENERAL_SURGERY = 'General Surgery',
  ENT = 'ENT',
  OPHTHALMOLOGY = 'Ophthalmology',
  DERMATOLOGY = 'Dermatology',
  PSYCHIATRY = 'Psychiatry',
  RESPIRATORY_MEDICINE = 'Respiratory Medicine',
  DENTAL = 'Dental Surgery',
  BURNS_PLASTIC = 'Burns & Plastic Surgery',
  
  // Cheluvamba
  OBG = 'OBG',
  PEDIATRICS = 'Pediatrics',
  NEONATOLOGY = 'Neonatology',
  
  // Krishnajammani
  CARDIOLOGY = 'Cardiology',
  NEUROLOGY = 'Neurology',
  NEPHROLOGY = 'Nephrology',
  UROLOGY = 'Urology',
  PLASTIC_SURGERY = 'Plastic Surgery',
  PEDIATRIC_SURGERY = 'Pediatric Surgery',
  GASTROENTEROLOGY = 'Gastroenterology',
  ONCOLOGY = 'Medical Oncology',
  SURGICAL_ONCOLOGY = 'Surgical Oncology',
  
  // Trauma
  ORTHOPAEDICS = 'Orthopaedics',
  EMERGENCY_MEDICINE = 'Emergency Medicine',
  TRAUMA_SURGERY = 'Trauma Surgery',
  NEUROSURGERY = 'Neurosurgery',
  
  // Common
  RADIOLOGY = 'Radiology',
  ANESTHESIA = 'Anesthesia',
  PATHOLOGY = 'Pathology',
  MICROBIOLOGY = 'Microbiology',
  BIOCHEMISTRY = 'Biochemistry',
  PHARMACY = 'Pharmacy',
  ACCOUNTS = 'Accounts'
}

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  HOSPITAL_ADMIN = 'Hospital Admin', // Admin Features
  DEPT_ADMIN = 'Department Admin',
  CONSULTANT = 'Doctor', // Doctor Features
  RECEPTIONIST = 'Receptionist', // Receptionist Features
  STAFF_NURSE = 'Staff Nurse', // Staff Nurse Features (formerly Ward Incharge)
  LAB_TECHNICIAN = 'Lab Technician', // Lab Tech Features
  BLOOD_BANK_MANAGER = 'Blood Bank Manager', // Blood Bank Manager
  CASUALTY_MO = 'Casualty MO',
  PHARMACIST = 'Pharmacist', // Pharmacist
  ACCOUNTANT = 'Accountant', // Accountant
  PATHOLOGIST = 'Pathologist', // Pathologist
  RADIOLOGIST = 'Radiologist' // Radiologist
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  hospital?: HospitalName; // If null, has access to all
  department?: Department; // Optional restriction
  avatar?: string;
}

export enum PatientType {
  OPD = 'OPD',
  IPD = 'IPD',
  CASUALTY = 'Casualty',
}

export enum BedStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  MAINTENANCE = 'Maintenance',
  RESERVED = 'Reserved'
}

export enum ReferralType {
  INTERNAL = 'Internal (HMIS)',
  EXTERNAL = 'External (Dello+)',
}

export enum TriagePriority {
  RED = 'Red (Immediate)',
  YELLOW = 'Yellow (Urgent)',
  GREEN = 'Green (Non-Urgent)',
  BLACK = 'Black (Deceased)'
}

export interface Patient {
  id: string;
  uhid: string; // Unique Hospital ID
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  address?: string;
  abhaId?: string; // ABDM integration
  abhaAddress?: string;
  idProof?: { type: string, number: string };
  
  type: PatientType;
  hospital: HospitalName;
  department: Department;
  doctor: string;
  status: 'Active' | 'Discharged' | 'Deceased' | 'Transferred';
  legalStatus?: 'MLC' | 'Non-MLC'; // Added MLC Tag

  // OPD Specifics
  opdVisitId?: string;
  visitType?: 'New Case' | 'Follow Up' | 'Emergency';

  // Casualty Specifics
  triagePriority?: TriagePriority;
  casualtyArrivalDate?: string;

  // IPD Specifics
  admissionId?: string;
  admissionDate?: string;
  ward?: string;
  bedNumber?: string;
  diagnosis?: string;
  admissionType?: 'Cash' | 'Insurance' | 'Scheme' | 'Govt';
  insuranceDetails?: {
      tpaName: string;
      policyNumber: string;
  };
  emergencyContact?: {
      name: string;
      relation: string;
      mobile: string;
  };
}

export interface Invoice {
  id: string;
  patientName: string;
  uhid: string;
  date: string;
  amount: number;
  status: string;
  mode: string;
  scheme: string;
  items: string[];
  breakdown?: {
    regFee?: number;
    consultFee?: number;
    other?: number;
    tax?: number;
    discount?: number;
  }
}

export interface LabOrder {
  id: string;
  patientId: string;
  testName: string;
  orderDate: string;
  status: 'Pending' | 'Processing' | 'Completed';
  result?: string;
  attachmentUrl?: string;
  department: Department;
  hospital: HospitalName;
}

export interface OTSchedule {
  id: string;
  patientId: string;
  procedureName: string; // Procedure Planned
  diagnosis: string;
  theaterId: string;
  surgeon: string;
  scheduledTime: string;
  status: 'Scheduled' | 'In-Progress' | 'Completed';
  hospital: HospitalName;
  anesthesiaType?: string;
}

export interface BloodStock {
  group: string; // A+, B+, etc.
  units: number;
  status: 'Normal' | 'Low' | 'Critical';
}

export interface Referral {
  id: string;
  type: ReferralType;
  patientId?: string; // For internal linking
  patientName: string;
  
  // Internal Routing
  sourceHospital?: HospitalName;
  sourceDepartment?: Department;
  targetHospital?: HospitalName;
  targetDepartment?: Department; // Or specialty for external
  
  // External Routing
  referringDoctor?: string; // Name of external doctor
  
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  notes: string;
  date: string;
  status: 'New' | 'Accepted' | 'Admitted' | 'Rejected';
}

export interface Bed {
  id: string;
  number: string;
  status: BedStatus;
  patientId?: string;
}

export interface Ward {
  id: string;
  name: string;
  hospital: HospitalName;
  department: Department;
  type: 'General' | 'ICU' | 'Casualty' | 'Private';
  beds: Bed[];
}

export interface RoundNote {
  id: string;
  patientId: string;
  date: string;
  doctor: string;
  note: string;
  vitals?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf' | 'other';
}

export interface CareTeamMessage {
  id: string;
  patientId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
}
