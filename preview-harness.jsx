import React from 'react';
import { createRoot } from 'react-dom/client';
import ResumePreview from './src/components/ResumePreview.jsx';

const resume = window.__TEST_RESUME__;
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(ResumePreview, { resume, isFreePlan: true }));
