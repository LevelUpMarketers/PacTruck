import type { ProfileId } from '../config/companyProfiles';

export interface RunSetup {
  companyName: string;
  email: string;
  competitorNames: [string, string, string];
  profileId: ProfileId;
}

export const COMPANY_NAME_MAX_LENGTH = 50;

const defaultCompetitorNames = [
  'Local HVAC Company 1',
  'Local HVAC Company 2',
  'Local HVAC Company 3',
] as const;

export function createEmptySetup(): RunSetup {
  return {
    companyName: '',
    email: '',
    competitorNames: ['', '', ''],
    profileId: 'balanced',
  };
}

// Names remain plain text. Form validation is handled by the setup screen.
export function normalizeSetup(draft: RunSetup): RunSetup {
  return {
    companyName: draft.companyName.trim(),
    email: draft.email.trim(),
    competitorNames: [
      draft.competitorNames[0].trim() || defaultCompetitorNames[0],
      draft.competitorNames[1].trim() || defaultCompetitorNames[1],
      draft.competitorNames[2].trim() || defaultCompetitorNames[2],
    ],
    profileId: draft.profileId,
  };
}
