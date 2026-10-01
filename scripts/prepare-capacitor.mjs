// Legacy compatibility entry point.
// Keep one web build pipeline so Capacitor, Pages, and local packaging all consume
// the exact same modular production bundle.
await import('./build-web.mjs');
console.log('Prepared Capacitor web bundle in www/');
