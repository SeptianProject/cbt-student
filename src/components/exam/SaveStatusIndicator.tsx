'use client';

import React from 'react';

interface SaveStatusIndicatorProps {
     isSaving: boolean;
     lastSavedTime: Date | null;
     saveError: string | null;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = () => {
     // Auto-save berjalan di background tanpa menampilkan UI
     return null;
};
