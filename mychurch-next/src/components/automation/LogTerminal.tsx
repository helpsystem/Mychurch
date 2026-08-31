/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ExecutionLog, ExecutionStep } from "@/actions/automation";
import { Terminal, CheckCircle2, XCircle, ArrowRight, CornerDownRight, Play, Calendar, Mail, FileText, FileSpreadsheet, CheckSquare, Sparkles, HelpCircle, Database, Trash, ShieldAlert } from "lucide-react";

interface LogTerminalProps {
  logs: ExecutionLog[];
  onClearLogs?: () => void;
}

export default function LogTerminal({ logs, onClearLogs }: LogTerminalProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Helper to resolve action icons
  const getActionIcon = (type: string) => {
    switch (type) {
      case "ai_gemini":
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case "gmail_send":
        return <Mail className="h-4 w-4 text-blue-400" />;
      case "sheets_append":
        return <FileSpreadsheet className="h-4 w-4 text-green-400" />;
      case "drive_create":
        return <FileText className="h-4 w-4 text-yellow-400" />;
      case "calendar_create":
        return <Calendar className="h-4 w-4 text-red-400" />;
      case "tasks_create":
        return <CheckSquare className="h-4 w-4 text-indigo-400" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "webhook":
        return "Webhook Post";
      case "cron":
        return "Cron Schedule";
      case "wordpress":
        return "WordPress Hook";
      case "manual":
        return "Manual Sandbox Run";
      default:
        return type;
    }
  };

  // Find currently selected log or default to the most recent one
  const activeLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  return (
    <div className="bg-[#141414] text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px] text-left">
      {/* Top Header */}
      <div className="bg-[#0d0d0d] px-4 py-3.5 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <h2 className="text-xs font-semibold font-mono tracking-wider text-slate-300 uppercase">
            Robotic Live Trace Logs
          </h2>
        </div>
        {onClearLogs && logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[10px] font-mono uppercase bg-slate-900 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/40 px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer"
          >
            <Trash className="h-3 w-3" /> Clear History
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 font-mono text-xs">
          <Database className="h-10 w-10 text-slate-700 stroke-[1.2] mb-3 animate-pulse" />
          <p className="text-slate-400">No telemetry recorded yet.</p>
          <p className="text-[10px] text-slate-600 mt-1 max-w-xs text-center leading-relaxed">
            Trigger a manual sandbox test or fire a WordPress webhook simulation to watch real-time robotic traces populate here.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
          
          {/* Left panel - logs list */}
          <div className="w-full md:w-2/5 overflow-y-auto divide-y divide-black/40 h-1/2 md:h-full">
            {logs.map((log) => {
              const isActive = activeLog && activeLog.id === log.id;
              const formattedTime = (log.timestamp as any)?.toDate 
                ? (log.timestamp as any).toDate().toLocaleTimeString() 
                : new Date(log.timestamp || Date.now()).toLocaleTimeString();
              
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id || null)}
                  className={`w-full text-left p-3.5 transition-colors block border-l-2 cursor-pointer ${
                    isActive 
                      ? "bg-slate-900/40 border-blue-500" 
                      : "bg-[#0a0a0a]/40 border-transparent hover:bg-slate-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[130px]">
                      {log.workflowName}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">{formattedTime}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black text-slate-400 border border-slate-850">
                        {getTriggerLabel(log.triggeredBy)}
                      </span>
                    </div>
                    {log.status === "success" ? (
                      <span className="font-mono text-[9px] text-green-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3 text-green-400" /> PASS
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] text-red-400 flex items-center gap-1 font-semibold">
                        <XCircle className="h-3 w-3 text-red-400" /> FAIL
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right panel - detailed execution trace */}
          <div className="flex-1 p-5 overflow-y-auto bg-black/20 font-mono text-xs flex flex-col justify-between h-1/2 md:h-full text-left">
            {activeLog && (
              <div className="space-y-4">
                
                {/* Header info */}
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-slate-200 text-xs font-semibold flex items-center gap-2">
                    <Play className="h-3 w-3 text-blue-400" />
                    Trace: {activeLog.workflowName}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-slate-500">
                    <span>ID: {activeLog.id}</span>
                    <span>•</span>
                    <span>Triggered: {getTriggerLabel(activeLog.triggeredBy)}</span>
                    <span>•</span>
                    <span>
                      Time: {(activeLog.timestamp as any)?.toDate 
                        ? (activeLog.timestamp as any).toDate().toLocaleString() 
                        : new Date(activeLog.timestamp || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Steps Accordion */}
                <div className="space-y-3">
                  {activeLog.steps.map((step, idx) => (
                    <div key={idx} className="border border-slate-850 rounded bg-[#0a0a0a] p-3">
                      
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getActionIcon(step.type)}
                          <span className="font-semibold text-slate-200 text-[11px]">{step.name}</span>
                        </div>
                        {step.status === "success" ? (
                          <span className="text-[9px] text-green-400 bg-green-950/20 border border-green-900/30 px-1.5 rounded flex items-center gap-0.5 font-bold">
                            ✔ SUCCESS
                          </span>
                        ) : (
                          <span className="text-[9px] text-red-400 bg-red-950/20 border border-red-900/30 px-1.5 rounded flex items-center gap-0.5 font-bold">
                            ✘ FAILED
                          </span>
                        )}
                      </div>

                      {/* Code traces */}
                      {step.status === "success" && step.output && (
                        <div className="mt-2 pl-3 border-l border-slate-800 space-y-1 text-[10px]">
                          <span className="text-slate-500 flex items-center gap-1">
                            <CornerDownRight className="h-2.5 w-2.5 text-slate-650" /> Response output:
                          </span>
                          <div className="bg-black/60 p-2 rounded text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-wrap">
                            {step.output}
                          </div>
                        </div>
                      )}

                      {step.status === "failed" && step.error && (
                        <div className="mt-2 pl-3 border-l border-red-950 space-y-1 text-[10px]">
                          <span className="text-red-400 flex items-center gap-1 font-bold">
                            <ShieldAlert className="h-3 w-3 text-red-400" /> Error Exception:
                          </span>
                          <div className="bg-red-950/10 border border-red-900/20 p-2 rounded text-red-300 leading-relaxed whitespace-pre-wrap">
                            {step.error}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

              </div>
            )}
            
            <div className="text-[9px] text-slate-600 border-t border-slate-800 pt-3 mt-4 flex items-center justify-between">
              <span>Telemetry trace active</span>
              <span>UTC Logs sync</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
