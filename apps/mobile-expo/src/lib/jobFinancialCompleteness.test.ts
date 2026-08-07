import {
  shouldDemoteCompletedOrPaidForIncompleteFinancials,
} from './jobFinancialCompleteness';

describe('shouldDemoteCompletedOrPaidForIncompleteFinancials', () => {
  it('does not demote on first observation', () => {
    expect(
      shouldDemoteCompletedOrPaidForIncompleteFinancials({
        previousFinanciallyComplete: null,
        nowFinanciallyComplete: false,
        workStatus: 'completed',
      }),
    ).toBe(false);
  });

  it('demotes when completeness drops on completed or paid jobs', () => {
    expect(
      shouldDemoteCompletedOrPaidForIncompleteFinancials({
        previousFinanciallyComplete: true,
        nowFinanciallyComplete: false,
        workStatus: 'completed',
      }),
    ).toBe(true);
    expect(
      shouldDemoteCompletedOrPaidForIncompleteFinancials({
        previousFinanciallyComplete: true,
        nowFinanciallyComplete: false,
        workStatus: 'paid',
      }),
    ).toBe(true);
  });

  it('does not demote when still complete or work is in progress', () => {
    expect(
      shouldDemoteCompletedOrPaidForIncompleteFinancials({
        previousFinanciallyComplete: true,
        nowFinanciallyComplete: true,
        workStatus: 'completed',
      }),
    ).toBe(false);
    expect(
      shouldDemoteCompletedOrPaidForIncompleteFinancials({
        previousFinanciallyComplete: true,
        nowFinanciallyComplete: false,
        workStatus: 'inProgress',
      }),
    ).toBe(false);
  });
});
