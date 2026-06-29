'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCallback } from 'react';

function waitForImages(element: HTMLElement, timeout = 5000): Promise<void> {
  return new Promise((resolve) => {
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const checkComplete = () => {
      if (loadedCount === images.length) {
        resolve();
      }
    };

    const timer = setTimeout(() => resolve(), timeout);

    images.forEach((img) => {
      if (img.complete) {
        loadedCount++;
        checkComplete();
      } else {
        img.onload = () => {
          loadedCount++;
          checkComplete();
        };
        img.onerror = () => {
          loadedCount++;
          checkComplete();
        };
      }
    });
  });
}

export function useExport() {
  const exportPDF = useCallback(async () => {
    const pages = document.querySelectorAll('[data-a4-page]');
    if (!pages.length) return;

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [794, 1123],
    });

    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i] as HTMLElement;
      
      // Wait for images to load
      await waitForImages(pageElement, 3000);

      if (i > 0) pdf.addPage();

      try {
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          logging: false,
          imageTimeout: 0,
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    }

    pdf.save('schedule.pdf');
  }, []);

  const exportJPEG = useCallback(async () => {
    const pages = document.querySelectorAll('[data-a4-page]');
    if (!pages.length) return;

    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i] as HTMLElement;
      
      // Wait for images to load
      await waitForImages(pageElement, 3000);

      try {
        const canvas = await html2canvas(pageElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          logging: false,
          imageTimeout: 0,
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = `schedule-page-${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error exporting page:', error);
      }
    }
  }, []);

  return { exportPDF, exportJPEG };
}
