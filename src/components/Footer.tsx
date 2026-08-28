import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      id="dashboard-footer"
      className="mt-8 pt-4 pb-8 border-t border-white/20 text-xs text-blue-100/80 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono bg-white/10 text-white px-2.5 py-1 rounded-md border border-white/20 text-[11px] backdrop-blur-xs font-semibold">
          Fórmula: % Retida = (QTD Retida / QTD Puxada) × 100
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-blue-200/90 font-medium">
        <span>Fonte: Base Blitz de Puxada</span>
        <span>•</span>
        <span>Pau Brasil Distribuidora Ambev</span>
        <span>•</span>
        <span>Painel Executivo de Gestão Logística</span>
      </div>
    </footer>
  );
};
