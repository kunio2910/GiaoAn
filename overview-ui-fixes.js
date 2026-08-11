(() => {
  const isSharePage = new URLSearchParams(window.location.search).has('share');

  function mergeOverviewHeader() {
    document.querySelectorAll('#screen-overview .goals-table').forEach((table) => {
      if (table.dataset.overviewHeaderFixed === 'true') return;
      const headerRows = table.tHead?.rows;
      if (!headerRows || headerRows.length < 2) return;
      const headerRow = headerRows[0];
      const periodRow = headerRows[1];
      if (headerRow.cells.length < 5 || periodRow.cells.length < 5) return;

      headerRow.cells[0].rowSpan = 2;
      headerRow.cells[1].rowSpan = 2;
      headerRow.cells[2].rowSpan = 2;
      headerRow.cells[headerRow.cells.length - 1].rowSpan = 2;
      periodRow.deleteCell(0);
      periodRow.deleteCell(0);
      periodRow.deleteCell(0);
      periodRow.deleteCell(periodRow.cells.length - 1);
      table.dataset.overviewHeaderFixed = 'true';
    });
  }

  function boot() {
    const overviewScreen = document.querySelector('#screen-overview');
    if (!overviewScreen) return;
    const observer = new MutationObserver(mergeOverviewHeader);
    observer.observe(overviewScreen, { childList: true, subtree: true });
    mergeOverviewHeader();
    if (!isSharePage && !overviewScreen.classList.contains('active')) {
      document.querySelector('[data-view="overview"]')?.click();
    }
    window.setTimeout(mergeOverviewHeader, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
