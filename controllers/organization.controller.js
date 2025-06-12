const Organization = require("../models/organization.model");
const mongoose = require("mongoose");

/* 🔍 GET ORGANIZATIONS */
exports.getOrganizations = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const type = req.query.type || "";

    // Fix the deleted flag parsing
    let deletedFlag = "";
    if (req.query.deleted) {
      deletedFlag = req.query.deleted.toString().toLowerCase();
    }

    const filter = {
      name: { $regex: search, $options: "i" },
      type: type || { $exists: true },
      status: { $regex: status, $options: "i" },
    };

    if (deletedFlag === "only") {
      filter.deletedAt = { $ne: null };
    } else if (deletedFlag === "all") {
      // do nothing, show all records
    } else {
      filter.deletedAt = null;
    }

    // First get the total count
    const total = await Organization.countDocuments(filter);

    const totalPages = Math.ceil(total / limit) || 1;

    // Then get the items for the current page
    const items = await Organization.find(filter).skip(skip).limit(limit);

    res.status(200).json({
      status: "success",
      message: "Organizations retrieved",
      data: {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch organizations",
      error: err.message,
    });
  }
};

/* 🔍 GET BY ID */
exports.getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org)
      return res.status(404).json({
        status: "error",
        message: "Organization not found",
      });

    res.status(200).json({
      status: "success",
      message: "Organization retrieved",
      data: org,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch organization",
      error: err.message,
    });
  }
};

/* ➕ CREATE */
exports.createOrganization = async (req, res) => {
  try {
    const org = await new Organization(req.body).save();
    res.status(201).json({
      status: "success",
      message: "Organization created",
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to create organization",
      error: err.message,
    });
  }
};

/* ✏️ UPDATE */
exports.updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true }
    );
    if (!org)
      return res.status(404).json({
        status: "error",
        message: "Organization not found or deleted",
      });

    res.status(200).json({
      status: "success",
      message: "Organization updated",
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to update organization",
      error: err.message,
    });
  }
};

/* 🔄 UPDATE STATUS */
exports.updateOrganizationStatus = async (req, res) => {
  try {
    const org = await Organization.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { status: req.body.status },
      { new: true }
    );
    if (!org)
      return res.status(404).json({
        status: "error",
        message: "Organization not found or deleted",
      });

    res.status(200).json({
      status: "success",
      message: "Organization status updated",
      data: org,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Failed to update status",
      error: err.message,
    });
  }
};

/* 🗑️ SOFT DELETE */
exports.deleteOrganization = async (req, res) => {
  try {
    const result = await Organization.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() }
    );
    if (!result)
      return res.status(404).json({
        status: "error",
        message: "Organization not found or already deleted",
      });

    res.status(200).json({
      status: "success",
      message: "Organization soft-deleted",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete organization",
      error: err.message,
    });
  }
};

/* 🗑️ BULK SOFT DELETE */
exports.bulkDeleteOrganizations = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Please provide an array of IDs",
      });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid organization IDs provided",
      });
    }

    const result = await Organization.updateMany(
      { _id: { $in: validIds }, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "No organizations found to delete or all are already deleted",
      });
    }

    res.status(200).json({
      status: "success",
      message: `${result.modifiedCount} organizations deleted`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Bulk delete failed",
      error: err.message,
    });
  }
};

/* ♻️ RESTORE */
exports.restoreOrganization = async (req, res) => {
  try {
    const org = await Organization.findOneAndUpdate(
      { _id: req.params.id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );
    if (!org)
      return res.status(404).json({
        status: "error",
        message: "Organization not found or not deleted",
      });

    res.status(200).json({
      status: "success",
      message: "Organization restored",
      data: org,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to restore organization",
      error: err.message,
    });
  }
};

/* ♻️ BULK RESTORE */
exports.bulkRestoreOrganizations = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Please provide an array of IDs",
      });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid organization IDs provided",
      });
    }

    const result = await Organization.updateMany(
      { _id: { $in: validIds }, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "No deleted organizations found to restore",
      });
    }

    res.status(200).json({
      status: "success",
      message: `${result.modifiedCount} organizations restored`,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Bulk restore failed",
      error: err.message,
    });
  }
};

/* ❌ HARD DELETE */
exports.hardDeleteOrganization = async (req, res) => {
  try {
    const existing = await Organization.findOne({
      _id: req.params.id,
      deletedAt: { $ne: null },
    });

    if (!existing) {
      return res.status(400).json({
        status: "error",
        message: "Organization must be soft-deleted before hard deletion",
      });
    }

    await Organization.findByIdAndDelete(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Organization permanently deleted",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to hard delete organization",
      error: err.message,
    });
  }
};

/* 🖼️ UPLOAD LOGO */
exports.uploadOrganizationLogo = async (req, res) => {
  try {
    const logoUrl = `/uploads/${req.file.filename}`;
    const org = await Organization.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { logoUrl },
      { new: true }
    );

    if (!org)
      return res.status(404).json({
        status: "error",
        message: "Organization not found or deleted",
      });

    res.status(200).json({
      status: "success",
      message: "Logo uploaded",
      data: org,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Failed to upload logo",
      error: err.message,
    });
  }
};

/* ❌ BULK HARD DELETE */
exports.bulkHardDeleteOrganizations = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Please provide an array of IDs",
      });
    }

    // Validate that all IDs are valid ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid organization IDs provided",
      });
    }

    // First check if all organizations are soft-deleted
    const existing = await Organization.find({
      _id: { $in: validIds },
      deletedAt: { $ne: null },
    });

    if (existing.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No soft-deleted organizations found to hard delete",
      });
    }

    // Find organizations that are not soft-deleted
    const notSoftDeleted = await Organization.find({
      _id: { $in: validIds },
      deletedAt: null,
    });

    // Perform the hard delete
    const result = await Organization.deleteMany({
      _id: { $in: validIds },
      deletedAt: { $ne: null },
    });

    res.status(200).json({
      status: "success",
      message: `${result.deletedCount} organizations permanently deleted`,
      data: {
        deletedCount: result.deletedCount,
        totalRequested: ids.length,
        validIds: validIds.length,
        notSoftDeleted: notSoftDeleted.length,
        notFound: validIds.length - existing.length - notSoftDeleted.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Bulk hard delete failed",
      error: err.message,
    });
  }
};
