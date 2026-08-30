export type ExpiredExportArtifact = {
  id: string;
  object_path: string;
  expires_at: string;
};

type CleanupDependencies = {
  markExpired: (id: string) => Promise<void>;
  removeObject: (objectPath: string) => Promise<{ absent?: boolean }>;
  scrubDeleted: (id: string, scrubbedAt: string) => Promise<void>;
  logDeletionFailure: (input: { requestId: string; overdue: boolean }) => void;
  now?: () => number;
};

export async function cleanExpiredExportArtifacts(
  rows: ExpiredExportArtifact[],
  dependencies: CleanupDependencies,
): Promise<void> {
  const nowMs = dependencies.now?.() ?? Date.now();
  const scrubbedAt = new Date(nowMs).toISOString();
  for (const row of rows) {
    await dependencies.markExpired(row.id);
    try {
      await dependencies.removeObject(row.object_path);
    } catch {
      dependencies.logDeletionFailure({
        requestId: row.id,
        overdue: nowMs - Date.parse(row.expires_at) > 26 * 60 * 60 * 1000,
      });
      continue;
    }
    await dependencies.scrubDeleted(row.id, scrubbedAt);
  }
}
