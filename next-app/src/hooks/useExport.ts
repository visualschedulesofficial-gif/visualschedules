'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCallback } from 'react';

export function useExport() {
  const exportPDF = useCallback(async () => {
    try {
      const pages = document.querySelectorAll('[data-a4-page]');
      console.log('Found pages:', pages.length);
      
      if (!pages.length) {
        alert('No pages found to export');
        return;
      }

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;
        console.log(`Processing page ${i + 1}...`);

        // Clone the element to avoid display issues
        const clone = pageElement.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '-9999px';
        clone.style.display = 'block';
        document.body.appendChild(clone);

        // Small delay to ensure rendering
        await new Promise(r => setTimeout(r, 500));

        try {
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#FFFFFF',
            logging: true,
            windowHeight: clone.scrollHeight,
            windowWidth: clone.scrollWidth,
          });

          if (i > 0) pdf.addPage();
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
          console.log(`Page ${i + 1} added to PDF`);
        } catch (err) {
          console.error(`Error on page ${i + 1}:`, err);
        } finally {
          document.body.removeChild(clone);
        }
      }

      pdf.save('schedule.pdf');
      console.log('PDF saved successfully');
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + (error as Error).message);
    }
  }, []);

  const exportJPEG = useCallback(async () => {
    try {
      const pages = document.querySelectorAll('[data-a4-page]');
      console.log('Found pages:', pages.length);
      
      if (!pages.length) {
        alert('No pages found to export');
        return;
      }

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;
        console.log(`Processing page ${i + 1}...`);

        // Clone the element to avoid display issues
        const clone = pageElement.cloneNode(true) as HTMLElement;
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '-9999px';
        clone.style.display = 'block';
        document.body.appendChild(clone);

        // Small delay to ensure rendering
        await new Promise(r => setTimeout(r, 500));

        try {
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#FFFFFF',
            logging: true,
            windowHeight: clone.scrollHeight,
            windowWidth: clone.scrollWidth,
          });

          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/jpeg', 0.95);
          link.download = `schedule-page-${i + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          console.log(`Page ${i + 1} exported`);
        } catch (err) {
          console.error(`Error on page ${i + 1}:`, err);
        } finally {
          document.body.removeChild(clone);
        }
      }

      console.log('JPEG export completed');
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + (error as Error).message);
    }
  }, []);

  return { exportPDF, exportJPEG };
}
