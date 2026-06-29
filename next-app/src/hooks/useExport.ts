"use client";

import { useCallback, useState } from "react";
import { useScheduleState } from "./useScheduleState";

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const title = useScheduleState((s) => s.title);

  const exportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const pages = document.querySelectorAll("[data-a4-page]");
      if (pages.length === 0) {
        alert("No pages to export");
        setExporting(false);
        return;
      }

      const isLandscape = scheduleType !== "daily";
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "px",
        format: "a4",
        hotfixes: ["px_scaling"],
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        const el = pages[i] as HTMLElement;

        try {
          // Wait a bit for rendering
          await new Promise((resolve) => setTimeout(resolve, 500));

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
            logging: false,
            width: el.offsetWidth,
            height: el.offsetHeight,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
        } catch (err) {
          console.error(`Page ${i + 1} error:`, err);
          alert(`Failed to export page ${i + 1}`);
          throw err;
        }
      }

      const filename = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  }, [scheduleType, title]);

  const exportJPEG = useCallback(async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;

      const pages = document.querySelectorAll("[data-a4-page]");
      if (pages.length === 0) {
        alert("No pages to export");
        setExporting(false);
        return;
      }

      for (let i = 0; i < pages.length; i++) {
        const el = pages[i] as HTMLElement;

        try {
          // Wait a bit for rendering
          await new Promise((resolve) => setTimeout(resolve, 500));

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
            logging: false,
            width: el.offsetWidth,
            height: el.offsetHeight,
          });

          const link = document.createElement("a");
          const filename = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}_page${i + 1}.png`;
          link.download = filename;
          link.href = canvas.toDataURL("image/png");
          link.click();

          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Page ${i + 1} error:`, err);
          alert(`Failed to export page ${i + 1}`);
          throw err;
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  }, [title]);

  return { exportPDF, exportJPEG, exporting };
}
