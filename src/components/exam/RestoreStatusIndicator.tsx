'use client';

import React from 'react';

interface RestoreStats {
     totalRestored: number;
     multipleChoiceCount: number;
     essayCount: number;
     lastAnsweredAt: string | null;
}

interface RestoreStatusIndicatorProps {
     isRestoring: boolean;
     hasRestored: boolean;
     restoreError: string | null;
     restoreStats: RestoreStats | null;
}

/**
 * Component untuk menampilkan status restore answers
 * Restore berjalan di background tanpa UI indicator untuk production
 */
export const RestoreStatusIndicator: React.FC<RestoreStatusIndicatorProps> = () => {
     // Restore berjalan di background tanpa menampilkan UI
     return null;
};
