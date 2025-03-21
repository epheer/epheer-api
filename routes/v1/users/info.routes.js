const express = require("express");
const controller = require("../../../controllers/users/info.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");
const query = require("../../../middlewares/query.middleware");

const router = express.Router();

router.put(
  "/:id",
  auth,
  access("personal"),
  controller.updateInfo.bind(controller)
);
router.get(
  "/:ids",
  auth,
  access("label"),
  controller.getUsersByIds.bind(controller)
);
router.get("/", auth, access("root"), query, controller.getAllUsers.bind(controller));

module.exports = router;
