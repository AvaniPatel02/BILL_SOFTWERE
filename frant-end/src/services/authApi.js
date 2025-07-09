const API_BASE_URL = 'http://localhost:8000/api';

export const authApi = {
  // Login API
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          access: data.access,
          refresh: data.refresh
        }
      };

    } catch (error) {
      console.error("Login API error:", error);
      return {
        success: false,
        error: error.message || 'Network error. Please try again.'
      };
    }
  },

  // Logout API (if needed)
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
        });

        if (response.ok) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          return { success: true };
        }
      }

      // Fallback: just clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { success: true };

    } catch (error) {
      console.error("Logout API error:", error);
      // Still clear local storage even if API call fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { success: true };
    }
  },

  // Refresh token API
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          refresh: refreshToken 
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      
      return {
        success: true,
        data: {
          access: data.access
        }
      };

    } catch (error) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const accessToken = localStorage.getItem('access_token');
    return !!accessToken;
  },

  // Get current access token
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  }
}; 