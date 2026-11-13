// Every month starts with its entire supply. No pellets respawn during a round.
export const pelletRules = {
  leadCount: 400,
  leadsPerPellet: 2,
  advertisingCount: 4,
  advertisingDurationMs: 8000,
  advertisingWarningMs: 2000,
  leadRadius: 3,
  advertisingRadius: 7,
  totalMonths: 12,
} as const;

// Comparable locations in the four quarters of the service district.
export const advertisingCells = [
  { column: 9, row: 5 },
  { column: 25, row: 5 },
  { column: 25, row: 15 },
  { column: 9, row: 15 },
] as const;
