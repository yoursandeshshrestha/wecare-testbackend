const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://yoursandeshgeneral:Wc5HmGCWHenNZSj1@cluster0.v6cxr7m.mongodb.net/"
  );
  console.log("MongoDB connected");
};

module.exports = connectDB;
