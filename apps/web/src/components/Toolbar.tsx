import React, { useRef } from 'react';
import {
  MousePointer,
  Square,
  Wifi,
  Grid,
  CornerDownLeft,
  RotateCcw,
  RotateCw,
  FolderOpen,
  Download,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useSceneStore } from '../store/scene.store.js';

export const Toolbar: React.FC = () => {
  const {
    activeTool,
    setTool,
    snapToGrid,
    setSnapToGrid,
    orthoMode,
    setOrthoMode,
    undo,
    redo,
    historyIndex,
    history,
    scene,
    clearScene,
    loadDemoScene,
    importSceneJson
  } = useSceneStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scene, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wifi_plan_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          importSceneJson(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '6px 10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Herramientas de dibujo */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #334155', paddingRight: '8px' }}>
        <button
          title="Seleccionar / Desplazar (V)"
          onClick={() => setTool('select')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTool === 'select' ? '#3b82f6' : '#334155',
            color: '#f8fafc'
          }}
        >
          <MousePointer size={18} />
        </button>

        <button
          title="Dibujar Muro (W)"
          onClick={() => setTool('wall')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTool === 'wall' ? '#3b82f6' : '#334155',
            color: '#f8fafc'
          }}
        >
          <Square size={18} />
        </button>

        <button
          title="Colocar Router (R)"
          onClick={() => setTool('router')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTool === 'router' ? '#3b82f6' : '#334155',
            color: '#f8fafc'
          }}
        >
          <Wifi size={18} />
        </button>
      </div>

      {/* Snapping y Ortogonal */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #334155', paddingRight: '8px' }}>
        <button
          title={snapToGrid ? 'Ajuste a cuadrícula (Activo)' : 'Ajuste a cuadrícula (Inactivo)'}
          onClick={() => setSnapToGrid(!snapToGrid)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: snapToGrid ? '#0284c7' : '#334155',
            color: '#f8fafc'
          }}
        >
          <Grid size={18} />
        </button>

        <button
          title={orthoMode ? 'Modo Ortogonal (90°) (Activo)' : 'Modo Ortogonal (90°) (Inactivo)'}
          onClick={() => setOrthoMode(!orthoMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: orthoMode ? '#0284c7' : '#334155',
            color: '#f8fafc'
          }}
        >
          <CornerDownLeft size={18} />
        </button>
      </div>

      {/* Historial Undo/Redo */}
      <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #334155', paddingRight: '8px' }}>
        <button
          title="Deshacer (Ctrl+Z)"
          onClick={undo}
          disabled={historyIndex <= 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
            backgroundColor: '#334155',
            color: historyIndex > 0 ? '#f8fafc' : '#64748b'
          }}
        >
          <RotateCcw size={18} />
        </button>

        <button
          title="Rehacer (Ctrl+Y)"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
            backgroundColor: '#334155',
            color: historyIndex < history.length - 1 ? '#f8fafc' : '#64748b'
          }}
        >
          <RotateCw size={18} />
        </button>
      </div>

      {/* Plantilla y Archivo */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          title="Cargar escena demo"
          onClick={loadDemoScene}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#334155',
            color: '#38bdf8'
          }}
        >
          <Sparkles size={18} />
        </button>

        <button
          title="Importar JSON"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#334155',
            color: '#f8fafc'
          }}
        >
          <FolderOpen size={18} />
        </button>

        <button
          title="Exportar plano (JSON)"
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#334155',
            color: '#f8fafc'
          }}
        >
          <Download size={18} />
        </button>

        <button
          title="Limpiar plano"
          onClick={clearScene}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#334155',
            color: '#f87171'
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
