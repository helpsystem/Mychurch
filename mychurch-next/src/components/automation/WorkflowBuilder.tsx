/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Workflow, ActionConfig, TriggerConfig, saveWorkflow, deleteWorkflow } from "@/actions/automation";
import { 
  Sparkles, Mail, FileSpreadsheet, FileText, Calendar, CheckSquare, 
  Trash2, PlusCircle, Save, Play, RefreshCw, Zap, ArrowDown, HelpCircle, LayoutGrid, CheckCircle, Database,
  MessageSquare, Radio, Smartphone, Users, User
} from "lucide-react";

interface WorkflowBuilderProps {
  userId: string;
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow | null) => void;
  onRefreshWorkflows: () => Promise<void>;
  onExecuteWorkflow: (workflow: Workflow, isMock: boolean) => Promise<void>;
  isExecuting: boolean;
  accessToken: string | null;
}

// 1-click Preset Templates
const PRESETS = [
  {
    name: "AI Lead Responder (WooCommerce & Forms)",
    description: "Catches custom WooCommerce/Form webhooks, queries Gemini to write a high-context personalized response, emails the customer via Gmail, and appends a structured log row to Google Sheets.",
    trigger: { type: "webhook" as const },
    actions: [
      {
        id: "step_ai_1",
        name: "Generate Intelligent Email",
        type: "ai_gemini" as const,
        config: {
          prompt: "Write a polite, engaging business email reply to lead {{ trigger.payload.customer_name }} (email: {{ trigger.payload.customer_email }}) who requested help regarding '{{ trigger.payload.subject || trigger.payload.items[0] }}'. Offer them a 15% onboarding discount as an automation incentive.",
          systemInstruction: "You are a professional corporate automated workspace agent.",
          model: "gemini-2.5-flash",
        },
      },
      {
        id: "step_gmail_2",
        name: "Disptach Response",
        type: "gmail_send" as const,
        config: {
          to: "{{ trigger.payload.customer_email || trigger.payload.sender_email }}",
          subject: "Regarding your inquiry: {{ trigger.payload.subject || 'Special AutoFlow Offer' }}",
          body: "{{ Generate_Intelligent_Email.output }}",
        },
      },
      {
        id: "step_sheets_3",
        name: "Log Activity row",
        type: "sheets_append" as const,
        config: {
          spreadsheetId: "1-D_pY7-FvE_mS-FakS0_6Q7VByK95r4F2Yt_0B7b8H4", // Example Spreadsheet ID
          sheetName: "Leads",
          rowValues: "{{ timestamp }}, {{ trigger.payload.customer_name }}, {{ trigger.payload.customer_email }}, Dispatched via AutoFlow Gmail Bot",
        },
      },
    ],
  },
  {
    name: "Intelligent Lead Meeting Scheduler",
    description: "Evaluates standard inbound briefs, generates calendar event briefs via Gemini AI, registers scheduling timelines onto Google Calendar, and appends a follow-up items list to Google Tasks.",
    trigger: { type: "wordpress" as const, formName: "Consultation Request" },
    actions: [
      {
        id: "step_ai_meet",
        name: "Draft Event Memo",
        type: "ai_gemini" as const,
        config: {
          prompt: "Summarize the following form submission message and draft a meeting description: '{{ trigger.payload.message }}'. Sender: {{ trigger.payload.sender_name }}",
          systemInstruction: "Synthesize briefs into a 2-sentence corporate description.",
          model: "gemini-2.5-flash",
        },
      },
      {
        id: "step_calendar",
        name: "Schedule Consult on Calendar",
        type: "calendar_create" as const,
        config: {
          eventTitle: "AutoFlow: Consultation with {{ trigger.payload.sender_name }}",
          eventDescription: "{{ Draft_Event_Memo.output }}",
          eventStartTime: "2026-07-16T15:00:00Z", // Example ISO
          eventDurationMinutes: 45,
        },
      },
      {
        id: "step_task",
        name: "Create Actionable Task",
        type: "tasks_create" as const,
        config: {
          taskTitle: "Review meeting memo for {{ trigger.payload.sender_name }}",
          taskNotes: "Check draft: {{ Draft_Event_Memo.output }}",
          taskDueDate: "2026-07-16",
        },
      },
    ],
  },
  {
    name: "Chronos Report Maker (SaaS Backup)",
    description: "Utilizes chronometer cron triggers to schedule autonomous report collection, drafts a comprehensive summary using Gemini AI, and backs up a plain text document to Google Drive.",
    trigger: { type: "cron" as const, schedule: "daily" },
    actions: [
      {
        id: "step_ai_report",
        name: "Generate Autonomous Summary",
        type: "ai_gemini" as const,
        config: {
          prompt: "Produce a high-level summary of workspace tasks and automated flows handled on {{ timestamp }}. Assert operational security and compile suggestions.",
          model: "gemini-2.5-flash",
        },
      },
      {
        id: "step_drive",
        name: "Archive to Google Drive",
        type: "drive_create" as const,
        config: {
          fileName: "AutoFlow_Archive_{{ timestamp }}.txt",
          fileContent: "AUTOFOLOW ROBOTIC CHRONOS LOG\nGenerated: {{ timestamp }}\n\nSummary:\n{{ Generate_Autonomous_Summary.output }}",
        },
      },
    ],
  },
  {
    name: "WhatsApp VIP Greeting & Sheet Logger",
    description: "Intercepts new contact submissions, utilizes Gemini to write an elegant, personalized welcome note, dispatches it to their WhatsApp direct phone line, and appends details to Google Sheets.",
    trigger: { type: "webhook" as const },
    actions: [
      {
        id: "step_ai_wa_vip",
        name: "Generate VIP Greeting",
        type: "ai_gemini" as const,
        config: {
          prompt: "Draft a high-end, premium warm greeting for {{ trigger.payload.customer_name }} from 'Antigravity Robotics'. Express gratitude and mention our automated service is live.",
          systemInstruction: "You are an elite, respectful customer service robot.",
          model: "gemini-2.5-flash",
        },
      },
      {
        id: "step_wa_send",
        name: "WhatsApp Dispatcher",
        type: "whatsapp_send" as const,
        config: {
          whatsappType: "individual",
          whatsappRecipient: "{{ trigger.payload.customer_phone || '+989123456789' }}",
          whatsappMessage: "{{ Generate_VIP_Greeting.output }}",
        },
      },
      {
        id: "step_sheets_log",
        name: "Log Activity row",
        type: "sheets_append" as const,
        config: {
          spreadsheetId: "1-D_pY7-FvE_mS-FakS0_6Q7VByK95r4F2Yt_0B7b8H4",
          sheetName: "WhatsAppLogs",
          rowValues: "{{ timestamp }}, {{ trigger.payload.customer_name }}, {{ trigger.payload.customer_phone }}, Welcome Message Dispatched",
        },
      },
    ],
  },
  {
    name: "Omni-Channel Multi-Platform Emergency Broadcast",
    description: "Triggered manually or via schedule to dispatch critical system alerts across multiple activated platforms (Gmail, WhatsApp, SMS, Slack, Telegram) simultaneously with custom configurations.",
    trigger: { type: "manual" as const },
    actions: [
      {
        id: "step_broadcast",
        name: "Omni-Channel Broadcaster",
        type: "multi_broadcast" as const,
        config: {
          broadcastPlatforms: ["gmail", "whatsapp", "sms", "slack", "telegram"],
          broadcastSubject: "⚠️ CRITICAL SYSTEM NOTIFICATION: Automated Robot Status",
          broadcastMessage: "Alert: The autonomous robotic automation pipelines successfully synced. Status: ACTIVE at {{ timestamp }}.",
          broadcastRecipientEmail: "{{ trigger.payload.customer_email || 'admin@example.com' }}",
          broadcastRecipientPhone: "{{ trigger.payload.customer_phone || '+989123456789' }}",
          broadcastGroupWhatsAppId: "120363223456789@g.us",
        },
      },
    ],
  },
];

