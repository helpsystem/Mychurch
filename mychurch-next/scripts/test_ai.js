const https = require('https');

const key = "AIzaSyB6NKiAHfFqPbk1tbVFDe-EuJi9hP_zg_w";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log("Supported generateContent models:");
        parsed.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .forEach(m => console.log(m.name));
      } else {
        console.log("Response:", data);
      }
    } catch(e) {
      console.log("Error parsing:", e, data);
    }
  });
}).on('error', err => console.error("Request error:", err));
