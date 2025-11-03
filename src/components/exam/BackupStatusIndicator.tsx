'use client';

import React from 'react';
import { FiDatabase, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';

interface BackupStatusIndicatorProps {
     isBackingUp: boolean;
     lastBackupTime: Date | null;
     backupError: string | null;
     backupCount: number;
}

/**
 * Component untuk menampilkan status periodic backup
 * 
 * Fitur:
 * - Visual indicator saat backup berlangsung
 * - Timestamp backup terakhir
 * - Error message jika backup gagal
 * - Backup counter
 */
export const BackupStatusIndicator: React.FC<BackupStatusIndicatorProps> = ({
     isBackingUp,
     lastBackupTime,
     backupError,
     backupCount
}) => {
     const formatTime = (date: Date | null) => {
          if (!date) return '-';
          return date.toLocaleTimeString('id-ID', {
               hour: '2-digit',
               minute: '2-digit',
               second: '2-digit'
          });
     };

     const getStatus = () => {
          if (isBackingUp) {
               return {
                    icon: <FiDatabase className="animate-pulse" />,
                    text: 'Membackup...',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50'
               };
          }

          if (backupError) {
               return {
                    icon: <FiAlertCircle />,
                    text: 'Backup gagal',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50'
               };
          }

          if (lastBackupTime) {
               return {
                    icon: <FiCheckCircle />,
                    text: 'Backup tersimpan',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50'
               };
          }

          return {
               icon: <FiClock />,
               text: 'Menunggu backup',
               color: 'text-gray-600',
               bgColor: 'bg-gray-50'
          };
     };

     const status = getStatus();

     return (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${status.bgColor} ${status.color} text-sm transition-all duration-300`}>
               <span className="flex-shrink-0">{status.icon}</span>
               <div className="flex flex-col">
                    <span className="font-medium">{status.text}</span>
                    {lastBackupTime && (
                         <span className="text-xs opacity-75">
                              Terakhir: {formatTime(lastBackupTime)} ({backupCount}x)
                         </span>
                    )}
                    {backupError && (
                         <span className="text-xs opacity-75">
                              {backupError}
                         </span>
                    )}
               </div>
          </div>
     );
};