export default function WorkflowBuilder({
  userId,
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  onRefreshWorkflows,
  onExecuteWorkflow,
  isExecuting,
  accessToken,
}: WorkflowBuilderProps) {
  // Current active form variables
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<"webhook" | "cron" | "wordpress" | "manual">("webhook");
  const [triggerSchedule, setTriggerSchedule] = useState("daily");
  const [triggerFormName, setTriggerFormName] = useState("Contact Form Main");
  const [actions, setActions] = useState<ActionConfig[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  // Sync state with selected workflow
  useEffect(() => {
    if (selectedWorkflow) {
      setName(selectedWorkflow.name);
      setDescription(selectedWorkflow.description);
      setTriggerType(selectedWorkflow.trigger.type);
      setTriggerSchedule(selectedWorkflow.trigger.schedule || "daily");
      setTriggerFormName(selectedWorkflow.trigger.formName || "Contact Form Main");
      setActions(selectedWorkflow.actions || []);
      if (selectedWorkflow.actions.length > 0) {
        setExpandedActionId(selectedWorkflow.actions[0].id);
      }
    } else {
      // Clear form
      setName("");
      setDescription("");
      setTriggerType("webhook");
      setTriggerSchedule("daily");
      setTriggerFormName("Contact Form Main");
      setActions([]);
      setExpandedActionId(null);
    }
  }, [selectedWorkflow]);

  // Load a Preset Template
  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setDescription(preset.description);
    setTriggerType(preset.trigger.type);
    if ("schedule" in preset.trigger) {
      setTriggerSchedule(preset.trigger.schedule || "daily");
    }
    if ("formName" in preset.trigger) {
      setTriggerFormName(preset.trigger.formName || "Contact Form Main");
    }
    
    // Copy actions and map unique IDs
    const clonedActions = preset.actions.map((act) => ({
      ...act,
      id: `step_${Math.floor(1000 + Math.random() * 9000)}`,
    }));
    setActions(clonedActions as any);
    if (clonedActions.length > 0) {
      setExpandedActionId(clonedActions[0].id);
    }
  };

  // Add a blank action
  const handleAddAction = (type: ActionConfig["type"]) => {
    const defaultConfigs = {
      ai_gemini: { prompt: "Write summary of {{ trigger.payload.customer_name }}", model: "gemini-2.5-flash", systemInstruction: "Be helpful." },
      gmail_send: { to: "{{ trigger.payload.customer_email }}", subject: "Inquiry Confirmation", body: "Hello! We will review." },
      sheets_append: { spreadsheetId: "Spreadsheet_ID_here", sheetName: "Sheet1", rowValues: "{{ timestamp }}, New Lead" },
      drive_create: { fileName: "Document_{{ timestamp }}.txt", fileContent: "Log body goes here." },
      calendar_create: { eventTitle: "Meeting", eventDescription: "Description text", eventStartTime: "2026-07-16T15:00:00Z", eventDurationMinutes: 60 },
      tasks_create: { taskTitle: "Review", taskNotes: "Notes...", taskDueDate: "2026-07-16" },
      whatsapp_send: { whatsappType: "individual" as const, whatsappRecipient: "{{ trigger.payload.customer_phone || '+989123456789' }}", whatsappMessage: "سلام {{ trigger.payload.customer_name || 'کاربر گرامی' }}، درخواست شما دریافت شد." },
      multi_broadcast: { broadcastPlatforms: ["gmail", "whatsapp"], broadcastMessage: "پیام جدید از ربات خودکارساز: {{ Generate_Intelligent_Email.output || 'عملیات با موفقیت انجام شد' }}", broadcastSubject: "اعلان چندپلتفرمی خودکار", broadcastRecipientEmail: "{{ trigger.payload.customer_email }}", broadcastRecipientPhone: "{{ trigger.payload.customer_phone || '+989123456789' }}", broadcastGroupWhatsAppId: "120363223456789@g.us" },
    };

    const typeLabels = {
      ai_gemini: "AI Gemini Synthesis",
      gmail_send: "Gmail Notification Bot",
      sheets_append: "Sheets Log Row Append",
      drive_create: "Drive Log Archivist",
      calendar_create: "Calendar Event Scheduler",
      tasks_create: "Google Tasks Planner",
      whatsapp_send: "WhatsApp Dispatcher",
      multi_broadcast: "Multi-Platform Broadcast",
    };

    const newAction: ActionConfig = {
      id: `step_${Math.floor(1000 + Math.random() * 9000)}`,
      name: typeLabels[type],
      type,
      config: defaultConfigs[type],
    };

    setActions([...actions, newAction]);
    setExpandedActionId(newAction.id);
  };

  // Update specific field configuration
  const handleUpdateActionConfig = (actionId: string, updates: Partial<ActionConfig["config"]>) => {
    setActions(
      actions.map((act) => {
        if (act.id === actionId) {
          return {
            ...act,
            config: { ...act.config, ...updates },
          };
        }
        return act;
      })
    );
  };

  const handleUpdateActionName = (actionId: string, newName: string) => {
    setActions(
      actions.map((act) => {
        if (act.id === actionId) {
          return { ...act, name: newName };
        }
        return act;
      })
    );
  };

  const handleDeleteAction = (actionId: string) => {
    setActions(actions.filter((act) => act.id !== actionId));
  };

  // Save workflow to Firestore
  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a workflow name.");
      return;
    }

    setIsSaving(true);
    try {
      const trigger: TriggerConfig = {
        type: triggerType,
        schedule: triggerType === "cron" ? triggerSchedule : undefined,
        formName: triggerType === "wordpress" ? triggerFormName : undefined,
        webhookUrl: triggerType === "webhook" ? "will_be_generated" : undefined,
      };

      const workflowToSave: Workflow = {
        id: selectedWorkflow?.id,
        name,
        description,
        active: true,
        trigger,
        actions,
        userId,
        createdAt: selectedWorkflow?.createdAt || undefined,
        updatedAt: undefined,
      };

      const savedId = await saveWorkflow(workflowToSave);
      await onRefreshWorkflows();
      
      // Select the saved workflow
      const updatedWorkflow = { ...workflowToSave, id: savedId };
      onSelectWorkflow(updatedWorkflow);
      alert("Workflow saved successfully to Firestore database!");
    } catch (err: any) {
      console.error("Save workflow error:", err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete workflow from Firestore
  const handleDelete = async () => {
    if (!selectedWorkflow?.id) return;
    const confirmed = window.confirm("Are you sure you want to delete this workflow permanently from Firestore?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteWorkflow(selectedWorkflow.id);
      await onRefreshWorkflows();
      onSelectWorkflow(null);
      alert("Workflow deleted successfully!");
    } catch (err: any) {
      console.error("Delete workflow error:", err);
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Trigger Mock run (sandbox) or Real run
  const handleTriggerRun = (isMock: boolean) => {
    if (actions.length === 0) {
      alert("Please add at least one action to the pipeline before executing.");
      return;
    }

    if (!isMock) {
      // Must follow Workspace Integration confirmation guidelines for destructive/mutating executions
      const confirmed = window.confirm(
        `Execute REAL automation workflow? This will send real emails (Resend), SMS/WhatsApp messages (Twilio), and execute AI operations on your server.`
      );
      if (!confirmed) return;
    }

    const currentWorkflow: Workflow = {
      id: selectedWorkflow?.id || "temporary-local",
      name: name || "Sandbox Test Workflow",
      description,
      active: true,
      trigger: {
        type: triggerType,
        schedule: triggerSchedule,
        formName: triggerFormName,
      },
      actions,
      userId,
      createdAt: undefined,
      updatedAt: undefined,
    };

    onExecuteWorkflow(currentWorkflow, isMock);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      {/* LEFT: Existing Workflows List + Preset Templates */}
      <div className="lg:col-span-4 space-y-6">
        {/* Existing Workflows from Database */}
        <div className="bg-[#141414] border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1">
              <Database className="h-3.5 w-3.5 text-blue-500" /> Saved Workflows
            </h3>
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-medium">
              Firestore DB
            </span>
          </div>

          {workflows.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-lg bg-[#0d0d0d]">
              0 Workflows found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => onSelectWorkflow(wf)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between text-xs ${
                    selectedWorkflow?.id === wf.id
                      ? "bg-blue-600 text-white border-blue-600 font-semibold"
                      : "bg-[#0a0a0a] border-slate-850 text-slate-300 hover:bg-[#141414] hover:text-white"
                  }`}
                >
                  <span className="truncate pr-2">{wf.name}</span>
                  <span className="text-[9px] px-1 py-0.5 font-mono bg-slate-900 text-slate-400 rounded border border-slate-800">
                    {wf.actions.length} steps
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => onSelectWorkflow(null)}
            className="w-full mt-3 py-1.5 border border-blue-600/50 hover:bg-blue-600/10 text-blue-400 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Create Brand New Flow
          </button>
        </div>

        {/* Preset Templates Loader */}
        <div className="bg-[#141414] border border-slate-800 rounded-xl p-4 shadow-xl">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
            <LayoutGrid className="h-3.5 w-3.5 text-blue-500" /> 1-Click presets
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 font-sans leading-relaxed">
            Load pre-mapped automation template pipelines integrating Gemini Intelligence with various Google Workspace API endpoints.
          </p>

          <div className="space-y-3">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadPreset(preset)}
                className="w-full text-left p-3 border border-slate-850 hover:border-slate-700 rounded-xl bg-[#0a0a0a] hover:bg-slate-900/20 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate max-w-[210px]">
                    {preset.name}
                  </h4>
                  <Zap className="h-3 w-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Visual Canvas / Form Builder */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-[#141414] border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-850 pb-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Name your Workflow (e.g. Lead Responder)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base font-bold text-white border-b border-transparent hover:border-slate-800 focus:border-blue-500 focus:outline-none w-full bg-transparent"
              />
              <input
                type="text"
                placeholder="Brief description of this automatic process..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs text-slate-400 border-b border-transparent hover:border-slate-800 focus:border-blue-500 focus:outline-none w-full mt-1.5 bg-transparent font-sans"
              />
            </div>

            {/* Execution Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleTriggerRun(true)}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-950 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-800 cursor-pointer"
                title="Simulate this flow with generated mock data"
                id="run-mock-btn"
              >
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" /> Sandbox Mock
              </button>
              <button
                onClick={() => handleTriggerRun(false)}
                disabled={isExecuting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
                title="Execute real actions with your active API keys"
                id="run-real-btn"
              >
                {isExecuting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Real Run
              </button>
            </div>
          </div>

          {/* Trigger settings */}
          <div className="p-4 bg-[#0d0d0d] rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Robotic Trigger Node [Step 0]
              </h4>
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-blue-400 font-bold">
                START
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-medium text-slate-400 mb-1">Trigger Engine</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full bg-black border border-slate-800 rounded-lg p-2 font-semibold text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="webhook">Webhook Post HTTP</option>
                  <option value="cron">Chronometer Cron Job</option>
                  <option value="wordpress">WordPress Form Submission</option>
                  <option value="manual">Manual Sandbox Button</option>
                </select>
              </div>

              {triggerType === "cron" && (
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Cron Interval Schedule</label>
                  <select
                    value={triggerSchedule}
                    onChange={(e) => setTriggerSchedule(e.target.value)}
                    className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="every_minute">⏰ Every minute (for sandboxing)</option>
                    <option value="hourly">⏰ Hourly intervals</option>
                    <option value="daily">⏰ Daily chronological cycles</option>
                    <option value="weekly">⏰ Weekly calendar frames</option>
                  </select>
                </div>
              )}

              {triggerType === "wordpress" && (
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">WP Integration Target Form</label>
                  <input
                    type="text"
                    value={triggerFormName}
                    onChange={(e) => setTriggerFormName(e.target.value)}
                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. WooCommerce Orders completed or CF7 title"
                  />
                </div>
              )}

              {triggerType === "webhook" && (
                <div className="sm:col-span-8">
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Permanent webhook url</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedWorkflow?.id ? `${window.location.origin}/api/webhook/${selectedWorkflow.id}` : "Save this workflow to lock in your custom Webhook URL"}
                    className="w-full bg-black/40 border border-slate-850 rounded-lg p-2 font-mono text-[9px] text-slate-400 cursor-not-allowed"
                  />
                </div>
              )}

              {triggerType === "manual" && (
                <div className="sm:col-span-8 flex items-center pl-1 text-slate-450 text-[11px] font-sans">
                  No parameters needed. This flow activates instantly upon pressing Sandbox Mock or Real Run.
                </div>
              )}
            </div>
          </div>

          {/* Connected Actions Sequence */}
          <div className="space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-black/30 text-slate-400 flex flex-col items-center justify-center">
                <LayoutGrid className="h-8 w-8 text-slate-500 stroke-[1.5] mb-2" />
                <p className="text-xs font-semibold text-slate-200">Automation Sequence is Empty</p>
                <p className="text-[10px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Add robotic actions below to map out the execution pipeline. You can use dynamic variables like <code>{"{{Generate_AI_Reply.output}}"}</code> in downstream blocks.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((act, index) => {
                  const isExpanded = expandedActionId === act.id;
                  
                  return (
                    <React.Fragment key={act.id}>
                      {/* Flow arrow */}
                      <div className="flex justify-center -my-1">
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-6 bg-slate-800"></div>
                          <ArrowDown className="h-4 w-4 text-slate-500 stroke-[2] -mt-1.5" />
                        </div>
                      </div>

                      {/* Action Block */}
                      <div className={`border rounded-xl bg-[#0d0d0d] shadow-xl overflow-hidden transition-all duration-200 ${
                        isExpanded ? "border-blue-500 ring-1 ring-blue-500/10" : "border-slate-850 hover:border-slate-800"
                      }`}>
                        
                        {/* Header accordion */}
                        <div
                          onClick={() => setExpandedActionId(isExpanded ? null : act.id)}
                          className="flex justify-between items-center p-3.5 bg-black/40 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] bg-blue-600 text-white h-5 w-5 rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <div>
                              <input
                                type="text"
                                value={act.name}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateActionName(act.id, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="font-semibold text-xs text-slate-200 border-b border-transparent hover:border-slate-800 focus:border-blue-500 bg-transparent focus:outline-none"
                              />
                              <span className="block font-mono text-[9px] text-slate-500 mt-0.5">
                                Var key: <code>{`{{${act.name.replace(/\s+/g, "_")}.output}}`}</code>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            {/* Action Type Icon */}
                            <span className="p-1 rounded bg-slate-900 text-slate-400">
                              {act.type === "ai_gemini" && <Sparkles className="h-4 w-4 text-purple-400" />}
                              {act.type === "gmail_send" && <Mail className="h-4 w-4 text-blue-400" />}
                              {act.type === "sheets_append" && <FileSpreadsheet className="h-4 w-4 text-green-400" />}
                              {act.type === "drive_create" && <FileText className="h-4 w-4 text-yellow-400" />}
                              {act.type === "calendar_create" && <Calendar className="h-4 w-4 text-red-400" />}
                              {act.type === "tasks_create" && <CheckSquare className="h-4 w-4 text-indigo-400" />}
                              {act.type === "whatsapp_send" && <MessageSquare className="h-4 w-4 text-green-400" />}
                              {act.type === "multi_broadcast" && <Radio className="h-4 w-4 text-pink-400" />}
                            </span>

                            <button
                              onClick={() => handleDeleteAction(act.id)}
                              className="text-slate-500 hover:text-red-450 p-1 rounded hover:bg-red-950/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content form */}
                        {isExpanded && (
                          <div className="p-4 border-t border-slate-850 bg-black/20 space-y-4 text-xs text-left">
                            {/* Gemini Config */}
                            {act.type === "ai_gemini" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    AI Model
                                  </label>
                                  <select
                                    value={act.config.model || "gemini-2.5-flash"}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { model: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                  >
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (General & Balanced)</option>
                                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Super Fast)</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    System Role Instruction
                                  </label>
                                  <input
                                    type="text"
                                    value={act.config.systemInstruction || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { systemInstruction: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. You are a precise workspace translator."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    AI Prompt Input
                                  </label>
                                  <textarea
                                    value={act.config.prompt || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { prompt: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. Write a response regarding: {{trigger.payload.message}}"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Gmail Config */}
                            {act.type === "gmail_send" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Recipient Email (To:)
                                  </label>
                                  <input
                                    type="text"
                                    value={act.config.to || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { to: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. {{trigger.payload.customer_email}} or specific address"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Subject line
                                  </label>
                                  <input
                                    type="text"
                                    value={act.config.subject || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { subject: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. Booking confirmation for {{trigger.payload.customer_name}}"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Mail Body content
                                  </label>
                                  <textarea
                                    value={act.config.body || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { body: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="Hi! Use outputs from steps e.g. {{Generate_Intelligent_Email.output}}"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Sheets Config */}
                            {act.type === "sheets_append" && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Spreadsheet ID
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.spreadsheetId || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { spreadsheetId: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="Pasted ID from sheet URL"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Sheet Title Name
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.sheetName || "Sheet1"}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { sheetName: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="e.g. Leads or Sheet1"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Row Values (Comma Separated list)
                                  </label>
                                  <input
                                    type="text"
                                    value={act.config.rowValues || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { rowValues: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. {{timestamp}}, {{trigger.payload.customer_name}}, {{Generate_Intelligent_Email.output}}"
                                  />
                                  <span className="text-[10px] text-slate-500 mt-1 block">
                                    Each comma represents a separate grid cell/column shift in Sheets.
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Drive Config */}
                            {act.type === "drive_create" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Target file name
                                  </label>
                                  <input
                                    type="text"
                                    value={act.config.fileName || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { fileName: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="e.g. log_{{timestamp}}.txt"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Document text content
                                  </label>
                                  <textarea
                                    value={act.config.fileContent || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { fileContent: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="Complete document body..."
                                  />
                                </div>
                              </div>
                            )}

                            {/* Calendar Config */}
                            {act.type === "calendar_create" && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                  <div className="sm:col-span-8">
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Event Title
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.eventTitle || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { eventTitle: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="Consultation with {{trigger.payload.sender_name}}"
                                    />
                                  </div>
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Duration (Mins)
                                    </label>
                                    <input
                                      type="number"
                                      value={act.config.eventDurationMinutes || 60}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { eventDurationMinutes: Number(e.target.value) })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Start DateTime (ISO format)
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.eventStartTime || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { eventStartTime: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="2026-07-16T15:00:00Z"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Calendar Description
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.eventDescription || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { eventDescription: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="Meeting brief: {{Draft_Event_Memo.output}}"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tasks Config */}
                            {act.type === "tasks_create" && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Task Title
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.taskTitle || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { taskTitle: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="Follow up with {{trigger.payload.sender_name}}"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Due Date (YYYY-MM-DD)
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.taskDueDate || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { taskDueDate: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="2026-07-16"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Detailed Task notes
                                  </label>
                                  <textarea
                                    value={act.config.taskNotes || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { taskNotes: e.target.value })}
                                    rows={2}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder="Memo summary: {{Draft_Event_Memo.output}}"
                                  />
                                </div>
                              </div>
                            )}

                            {/* WhatsApp Config */}
                            {act.type === "whatsapp_send" && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                                    WhatsApp Target Category (نوع ارسال پیام)
                                  </label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateActionConfig(act.id, { whatsappType: "individual" })}
                                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                        (act.config.whatsappType || "individual") === "individual"
                                          ? "bg-green-950/20 text-green-400 border-green-800"
                                          : "bg-black border-slate-800 text-slate-400 hover:text-slate-250"
                                      }`}
                                    >
                                      <User className="h-3.5 w-3.5" />
                                      انفرادی (Individual)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateActionConfig(act.id, { whatsappType: "group" })}
                                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                        act.config.whatsappType === "group"
                                          ? "bg-green-950/20 text-green-400 border-green-800"
                                          : "bg-black border-slate-800 text-slate-400 hover:text-slate-250"
                                      }`}
                                    >
                                      <Users className="h-3.5 w-3.5" />
                                      گروهی (Group)
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    {(act.config.whatsappType || "individual") === "individual" 
                                      ? "Recipient Phone Number (شماره موبایل مقصد با کد کشور)" 
                                      : "WhatsApp Group ID (شناسه گروه واتساپ)"}
                                  </label>
                                  <input
                                    type="text"
                                    value={act.config.whatsappRecipient || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { whatsappRecipient: e.target.value })}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                    placeholder={(act.config.whatsappType || "individual") === "individual" ? "e.g. +989123456789 or {{trigger.payload.customer_phone}}" : "e.g. 120363021456789@g.us or {{trigger.payload.group_id}}"}
                                  />
                                  <p className="text-[10px] text-slate-500 mt-1">
                                    {(act.config.whatsappType || "individual") === "individual"
                                      ? "شماره تلفن مقصد را به همراه پیش‌شماره بین‌المللی (مثلاً ۹۸+) بدون صفر وارد کنید."
                                      : "شناسه گروه واتساپ را به فرمت @g.us وارد نمایید که از طریق کوئری وب‌سرویس‌ها قابل دریافت است."}
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Message Text (متن پیام ارسالی)
                                  </label>
                                  <textarea
                                    value={act.config.whatsappMessage || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { whatsappMessage: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:border-blue-500 focus:outline-none text-right"
                                    dir="rtl"
                                    placeholder="متن پیام خود را اینجا بنویسید... متغیرها مانند {{trigger.payload.customer_name}} نیز پشتیبانی می‌شوند."
                                  />
                                </div>
                              </div>
                            )}

                            {/* Multi Broadcast Config */}
                            {act.type === "multi_broadcast" && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                                    Select Broadcast Platforms (پلتفرم‌های ارسال پیام)
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { id: "gmail", label: "Gmail", color: "border-blue-800 text-blue-400 bg-blue-950/25" },
                                      { id: "whatsapp", label: "WhatsApp", color: "border-green-800 text-green-400 bg-green-950/25" },
                                      { id: "sms", label: "SMS (Twilio)", color: "border-yellow-800 text-yellow-400 bg-yellow-950/25" },
                                      { id: "slack", label: "Slack Webhook", color: "border-purple-800 text-purple-400 bg-purple-950/25" },
                                      { id: "telegram", label: "Telegram Bot", color: "border-sky-800 text-sky-400 bg-sky-950/25" },
                                    ].map((plat) => {
                                      const currentPlatforms = act.config.broadcastPlatforms || [];
                                      const isSelected = currentPlatforms.includes(plat.id);
                                      return (
                                        <button
                                          key={plat.id}
                                          type="button"
                                          onClick={() => {
                                            const nextPlatforms = isSelected
                                              ? currentPlatforms.filter((p) => p !== plat.id)
                                              : [...currentPlatforms, plat.id];
                                            handleUpdateActionConfig(act.id, { broadcastPlatforms: nextPlatforms });
                                          }}
                                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                            isSelected
                                              ? `${plat.color} ring-1 ring-offset-1 ring-offset-black ring-slate-700`
                                              : "bg-black border-slate-800 text-slate-500 hover:text-slate-300"
                                          }`}
                                        >
                                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-current animate-pulse" : "bg-slate-700"}`} />
                                          {plat.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1.5">
                                    کانال‌های دلخواه خود را فعال کنید. پیام به صورت همزمان به تمامی پلتفرم‌های انتخاب شده ارسال خواهد شد.
                                  </p>
                                </div>

                                <div className="border-t border-slate-850 pt-3 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Subject line (عنوان پیام - برای ایمیل)
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.broadcastSubject || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { broadcastSubject: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="e.g. وضعیت سفارش یا اعلان سیستم"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Recipient Email (ایمیل مقصد)
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.broadcastRecipientEmail || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { broadcastRecipientEmail: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="e.g. {{trigger.payload.customer_email}}"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      Recipient Phone (موبایل مقصد - برای SMS و واتساپ انفرادی)
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.broadcastRecipientPhone || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { broadcastRecipientPhone: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="e.g. {{trigger.payload.customer_phone}}"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                      WhatsApp Group ID (شناسه گروه واتساپ - در صورت ارسال گروهی)
                                    </label>
                                    <input
                                      type="text"
                                      value={act.config.broadcastGroupWhatsAppId || ""}
                                      onChange={(e) => handleUpdateActionConfig(act.id, { broadcastGroupWhatsAppId: e.target.value })}
                                      className="w-full bg-black border border-slate-800 rounded-lg p-2 font-mono text-slate-200 focus:border-blue-500 focus:outline-none"
                                      placeholder="e.g. 120363223456789@g.us"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
                                    Broadcast Message Content (متن اصلی پیام ارسالی)
                                  </label>
                                  <textarea
                                    value={act.config.broadcastMessage || ""}
                                    onChange={(e) => handleUpdateActionConfig(act.id, { broadcastMessage: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black border border-slate-800 rounded-lg p-2 font-sans text-slate-200 focus:border-blue-500 focus:outline-none text-right"
                                    dir="rtl"
                                    placeholder="پیام عمومی برای تمام پلتفرم‌ها..."
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add actions selector bar */}
          <div className="border-t border-slate-850 pt-5 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Add Action Pipeline Node
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleAddAction("ai_gemini")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Gemini AI
              </button>
              <button
                onClick={() => handleAddAction("gmail_send")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                Gmail
              </button>
              <button
                onClick={() => handleAddAction("sheets_append")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-green-400" />
                Sheets
              </button>
              <button
                onClick={() => handleAddAction("drive_create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-yellow-400" />
                Drive File
              </button>
              <button
                onClick={() => handleAddAction("calendar_create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-red-400" />
                Calendar Event
              </button>
              <button
                onClick={() => handleAddAction("tasks_create")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                Task Item
              </button>
              <button
                onClick={() => handleAddAction("whatsapp_send")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-green-400" />
                WhatsApp Message
              </button>
              <button
                onClick={() => handleAddAction("multi_broadcast")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
              >
                <Radio className="h-3.5 w-3.5 text-pink-400" />
                Multi-Platform Broadcast
              </button>
            </div>
          </div>

          {/* Bottom save bar */}
          <div className="border-t border-slate-850 pt-4 flex justify-between items-center">
            {selectedWorkflow?.id ? (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-bold rounded-lg border border-red-900/40 transition-colors cursor-pointer"
                id="delete-workflow-btn"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Deleting..." : "Delete from Database"}
              </button>
            ) : (
              <div></div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
              id="save-workflow-btn"
            >
              {isSaving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {isSaving ? "Saving Configuration..." : "Save Workflow Configuration"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
