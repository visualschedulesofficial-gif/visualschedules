"use client";

import { useCallback, useState } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";

// Load scripts dynamically
function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)[src]) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureLibraries() {
  if (typeof (window as any).html2canvas === "undefined") {
    await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  }
  if (typeof (window as any).jspdf === "undefined") {
    await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
}

// Hide editing-only affordances (remove buttons, drop hints) so exports look like a finished schedule
function injectExportHideStyle() {
  const style = document.createElement("style");
  style.id = "export-hide-style";
  style.textContent = ".slot-rm,.weekly-card-rm,.dz-hint,.weekly-drop-hint,.weekly-mini-drop,.ft-drop-hint,.ft-card-rm,.card-remove-btn,.slot-remove-icon{display:none!important}";
  document.head.appendChild(style);
  return style;
}

// html2canvas doesn't respect CSS object-fit on <img> — it stretches the
// image to fill its box. Work around this by temporarily replacing
// object-fit with explicit width/height that reproduce the same
// letterboxed/contain look, which html2canvas renders correctly.
function lockImageSizesForCapture(pageEl: HTMLElement) {
  const overrides: Array<{ el: HTMLImageElement; prev: string | null }> = [];
  pageEl.querySelectorAll("img").forEach((img) => {
    const parent = img.parentElement;
    if (!parent) return;
    const pw = parent.clientWidth;
    const ph = parent.clientHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!pw || !ph || !iw || !ih) return;
    const scale = Math.min(pw / iw, ph / ih);
    const w = Math.round(iw * scale);
    const h = Math.round(ih * scale);
    overrides.push({ el: img, prev: img.getAttribute("style") });
    img.style.width = w + "px";
    img.style.height = h + "px";
    img.style.maxWidth = "none";
    img.style.maxHeight = "none";
    img.style.objectFit = "";
    img.style.display = "block";
    img.style.margin = "auto";
  });
  return overrides;
}

function restoreImageSizes(overrides: Array<{ el: HTMLImageElement; prev: string | null }>) {
  overrides.forEach(({ el, prev }) => {
    if (prev) el.setAttribute("style", prev);
    else el.removeAttribute("style");
  });
}

// html2canvas also can't reliably render the text VALUE of <input> elements
// Swap each one for a plain text div with the same class
function swapColumnInputsForCapture(pageEl: HTMLElement) {
  const swaps: Array<{ input: HTMLInputElement; div: HTMLDivElement }> = [];
  pageEl.querySelectorAll("input.custom-col-input, input.ft-col-input, .col-name-input").forEach((input) => {
    const inputEl = input as HTMLInputElement;
    const div = document.createElement("div");
    div.className = inputEl.className;
    div.textContent = inputEl.value;
    inputEl.style.display = "none";
    inputEl.insertAdjacentElement("afterend", div);
    swaps.push({ input: inputEl, div });
  });
  return swaps;
}

function restoreColumnInputs(swaps: Array<{ input: HTMLInputElement; div: HTMLDivElement }>) {
  swaps.forEach(({ input, div }) => {
    div.remove();
    input.style.display = "";
  });
}

function prepPageForCapture(pageEl: HTMLElement) {
  return {
    imgOverrides: lockImageSizesForCapture(pageEl),
    inputSwaps: swapColumnInputsForCapture(pageEl),
  };
}

function restorePageAfterCapture(state: ReturnType<typeof prepPageForCapture>) {
  restoreImageSizes(state.imgOverrides);
  restoreColumnInputs(state.inputSwaps);
}

