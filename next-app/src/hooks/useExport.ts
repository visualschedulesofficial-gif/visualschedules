"use client";

import { useCallback, useState } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";

// Load scripts dynamically
function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already on the page?
    const already = document.querySelector(`script[src="${src}"]`);
    if (already) {
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
    // html2canvas-pro is a drop-in fork that understands modern Tailwind v4
    // colors (oklch/oklab). The original html2canvas 1.4.1 crashes on them.
    await loadExternalScript("https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.11/dist/html2canvas-pro.min.js");
  }
  if (typeof (window as any).jspdf === "undefined") {
    await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }
  // Verify the tools actually loaded — if blocked (offline, ad-blocker,
  // strict content policy) the script tag resolves but the global is missing.
  if (typeof (window as any).html2canvas === "undefined" || !(window as any).jspdf?.jsPDF) {
    throw new Error("LIBS_FAILED");
  }
}

// Make sure the actual webfonts (Playwrite title font + Atkinson card font)
// are fully loaded before html2canvas takes its picture. Without this, the
// browser may still be showing a fallback font at capture time.
async function ensureFontsLoaded() {
  try {
    const f: any = (document as any).fonts;
    if (!f) return;
    await Promise.allSettled([
      f.load('400 30px "Playwrite DE Grund"'),
      f.load('400 18px "Playwrite DE Grund"'),
      f.load('400 18px "Atkinson Hyperlegible"'),
      f.load('700 18px "Atkinson Hyperlegible"'),
    ]);
    await f.ready;
  } catch {
    // If the Font Loading API is unavailable, capture proceeds anyway
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

// Find the schedule pages currently rendered on screen.
function getPageElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll("[data-a4-page]")) as HTMLElement[];
}

// Translate any internal error into a clear, plain-English message.
function friendlyMessage(err: unknown, kind: "PDF" | "images"): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "NO_PAGES" || msg === "No pages to export") {
    return "There's nothing to export yet. Add at least one card to your schedule, then try again.";
  }
  if (msg === "NOT_VISIBLE") {
    return "The schedule isn't on screen right now. Please make sure your schedule is showing, then try again.";
  }
  if (msg === "LIBS_FAILED" || msg.startsWith("Failed to load")) {
    return `Couldn't load the ${kind} tool. This usually means no internet connection, or a browser extension/ad-blocker is blocking it. Check your connection, disable blockers for this site, and try again.`;
  }
  if (msg.toLowerCase().includes("tainted") || msg.toLowerCase().includes("cors") || msg.toLowerCase().includes("security")) {
    return `Couldn't include one of the card images in the ${kind}. An image may not be loading correctly. Try refreshing the page and exporting again.`;
  }
  return `Something went wrong creating the ${kind}. Please refresh the page and try again. (Details: ${msg})`;
}

