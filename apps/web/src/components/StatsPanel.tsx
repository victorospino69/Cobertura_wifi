import React from 'react';
import { useSceneStore } from '../store/scene.store.js';
import { Activity, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export const StatsPanel: React.FC = () => {
  const { simStats, simDurationMs, isSimulating } = useSceneStore();

  if (!simStats) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '420px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '8px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '12px',
        color: '#f8fafc'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <CheckCircle2 size={16} color="#22c55e" />
        <div>
          <span style={{ color: '#94a3b8' }}>Cobertura: </span>
          <strong style={{ color: '#22c55e' }}>{simStats.coveragePct}%</strong>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ShieldAlert size={16} color="#ef4444" />
        <div>
          <span style={{ color: '#94a3b8' }}>Zona muerta: </span>
          <strong style={{ color: simStats.deadZonePct > 20 ? '#ef4444' : '#f8fafc' }}>
            {simStats.deadZonePct}% ({simStats.deadZoneAreaM2} m²)
          </strong>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Activity size={16} color="#38bdf8" />
        <div>
          <span style={{ color: '#94a3b8' }}>RSSI Medio: </span>
          <strong>{simStats.meanDbm} dBm</strong>
          <span style={{ color: '#64748b', marginLeft: '6px' }}>p5: {simStats.p5Dbm} dBm</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
        <Clock size={14} />
        <span>{simDurationMs !== null ? `${simDurationMs} ms` : '...'}</span>
        {isSimulating && <span style={{ color: '#38bdf8', marginLeft: '4px' }}>●</span>}
      </div>
    </div>
  );
};
