import type { ListJobsForCurrentUserItem } from '@fieldsolo/api-client';

import type { JobsOpenSectionKind } from '../components/ds/JobsOpenStackSectionHeader';

export function isOpenTabJobIncomplete(job: ListJobsForCurrentUserItem): boolean {
  return !job.isFinanciallyComplete;
}

export type OpenTabJobBuckets = Record<JobsOpenSectionKind, ListJobsForCurrentUserItem[]>;

/** Same grouping as Jobs → Open tab section stacks. */
export function bucketOpenTabJobs(jobs: ListJobsForCurrentUserItem[]): OpenTabJobBuckets {
  const incomplete: ListJobsForCurrentUserItem[] = [];
  const inProgress: ListJobsForCurrentUserItem[] = [];
  const unpaid: ListJobsForCurrentUserItem[] = [];
  for (const job of jobs) {
    if (isOpenTabJobIncomplete(job)) incomplete.push(job);
    else if (job.workStatus === 'inProgress') inProgress.push(job);
    else if (job.workStatus === 'completed') unpaid.push(job);
  }
  return { incomplete, inProgress, unpaid };
}
