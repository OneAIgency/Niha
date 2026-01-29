/**
 * UsersPage tests.
 * Verifies Status column shows "Active" vs "DISABLED" based on user.is_active.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { UsersPage } from '../UsersPage';
import type { User, UserRole } from '../../types';

const { mockUsers } = vi.hoisted(() => {
  const active: User & { entity_name?: string; is_active?: boolean } = {
    id: 'user-active',
    email: 'active@test.com',
    first_name: 'Active',
    last_name: 'User',
    role: 'ADMIN' as UserRole,
    is_active: true,
  };
  const disabled: User & { entity_name?: string; is_active?: boolean } = {
    id: 'user-disabled',
    email: 'disabled@test.com',
    first_name: 'Disabled',
    last_name: 'User',
    role: 'NDA' as UserRole,
    is_active: false,
  };
  return { mockUsers: [active, disabled] };
});

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      getUsers: vi.fn().mockResolvedValue({
        data: mockUsers,
        pagination: { page: 1, per_page: 20, total: 2, total_pages: 1 },
      }),
    },
  };
});

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Active in Status column for active users', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('shows DISABLED in Status column for disabled users', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      const disabledBadges = screen.getAllByText('DISABLED');
      expect(disabledBadges.length).toBeGreaterThanOrEqual(1);
    });
  });
});
