'use client';

import React from 'react';

interface BackupStatusIndicatorProps {
     isBackingUp: boolean;
     lastBackupTime: Date | null;
     backupError: string | null;
     backupCount: number;
}

/**
 * Component untuk menampilkan status periodic backup
 * Backup berjalan di background tanpa UI indicator untuk production
 */
export const BackupStatusIndicator: React.FC<BackupStatusIndicatorProps> = () => {
     // Backup berjalan di background tanpa menampilkan UI
     return null;
};
