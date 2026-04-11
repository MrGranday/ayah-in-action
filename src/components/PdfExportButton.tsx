'use client';

import { useState } from 'react';
import { FileDown, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { parseNoteBody } from '@/lib/utils';

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

export function PdfExportButton({ notes }: { notes: Note[] }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const container = document.createElement('div');
      container.id = 'journal-print-area';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '800px';
      container.style.padding = '60px';
      container.style.backgroundColor = '#fafaf3'; // Heirloom background
      container.style.color = '#1b1c18';
      container.style.fontFamily = "'Inter', sans-serif";

      const appNotes = notes.filter(n => n.body.includes('<!--aia'));
      
      let html = `
        <div style="text-align: center; margin-bottom: 60px; padding-bottom: 40px; border-bottom: 1px solid rgba(0, 76, 59, 0.1);">
          <div style="font-family: serif; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: #004c3b; opacity: 0.6; margin-bottom: 16px;">The Digital Heirloom</div>
          <h1 style="font-family: serif; font-size: 48px; color: #004c3b; margin: 0; font-style: italic;">My Quranic Archive</h1>
          <p style="color: #3f4944; margin-top: 12px; font-size: 14px; letter-spacing: 0.05em;">Curated reflections exported on ${format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
      `;

      html += '<div style="display: flex; flex-direction: column; gap: 48px;">';
      
      appNotes.forEach(note => {
        const { logText, metadata } = parseNoteBody(note.body);
        const categories = metadata?.categories || [];
        const dateStr = format(new Date(note.createdAt), 'EEEE, MMMM do, yyyy');
        const verseKey = metadata?.verseKey || 'Reflection';
        
        html += `
          <div style="position: relative; padding-left: 24px; border-left: 2px solid #d4a017;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center;">
              <div>
                <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; color: #d4a017; display: block; margin-bottom: 4px;">Entry Asset</span>
                <div style="font-family: serif; font-size: 24px; color: #004c3b;">Verse ${verseKey}</div>
              </div>
              <div style="text-align: right;">
                 <div style="font-family: serif; font-size: 14px; color: #3f4944; font-style: italic;">${dateStr}</div>
              </div>
            </div>
            
            <div style="font-size: 16px; line-height: 1.8; color: #1b1c18; background: white; padding: 32px; border-radius: 24px; border: 1px solid rgba(0, 76, 59, 0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.02); margin-bottom: 20px;">
              ${logText}
            </div>

            ${categories.length > 0 ? `
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${categories.map((c: string) => `<span style="background: rgba(0, 76, 59, 0.05); padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #004c3b;">${c}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      });

      if (appNotes.length === 0) {
        html += `<div style="text-align: center; padding: 100px 0; border: 1px dashed rgba(0, 76, 59, 0.1); border-radius: 40px;">
          <p style="color: #3f4944; font-style: italic; font-family: serif; font-size: 18px;">The pages of your journal remain unwritten.</p>
        </div>`;
      }

      html += '</div>';
      
      html += `
        <div style="margin-top: 80px; text-align: center; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #004c3b; opacity: 0.3; border-top: 1px solid rgba(0, 76, 59, 0.05); padding-top: 40px;">
          Preserved via Ayah in Action &bull; Digital Sanctuary Archive
        </div>
      `;

      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#fafaf3' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= 297;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= 297;
      }
      
      pdf.save(`quran-journal-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      document.body.removeChild(container);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport} 
      disabled={isExporting} 
      className="group relative flex items-center justify-center gap-3 px-6 h-12 rounded-2xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 overflow-hidden"
    >
      <div className="absolute inset-0 silk-gradient opacity-90 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
      
      <div className="relative flex items-center gap-3 text-white">
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <FileDown className="w-4.5 h-4.5 group-hover:translate-y-0.5 transition-transform" />
            <Sparkles className="w-3.5 h-3.5 opacity-40" />
          </>
        )}
        <span className="font-label text-xs font-bold tracking-[0.2em] uppercase">
          {isExporting ? 'Curating...' : 'Export Archive'}
        </span>
      </div>
    </button>
  );
}
