const mongoose = require("mongoose");
const Organization = require("../models/organization.model"); // Adjust path if needed
const { faker } = require("@faker-js/faker");

const MONGO_URI = "mongodb://localhost:27017/orgadmin";

const seed = async () => {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("Connected to MongoDB. Seeding data...");

  // Clear old data
  await Organization.deleteMany();

  const orgTypes = [
    "TRAVEL_AGENT",
    "SUPPLIER",
    "PLATFORM",
    "TRAVEL_AGENT + SUPPLIER",
  ];
  const statuses = ["APPROVED", "SUSPENDED"];

  const orgs = Array.from({ length: 30 }).map(() => ({
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name().toLowerCase()),
    type: faker.helpers.arrayElement(orgTypes),
    businessInfo: {
      gstNumber: faker.string.alphanumeric(15),
      panNumber: faker.string.alphanumeric(10),
      tinNumber: faker.string.numeric(9),
      registrationId: faker.string.uuid(),
    },
    contactDetails: {
      phone: faker.phone.number("+91 ##########"),
      email: faker.internet.email(),
    },
    address: {
      country: faker.location.country(),
      state: faker.location.state(),
      city: faker.location.city(),
      pinCode: faker.location.zipCode(),
    },
    logoUrl: faker.image.url(),
    status: faker.helpers.arrayElement(statuses),
    rootUser: new mongoose.Types.ObjectId(),
    createdBy: faker.internet.email(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await Organization.insertMany(orgs);

  console.log("✅ Seeded 10 organizations.");
  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seeding failed:", err);
  mongoose.connection.close();
});
