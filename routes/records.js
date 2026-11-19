const router = require("express").Router();
const pool = require("../db");

function validateId(req, res, next) {
  const id = Number(req.params.id);

  if (!/^[1-9]\d*$/.test(req.params.id) ||
      !Number.isSafeInteger(id)) {
    return res.status(400).json({
      message: "ID must be a positive whole number."
    });
  }

  req.recordId = id;
  next();
}

function validateRecord(req, res, next) {
  const fields = {
    title: [3, 80],
    category: [2, 40],
    description: [5, 300]
  };

  const body = req.body || {};
  const record = {};

  for (const [field, [min, max]] of Object.entries(fields)) {
    if (typeof body[field] !== "string") {
      return res.status(400).json({
        message: `${field} must be text.`
      });
    }

    const value = body[field].trim();

    if (value.length < min || value.length > max) {
      return res.status(400).json({
        message: `${field} must have ${min} to ${max} characters.`
      });
    }

    record[field] = value;
  }

  const allowedStatuses = [
    "Pending",
    "In progress",
    "Completed"
  ];

  if (typeof body.status !== "string" ||
      !allowedStatuses.includes(body.status.trim())) {
    return res.status(400).json({
      message: "Status must be Pending, In progress, or Completed."
    });
  }

  record.status = body.status.trim();
  req.record = record;
  next();
}

// Read all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM records ORDER BY id"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Read one record
router.get("/:id", validateId, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM records WHERE id = $1",
      [req.recordId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Record not found."
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create a record
router.post("/", validateRecord, async (req, res, next) => {
  try {
    const { title, category, description, status } = req.record;

    const result = await pool.query(
      `INSERT INTO records
       (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, category, description, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update a record
router.put(
  "/:id",
  validateId,
  validateRecord,
  async (req, res, next) => {
    try {
      const { title, category, description, status } = req.record;

      const result = await pool.query(
        `UPDATE records
         SET title = $1,
             category = $2,
             description = $3,
             status = $4
         WHERE id = $5
         RETURNING *`,
        [title, category, description, status, req.recordId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Record not found."
        });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

// Delete a record
router.delete("/:id", validateId, async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [req.recordId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Record not found."
      });
    }

    res.status(200).json({
      message: "Record deleted."
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;