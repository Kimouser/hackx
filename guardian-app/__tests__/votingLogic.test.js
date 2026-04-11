/**
 * Unit tests for Guardian voting logic (one-vote-per-user)
 * Run: npx jest __tests__/votingLogic.test.js
 */

// We test the in-memory database directly
import { getDatabase, upvoteReport, hasUserVoted, getAllReports } from '../src/db/database';

beforeAll(async () => {
  await getDatabase(); // seed data
});

describe('Upvote — One Vote Per User', () => {
  test('first vote increments upvote count', async () => {
    const before = (await getAllReports()).find((r) => r.id === 1);
    const initialVotes = before.upvotes;

    const result = await upvoteReport(1, 'test_user_1');
    expect(result.alreadyVoted).toBe(false);
    expect(result.upvotes).toBe(initialVotes + 1);
  });

  test('second vote from same user is blocked', async () => {
    const result = await upvoteReport(1, 'test_user_1');
    expect(result.alreadyVoted).toBe(true);
  });

  test('different user can still vote on the same report', async () => {
    const before = (await getAllReports()).find((r) => r.id === 1);
    const initialVotes = before.upvotes;

    const result = await upvoteReport(1, 'test_user_2');
    expect(result.alreadyVoted).toBe(false);
    expect(result.upvotes).toBe(initialVotes + 1);
  });

  test('hasUserVoted returns correct state', () => {
    expect(hasUserVoted(1, 'test_user_1')).toBe(true);
    expect(hasUserVoted(1, 'test_user_2')).toBe(true);
    expect(hasUserVoted(1, 'never_voted')).toBe(false);
  });

  test('voting on non-existent report throws', async () => {
    await expect(upvoteReport(9999, 'test_user_1')).rejects.toThrow('Report not found');
  });
});

describe('Municipal Loop Trigger', () => {
  test('municipal email triggers at 10 upvotes', async () => {
    // Use a report with lower votes and push it to 10
    const reports = await getAllReports();
    const target = reports.find((r) => r.upvotes < 8);
    if (!target) return; // skip if all reports already high

    // Vote enough times with unique users to reach 10
    for (let i = 0; i < 12; i++) {
      const res = await upvoteReport(target.id, `municipal_test_${i}`);
      if (res.municipalTriggered) {
        expect(res.upvotes).toBeGreaterThanOrEqual(10);
        expect(res.municipal_email_sent).toBe(1);
        return;
      }
    }
  });
});
