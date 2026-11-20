import React from 'react';
import { CADEditor } from './editor/CADEditor.js';
import { Toolbar } from './components/Toolbar.js';
import { PropertiesPanel } from './components/PropertiesPanel.js';
import { StatsPanel } from './components/StatsPanel.js';
import { Legend } from './components/Legend.js';

export const App: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Toolbar />
      <StatsPanel />
      <PropertiesPanel />
      <Legend />
      <CADEditor />
    </div>
  );
};
