# Automated Backup System

## Overview

The School Management System includes a comprehensive automated backup system that ensures data safety and disaster recovery capabilities. The system supports daily automated backups, external storage, compression, and recovery procedures.

## Features

- **Automated Daily Backups**: Scheduled database backups using cron expressions
- **External Storage Support**: Copy backups to external storage (network drives, cloud storage)
- **Compression**: Gzip compression to reduce storage requirements
- **Retention Policy**: Automatic cleanup of old backups based on retention days
- **Recovery Procedure**: Simple restore process with RTO of 4 hours
- **Backup Verification**: Integrity checks for backup files
- **Manual Backup**: On-demand backup creation via API
- **Backup Management**: List, verify, and manage backups through API

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Backup Configuration
BACKUP_ENABLED=true                    # Enable/disable automated backups
BACKUP_SCHEDULE=0 2 * * *              # Cron expression (2 AM daily)
BACKUP_RETENTION_DAYS=30               # Keep backups for 30 days
BACKUP_PATH=./backups                  # Local backup directory
BACKUP_EXTERNAL_PATH=/mnt/backup       # External storage path (optional)
BACKUP_COMPRESSION=true                # Enable gzip compression
BACKUP_ON_STARTUP=false                # Run backup on server startup
```

### Cron Schedule Examples

- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 3 1 * *` - Monthly on the 1st at 3:00 AM

## Architecture

### Components

1. **BackupService** (`src/services/backup.service.ts`)
   - Core backup functionality
   - Database export using mysqldump
   - Compression and external storage
   - Restore and verification

2. **BackupJob** (`src/jobs/backupJob.ts`)
   - Scheduled backup execution
   - Automatic cleanup of old backups
   - Job status monitoring

3. **BackupController** (`src/modules/backup/backup.controller.ts`)
   - API endpoints for backup management
   - Manual backup creation
   - Restore operations

### Backup Process

1. **Create Backup**
   ```
   mysqldump → SQL file → Compress (gzip) → Copy to external storage
   ```

2. **Cleanup Old Backups**
   ```
   List backups → Filter by retention policy → Delete old files
   ```

3. **Restore Backup**
   ```
   Find backup file → Decompress (if needed) → mysql restore
   ```

## API Endpoints

All endpoints require `school_admin` role authentication.

### Create Manual Backup

```http
POST /api/v1/backup/create
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Backup created successfully",
  "data": {
    "filename": "backup_2024-01-15T02-00-00.sql.gz",
    "path": "/path/to/backups/backup_2024-01-15T02-00-00.sql.gz",
    "size": 1048576,
    "duration": 5432
  }
}
```

### List Available Backups

```http
GET /api/v1/backup/list
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "filename": "backup_2024-01-15T02-00-00.sql.gz",
      "timestamp": "2024-01-15T02:00:00.000Z",
      "size": 1048576,
      "compressed": true,
      "location": "both"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

### Restore from Backup

```http
POST /api/v1/backup/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "backup_2024-01-15T02-00-00.sql.gz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Database restored successfully",
  "data": {
    "restoredTables": 0,
    "duration": 8765
  }
}
```

### Verify Backup Integrity

```http
POST /api/v1/backup/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "backup_2024-01-15T02-00-00.sql.gz"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "backup_2024-01-15T02-00-00.sql.gz",
    "valid": true
  }
}
```

### Clean Up Old Backups

```http
POST /api/v1/backup/cleanup
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Old backups cleaned up successfully",
  "data": {
    "deletedCount": 5
  }
}
```

### Get Backup Configuration

```http
GET /api/v1/backup/config
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "schedule": "0 2 * * *",
    "retentionDays": 30,
    "backupPath": "./backups",
    "externalStoragePath": "/mnt/backup",
    "compressionEnabled": true,
    "jobStatus": {
      "running": true,
      "schedule": "0 2 * * *"
    }
  }
}
```

## Recovery Procedure

### Standard Recovery (RTO: 4 hours)

1. **Identify the backup to restore**
   ```bash
   curl -X GET http://localhost:3000/api/v1/backup/list \
     -H "Authorization: Bearer <token>"
   ```

2. **Verify backup integrity**
   ```bash
   curl -X POST http://localhost:3000/api/v1/backup/verify \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"filename": "backup_2024-01-15T02-00-00.sql.gz"}'
   ```

3. **Stop the application** (to prevent data conflicts)
   ```bash
   pm2 stop school-management-system
   # or
   docker-compose down
   ```

4. **Restore the database**
   ```bash
   curl -X POST http://localhost:3000/api/v1/backup/restore \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"filename": "backup_2024-01-15T02-00-00.sql.gz"}'
   ```

5. **Restart the application**
   ```bash
   pm2 start school-management-system
   # or
   docker-compose up -d
   ```

6. **Verify system functionality**
   - Check health endpoint: `GET /health`
   - Test critical operations
   - Review audit logs

### Manual Recovery (Alternative)

If the API is unavailable, you can restore manually:

1. **Locate the backup file**
   ```bash
   ls -lh /path/to/backups/
   ```

2. **Decompress if needed**
   ```bash
   gunzip backup_2024-01-15T02-00-00.sql.gz
   ```

3. **Restore using mysql command**
   ```bash
   mysql -h localhost -u root -p school_management_system < backup_2024-01-15T02-00-00.sql
   ```

## External Storage Options

### Network Drive (NFS/SMB)

Mount the network drive and configure the path:

```bash
# Mount NFS share
sudo mount -t nfs server:/backup /mnt/backup

