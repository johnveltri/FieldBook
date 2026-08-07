import type { JobDetailViewModel, JobDetailWorkStatus } from '@fieldsolo/shared-types';

import type { LocalOtherCostLine } from './otherCostTypes';

export type JobFinancialCompletenessContext = {
  job: JobDetailViewModel;
  localOtherCostLines: LocalOtherCostLine[];
  noOtherCostsConfirmed: boolean;
};

export type FinancialCompletenessGap = 'revenue' | 'session' | 'materials' | 'otherCosts';

function hasNamedJob(job: JobDetailViewModel): boolean {
  const title = job.shortDescription.trim();
  return title.length > 0 && title !== 'Untitled Job';
}

function hasMaterialsComplete(job: JobDetailViewModel): boolean {
  const hasMaterials = job.materialBuckets.some((bucket) => bucket.items.length > 0);
  return hasMaterials || job.noMaterialsConfirmed;
}

function hasOtherCostsComplete(
  localOtherCostLines: LocalOtherCostLine[],
  noOtherCostsConfirmed: boolean,
): boolean {
  return localOtherCostLines.length > 0 || noOtherCostsConfirmed;
}

export function isJobFinanciallyComplete(ctx: JobFinancialCompletenessContext): boolean {
  const { job, localOtherCostLines, noOtherCostsConfirmed } = ctx;
  return (
    hasNamedJob(job) &&
    job.earnings.revenueCents > 0 &&
    job.metrics.sessionCount > 0 &&
    hasMaterialsComplete(job) &&
    hasOtherCostsComplete(localOtherCostLines, noOtherCostsConfirmed)
  );
}

/** Fixed order for the mark-complete wizard. */
export function financialCompletenessGaps(
  ctx: JobFinancialCompletenessContext,
): FinancialCompletenessGap[] {
  const { job, localOtherCostLines, noOtherCostsConfirmed } = ctx;
  const gaps: FinancialCompletenessGap[] = [];
  if (!hasNamedJob(job) || job.earnings.revenueCents <= 0) {
    gaps.push('revenue');
  }
  if (job.metrics.sessionCount <= 0) {
    gaps.push('session');
  }
  if (!hasMaterialsComplete(job)) {
    gaps.push('materials');
  }
  if (!hasOtherCostsComplete(localOtherCostLines, noOtherCostsConfirmed)) {
    gaps.push('otherCosts');
  }
  return gaps;
}

export function jobCostsIncompleteForListPill(job: {
  hasMaterials: boolean;
  noMaterialsConfirmed: boolean;
}): boolean {
  return !job.hasMaterials && !job.noMaterialsConfirmed;
}

export function isCompletedOrPaidWorkStatus(status: JobDetailWorkStatus): boolean {
  return status === 'completed' || status === 'paid';
}

/**
 * When a job was financially complete and loses required info while still
 * marked completed/paid, revert work status to in progress.
 *
 * `previousFinanciallyComplete === null` skips the first observation (e.g. job
 * load) so stale Phase-1 local other-cost state does not demote on open.
 */
export function shouldDemoteCompletedOrPaidForIncompleteFinancials(input: {
  previousFinanciallyComplete: boolean | null;
  nowFinanciallyComplete: boolean;
  workStatus: JobDetailWorkStatus;
}): boolean {
  const { previousFinanciallyComplete, nowFinanciallyComplete, workStatus } = input;
  if (previousFinanciallyComplete !== true || nowFinanciallyComplete) return false;
  return isCompletedOrPaidWorkStatus(workStatus);
}
