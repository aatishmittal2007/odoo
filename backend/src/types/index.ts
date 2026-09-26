export enum UserRole {
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  WAREHOUSE_STAFF = 'WAREHOUSE_STAFF',
}

export enum ExceptionType {
  INVENTORY_DISCREPANCY = 'INVENTORY_DISCREPANCY',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  UNUSUAL_ADJUSTMENT = 'UNUSUAL_ADJUSTMENT',
  COUNT_OVERDUE = 'COUNT_OVERDUE',
  LOW_STOCK = 'LOW_STOCK',
  NEGATIVE_STOCK = 'NEGATIVE_STOCK',
  TRANSFER_EXCEPTION = 'TRANSFER_EXCEPTION',
}

export enum ExceptionSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ExceptionStatus {
  NEW = 'NEW',
  INVESTIGATING = 'INVESTIGATING',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum RootCauseType {
  COUNTING_ERROR = 'Counting error',
  RECEIVING_ERROR = 'Receiving error',
  PICKING_ERROR = 'Picking error',
  TRANSFER_ERROR = 'Transfer error',
  DAMAGED_STOCK = 'Damaged stock',
  WRONG_LOCATION = 'Wrong location',
  SYSTEM_PROCESS_ERROR = 'System/process error',
  UNKNOWN = 'Unknown',
  OTHER = 'Other',
}

export enum CorrectiveActionType {
  UPDATE_LOCATION = 'UPDATE_LOCATION',
  ADJUST_INVENTORY = 'ADJUST_INVENTORY',
  CREATE_TRANSFER = 'CREATE_TRANSFER',
  FOLLOWUP_TASK = 'FOLLOWUP_TASK',
  MARK_RESOLVED = 'MARK_RESOLVED',
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AIAnalysisOutput {
  summary: string;
  facts: string[];
  potential_causes: string[];
  recommended_checks: string[];
  modelUsed?: string;
  confidence?: string;
}

export interface IntegrationStatus {
  stocksenseCore: { status: 'healthy' | 'degraded'; message: string };
  postgres: { status: 'connected' | 'disconnected'; message: string };
  n8n: { status: 'connected' | 'unavailable'; message: string; url?: string };
  openRouter: { status: 'configured' | 'not_configured'; model?: string; message: string };
}
