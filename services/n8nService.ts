/**
 * N8N Automation Service
 * Handles communication with n8n automation platform
 * 
 * Features:
 * - Fetch all workflows
 * - Execute workflows
 * - Get workflow execution history
 * - Check n8n server health
 */

import axios, { AxiosInstance } from 'axios';

// N8N Configuration (from environment variables)
const N8N_BASE_URL = import.meta.env.VITE_N8N_URL || 'https://n8n.samyar.at';
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';

// Types
export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  connections: any;
  settings?: {
    errorWorkflow?: string;
    saveExecutionProgress?: boolean;
    saveManualExecutions?: boolean;
    saveDataErrorExecution?: string;
    saveDataSuccessExecution?: string;
    executionTimeout?: number;
  };
}

export interface N8NExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowData: {
    name: string;
  };
  data: {
    resultData: {
      runData: any;
      error?: any;
    };
  };
}

export interface N8NServerHealth {
  status: 'healthy' | 'unhealthy';
  version?: string;
  latency?: number;
}

class N8NService {
  private api: AxiosInstance;
  private lastRequestTime = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private readonly RATE_LIMIT = {
    minRequestInterval: 2000, // 2 seconds between requests to avoid 429
    maxRetries: 3,
    retryDelay: 3000, // 3 seconds for retry
  };

  constructor() {
    this.api = axios.create({
      baseURL: `${N8N_BASE_URL}`,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000, // Increased timeout
    });
    
    // Add response interceptor for rate limiting and retry
    this.api.interceptors.response.use(
      (response) => {
        // Update last request time on successful response
        this.lastRequestTime = Date.now();
        return response;
      },
      async (error) => {
        const { config, response } = error;
        
        // Handle 429 Too Many Requests
        if (response && response.status === 429) {
          console.warn('Rate limited by N8N server, backing off...');
          
          // Calculate retry delay with exponential backoff
          const retryDelay = this.RATE_LIMIT.retryDelay * 2;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Retry the request
          return this.api(config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if n8n server is reachable and healthy
   */
  async checkHealth(): Promise<N8NServerHealth> {
    return this.executeWithRetry(async () => {
      const startTime = Date.now();
      const response = await this.api.get('/healthz');
      const latency = Date.now() - startTime;

      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        latency,
      };
    });
  }

  /**
   * Fetch all workflows from n8n
   */
  async getWorkflows(): Promise<N8NWorkflow[]> {
    return this.executeWithRetry(async () => {
      const response = await this.api.get('/api/v1/workflows');
      return response.data.data || [];
    });
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string, data?: any): Promise<N8NExecution> {
    return this.executeWithRetry(async () => {
      const response = await this.api.post(`/api/v1/workflows/${workflowId}/execute`, {
        data: data || {},
      });
      return response.data;
    });
  }

  /**
   * Get execution history for a workflow
   */
  async getExecutions(workflowId?: string, limit: number = 10): Promise<N8NExecution[]> {
    return this.executeWithRetry(async () => {
      const params: any = { limit };
      if (workflowId) {
        params.workflowId = workflowId;
      }

      const response = await this.api.get('/api/v1/executions', { params });
      return response.data.data || [];
    });
  }
  /**
   * Execute request with rate limiting and retry logic
   */
  private async executeWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Rate limiting check
    if (timeSinceLastRequest < this.RATE_LIMIT.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.RATE_LIMIT.minRequestInterval - timeSinceLastRequest)
      );
    }

    let retryCount = 0;
    
    while (retryCount < this.RATE_LIMIT.maxRetries) {
      try {
        const result = await requestFn();
        this.lastRequestTime = Date.now();
        return result;
      } catch (error: any) {
        retryCount++;
        console.error(`Request failed (attempt ${retryCount}/${this.RATE_LIMIT.maxRetries}):`, error);
        
        if (retryCount >= this.RATE_LIMIT.maxRetries) {
          throw new Error(error.response?.data?.message || 'Request failed after maximum retries');
        }
        
        // Exponential backoff for retries
        await new Promise(resolve =>
          setTimeout(resolve, this.RATE_LIMIT.retryDelay * Math.pow(2, retryCount - 1))
        );
      }
    }
    
    throw new Error('Request failed after all retries');
  }

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflow> {
    return this.executeWithRetry(async () => {
      const response = await this.api.get(`/api/v1/workflows/${workflowId}`);
      return response.data;
    });
  }

  /**
   * Activate or deactivate a workflow
   */
  async toggleWorkflow(workflowId: string, active: boolean): Promise<N8NWorkflow> {
    return this.executeWithRetry(async () => {
      const response = await this.api.patch(`/api/v1/workflows/${workflowId}`, {
        active,
      });
      return response.data;
    });
  }

  /**
   * Get details of a specific execution
   */
  async getExecution(executionId: string): Promise<N8NExecution> {
    return this.executeWithRetry(async () => {
      const response = await this.api.get(`/api/v1/executions/${executionId}`);
      return response.data;
    });
  }

  /**
   * Delete a workflow execution
   */
  async deleteExecution(executionId: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.api.delete(`/api/v1/executions/${executionId}`);
    });
  }

  /**
   * Execute workflow via webhook (for public workflows)
   */
  async executeWebhook(workflowId: string, data?: any): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.api.post(`/webhook/${workflowId}`, data);
      return response.data;
    });
  }
}

// Export singleton instance
export const n8nService = new N8NService();
export default n8nService;
