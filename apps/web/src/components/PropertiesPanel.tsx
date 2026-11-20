import React from 'react';
import { useSceneStore } from '../store/scene.store.js';
import { Trash2, Radio, Layers, Sliders } from 'lucide-react';

export const PropertiesPanel: React.FC = () => {
  const {
    scene,
    selectedWallId,
    selectedRouterId,
    activeMaterialId,
    setActiveMaterial,
    updateWall,
    removeWall,
    updateRouter,
    removeRouter,
    simParams,
    setSimParams
  } = useSceneStore();

  const selectedWall = scene.walls.find((w) => w.id === selectedWallId);
  const selectedRouter = scene.routers.find((r) => r.id === selectedRouterId);

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '280px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        zIndex: 20,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        fontSize: '13px'
      }}
    >
      {/* 1. Elemento seleccionado: Muro */}
      {selectedWall && (
        <div style={{ marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} /> Muro Seleccionado
            </span>
            <button
              onClick={() => removeWall(selectedWall.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Eliminar muro"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>Material:</label>
            <select
              value={selectedWall.materialId}
              onChange={(e) => updateWall(selectedWall.id, { materialId: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #475569',
                color: '#f8fafc',
                padding: '6px',
                borderRadius: '4px'
              }}
            >
              {scene.materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
              Espesor: {(selectedWall.thickness * 100).toFixed(0)} cm
            </label>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={selectedWall.thickness}
              onChange={(e) => updateWall(selectedWall.id, { thickness: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>
        </div>
      )}

      {/* 2. Elemento seleccionado: Router */}
      {selectedRouter && (
        <div style={{ marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={16} /> Router Wi-Fi
            </span>
            <button
              onClick={() => removeRouter(selectedRouter.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Eliminar router"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>Nombre:</label>
            <input
              type="text"
              value={selectedRouter.name}
              onChange={(e) => updateRouter(selectedRouter.id, { name: e.target.value })}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #475569',
                color: '#f8fafc',
                padding: '6px',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>Banda de Frecuencia:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => updateRouter(selectedRouter.id, { freqGHz: 2.4 })}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #475569',
                  backgroundColor: selectedRouter.freqGHz === 2.4 ? '#3b82f6' : '#0f172a',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: selectedRouter.freqGHz === 2.4 ? 600 : 400
                }}
              >
                2.4 GHz
              </button>
              <button
                type="button"
                onClick={() => updateRouter(selectedRouter.id, { freqGHz: 5.0 })}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #475569',
                  backgroundColor: selectedRouter.freqGHz === 5.0 ? '#a855f7' : '#0f172a',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: selectedRouter.freqGHz === 5.0 ? 600 : 400
                }}
              >
                5.0 GHz
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
              Potencia Tx: {selectedRouter.txPowerDbm} dBm ({(Math.pow(10, selectedRouter.txPowerDbm / 10)).toFixed(0)} mW)
            </label>
            <input
              type="range"
              min="10"
              max="30"
              step="1"
              value={selectedRouter.txPowerDbm}
              onChange={(e) => updateRouter(selectedRouter.id, { txPowerDbm: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
              Ganancia Antena: {selectedRouter.gainDbi} dBi
            </label>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={selectedRouter.gainDbi}
              onChange={(e) => updateRouter(selectedRouter.id, { gainDbi: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
          </div>
        </div>
      )}

      {/* 3. Material activo para nuevos muros */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
        <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Layers size={16} /> Material para Muros
        </span>
        <select
          value={activeMaterialId}
          onChange={(e) => setActiveMaterial(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#0f172a',
            border: '1px solid #475569',
            color: '#f8fafc',
            padding: '6px',
            borderRadius: '4px'
          }}
        >
          {scene.materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Parámetros del Motor de Propagación */}
      <div>
        <span style={{ fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Sliders size={16} /> Simulación Física
        </span>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
            Resolución de Malla: {simParams.gridStepM} m
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0.5, 0.25, 0.1].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setSimParams({ gridStepM: step })}
                style={{
                  flex: 1,
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #475569',
                  backgroundColor: simParams.gridStepM === step ? '#3b82f6' : '#0f172a',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                {step} m
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
            Modelo de Ray Tracing:
          </label>
          <select
            value={simParams.maxReflections}
            onChange={(e) => setSimParams({ maxReflections: parseInt(e.target.value) as 0 | 1 })}
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #475569',
              color: '#f8fafc',
              padding: '6px',
              borderRadius: '4px'
            }}
          >
            <option value={0}>Nivel A: Camino Directo + Muros</option>
            <option value={1}>Nivel B: Directo + Reflexiones Orden 1</option>
          </select>
        </div>

        {simParams.maxReflections > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={simParams.coherent}
                onChange={(e) => setSimParams({ coherent: e.target.checked })}
                style={{ accentColor: '#3b82f6' }}
              />
              Modo Coherente (Fase / Fading)
            </label>
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>
            Umbral Zona Muerta: {simParams.deadZoneDbm} dBm
          </label>
          <input
            type="range"
            min="-90"
            max="-65"
            step="1"
            value={simParams.deadZoneDbm}
            onChange={(e) => setSimParams({ deadZoneDbm: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#ef4444' }}
          />
        </div>
      </div>
    </div>
  );
};
