import React, { useState } from "react";
import { Workflow } from "@/actions/automation";
import { Play, RefreshCw, Cpu, Shield, Send } from "lucide-react";

interface SandboxRunnerProps {
  workflows: Workflow[];
  onExecute: (workflow: Workflow, isMock: boolean) => Promise<void>;
  isExecuting: boolean;
}

export default function SandboxRunner({ workflows, onExecute, isExecuting }: SandboxRunnerProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || "");
  const [isMock, setIsMock] = useState(true);

  const handleRun = () => {
    const workflow = workflows.find(w => w.id === selectedWorkflowId);
    if (!workflow) return;
    onExecute(workflow, isMock);
  };

  return (
    <div className="bg-[#141414] rounded-xl border border-slate-800 p-5 shadow-xl text-left max-w-3xl mx-auto mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Sandbox Executor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test your workflows in an isolated sandbox or trigger a live run.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Select Workflow to Test</label>
          <select 
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-slate-700 text-sm rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-slate-200"
          >
            <option value="" disabled>Select a workflow...</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Execution Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input 
                type="radio" 
                checked={isMock} 
                onChange={() => setIsMock(true)} 
                className="text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500"
              />
              Mock Mode (Safe)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input 
                type="radio" 
                checked={!isMock} 
                onChange={() => setIsMock(false)} 
                className="text-red-500 bg-slate-800 border-slate-600 focus:ring-red-500"
              />
              Live Mode (Real APIs)
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {isMock 
              ? "Mock mode will simulate the execution without calling external APIs or sending real emails/SMS." 
              : "Live mode will trigger real emails, SMS, and WhatsApp messages based on the configured steps."}
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isExecuting || !selectedWorkflowId}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          {isExecuting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isExecuting ? "Executing..." : "Trigger Workflow"}
        </button>
      </div>

    </div>
  );
}
