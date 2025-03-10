const express = require("express");
const controller = require("../../../controllers/label/note.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.patch(
  "/:id",
  auth,
  access("manager"),
  controller.updateNote.bind(controller)
);
router.get(
  "/:id",
  auth,
  access("manager"),
  controller.getNote.bind(controller)
);

module.exports = router;
