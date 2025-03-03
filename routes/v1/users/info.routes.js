const express = require("express");
const controller = require("../../../controllers/users/info.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.patch("/:id", auth, access("personal"), controller.updateInfo);
router.get("/:ids", auth, access("label"), controller.getUsersByIds);
router.get("/", auth, access("root"), controller.getAllUsers);

module.exports = router;
