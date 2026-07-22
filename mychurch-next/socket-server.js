const express = require("express");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);

// In a real production environment, you should restrict origins to your actual domain.
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// IMPORTANT: This should be provided in your .env or similar.
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8').split('\n');
    envConfig.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}
const GOOGLE_TRANSLATE_API = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_URL || "";

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join a specific meeting room
  socket.on("join_meeting", (meetingId) => {
    socket.join(meetingId);
    console.log(`👤 User joined meeting: ${meetingId}`);
  });

  // Receive live speech text from the presentation admin
  socket.on("speaker_text", async (data) => {
    const { meetingId, text, isFinal } = data;
    if (!meetingId) return;

    // Fast initial emit (untranslated) for immediate display (<1s delay)
    io.to(meetingId).emit("live_caption", {
      original: text,
      translated: "",
      isFinal: false
    });

    // When the sentence ends, send to translation API
    if (isFinal) {
      if (!GOOGLE_TRANSLATE_API) {
          // If no API is configured, just broadcast the final original text
          io.to(meetingId).emit("live_caption", {
            original: text,
            translated: "(مترجم تنظیم نشده است)",
            isFinal: true
          });
          return;
      }

      try {
        const response = await fetch(GOOGLE_TRANSLATE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text, source: 'fa', target: 'en' })
        });
        const result = await response.json();

        io.to(meetingId).emit("live_caption", {
          original: text,
          translated: result.translated || "",
          isFinal: true
        });
      } catch (error) {
        console.error("Translation Error:", error);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Socket Server is running on port ${PORT}`);
});
