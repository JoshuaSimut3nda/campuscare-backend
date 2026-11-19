require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>CampusCare API Guide</title>
      <style>
        body { font: 16px/1.6 system-ui, sans-serif; max-width: 960px; margin: 40px auto; padding: 0 20px; color: #17324d; }
        h1, h2 { color: #125b83; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #ccd9e2; padding: 10px; text-align: left; }
        th, pre { background: #edf5fa; }
        pre { padding: 16px; overflow-x: auto; }
        a { color: #096a9f; }
      </style>
    </head>
    <body>
    <h1>CampusCare — Campus Maintenance Requests API</h1>
    <p><strong>Student ID:</strong> 202406725 | ICT251 Activity 7</p>
    <p>Report campus maintenance problems such as broken lights, leaking taps,
    and damaged furniture. Track requests from Pending to Completed.</p>
    <p><strong>API base URL:</strong> <code id="base-url"></code></p>
    <script>document.getElementById("base-url").textContent = window.location.origin;</script>
    <ul>
      <li><a href="/health">Check database connection</a></li>
      <li><a href="/api/records">View records</a></li>
    </ul>
    <h2>Routes</h2>
    <table>
      <tr><th>Method</th><th>Route</th><th>Purpose</th><th>Success</th></tr>
      <tr><td>GET</td><td>/</td><td>This API guide</td><td>200</td></tr>
      <tr><td>GET</td><td>/health</td><td>Check server and database</td><td>200</td></tr>
      <tr><td>GET</td><td>/api/records</td><td>Read all records; returns an array</td><td>200</td></tr>
      <tr><td>GET</td><td>/api/records/:id</td><td>Read one record</td><td>200</td></tr>
      <tr><td>POST</td><td>/api/records</td><td>Create a record</td><td>201</td></tr>
      <tr><td>PUT</td><td>/api/records/:id</td><td>Replace all four editable fields</td><td>200</td></tr>
      <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td><td>200</td></tr>
    </table>
    <h2>Input fields</h2>
    <p>POST and PUT require all four fields as strings. Send
    <code>Content-Type: application/json</code>. The database generates
    <code>id</code>; do not include it in the request body.</p>
    <table>
      <tr><th>Field</th><th>Rule</th></tr>
      <tr><td>title</td><td>3–80 characters</td></tr>
      <tr><td>category</td><td>2–40 characters, such as Electrical, Plumbing, Maintenance, or Furniture</td></tr>
      <tr><td>description</td><td>5–300 characters</td></tr>
      <tr><td>status</td><td>Exactly Pending, In progress, or Completed</td></tr>
    </table>
    <p>IDs in route addresses must be positive whole numbers. PUT updates an
    existing record and does not create a missing one.</p>
    <h2>Example POST and PUT body</h2>
    <p>Use this body for POST /api/records or PUT /api/records/:id,
    replacing :id with an existing record ID.</p>
    <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>
    <h2>Responses</h2>
    <p>GET one, POST, and PUT return a record object including its ID.
    DELETE returns <code>{"message":"Record deleted."}</code>.</p>
    <table>
      <tr><th>Status</th><th>Meaning</th></tr>
      <tr><td>200</td><td>Successful read, update, deletion, or health check</td></tr>
      <tr><td>201</td><td>Record created</td></tr>
      <tr><td>400</td><td>Invalid input, invalid ID, or malformed JSON</td></tr>
      <tr><td>404</td><td>Record or route not found</td></tr>
      <tr><td>500</td><td>Unexpected server error</td></tr>
      <tr><td>503</td><td>Database unavailable during health check</td></tr>
    </table>
    <p>Errors return JSON with a <code>message</code> field, for example
    <code>{"message":"Record not found."}</code>.</p>
    <p>A hosted service that has been idle may need time to start.
    Wait briefly and retry the request.</p>
    </body></html>
  `);
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      message: "Server and database are working."
    });
  } catch (error) {
    console.error(error);
    res.status(503).json({
      message: "Database connection failed."
    });
  }
});

app.use("/api/records", require("./routes/records"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON."
    });
  }

  console.error(error);
  res.status(500).json({
    message: "An unexpected server error occurred."
  });
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
