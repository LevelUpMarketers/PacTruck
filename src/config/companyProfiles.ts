export type ProfileId = 'balanced' | 'visibility' | 'booking' | 'operations';

export interface CompanyProfile {
  readonly id: ProfileId;
  readonly name: string;
  readonly description: string;
  readonly bookingRate: number;
  readonly speedBonus: number;
  readonly jobsPerTeam: number;
}

// Starting strengths differ, while every profile shares the same upgrade ceilings.
export const companyProfiles: readonly CompanyProfile[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'A steady mix of visibility, booking ability, and service capacity.',
    bookingRate: 0.45,
    speedBonus: 0.03,
    jobsPerTeam: 50,
  },
  {
    id: 'visibility',
    name: 'Visibility-focused',
    description: 'Start with a faster truck to reach more leads.',
    bookingRate: 0.43,
    speedBonus: 0.06,
    jobsPerTeam: 50,
  },
  {
    id: 'booking',
    name: 'Booking-focused',
    description: 'Convert more collected leads, with slightly less service capacity.',
    bookingRate: 0.47,
    speedBonus: 0,
    jobsPerTeam: 48,
  },
  {
    id: 'operations',
    name: 'Operations-focused',
    description: 'Start with more capacity to complete booked jobs.',
    bookingRate: 0.44,
    speedBonus: 0.03,
    jobsPerTeam: 55,
  },
];

export function getCompanyProfile(id: ProfileId): CompanyProfile {
  return companyProfiles.find(profile => profile.id === id) ?? companyProfiles[0];
}
