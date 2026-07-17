"use server";

import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// ─── Types ─────────────────────────────────────────────────────────────

export interface TriggerConfig {
  type: "webhook" | "cron" | "wordpress" | "manual";
  schedule?: string;
  webhookUrl?: string;
  formName?: string;
}

export interface ActionConfig {
  id: string;
  type: "ai_gemini" | "gmail_send" | "sheets_append" | "drive_create" | "calendar_create" | "tasks_create" | "whatsapp_send" | "multi_broadcast";
  name: string;
  config: {
    // Gemini
    prompt?: string;
    systemInstruction?: string;
    model?: string;
    
    // Gmail
    to?: string;
    subject?: string;
    body?: string;
    
    // Sheets
    spreadsheetId?: string;
    sheetName?: string;
    rowValues?: string;
    
    // Drive
    fileName?: string;
    fileContent?: string;
    
    // Calendar
    eventTitle?: string;
    eventDescription?: string;
    eventStartTime?: string;
    eventDurationMinutes?: number;
    
    // Tasks
    taskTitle?: string;
    taskNotes?: string;
    taskDueDate?: string;

    // WhatsApp
    whatsappType?: "individual" | "group";
    whatsappRecipient?: string;
    whatsappMessage?: string;

    // Multi-Broadcast
    broadcastPlatforms?: string[];
    broadcastMessage?: string;
    broadcastSubject?: string;
    broadcastRecipientEmail?: string;
    broadcastRecipientPhone?: string;
    broadcastGroupWhatsAppId?: string;
  };
}

export interface Workflow {
  id?: string;
  name: string;
  description: string;
  active: boolean;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExecutionStep {
  name: string;
  type: string;
  status: "success" | "failed" | "skipped";
  output?: string;
  error?: string;
}

export interface ExecutionLog {
  id?: string;
  workflowId: string;
  workflowName: string;
  userId: string;
  status: "success" | "failed" | "running";
  steps: ExecutionStep[];
  triggeredBy: "webhook" | "cron" | "wordpress" | "manual";
  timestamp?: string;
}

// ─── Ensure Tables ─────────────────────────────────────────────────────

async function ensureAutomationTables() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS church_workflows (
        id text PRIMARY KEY,
        user_id text,
        workflow jsonb NOT NULL,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );
    `);
    
    await query(`
      CREATE TABLE IF NOT EXISTS church_execution_logs (
        id text PRIMARY KEY,
        workflow_id text NOT NULL,
        user_id text,
        status text NOT NULL,
        log_data jsonb NOT NULL,
        timestamp timestamp with time zone DEFAULT now()
      );
    `);
  } catch (e) {
    console.error("[Automation] Failed to ensure tables exist:", e);
  }
}

// ─── Workflows CRUD ────────────────────────────────────────────────────

export async function saveWorkflow(workflow: Workflow): Promise<string> {
  await ensureAutomationTables();
  
  const id = workflow.id || uuidv4();
  const now = new Date().toISOString();
  
  const cleanWorkflow = {
    ...workflow,
    id,
    updatedAt: now,
    createdAt: workflow.createdAt || now
  };

  await query(`
    INSERT INTO church_workflows (id, user_id, workflow, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      workflow = EXCLUDED.workflow,
      updated_at = EXCLUDED.updated_at
  `, [id, workflow.userId, JSON.stringify(cleanWorkflow), cleanWorkflow.createdAt, cleanWorkflow.updatedAt]);

  return id;
}

export async function getWorkflows(userId: string): Promise<Workflow[]> {
  await ensureAutomationTables();
  
  // Note: Assuming admin context, we can just fetch all workflows or filter by userId
  const result = await query(`
    SELECT workflow FROM church_workflows
    ORDER BY updated_at DESC
  `);
  
  return result.rows.map(r => r.workflow as Workflow);
}

export async function getWorkflow(workflowId: string): Promise<Workflow | null> {
  await ensureAutomationTables();
  
  const result = await query(`
    SELECT workflow FROM church_workflows
    WHERE id = $1
  `, [workflowId]);
  
  if (result.rows.length === 0) return null;
  return result.rows[0].workflow as Workflow;
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  await ensureAutomationTables();
  
  await query(`
    DELETE FROM church_workflows
    WHERE id = $1
  `, [workflowId]);
}

// ─── Trigger Engine ────────────────────────────────────────────────────

export async function triggerAutomationEvent(eventName: string, payload: any) {
  await ensureAutomationTables();
  
  // Find workflows that trigger on this eventName
  const result = await query(`
    SELECT workflow FROM church_workflows
    WHERE (workflow->>'active')::boolean = true
    AND workflow->'trigger'->>'type' = $1
  `, ["webhook"]); // In the future, this can be customized to match eventName inside the trigger config

  // Note: we can import executeWorkflow dynamically to avoid circular dependencies if any, 
  // but since this is a server action, it's safer to not execute heavy tasks directly blocking the response.
  // We can just log it for now or rely on the actual API route for external webhooks.
}

// ─── Execution Logs CRUD ───────────────────────────────────────────────

export async function logExecution(log: ExecutionLog): Promise<string> {
  await ensureAutomationTables();
  
  const id = log.id || uuidv4();
  const timestamp = new Date().toISOString();
  
  const cleanLog = {
    ...log,
    id,
    timestamp
  };

  await query(`
    INSERT INTO church_execution_logs (id, workflow_id, user_id, status, log_data, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, log.workflowId, log.userId, log.status, JSON.stringify(cleanLog), timestamp]);

  return id;
}

export async function getExecutionLogs(workflowId?: string): Promise<ExecutionLog[]> {
  await ensureAutomationTables();
  
  let q = `
    SELECT log_data FROM church_execution_logs
    ORDER BY timestamp DESC
    LIMIT 100
  `;
  let params: any[] = [];

  if (workflowId) {
    q = `
      SELECT log_data FROM church_execution_logs
      WHERE workflow_id = $1
      ORDER BY timestamp DESC
      LIMIT 100
    `;
    params = [workflowId];
  }

  const result = await query(q, params);
  
  return result.rows.map(r => r.log_data as ExecutionLog);
}
