import axios from 'axios';
import { getCookie } from 'cookies-next';

/**
 * Normalizes Strapi API response structures.
 * Strapi v5 returns flat objects ({ id, title, description, instructor: { ... } }),
 * whereas standard LMS frontend components expect the Strapi v4 nested structure ({ id, attributes: { title, instructor: { data: ... } } }).
 * This normalizer bridges both formats dynamically so all components receive both flat & attributes accessors without error.
 */
function normalizeStrapiData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeStrapiData);

  const res: any = { ...data };

  // If this is a Strapi entity (has id or documentId)
  if (res.id !== undefined || res.documentId !== undefined) {
    if (!res.attributes) {
      const attrs: any = {};
      for (const [k, v] of Object.entries(res)) {
        if (k !== 'id' && k !== 'documentId' && k !== 'attributes') {
          attrs[k] = normalizeStrapiData(v);
        }
      }
      res.attributes = attrs;
    }

    // Ensure relations on attributes are wrapped in { data: ... } for legacy compatibility
    for (const [k, v] of Object.entries(res.attributes)) {
      if (v && typeof v === 'object' && !(v as any).data && k !== 'attributes') {
        if (Array.isArray(v)) {
          res.attributes[k] = { data: v.map(normalizeStrapiData) };
        } else if ((v as any).id !== undefined || (v as any).documentId !== undefined || (v as any).username !== undefined || (v as any).name !== undefined) {
          res.attributes[k] = { data: normalizeStrapiData(v) };
        }
      }
    }
  }

  if (res.data !== undefined) {
    res.data = normalizeStrapiData(res.data);
  }

  return res;
}

// Resolve and normalize the API base URL to ensure /api is present
let rawBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api').trim();
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
if (!rawBaseUrl.endsWith('/api')) {
  rawBaseUrl += '/api';
}

if (typeof window !== 'undefined') {
  console.info('[LMSPrime API Client] Target Backend:', rawBaseUrl);
}

const apiClient = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * 1. Automatically injects the JWT into the Authorization header of every outbound request.
 * 2. Normalizes URL populate query parameters for Strapi v5 syntax.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('jwt');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Fix legacy Strapi v4 nested populate query strings for v5 compatibility
    if (config.url) {
      // Fix populate[course][populate]=instructor -> populate[course][populate][0]=instructor
      config.url = config.url.replace(
        /populate\[([^\]]+)\]\[populate\]=([^&]+)/g,
        'populate[$1][populate][0]=$2'
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 1. Automatically normalizes Strapi v5 flat payloads so attributes and data accessors work across all pages.
 * 2. Globally catches failed requests (e.g. 401 Unauthorized).
 */
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = normalizeStrapiData(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request - Token missing, expired, or invalid signature.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
