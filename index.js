const express = require("express");
const app = express();
app.get("/health", (req,res)=>res.json({ok:true}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running: http://localhost:${PORT}/health`));
