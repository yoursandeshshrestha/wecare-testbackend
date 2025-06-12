const app = require("./app");
const connectDB = require("./config/db");

connectDB();

app.get("/", (req, res) => {
  res.json({
    data: {
      message: "Api is running",
    },
    status: "success",
    code: 200,
  });
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
