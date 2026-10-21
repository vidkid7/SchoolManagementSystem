import React from 'react';
import { render, screen } from '@testing-library/react';
import { BackupManagement } from './BackupManagement';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'backup.title': 'Backup & Restore',
      'backup.subtitle': 'Backup and restore school data',
      'backup.config': 'Backup Configuration',
      'backup.createBackup': 'Create Backup',
      'backup.lastRunUnavailable': 'No run history available',
      'backup.nextRunUnavailable': 'Scheduler active; next run time unavailable',
      'backup.notScheduled': 'Not scheduled',
      'backup.availableBackups': 'Available Backups',
      'backup.filename': 'Filename',
      'backup.size': 'Size',
      'backup.createdAt': 'Created At',
      'backup.status': 'Status',
      'backup.actions': 'Actions',
      'backup.noBackups': 'No backups found',
      'backup.cleanupOld': 'Cleanup Old',
    }[key] ?? key),
  }),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('BackupManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockImplementation((url) => Promise.resolve({
      data: url.includes('/config')
        ? { data: {
            enabled: true,
            schedule: '0 2 * * *',
            retentionDays: 30,
            backupPath: '/backups',
            compressionEnabled: true,
            jobStatus: { running: true, schedule: '0 2 * * *' },
          } }
        : { data: [] },
    } as any));
  });

  it('does not claim missing backup run timestamps mean never or not scheduled', async () => {
    render(<BackupManagement />);

    expect(await screen.findByText('No backups found')).toBeInTheDocument();
    expect(screen.getByText('No run history available')).toBeInTheDocument();
    expect(screen.getByText('Scheduler active; next run time unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Never')).not.toBeInTheDocument();
    expect(screen.queryByText('Not scheduled')).not.toBeInTheDocument();
  });
});
