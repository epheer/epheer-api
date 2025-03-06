const express = require("express");
const controller = require("../../../controllers/label/note.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.patch("/:id", auth, access("manager"), controller.updateNote);
router.get("/:id", auth, access("manager"), controller.getNote);

module.exports = router;
