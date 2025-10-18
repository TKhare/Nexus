import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup.jsx';

const root = createRoot(document.getElementById('popup-root'));
root.render(<Popup />);
