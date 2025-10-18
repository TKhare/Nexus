import React from 'react';
import { createRoot } from 'react-dom/client';
import Document from './Document.jsx';

const root = createRoot(document.getElementById('document-root'));
root.render(<Document />);