function getExportFileBaseName(title: string) {
  const titleVal = (title || "schedule").trim();
  return titleVal.replace(/[^a-z0-9]+/gi, "-").toLowerCase().replace(/^-+|-+$/g, "") || "schedule";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function buildPdfBlob(scheduleType: string) {
  const pages = Array.from(document.querySelectorAll('[data-a4-page]'));
  if (!pages.length) throw new Error("No pages to export");

  const isLandscape = scheduleType === "weekly" || scheduleType === "custom" || scheduleType === "firstthen";
  const orientation = isLandscape ? "landscape" : "portrait";
  const pageWidthMM = isLandscape ? 297 : 210;
  const pageHeightMM = isLandscape ? 210 : 297;

  await ensureLibraries();
  const { jsPDF } = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement;
    const prevTransform = pageEl.style.transform;
    const prevMargin = pageEl.style.margin;
    pageEl.style.transform = "none";
    pageEl.style.margin = "0";

    const captureState = prepPageForCapture(pageEl);
    const canvas = await html2canvas(pageEl, { 
      scale: 2, 
      backgroundColor: "#FFFFFF", 
      useCORS: false,
      allowTaint: true,
      logging: false,
      windowTimeout: 10000
    });
    restorePageAfterCapture(captureState);

    pageEl.style.transform = prevTransform;
    pageEl.style.margin = prevMargin;

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage("a4", orientation);
    pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMM, pageHeightMM);
  }

  return pdf.output("blob");
}

async function buildJpegBlobs(scheduleType: string) {
  const pages = Array.from(document.querySelectorAll('[data-a4-page]'));
  if (!pages.length) throw new Error("No pages to export");

  await ensureLibraries();
  const html2canvas = (window as any).html2canvas;

  const blobs: Array<{ blob: Blob; index: number }> = [];

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement;
    const prevTransform = pageEl.style.transform;
    const prevMargin = pageEl.style.margin;
    pageEl.style.transform = "none";
    pageEl.style.margin = "0";

    const captureState = prepPageForCapture(pageEl);
    const canvas = await html2canvas(pageEl, { 
      scale: 2, 
      backgroundColor: "#FFFFFF", 
      useCORS: false,
      allowTaint: true,
      logging: false,
      windowTimeout: 10000
    });
    restorePageAfterCapture(captureState);

    pageEl.style.transform = prevTransform;
    pageEl.style.margin = prevMargin;

    const blob = await new Promise<Blob>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    blobs.push({ blob, index: i });

    // Pause between pages to avoid browser treating rapid downloads as pop-up spam
    if (i < pages.length - 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return blobs;
}

export function useExport() {
  const title = useScheduleState((s) => s.title);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const pages = useScheduleState((s) => s.pages);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  const showStatus = useCallback((text: string) => {
    setExportStatus(text);
  }, []);

  const hideStatus = useCallback(() => {
    setExportStatus("");
  }, []);

  const exportPDF = useCallback(async () => {
    if (!pages.length) {
      alert("No pages to export.");
      return;
    }

    setExporting(true);
    showStatus("Preparing your PDF…");

    try {
      const hideStyle = injectExportHideStyle();
      try {
        const blob = (await buildPdfBlob(scheduleType)) as Blob;
        const fileName = getExportFileBaseName(title) + ".pdf";
        downloadBlob(blob, fileName);
      } finally {
        hideStyle.remove();
      }
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Something went wrong creating the PDF. Please try again.");
    } finally {
      setExporting(false);
      hideStatus();
    }
  }, [pages, scheduleType, title, showStatus, hideStatus]);

  const exportJPEG = useCallback(async () => {
    if (!pages.length) {
      alert("No pages to export.");
      return;
    }

    setExporting(true);
    showStatus("Preparing your images…");

    try {
      const hideStyle = injectExportHideStyle();
      try {
        const baseName = getExportFileBaseName(title);
        const blobs = await buildJpegBlobs(scheduleType);

        for (let i = 0; i < blobs.length; i++) {
          const { blob, index } = blobs[i];
          const fname = pages.length > 1 ? `${baseName}-page-${index + 1}.jpg` : `${baseName}.jpg`;
          downloadBlob(blob, fname);
          // Pause between downloads
          if (i < blobs.length - 1) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      } finally {
        hideStyle.remove();
      }
    } catch (err) {
      console.error("JPEG export error:", err);
      alert("Something went wrong creating the images. Please try again.");
    } finally {
      setExporting(false);
      hideStatus();
    }
  }, [pages, scheduleType, title, showStatus, hideStatus]);

  return {
    exportPDF,
    exportJPEG,
    exporting,
    exportStatus,
  };
}
