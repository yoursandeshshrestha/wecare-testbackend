const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },

  slug: {
    type: String,
    required: true,
    lowercase: true,
  },

  type: {
    type: String,
    enum: ["TRAVEL_AGENT", "SUPPLIER", "TRAVEL_AGENT + SUPPLIER", "PLATFORM"],
    required: true,
  },

  businessInfo: {
    gstNumber: String,
    panNumber: String,
    tinNumber: String,
    registrationId: String,
  },

  contactDetails: {
    phone: String,
    email: String,
  },

  address: {
    country: String,
    state: String,
    city: String,
    pinCode: String,
  },

  logoUrl: String,

  status: {
    type: String,
    enum: ["APPROVED", "SUSPENDED"], // ✅ removed "PENDING"
    default: "APPROVED", // ✅ set a sensible default
  },

  rootUser: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  deletedAt: { type: Date, default: null },
});

// Pre-save middleware to handle duplicate slugs
organizationSchema.pre("save", async function (next) {
  if (!this.isModified("slug")) return next();

  try {
    // Check if slug exists
    const existingOrg = await this.constructor.findOne({
      slug: this.slug,
      _id: { $ne: this._id }, // Exclude current document
    });

    if (existingOrg) {
      // Add timestamp to make slug unique
      this.slug = `${this.slug}-${Date.now()}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Organization", organizationSchema);
