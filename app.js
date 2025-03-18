const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");
require("dotenv").config();

const app = express();

if (process.env.NODE_ENV === "production") {
  const corsOptions = {
    origin: /https:\/\/.*\.epheer\.ru$/,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  app.use(cors(corsOptions));
} else {
  const corsOptions = {
    origin: ["http://localhost:3000", "https://lab.epheer.ru", "https://epheer.ru"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }
  app.use(cors(corsOptions));
}
app.options("*", cors());

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(xss());
app.use(mongoSanitize({ allowDots: true }));
app.use("/", router);
app.use(errorMiddleware);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
