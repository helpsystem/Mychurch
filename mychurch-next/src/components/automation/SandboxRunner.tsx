/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { runAllTests, TestCaseResult } from "../tests/engine.test";
import { CheckCircle, AlertTriangle, Play, RefreshCw, Cpu, Clock, Check, Shield } from "lucide-react";

export default function TestRunner() {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    const startTime = performance.now();
    
    try {
      // Execute the test cases
      const testResults = await runAllTests();
      setResults(testResults);
    } catch (err) {
      console.error("Test execution block failed:", err);
    } finally {
      setIsRunning(false);
      setTotalDuration(Math.round(performance.now() - startTime));
    }
  };

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.status === "passed").length;
  const failedTests = results.filter((r) => r.status === "failed").length;

  return (
    <div className="bg-[#141414] rounded-xl border border-slate-800 p-5 shadow-xl text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Interactive System Unit Tests
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Validate template parser accuracy, context pipeline mapping, and automated execution safety.
          </p>
        </div>
        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
          id="run-tests-btn"
        >
          {isRunning ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isRunning ? "Running Suite..." : "Run Test Suite"}
        </button>
      </div>

      {/* Overview Statistics */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-[#0d0d0d] border border-slate-850 rounded-lg p-3 text-center">
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Scenarios</span>
            <span className="text-xl font-bold font-mono text-slate-200">{totalTests}</span>
          </div>
          <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-3 text-center">
            <span className="block text-[10px] uppercase font-mono tracking-wider text-green-400">Passed</span>
            <span className="text-xl font-bold font-mono text-green-400 flex items-center justify-center gap-1">
              <Check className="h-4 w-4 stroke-[3]" /> {passedTests}
            </span>
          </div>
          <div className="bg-red-950/10 border border-red-900/30 rounded-lg p-3 text-center">
            <span className="block text-[10px] uppercase font-mono tracking-wider text-red-400">Failed</span>
            <span className="text-xl font-bold font-mono text-red-400">
              {failedTests}
            </span>
          </div>
          <div className="bg-[#0d0d0d] border border-slate-850 rounded-lg p-3 text-center">
            <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Time</span>
            <span className="text-xl font-bold font-mono text-slate-200 flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-slate-550" /> {totalDuration}ms
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && (
        <div className="bg-black/40 border border-dashed border-slate-800 rounded-lg py-12 text-center text-slate-400">
          <Cpu className="h-8 w-8 mx-auto text-slate-700 stroke-[1.5] mb-2" />
          <p className="text-sm font-medium text-slate-300">Test suite is idle.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Execute the test suite to inspect system performance metrics and trigger validation assertions on the pipeline modules.
          </p>
        </div>
      )}

      {/* Test List */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {results.map((r, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 bg-[#0d0d0d] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors ${
                r.status === "passed" ? "border-slate-850 hover:border-slate-800" : "border-red-900/30 bg-red-950/10"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    r.status === "passed" 
                      ? "bg-slate-900 text-slate-400 border-slate-800" 
                      : "bg-red-950 text-red-400 border-red-900/30"
                  }`}>
                    {r.category}
                  </span>
                  <span className="text-xs font-mono text-slate-550">{r.durationMs}ms</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 truncate">{r.name}</h3>
                <p className="font-mono text-[10px] text-slate-450 mt-1 line-clamp-2">
                  {r.message}
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-end md:self-center">
                {r.status === "passed" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-950/20 border border-green-900/20 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Passed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/20 border border-red-900/20 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" /> Failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
