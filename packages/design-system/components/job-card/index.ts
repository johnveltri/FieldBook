export {
  JobCard,
  type JobCardCategoryVariant,
  type JobCardProps,
  type JobCardStatusVariant,
  type JobCardVariant,
} from './JobCard';

/** Re-exported so consumers can wire `statusPillKind` next to `JobCard` from one entry. */
export {
  StatusPill,
  STATUS_PILL_KINDS,
  type StatusPillKind,
  type StatusPillProps,
} from '../status-pill';
