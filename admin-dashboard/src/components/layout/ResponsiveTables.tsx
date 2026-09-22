"use client";

import { useEffect } from "react";

/**
 * Makes every <table> in the admin console usable on small screens.
 *
 * Tables here are authored as plain <table> markup across ~18 pages, each with
 * its own column set. Rather than hand-editing every page, this walks the DOM
 * and annotates tables so a single set of CSS rules in globals.css can turn
 * each row into a stacked card on phones:
 *
 *   - `data-responsive-table` on the <table>  -> gives the global CSS enough
 *     specificity to win over the per-page CSS-module classes (.td/.th), which
 *     would otherwise outrank plain element selectors.
 *   - `data-label="<column header>"` on each <td> -> rendered by CSS as the
 *     field label beside the value once the row is stacked.
 *
 * Tables re-render whenever data loads or a filter changes, which replaces the
 * DOM nodes and drops these attributes, so a MutationObserver re-applies them.
 * The observer watches childList/subtree only (never attributes), so our own
 * setAttribute calls cannot retrigger it — no feedback loop.
 */
export default function ResponsiveTables() {
  useEffect(() => {
    const annotate = () => {
      document.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
        const headers = Array.from(table.querySelectorAll("thead th")).map(
          (th) => (th.textContent || "").trim()
        );
        // A table with no <thead> has no labels to copy; stacking it would
        // produce unlabelled values, so leave it as a normal table.
        if (headers.length === 0) return;

        table.setAttribute("data-responsive-table", "");

        table.querySelectorAll("tbody tr").forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            // Spanning cells are empty/loading/"no results" rows — they do not
            // correspond to a single column, so labelling them would be wrong.
            const span = Number(cell.getAttribute("colspan") || "1");
            if (span > 1) return;

            const label = headers[index];
            if (!label) return;
            if (cell.getAttribute("data-label") === label) return;
            cell.setAttribute("data-label", label);
          });
        });
      });
    };

    annotate();

    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(annotate);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return null;
}
