export type ExportDeletionRow = {
  id: string;
  object_path: string | null;
  generation_state: string;
};

export function buildExportDeletionPlan(userId: string, rows: ExportDeletionRow[]) {
  return {
    // A processing worker must observe the revocation and finish its cleanup
    // before Auth deletion can cascade the request row away.
    generationInFlight: rows.some((row) => row.generation_state === 'processing'),
    objectPaths: [...new Set(rows.map((row) =>
      row.object_path ?? `${userId}/${row.id}/job-summary.csv`
    ))],
  };
}
