const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const ctl = require("../controllers/organization.controller");

/* ---------- Multer setup (unchanged) ---------- */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads/"),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const fileFilter = (_, file, cb) =>
  file.originalname.match(/\.(jpg|jpeg|png|gif)$/)
    ? cb(null, true)
    : cb(new Error("Only image files are allowed!"), false);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ---------- CRUD + soft-delete / restore ---------- */
// Bulk operations must be first and more specific
router.delete("/bulk/delete", ctl.bulkDeleteOrganizations);
router.patch("/bulk/restore", ctl.bulkRestoreOrganizations);
router.post("/bulk/hard-delete", ctl.bulkHardDeleteOrganizations);

// Root routes
router.get("/", ctl.getOrganizations); // ?deleted=only|all
router.post("/", ctl.createOrganization);

// Routes with :id parameter
router.patch("/:id", ctl.updateOrganization);
router.patch("/:id/status", ctl.updateOrganizationStatus);
router.delete("/:id", ctl.deleteOrganization);
router.patch("/:id/restore", ctl.restoreOrganization);
router.delete("/:id/hard-delete", ctl.hardDeleteOrganization);

router.post("/:id/logo", upload.single("logo"), ctl.uploadOrganizationLogo);
router.get("/:id", ctl.getOrganizationById);

module.exports = router;
