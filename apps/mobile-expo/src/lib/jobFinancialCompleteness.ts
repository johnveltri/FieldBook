import type { JobDetailViewModel } from '@fieldsolo/shared-types';

export type JobFinancialCompletenessContext = {
  job: JobDetailViewModel;
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

function hasOtherCostsComplete(job: JobDetailViewModel): boolean {
  const hasOtherCosts = job.otherCostBuckets.some((bucket) => bucket.items.length > 0);
  return hasOtherCosts || job.noOtherCostsConfirmed;
}

export function isJobFinanciallyComplete(ctx: JobFinancialCompletenessContext): boolean {
  const { job } = ctx;
  return (
    hasNamedJob(job) &&
    (job.earnings.revenueCents ?? 0) > 0 &&
    job.metrics.sessionCount > 0 &&
    hasMaterialsComplete(job) &&
    hasOtherCostsComplete(job)
  );
}

/** Fixed order for the mark-complete wizard. */
export function financialCompletenessGaps(
  ctx: JobFinancialCompletenessContext,
): FinancialCompletenessGap[] {
  const { job } = ctx;
  const gaps: FinancialCompletenessGap[] = [];
  if (!hasNamedJob(job) || (job.earnings.revenueCents ?? 0) <= 0) {
    gaps.push('revenue');
  }
  if (job.metrics.sessionCount <= 0) {
    gaps.push('session');
  }
  if (!hasMaterialsComplete(job)) {
    gaps.push('materials');
  }
  if (!hasOtherCostsComplete(job)) {
    gaps.push('otherCosts');
  }
  return gaps;
}

export function jobCostsIncompleteForListPill(job: {
  hasMaterials: boolean;
  noMaterialsConfirmed: boolean;
  hasOtherCosts: boolean;
  noOtherCostsConfirmed: boolean;
}): boolean {
  const materialsIncomplete = !job.hasMaterials && !job.noMaterialsConfirmed;
  const otherIncomplete = !job.hasOtherCosts && !job.noOtherCostsConfirmed;
  return materialsIncomplete || otherIncomplete;
}

export function isCompletedOrPaidWorkStatus(
  status: JobDetailViewModel['workStatus'],
): boolean {
  return status === 'completed' || status === 'paid';
}

/**
 * When a job was financially complete and loses required info while still
 * marked completed/paid, revert work status to in progress.
 *
 * `previousFinanciallyComplete === null` skips the first observation (e.g. job
 * load) so stale state does not demote on open.
 */
export function shouldDemoteCompletedOrPaidForIncompleteFinancials(input: {
  previousFinanciallyComplete: boolean | null;
  nowFinanciallyComplete: boolean;
  workStatus: JobDetailViewModel['workStatus'];
}): boolean {
  const { previousFinanciallyComplete, nowFinanciallyComplete, workStatus } = input;
  if (previousFinanciallyComplete !== true || nowFinanciallyComplete) return false;
  return isCompletedOrPaidWorkStatus(workStatus);
}
