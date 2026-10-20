import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleManagement } from './RoleManagement';
import { apiClient } from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: { roleName?: string }) => {
      const labels: Record<string, string> = {
        'roles.title': 'Role Management',
        'roles.addRole': 'Add Role',
        'roles.roleName': 'Role Name',
        'roles.roleCode': 'Role Code',
        'roles.description': 'Description',
        'roles.permissions': 'Permissions',
        'roles.systemRole': 'System Role',
        'roles.active': 'Active',
        'roles.managePermissions': 'Manage Permissions',
        'roles.selectPermissionsHint': 'Select permissions to assign to this role.',
        'roles.noPermissionsAvailable': 'No permissions are available to assign to this role.',
        'roles.selectAll': 'Select All',
        'roles.deselectAll': 'Deselect All',
        'roles.createRole': 'Create Role',
        'roles.expandRole': `Expand details for ${options?.roleName ?? ''}`,
        'roles.collapseRole': `Collapse details for ${options?.roleName ?? ''}`,
        'roles.activateRole': `Activate ${options?.roleName ?? ''}`,
        'roles.deactivateRole': `Deactivate ${options?.roleName ?? ''}`,
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'staff.actions': 'Actions',
        'staff.edit': 'Edit',
      };
      return labels[key] ?? key;
    },
  }),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('RoleManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockImplementation((url) => Promise.resolve({
      data: {
        data: url.includes('/permissions') ? [] : [{
          id: 'qa-role',
          name: 'QA Audit Role',
          code: 'QA_AUDIT_ROLE',
          description: 'Synthetic role for component testing',
          isSystem: false,
          isActive: true,
          permissions: [],
        }],
      },
    }));
  });

  it('names role controls and shows an explicit empty permission state', async () => {
    const user = userEvent.setup();
    render(<RoleManagement />);

    expect(await screen.findByText('QA Audit Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand details for QA Audit Role' }))
      .toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('checkbox', { name: 'Deactivate QA Audit Role' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Manage Permissions (0)' }));
    expect(await screen.findByText('No permissions are available to assign to this role.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Select All' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deselect All' })).toBeDisabled();
  });
});
