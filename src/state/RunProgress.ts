import { pelletRules } from '../config/pellets.js';
import type { RunSetup } from './RunSetup';
import type { CompanyId, RoundResult } from './PelletRound';

// One run survives scene restarts; each month's PelletRound is created afresh.
export class RunProgress {
  readonly setup: RunSetup;
  private currentMonth = 1;
  private readonly completed: RoundResult[] = [];

  constructor(setup: RunSetup) {
    const competitorNames: RunSetup['competitorNames'] = [...setup.competitorNames];
    Object.freeze(competitorNames);
    this.setup = Object.freeze({ ...setup, competitorNames });
  }

  get month(): number { return this.currentMonth; }

  get results(): readonly RoundResult[] {
    // A caller may inspect history, but cannot change the run's internal list.
    return [...this.completed];
  }

  get isFinished(): boolean {
    return this.currentMonth === pelletRules.totalMonths && this.completed.length === pelletRules.totalMonths;
  }

  totalLeads(companyId: CompanyId): number {
    if (!Number.isInteger(companyId) || companyId < 0 || companyId > 3) {
      throw new Error('A company ID must be an integer from 0 to 3.');
    }
    return this.completed.reduce((total, result) => total + result.leadPellets[companyId] * pelletRules.leadsPerPellet, 0);
  }

  record(result: RoundResult): void {
    if (!result || !Number.isInteger(result.month) || result.month !== this.currentMonth) {
      throw new Error('Only the current month can be recorded.');
    }
    if (this.completed.some(previous => previous.month === result.month)) {
      throw new Error('This month has already been recorded.');
    }
    if (!Array.isArray(result.leadPellets) || result.leadPellets.length !== 4 ||
        result.leadPellets.some(count => !Number.isSafeInteger(count) || count < 0) ||
        result.leadPellets.reduce((sum, count) => sum + count, 0) !== pelletRules.leadCount) {
      throw new Error('A completed month must credit all Lead Pellets exactly once across four companies.');
    }

    const counts: [number, number, number, number] = [
      result.leadPellets[0], result.leadPellets[1], result.leadPellets[2], result.leadPellets[3],
    ];
    Object.freeze(counts);
    this.completed.push(Object.freeze({ month: result.month, leadPellets: counts }));
  }

  advanceMonth(): boolean {
    if (this.completed.length !== this.currentMonth) {
      throw new Error('Complete and record the current month before starting another.');
    }
    if (this.currentMonth >= pelletRules.totalMonths) return false;
    this.currentMonth++;
    return true;
  }
}
