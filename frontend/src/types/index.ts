export type UserRole = 'DOCTOR' | 'PHARMACIST' | 'ORG_ADMIN' | 'SYSTEM_ADMIN' | 'PATIENT';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  organization_id: string;
  organization_name: string;
  msp_id: string;
}

export interface PrescriptionItem {
  medication_code: string;
  medication_name: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration_days?: number;
}

export interface PrescriptionData {
  prescription_id: string;
  status: 'ISSUED' | 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'REVOKED' | 'EXPIRED';
  payload_hash: string;
  total_quantity: number;
  remaining_quantity: number;
  qr_token: string;
  issued_at: string;
  expires_at: string;
  revoked_at?: string;
  revocation_reason?: string;
  medications?: PrescriptionItem[];
}

export interface VerifiedPrescription {
  prescription_id: string;
  is_authentic: boolean;
  status: string;
  total_quantity: number;
  remaining_quantity: number;
  issuer: {
    prescriber_id: string;
    hospital_org: string;
    key_id: string;
  };
  medications: PrescriptionItem[];
  expires_at: string;
  tamper_status: string;
}

export interface DispenseResult {
  dispense_id: string;
  prescription_id: string;
  status: string;
  dispensed_quantity: number;
  remaining_quantity: number;
  blockchain_tx_id: string;
  timestamp: string;
}

export interface AuditEventItem {
  id: string;
  event_type: 'ISSUANCE' | 'VERIFICATION' | 'DISPENSE' | 'REVOCATION' | 'TAMPER_ATTEMPT';
  actor_id: string;
  organization_id: string;
  target_resource_id: string;
  blockchain_tx_id?: string;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  details?: string;
  timestamp: string;
}

export interface SystemHealthData {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  components: {
    api: string;
    database: string;
    blockchain_gateway: string;
    storage: string;
  };
  timestamp: string;
}
