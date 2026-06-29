"use client";

import { useCallback, useState } from "react";
import { useScheduleState } from "./useScheduleState";

// Enhanced image loading wait with better debugging
async function waitForImages(element: HTMLElement, timeout = 10000): Promise<void> {
  const images = element.querySelectorAll("img");
  console.log(`[Export] Found ${images.length} images to load`);
  
  if (images.length === 0) return;

  const imagePromises = Array.from(images).map((img, idx) => {
    return new Promise<void>((resolve) => {
      // If already loaded, resolve immediately
      if (img.complete && img.naturalHeight > 0) {
        console.log(`[Export] Image ${idx} already loaded`);
        resolve();
        return;
      }

      // Check if image has src
      if (!img.src) {
        console.log(`[Export] Image ${idx} has no src, skipping`);
        resolve();
        return;
      }

      console.log(`[Export] Waiting for image ${idx}: ${img.src.substring(0, 50)}...`);

      let completed = false;
      const onLoad = () => {
        if (!completed) {
          completed = true;
          console.log(`[Export] Image ${idx} loaded successfully`);
          resolve();
        }
      };
      const onError = () => {
        if (!completed) {
          completed = true;
          console.warn(`[Export] Image ${idx} failed to load, continuing anyway`);
          resolve();
        }
      };

      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onError, { once: true });

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.warn(`[Export] Image ${idx} timeout (${timeout}ms), continuing`);
          resolve();
        }
      }, timeout);

      // Cleanup if loads before timeout
      img.addEventListener("load", () => clearTimeout(timeoutId), { once: true });
      img.addEventListener("error", () => clearTimeout(timeoutId), { once: true });
    });
  });

  await Promise.all(imagePromises);
  console.log(`[Export] All images loaded or timed out`);
}

export function useExport() {
  const [exporting, setExporting] = useState(false);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const title = useScheduleState((s) => s.title);

  const exportPDF = useCallback(async () => {
    console.log("[Export] Starting PDF export...");
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const pages = document.querySelectorAll("[data-a4-page]");
      console.log(`[Export] Found ${pages.length} pages to export`);
      
      if (pages.length === 0) {
        alert("No pages to export");
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
        console.log(`[Export] Processing page ${i + 1}/${pages.length}`);
        
        if (i > 0) pdf.addPage();

        const el = pages[i] as HTMLElement;

        try {
          // Wait for images to load before capturing
          await waitForImages(el);
          
          // Extra delay to ensure rendering is complete
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Remove any scale transform before capture
          const parent = el.parentElement;
          const originalTransform = parent?.style.transform || "";
          const originalMinWidth = parent?.style.minWidth || "";
          const originalOpacity = parent?.style.opacity || "";
          
          if (parent) {
            parent.style.transform = "none";
            parent.style.minWidth = "auto";
            parent.style.opacity = "1";
          }

          console.log(`[Export] Capturing page ${i + 1} with html2canvas...`);
          
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
            logging: true,
            width: el.offsetWidth,
            height: el.offsetHeight,
            foreignObjectRendering: true,
            onclone: (clonedDocument) => {
              // Ensure all images are visible in cloned document
              const clonedImages = clonedDocument.querySelectorAll("img");
              clonedImages.forEach((img: any, idx: number) => {
                img.style.display = "block";
                img.style.visibility = "visible";
                img.style.opacity = "1";
                console.log(`[Export] Cloned image ${idx} visibility set`);
              });
            },
          });

          // Restore original styles
          if (parent) {
            parent.style.transform = originalTransform;
            parent.style.minWidth = originalMinWidth;
            parent.style.opacity = originalOpacity;
          }

          console.log(`[Export] Adding page ${i + 1} to PDF`);
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
        } catch (pageError) {
          console.error(`[Export] Error processing page ${i + 1}:`, pageError);
          alert(`Failed to export page ${i + 1}`);
          throw pageError;
        }
      }

      const filename = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}.pdf`;
      console.log(`[Export] Saving PDF as ${filename}`);
      pdf.save(filename);
      console.log("[Export] PDF export complete!");
      
    } catch (error) {
      console.error("[Export] PDF export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setExporting(false);
    }
  }, [scheduleType, title]);

  const exportJPEG = useCallback(async () => {
    console.log("[Export] Starting JPEG export...");
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;

      const pages = document.querySelectorAll("[data-a4-page]");
      console.log(`[Export] Found ${pages.length} pages to export as JPEG`);
      
      if (pages.length === 0) {
        alert("No pages to export");
        return;
      }

      for (let i = 0; i < pages.length; i++) {
        console.log(`[Export] Processing JPEG page ${i + 1}/${pages.length}`);
        
        const el = pages[i] as HTMLElement;

        try {
          // Wait for images to load before capturing
          await waitForImages(el);
          
          // Extra delay to ensure rendering is complete
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Remove scale
          const parent = el.parentElement;
          const originalTransform = parent?.style.transform || "";
          const originalMinWidth = parent?.style.minWidth || "";
          const originalOpacity = parent?.style.opacity || "";
          
          if (parent) {
            parent.style.transform = "none";
            parent.style.minWidth = "auto";
            parent.style.opacity = "1";
          }

          console.log(`[Export] Capturing JPEG page ${i + 1} with html2canvas...`);
          
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#FFFFFF",
            logging: true,
            width: el.offsetWidth,
            height: el.offsetHeight,
            foreignObjectRendering: true,
            onclone: (clonedDocument) => {
              // Ensure all images are visible in cloned document
              const clonedImages = clonedDocument.querySelectorAll("img");
              clonedImages.forEach((img: any, idx: number) => {
                img.style.display = "block";
                img.style.visibility = "visible";
                img.style.opacity = "1";
                console.log(`[Export] Cloned JPEG image ${idx} visibility set`);
              });
            },
          });

          // Restore original styles
          if (parent) {
            parent.style.transform = originalTransform;
            parent.style.minWidth = originalMinWidth;
            parent.style.opacity = originalOpacity;
          }

          const link = document.createElement("a");
          const filename = `${title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "schedule"}_page${i + 1}.png`;
          link.download = filename;
          link.href = canvas.toDataURL("image/png");
          
          console.log(`[Export] Downloading ${filename}`);
          link.click();
          
          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (pageError) {
          console.error(`[Export] Error processing JPEG page ${i + 1}:`, pageError);
          alert(`Failed to export page ${i + 1}`);
          throw pageError;
        }
      }
      
      console.log("[Export] JPEG export complete!");
    } catch (error) {
      console.error("[Export] JPEG export failed:", error);
      alert(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setExporting(false);
    }
  }, [title]);

  return { exportPDF, exportJPEG, exporting };
}