async function buildPdfBlob(scheduleType: string) {
  const pages = getPageElements();
  if (!pages.length) throw new Error("NOT_VISIBLE");

  const isLandscape = scheduleType === "weekly" || scheduleType === "custom";
  const orientation = isLandscape ? "landscape" : "portrait";
  const pageWidthMM = isLandscape ? 297 : 210;
  const pageHeightMM = isLandscape ? 210 : 297;

  await ensureLibraries();
  await ensureFontsLoaded();
  const { jsPDF } = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement;
    const prevTransform = pageEl.style.transform;
    const prevMargin = pageEl.style.margin;
    pageEl.style.transform = "none";
    pageEl.style.margin = "0";

    // Wait for all images on this page to load
    const imgs = pageEl.querySelectorAll("img") as NodeListOf<HTMLImageElement>;
    await Promise.allSettled(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = img.src;
            }
          })
      )
    );

    // Small delay to ensure images are rendered
    await new Promise((r) => setTimeout(r, 300));

    const captureState = prepPageForCapture(pageEl);
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: "#FFFFFF",
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowTimeout: 20000,
      onclone: (_doc: Document) => {
        // Apply export styles only to the CLONE — real canvas is never touched,
        // so there is no flicker on the live page.
        // SAFETY NET: copy every style rule the live page has in memory
        // straight into the clone as plain text. Without this, the clone
        // re-downloads CSS files from the server — and right after a deploy
        // those old files are gone (404), producing a completely unstyled
        // export. This makes the capture independent of the network.
        let liveCss = "";
        try {
          for (const sheet of Array.from(document.styleSheets)) {
            try {
              for (const rule of Array.from((sheet as CSSStyleSheet).cssRules)) {
                liveCss += rule.cssText + "\n";
              }
            } catch {
              // Cross-origin stylesheet (e.g. Google Fonts) — skip; fonts are
              // already loaded in the main document and remain usable.
            }
          }
        } catch {}
        const baseStyles = _doc.createElement("style");
        baseStyles.textContent = liveCss;
        _doc.head.appendChild(baseStyles);

        const s = _doc.createElement("style");
        s.textContent = [
          // Keep the real title font in the export; Georgia is only a fallback
          ".font-serif{font-family:'Playwrite DE Grund',Georgia,serif!important}",
          // Card/label font, pinned so the clone can't fall back to a system font
          ".font-sans{font-family:'Atkinson Hyperlegible',system-ui,sans-serif!important}",
          // Resolve CSS variable borders to hex so they aren't black
          "*{--weekly-border:#C5D2B8!important;--color-weekly-border:#C5D2B8!important}",
          // Pin card borders: exports were falling back to the default border
          // color (text ink = near-black). Force the light green from the
          // canvas, 1px solid, on every element that asks for it.
          '[class*="border-[#C7D7B8]"]{border-color:#C7D7B8!important;border-style:solid!important;border-width:1px!important}',
          '[class*="border-[#C5D2B8]"]{border-color:#C5D2B8!important;border-style:solid!important}',
          '[class*="border-[#F0F0F0]"]{border-top-color:#F0F0F0!important}',
          '[class*="border-b-[#C5D2B8]"]{border-bottom-color:#C5D2B8!important}',
          '[class*="border-r-[#C5D2B8]"]{border-right-color:#C5D2B8!important}',
          '[class*="bg-[#E8EDE0]"]{background-color:#E8EDE0!important}',
          '[class*="bg-[#FAFBF7]"]{background-color:#FAFBF7!important}',
          '[class*="bg-[#EFF2E8]"]{background-color:#EFF2E8!important}',
          '[class*="text-[#5A8A3C]"]{color:#5A8A3C!important}',
          '[class*="text-[#4A5A3E]"]{color:#4A5A3E!important}',
          '[class*="text-[#7A8F5E]"] , [class*="text-[#7A8F5E]"] *{color:#7A8F5E!important}',
          '[class*="text-[#2C2C2C]"]{color:#2C2C2C!important}',
          '[class*="stroke-[#8A9B74]"]{stroke:#8A9B74!important}',
        ].join("");
        _doc.head.appendChild(s);
      },
      ignoreElements: (el: any) => {
        // SVG elements store className as an object (SVGAnimatedString), not a
        // string, so read it safely to avoid "includes is not a function".
        const raw = el.className;
        const cn = typeof raw === "string" ? raw : raw && typeof raw.baseVal === "string" ? raw.baseVal : "";
        return cn.includes("slot-rm") || cn.includes("remove") || cn.includes("dz-hint");
      },
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
  const pages = getPageElements();
  if (!pages.length) throw new Error("NOT_VISIBLE");

  await ensureLibraries();
  await ensureFontsLoaded();
  const html2canvas = (window as any).html2canvas;

  const blobs: Array<{ blob: Blob; index: number }> = [];

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement;
    const prevTransform = pageEl.style.transform;
    const prevMargin = pageEl.style.margin;
    pageEl.style.transform = "none";
    pageEl.style.margin = "0";

    const imgs = pageEl.querySelectorAll("img") as NodeListOf<HTMLImageElement>;
    await Promise.allSettled(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = img.src;
            }
          })
      )
    );

    await new Promise((r) => setTimeout(r, 300));

    const captureState = prepPageForCapture(pageEl);
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: "#FFFFFF",
      useCORS: true,
      allowTaint: false,
      logging: false,
      windowTimeout: 20000,
      onclone: (_doc: Document) => {
        // Apply export styles only to the CLONE — real canvas is never touched,
        // so there is no flicker on the live page.
        // SAFETY NET: copy every style rule the live page has in memory
        // straight into the clone as plain text. Without this, the clone
        // re-downloads CSS files from the server — and right after a deploy
        // those old files are gone (404), producing a completely unstyled
        // export. This makes the capture independent of the network.
        let liveCss = "";
        try {
          for (const sheet of Array.from(document.styleSheets)) {
            try {
              for (const rule of Array.from((sheet as CSSStyleSheet).cssRules)) {
                liveCss += rule.cssText + "\n";
              }
            } catch {
              // Cross-origin stylesheet (e.g. Google Fonts) — skip; fonts are
              // already loaded in the main document and remain usable.
            }
          }
        } catch {}
        const baseStyles = _doc.createElement("style");
        baseStyles.textContent = liveCss;
        _doc.head.appendChild(baseStyles);

        const s = _doc.createElement("style");
        s.textContent = [
          // Keep the real title font in the export; Georgia is only a fallback
          ".font-serif{font-family:'Playwrite DE Grund',Georgia,serif!important}",
          // Card/label font, pinned so the clone can't fall back to a system font
          ".font-sans{font-family:'Atkinson Hyperlegible',system-ui,sans-serif!important}",
          // Resolve CSS variable borders to hex so they aren't black
          "*{--weekly-border:#C5D2B8!important;--color-weekly-border:#C5D2B8!important}",
          // Pin card borders: exports were falling back to the default border
          // color (text ink = near-black). Force the light green from the
          // canvas, 1px solid, on every element that asks for it.
          '[class*="border-[#C7D7B8]"]{border-color:#C7D7B8!important;border-style:solid!important;border-width:1px!important}',
          '[class*="border-[#C5D2B8]"]{border-color:#C5D2B8!important;border-style:solid!important}',
          '[class*="border-[#F0F0F0]"]{border-top-color:#F0F0F0!important}',
          '[class*="border-b-[#C5D2B8]"]{border-bottom-color:#C5D2B8!important}',
          '[class*="border-r-[#C5D2B8]"]{border-right-color:#C5D2B8!important}',
          '[class*="bg-[#E8EDE0]"]{background-color:#E8EDE0!important}',
          '[class*="bg-[#FAFBF7]"]{background-color:#FAFBF7!important}',
          '[class*="bg-[#EFF2E8]"]{background-color:#EFF2E8!important}',
          '[class*="text-[#5A8A3C]"]{color:#5A8A3C!important}',
          '[class*="text-[#4A5A3E]"]{color:#4A5A3E!important}',
          '[class*="text-[#7A8F5E]"] , [class*="text-[#7A8F5E]"] *{color:#7A8F5E!important}',
          '[class*="text-[#2C2C2C]"]{color:#2C2C2C!important}',
          '[class*="stroke-[#8A9B74]"]{stroke:#8A9B74!important}',
        ].join("");
        _doc.head.appendChild(s);
      },
      ignoreElements: (el: any) => {
        // SVG elements store className as an object (SVGAnimatedString), not a
        // string, so read it safely to avoid "includes is not a function".
        const raw = el.className;
        const cn = typeof raw === "string" ? raw : raw && typeof raw.baseVal === "string" ? raw.baseVal : "";
        return cn.includes("slot-rm") || cn.includes("remove") || cn.includes("dz-hint");
      },
    });
    restorePageAfterCapture(captureState);

    pageEl.style.transform = prevTransform;
    pageEl.style.margin = prevMargin;

    const blob = await new Promise<Blob>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    blobs.push({ blob, index: i });

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
  const scheduleId = useScheduleState((s) => s.id);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Save schedule to DB — silently, never blocks or errors the export
  const saveToDatabase = async () => {
    try {
      const state = useScheduleState.getState();
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.id,
          title: state.title,
          scheduleType: state.scheduleType,
          language: state.language,
          gender: state.gender,
          gridCols: state.gridCols,
          customColNames: state.customColNames,
          weekMode: state.weekMode,
          cardStyle: state.cardStyle,
          data: { pages: state.pages },
        }),
      });
      if (res.ok) {
        setLastSaved(new Date());
        state.markClean?.();
      }
    } catch {
      // Save failure never interrupts the export
    }
  };

  const showStatus = useCallback((text: string) => {
    setExportStatus(text);
  }, []);

  const hideStatus = useCallback(() => {
    setExportStatus("");
  }, []);

  const exportPDF = useCallback(async () => {
    if (!pages.length) {
      alert("There's nothing to export yet. Add at least one card to your schedule, then try again.");
      return;
    }

    // On phones a silent download is confusing — open a tab now (while we
    // still have the user's tap) and show the PDF in it when ready.
    const isPhone =
      typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    let previewTab: Window | null = null;
    if (isPhone) {
      previewTab = window.open("", "_blank");
      if (previewTab) {
        previewTab.document.write(
          '<title>Preparing your PDF…</title><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#4A5A3E;background:#F5F3EC">Preparing your PDF…</body>'
        );
      }
    }

    setExporting(true);
    useScheduleState.getState().setExporting(true);
    showStatus("Preparing your PDF…");

    const hideStyle = injectExportHideStyle();
    try {
      const blob = (await buildPdfBlob(scheduleType)) as Blob;
      const fileName = getExportFileBaseName(title) + ".pdf";
      if (previewTab) {
        const url = URL.createObjectURL(blob);
        previewTab.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 120000);
      } else {
        downloadBlob(blob, fileName);
      }
      // Save to database after successful export (silently)
      showStatus("Saving…");
      await saveToDatabase();
    } catch (err) {
      console.error("PDF export error:", err);
      alert(friendlyMessage(err, "PDF"));
    } finally {
      hideStyle.remove();
      setExporting(false);
      useScheduleState.getState().setExporting(false);
      hideStatus();
    }
  }, [pages, scheduleType, title, showStatus, hideStatus, saveToDatabase]);

  const exportJPEG = useCallback(async () => {
    if (!pages.length) {
      alert("There's nothing to export yet. Add at least one card to your schedule, then try again.");
      return;
    }

    setExporting(true);
    useScheduleState.getState().setExporting(true);
    showStatus("Preparing your images…");

    const hideStyle = injectExportHideStyle();
    try {
      const baseName = getExportFileBaseName(title);
      const blobs = await buildJpegBlobs(scheduleType);

      for (let i = 0; i < blobs.length; i++) {
        const { blob, index } = blobs[i];
        const fname = pages.length > 1 ? `${baseName}-page-${index + 1}.jpg` : `${baseName}.jpg`;
        downloadBlob(blob, fname);
        if (i < blobs.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      // Save to database after successful export (silently)
      showStatus("Saving…");
      await saveToDatabase();
    } catch (err) {
      console.error("JPEG export error:", err);
      alert(friendlyMessage(err, "images"));
    } finally {
      hideStyle.remove();
      setExporting(false);
      useScheduleState.getState().setExporting(false);
      hideStatus();
    }
  }, [pages, scheduleType, title, showStatus, hideStatus, saveToDatabase]);

  return {
    exportPDF,
    exportJPEG,
    exporting,
    exportStatus,
    lastSaved,
  };
}
