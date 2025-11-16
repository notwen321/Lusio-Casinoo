// Temporary placeholder - Backend API removed
// This file exists only to prevent build errors
// All game logic should use blockchain hooks instead

const axiosServices = {
  get: async (url: string, config?: any) => {
    console.warn('Backend API call attempted but backend is removed. Use blockchain hooks instead.');
    throw new Error('Backend API is no longer available. Please use ONE Chain blockchain.');
  },
  post: async (url: string, data?: any, config?: any) => {
    console.warn('Backend API call attempted but backend is removed. Use blockchain hooks instead.');
    throw new Error('Backend API is no longer available. Please use ONE Chain blockchain.');
  },
  put: async (url: string, data?: any, config?: any) => {
    console.warn('Backend API call attempted but backend is removed. Use blockchain hooks instead.');
    throw new Error('Backend API is no longer available. Please use ONE Chain blockchain.');
  },
  delete: async (url: string, config?: any) => {
    console.warn('Backend API call attempted but backend is removed. Use blockchain hooks instead.');
    throw new Error('Backend API is no longer available. Please use ONE Chain blockchain.');
  },
};

export default axiosServices;
