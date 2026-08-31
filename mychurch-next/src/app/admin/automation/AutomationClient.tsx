"use client";

import React, { useState, useEffect } from "react";
import { 
  getWorkflows, 
  getExecutionLogs,
  Workflow, 
  ExecutionLog,
  logExecution
} from "@/actions/automation";
import { executeWorkflow } from "@/lib/automation-engine";
import WorkflowBuilder from "@/components/automation/WorkflowBuilder";
import LogTerminal from "@/components/automation/LogTerminal";
import TestRunner from "@/components/automation/SandboxRunner";
import { 
  Layers, FileCode, CheckSquare, Sparkles, 
  RefreshCw, CheckCircle 
} from "lucide-react";

interface AutomationClientProps {
  initialWorkflows: Workflow[];
  initialLogs: ExecutionLog[];
  userId: string;
}

export default function AutomationClient({ initialWorkflows, initialLogs, userId }: AutomationClientProps) {
  // Data states
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    initialWorkflows.length > 0 ? initialWorkflows[0] : null
  );
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs);
  const [isExecuting, setIsExecuting] = useState(false);

  // Tab state: 'studio' | 'tests'
  const [activeTab, setActiveTab] = useState<"studio" | "tests">("studio");

  const loadWorkflows = async () => {
    try {
      const data = await getWorkflows(userId);
      setWorkflows(data);
      if (data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(data[0]);
      }
    } catch (err) {
      console.error("Error loading workflows:", err);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await getExecutionLogs();
      setLogs(data);
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  // Run the workflow via frontend sandbox (mock or real)
  const handleExecuteWorkflow = async (workflowToRun: Workflow, isMock: boolean) => {
    setIsExecuting(true);
    try {
      // Create a temporary running log state for visual feedback
      const tempLogId = `temp-${Date.now()}`;
      const tempLog: ExecutionLog = {
        id: tempLogId,
        workflowId: workflowToRun.id || "sandbox",
        workflowName: workflowToRun.name,
        userId: userId,
        status: "running",
        steps: workflowToRun.actions.map((act) => ({
          name: act.name,
          type: act.type,
          status: "skipped",
        })),
        triggeredBy: workflowToRun.trigger.type,
        timestamp: new Date().toISOString(),
      };
      
      setLogs((prev) => [tempLog, ...prev]);

      // Note: In Next.js, calling this direct client-side will bundle all server logic!
      // Wait, executeWorkflow is imported from "@/lib/automation-engine", which has Node APIs (fs, child_process etc from Twilio/Resend).
      // We CANNOT call it from a client component! We must use a Server Action to run it.
      // So instead of calling executeWorkflow here, I need to call a server action or API route.
      // Let's create an API call for now.
      
      const res = await fetch("/api/admin/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: workflowToRun, isMock, triggerPayload: {} })
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const data = await res.json();
      setLogs((prev) => [data.log, ...prev.filter(l => l.id !== tempLogId)]);
      
    } catch (error) {
      console.error("Workflow Execution Error:", error);
      alert("Execution failed. Check console.");
      // reload logs to clear temp log
      loadLogs();
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0f1117] text-slate-800 dark:text-slate-200">
      {/* Sidebar navigation for sub-tools */}
      <div className="w-20 bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-[#30363d] flex flex-col items-center py-6 gap-6 shadow-sm z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md mb-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        <button
          onClick={() => setActiveTab("studio")}
          className={`p-3 rounded-xl transition-all duration-200 relative group ${
            activeTab === "studio"
              ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-[#21262d] hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          title="Workflow Builder"
        >
          <Layers className="w-6 h-6" strokeWidth={activeTab === "studio" ? 2.5 : 2} />
          {activeTab === "studio" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("tests")}
          className={`p-3 rounded-xl transition-all duration-200 relative group ${
            activeTab === "tests"
              ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-[#21262d] hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          title="Sandbox & Testing"
        >
          <CheckSquare className="w-6 h-6" strokeWidth={activeTab === "tests" ? 2.5 : 2} />
          {activeTab === "tests" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
          )}
        </button>

        <div className="mt-auto">
          <button
            onClick={loadLogs}
            className="p-3 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-[#21262d] transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-auto">
          {activeTab === "studio" && (
            <WorkflowBuilder
              userId={userId}
              workflows={workflows}
              selectedWorkflow={selectedWorkflow}
              onSelectWorkflow={setSelectedWorkflow}
              onRefreshWorkflows={loadWorkflows}
              onExecuteWorkflow={handleExecuteWorkflow}
              isExecuting={isExecuting}
              accessToken={"server-side-keys-used"} 
            />
          )}

          {activeTab === "tests" && (
            <TestRunner
              workflows={workflows}
              onExecute={handleExecuteWorkflow}
              isExecuting={isExecuting}
            />
          )}
        </main>

        {/* Global Floating Terminal - always visible for transparency */}
        {logs.length > 0 && (
          <div className="h-64 border-t border-slate-200 dark:border-[#30363d] bg-[#0d1117] relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <LogTerminal logs={logs} />
          </div>
        )}
      </div>
    </div>
  );
}
