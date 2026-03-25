// js/config.js
(function() {
  const getAppRoot = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const knownFolders = ['user', 'admin', 'services', 'assets', 'js', 'styles'];
    // If the first part of the path isn't a known top-level folder, it's likely the app root
    if (parts.length > 0 && !knownFolders.includes(parts[0])) {
      return '/' + parts[0];
    }
    return '';
  };

  window.APP_CONFIG = {
    ROOT: getAppRoot(),
    get root() { return this.ROOT; }, // Alias for convenience
    get SERVICES() { return this.ROOT + '/services'; },
    get apiBase() { return this.SERVICES; } // Alias for backward compatibility
  };
  
  console.log('App Config initialized:', window.APP_CONFIG);
})();
