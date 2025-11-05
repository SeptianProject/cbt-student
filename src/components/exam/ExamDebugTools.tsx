'use client';

import React from 'react';

interface ExamDebugToolsProps {
     onTimeSet?: (seconds: number) => void;
}

export const ExamDebugTools: React.FC<ExamDebugToolsProps> = () => {
     // Debug tools dinonaktifkan untuk production
     return null;
};
