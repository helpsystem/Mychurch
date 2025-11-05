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

  constructor() {
    this.api = axios.create({
      baseURL: `${N8N_BASE_URL}`,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Check if n8n server is reachable and healthy
   */
  async checkHealth(): Promise<N8NServerHealth> {
    try {
      const startTime = Date.now();
      const response = await this.api.get('/healthz');
      const latency = Date.now() - startTime;

      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        latency,
      };
    } catch (error) {
      console.error('N8N Health check failed:', error);
      return {
        status: 'unhealthy',
      };
    }
  }

  /**
   * Fetch all workflows from n8n
   */
  async getWorkflows(): Promise<N8NWorkflow[]> {
    try {
      const response = await this.api.get('/api/v1/workflows');
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch workflows:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch workflows');
    }
  }

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<N8NWorkflow> {
    try {
      const response = await this.api.get(`/api/v1/workflows/${workflowId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch workflow ${workflowId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch workflow');
    }
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string, data?: any): Promise<N8NExecution> {
    try {
      const response = await this.api.post(`/api/v1/workflows/${workflowId}/execute`, {
        data: data || {},
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to execute workflow ${workflowId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to execute workflow');
    }
  }

  /**
   * Activate or deactivate a workflow
   */
  async toggleWorkflow(workflowId: string, active: boolean): Promise<N8NWorkflow> {
    try {
      const response = await this.api.patch(`/api/v1/workflows/${workflowId}`, {
        active,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to toggle workflow ${workflowId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to toggle workflow');
    }
  }

  /**
   * Get execution history for a workflow
   */
  async getExecutions(workflowId?: string, limit: number = 10): Promise<N8NExecution[]> {
    try {
      const params: any = { limit };
      if (workflowId) {
        params.workflowId = workflowId;
      }

      const response = await this.api.get('/api/v1/executions', { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch executions:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch executions');
    }
  }

  /**
   * Get details of a specific execution
   */
  async getExecution(executionId: string): Promise<N8NExecution> {
    try {
      const response = await this.api.get(`/api/v1/executions/${executionId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch execution ${executionId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to fetch execution');
    }
  }

  /**
   * Delete a workflow execution
   */
  async deleteExecution(executionId: string): Promise<void> {
    try {
      await this.api.delete(`/api/v1/executions/${executionId}`);
    } catch (error: any) {
      console.error(`Failed to delete execution ${executionId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to delete execution');
    }
  }

  /**
   * Execute workflow via webhook (for public workflows)
   */
  async executeWebhook(workflowId: string, data?: any): Promise<any> {
    try {
      const response = await this.api.post(`/webhook/${workflowId}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to execute webhook ${workflowId}:`, error);
      throw new Error(error.response?.data?.message || 'Failed to execute webhook');
    }
  }
}

// Export singleton instance
export const n8nService = new N8NService();
export default n8nService;
