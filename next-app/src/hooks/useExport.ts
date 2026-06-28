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
      if (pages.length === 0) return;

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
        // Remove any scale transform before capture
        const parent = el.parentElement;
        const originalTransform = parent?.style.transform || "";
        const originalMinWidth = parent?.style.minWidth || "";
        if (parent) {
          parent.style.transform = "none";
          parent.style.minWidth = "auto";
        }

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });

        // Restore
        if (parent) {
          parent.style.transform = originalTransform;
          parent.style.minWidth = originalMinWidth;
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      }

      pdf.save(`${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [scheduleType, title]);

  const exportJPEG = useCallback(async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;

      const pages = document.querySelectorAll("[data-a4-page]");
      if (pages.length === 0) return;

      for (let i = 0; i < pages.length; i++) {
        const el = pages[i] as HTMLElement;
        // Remove scale
        const parent = el.parentElement;
        const originalTransform = parent?.style.transform || "";
        const originalMinWidth = parent?.style.minWidth || "";
        if (parent) {
          parent.style.transform = "none";
          parent.style.minWidth = "auto";
        }

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });

        // Restore
        if (parent) {
          parent.style.transform = originalTransform;
          parent.style.minWidth = originalMinWidth;
        }

        const link = document.createElement("a");
        link.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}_page${i + 1}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } finally {
      setExporting(false);
    }
  }, [title]);

  return { exportPDF, exportJPEG, exporting };
}
