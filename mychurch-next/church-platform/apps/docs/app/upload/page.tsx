"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !tenantId) {
      alert("Please provide a file and Tenant ID");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("tenantId", tenantId); // In a real app, this comes from the auth session

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        alert("Upload successful!");
        setFile(null);
        setTitle("");
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Upload Media (Telegram Cloud Storage)</h2>
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>Tenant ID (Simulated):</label>
          <input 
            type="text" 
            value={tenantId} 
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="e.g. cm0abcd..."
            style={{ width: "100%", padding: "8px" }}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>Title:</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sermon Title"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>File:</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ width: "100%" }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: "10px", backgroundColor: loading ? "#999" : "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          {loading ? "Uploading to Telegram..." : "Upload"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "5px", overflow: "auto" }}>
          <h4>Result:</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
