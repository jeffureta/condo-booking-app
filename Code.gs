/**
 * Google Apps Script Web App Entrypoint for Condominium Booking System.
 * Handles HTTP requests and renders modular HTML templates.
 */

/**
 * Serves the HTML frontend or returns availability as JSON if queried with ?action=getAvailableDates
 *
 * @param {Object} e - HTTP event object
 * @returns {HtmlOutput|TextOutput}
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'getAvailableDates') {
    const bookedRanges = getBookedRanges();
    return ContentService.createTextOutput(JSON.stringify(bookedRanges))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Serve the interactive web app HTML interface
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('Book 2-Bedroom Condominium')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Required for Google Sites iframe embedding
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/**
 * Helper function to include HTML subfiles (Styles, Scripts) into Index.html.
 * Standard Apps Script modular template pattern.
 *
 * @param {string} filename - Name of the HTML file without extension
 * @returns {string} Raw HTML content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
