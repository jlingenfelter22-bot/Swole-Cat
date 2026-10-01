// Swole Cat application boundary registry.
// Existing v0.55 behavior remains global for compatibility while new infrastructure
// can register isolated services (sync, sharing, identity, network) without coupling
// those systems directly to workout-domain code.
const SwoleCatRuntime = window.SwoleCatRuntime = window.SwoleCatRuntime || {
  services: Object.create(null),
  events: new EventTarget(),
  registerService(name, service){
    if(!name)throw new Error('Service name is required');
    this.services[name]=service;
    this.events.dispatchEvent(new CustomEvent('service:registered',{detail:{name}}));
    return service;
  },
  getService(name){return this.services[name]||null}
};

const swoleCatStorage = SwoleCatRuntime.registerService('storage',{
  getItem(key){return window.localStorage.getItem(key)},
  setItem(key,value){return window.localStorage.setItem(key,value)},
  removeItem(key){return window.localStorage.removeItem(key)}
});
