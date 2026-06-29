"use client";

import { useCallback, useState } from "react";
import { useScheduleState } from "./useScheduleState";

// Wait for all images to load in an element
async function waitForImages(element: HTMLElement, timeout = 5000): Promise<void> {
  const images = element.querySelectorAll("img");
  if (images.length === 0) return;

  const imagePromises = Array.from(images).map((img) => {
    return new Promise<void>((resolve) => {
      // If already loaded, resolve immediately
      if (img.complete && img.naturalHeight > 0) {
        resolve();
      } else {
        // Wait for load or error
        const onLoad = () => resolve();
        const onError = () => resolve(); // Even if error, continue
        img.addEventListener("load", onLoad, { once: true });
        img.addEventListener("error", onError, { once: true });

        // Timeout fallback
        setTimeout(() => resolve(), timeout);
      }
    });
  });

  await Promise.all(imagePromises);
}

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

        // ⬅️ FIX: Ensure element is visible during capture
        const originalDisplay = el.style.display;
        const originalVisibility = el.style.visibility;
        const originalOpacity = el.style.opacity;
        
        el.style.display = "block";
        el.style.visibility = "visible";
        el.style.opacity = "1";

        // Wait for images to load before capturing
        await waitForImages(el);
        // Small delay to ensure rendering
        await new Promise((resolve) => setTimeout(resolve, 200));

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
          allowTaint: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          width: el.offsetWidth,
          height: el.offsetHeight,
          onclone: (clonedDocument) => {
            // Ensure images are visible in cloned document
            const clonedImages = clonedDocument.querySelectorAll("img");
            clonedImages.forEach((img: any) => {
              img.style.display = "block";
              img.style.visibility = "visible";
            });
          },
        });

        // Restore visibility
        el.style.display = originalDisplay;
        el.style.visibility = originalVisibility;
        el.style.opacity = originalOpacity;

        // Restore transform
        if (parent) {
          parent.style.transform = originalTransform;
          parent.style.minWidth = originalMinWidth;
        }

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
      }

      pdf.save(`${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Export failed. Please try again.");
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

        // ⬅️ FIX: Ensure element is visible during capture
        const originalDisplay = el.style.display;
        const originalVisibility = el.style.visibility;
        const originalOpacity = el.style.opacity;
        
        el.style.display = "block";
        el.style.visibility = "visible";
        el.style.opacity = "1";

        // Wait for images to load before capturing
        await waitForImages(el);
        // Small delay to ensure rendering
        await new Promise((resolve) => setTimeout(resolve, 200));

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
          allowTaint: true,
          backgroundColor: "#FFFFFF",
          logging: false,
          width: el.offsetWidth,
          height: el.offsetHeight,
          onclone: (clonedDocument) => {
            // Ensure images are visible in cloned document
            const clonedImages = clonedDocument.querySelectorAll("img");
            clonedImages.forEach((img: any) => {
              img.style.display = "block";
              img.style.visibility = "visible";
            });
          },
        });

        // Restore visibility
        el.style.display = originalDisplay;
        el.style.visibility = originalVisibility;
        el.style.opacity = originalOpacity;

        // Restore transform
        if (parent) {
          parent.style.transform = originalTransform;
          parent.style.minWidth = originalMinWidth;
        }

        const link = document.createElement("a");
        link.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}_page${i + 1}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (error) {
      console.error("JPEG export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [title]);

  return { exportPDF, exportJPEG, exporting };
}