# Add to .env
BACKUP_EXTERNAL_PATH=/mnt/backup
```

### Cloud Storage (S3-compatible)

For cloud storage, you can use tools like `rclone` to sync backups:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure rclone for your cloud provider
rclone config

# Create a cron job to sync backups
0 3 * * * rclone sync /path/to/backups remote:school-backups
```

### USB Drive

```bash
# Mount USB drive
sudo mount /dev/sdb1 /mnt/usb-backup

# Add to .env
BACKUP_EXTERNAL_PATH=/mnt/usb-backup
```

## Monitoring and Alerts

### Check Backup Status

Monitor backup job status through logs:

```bash
# View backup logs
tail -f logs/combined.log | grep -i backup

# Check last backup
ls -lht /path/to/backups/ | head -n 5
```

### Set Up Alerts

Configure alerts for backup failures:

1. **Email Notifications**: Integrate with nodemailer
2. **SMS Alerts**: Use Sparrow SMS for critical failures
3. **Monitoring Tools**: Integrate with Prometheus/Grafana

## Best Practices

1. **Test Restores Regularly**: Perform quarterly restore tests to verify backup integrity
2. **Multiple Storage Locations**: Use both local and external storage
3. **Monitor Disk Space**: Ensure sufficient space for backups
4. **Secure Backups**: Encrypt sensitive backups and restrict access
5. **Document Recovery**: Keep recovery procedures updated and accessible
6. **Retention Policy**: Balance storage costs with recovery needs
7. **Backup Verification**: Regularly verify backup integrity

## Troubleshooting

### Backup Creation Fails

**Issue**: mysqldump command fails

**Solution**:
- Verify MySQL credentials in `.env`
- Check MySQL user permissions: `GRANT SELECT, LOCK TABLES ON *.* TO 'user'@'localhost';`
- Ensure sufficient disk space
- Check MySQL server is running

### External Storage Copy Fails

**Issue**: Cannot copy to external storage

**Solution**:
- Verify external path exists and is writable
- Check mount status: `mount | grep backup`
- Verify network connectivity for network drives
- Check permissions: `ls -ld /mnt/backup`

### Restore Fails

**Issue**: Database restore fails

**Solution**:
- Verify backup file integrity
- Check MySQL server is running
- Ensure database exists: `CREATE DATABASE IF NOT EXISTS school_management_system;`
- Verify MySQL user has restore permissions
- Check for disk space issues

### Old Backups Not Deleted

**Issue**: Cleanup doesn't delete old backups

**Solution**:
- Check retention policy configuration
- Verify file permissions for deletion
- Review cleanup logs for errors
- Manually delete if needed: `find /path/to/backups -name "backup_*" -mtime +30 -delete`

## Security Considerations

1. **Access Control**: Only `school_admin` role can manage backups
2. **Backup Encryption**: Consider encrypting backups for sensitive data
3. **Secure Storage**: Restrict access to backup directories
4. **Audit Logging**: All backup operations are logged
5. **Network Security**: Use secure protocols for external storage

## Performance Impact

- **Backup Duration**: Typically 1-5 minutes for databases up to 1GB
- **CPU Usage**: Minimal during backup (mysqldump is efficient)
- **I/O Impact**: Scheduled during low-traffic hours (2 AM default)
- **Compression**: Reduces backup size by 70-90%

## Compliance

The backup system helps meet:

- **Data Protection Requirements**: Regular backups ensure data safety
- **Disaster Recovery**: RTO of 4 hours meets reliability NFR
- **Audit Requirements**: All operations are logged
- **Business Continuity**: Automated backups ensure minimal data loss

## Future Enhancements

- [ ] Incremental backups for large databases
- [ ] Point-in-time recovery
- [ ] Backup encryption at rest
- [ ] Cloud storage integration (AWS S3, Google Cloud Storage)
- [ ] Backup health dashboard
- [ ] Automated restore testing
- [ ] Multi-region backup replication

## Support

For issues or questions about the backup system:

1. Check logs: `logs/combined.log`
2. Review this documentation
3. Contact system administrator
4. Raise an issue in the project repository
