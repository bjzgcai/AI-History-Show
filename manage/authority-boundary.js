'use strict';

const LEGACY_WRITE_ROUTES = new Set([
  'POST /api/catalog',
  'POST /api/events',
  'POST /api/images/upload',
  'POST /api/images/download',
  'POST /api/events/init',
  'POST /api/generate',
  'POST /api/backups/restore',
]);

function isLegacyWriteRoute(method, url) {
  const pathname = String(url || '').split('?')[0];
  return LEGACY_WRITE_ROUTES.has(`${method} ${pathname}`);
}

module.exports = { LEGACY_WRITE_ROUTES, isLegacyWriteRoute };
