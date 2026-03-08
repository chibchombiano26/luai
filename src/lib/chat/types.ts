import type { ReactNode } from 'react';
import type { AppLocale } from '@/lib/i18n';
import type { ChatCommandId } from './commands';

export interface LocalizedCommandMessage {
  es: string;
  en: string;
}

export interface SlashCommandDefinition {
  id: ChatCommandId;
  name: string;
  description: string;
  icon: ReactNode;
  category: string;
  example: string;
}

export interface SlashCommandSelection {
  id: ChatCommandId;
  name: string;
}

export interface SlashCommandMenuProps {
  input: string;
  onSelectCommand: (command: SlashCommandSelection) => void;
  locale?: AppLocale;
  enabledCommandIds?: ChatCommandId[];
}

export interface ChatApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VehicleFormSubmissionData {
  licensePlate: string;
  vehicleYear: number;
  fasecoldaCode: string;
  vehiclePrice: number;
  isNew: boolean;
  mode?: 'quote' | 'insurer_comparison';
}

export interface OwnerFormSubmissionData {
  licensePlate: string;
  vehicleYear: number;
  fasecoldaCode: string;
  vehiclePrice: number;
  isNew: boolean;
  insuredName: string;
  insuredSurname: string;
  insuredDocumentNumber: string;
  insuredBirthDate: string;
  mode?: 'quote' | 'insurer_comparison';
}
