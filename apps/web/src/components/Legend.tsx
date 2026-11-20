import React from 'react';
import { useSceneStore } from '../store/scene.store.js';
import { getQualityLabel } from '../heatmap/palette.js';
import { Crosshair } from 'lucide-react';

export const Legend: React.FC = () => {
  const { hoverPos, hoverDbm } = useSceneStore();

  const quality = hoverDbm !== null ? getQualityLabel(hoverDbm) : null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      {/* Sonda del cursor interactiva */}
      {hoverPos && (
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            width: 'fit-content'
          }}
        >
          <Crosshair size={14} color="#38bdf8" />
          <span>
            X: {hoverPos.x.toFixed(2)}m, Y: {hoverPos.y.toFixed(2)}m
          </span>
          {hoverDbm !== null ? (
            <span style={{ fontWeight: 600, color: quality?.color }}>
              {hoverDbm} dBm ({quality?.label})
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>(Fuera del edificio)</span>
          )}
        </div>
      )}

      {/* Escala cromática de intensidad de señal */}
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          width: '320px',
          fontSize: '11px',
          color: '#cbd5e1'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 500 }}>
          <span>Intensidad de Señal Wi-Fi (dBm)</span>
          <span style={{ color: '#94a3b8' }}>Paleta Turbo</span>
        </div>

        {/* Gradiente visual */}
        <div
          style={{
            height: '14px',
            borderRadius: '4px',
            background:
              'linear-gradient(to right, #30123b, #4662d7, #28bbec, #35f577, #a2fc3c, #f8c932, #f55b11, #b51c06, #7a0403)',
            marginBottom: '6px',
            border: '1px solid #475569'
          }}
        />

        {/* Marcas de dBm y etiquetas de calidad */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px' }}>
          <span>-100</span>
          <span>-85 (Débil)</span>
          <span>-75 (Acept.)</span>
          <span>-67 (Buena)</span>
          <span>-50 (Excel.)</span>
          <span>-30</span>
        </div>
      </div>
    </div>
  );
};
