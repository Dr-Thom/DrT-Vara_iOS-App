// API Configuration
const getBackendURL = () => {
  // Try process.env first (for production builds)
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Fallback for development/preview
  return window.location.origin;
};

export const API_CONFIG = {
  BACKEND_URL: getBackendURL(),
  ENDPOINTS: {
    WAITLIST: '/api/waitlist',
    STATS: '/api/waitlist/stats',
    HEALTH: '/api/health'
  }
};

export default API_CONFIG;
