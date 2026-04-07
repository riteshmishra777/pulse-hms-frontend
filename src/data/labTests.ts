// src/data/labTests.ts
export interface LabTestOption {
  name: string;
  category: string;
  price: number;
  description: string;
}

export const LAB_TESTS: LabTestOption[] = [
  // Blood Tests
  { name: 'Complete Blood Count (CBC)', category: 'Blood', price: 300, description: 'Measures different components of blood' },
  { name: 'Blood Glucose (Fasting)', category: 'Blood', price: 150, description: 'Measures blood sugar levels after fasting' },
  { name: 'Blood Glucose (Random)', category: 'Blood', price: 120, description: 'Measures blood sugar at any time' },
  { name: 'HbA1c (Glycated Hemoglobin)', category: 'Blood', price: 450, description: 'Average blood sugar over 3 months' },
  { name: 'Lipid Profile', category: 'Blood', price: 500, description: 'Cholesterol and triglycerides panel' },
  { name: 'Liver Function Test (LFT)', category: 'Blood', price: 600, description: 'Evaluates liver health' },
  { name: 'Kidney Function Test (KFT)', category: 'Blood', price: 550, description: 'Evaluates kidney health' },
  { name: 'Thyroid Profile (T3,T4,TSH)', category: 'Blood', price: 700, description: 'Tests thyroid gland function' },
  { name: 'Blood Group & Rh Factor', category: 'Blood', price: 100, description: 'Determines blood group' },
  { name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'Blood', price: 150, description: 'Detects inflammation' },

  // Urine Tests
  { name: 'Urine Routine & Microscopy', category: 'Urine', price: 150, description: 'Complete urine analysis' },
  { name: 'Urine Culture & Sensitivity', category: 'Urine', price: 400, description: 'Detects urinary tract infections' },
  { name: 'Urine Pregnancy Test (UPT)', category: 'Urine', price: 100, description: 'Detects pregnancy hormone' },

  // Imaging
  { name: 'Chest X-Ray', category: 'Imaging', price: 400, description: 'Examines lungs and chest' },
  { name: 'Abdominal Ultrasound', category: 'Imaging', price: 800, description: 'Imaging of abdominal organs' },
  { name: 'ECG (Electrocardiogram)', category: 'Imaging', price: 300, description: 'Records heart electrical activity' },
  { name: 'Echocardiogram', category: 'Imaging', price: 1500, description: 'Ultrasound of the heart' },

  // Infection
  { name: 'Malaria Test (Rapid)', category: 'Infection', price: 200, description: 'Detects malaria parasites' },
  { name: 'Dengue NS1 Antigen', category: 'Infection', price: 500, description: 'Early dengue detection' },
  { name: 'COVID-19 RT-PCR', category: 'Infection', price: 700, description: 'Detects COVID-19 virus' },
  { name: 'HIV Test (ELISA)', category: 'Infection', price: 300, description: 'Detects HIV antibodies' },
  { name: 'Hepatitis B Surface Antigen', category: 'Infection', price: 350, description: 'Detects Hepatitis B' },
  { name: 'Typhoid Test (Widal)', category: 'Infection', price: 200, description: 'Detects typhoid fever' },

  // Stool
  { name: 'Stool Routine Examination', category: 'Stool', price: 150, description: 'Examines stool sample' },
  { name: 'Stool Culture', category: 'Stool', price: 400, description: 'Detects intestinal infections' },
];

export const CATEGORIES = [...new Set(LAB_TESTS.map(t => t.category))];
