import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type JobsListInvalidationContextValue = {
  /** Incremented when consumers should reload the jobs list from the first page. */
  version: number;
  invalidateJobsList: () => void;
};

const JobsListInvalidationContext = createContext<JobsListInvalidationContextValue | null>(
  null,
);

export function JobsListInvalidationProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const invalidateJobsList = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);
  const value = useMemo(
    () => ({ version, invalidateJobsList }),
    [version, invalidateJobsList],
  );
  return (
    <JobsListInvalidationContext.Provider value={value}>
      {children}
    </JobsListInvalidationContext.Provider>
  );
}

export function useJobsListInvalidation(): JobsListInvalidationContextValue {
  const ctx = useContext(JobsListInvalidationContext);
  if (!ctx) {
    throw new Error('useJobsListInvalidation must be used within JobsListInvalidationProvider');
  }
  return ctx;
}
