const express = require("express");
const controller = require("../../../controllers/label/manager.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.get(
  "/:id/artists",
  auth,
  access("manager"),
  controller.getArtistsByManager.bind(controller)
);
router.get(
  "/",
  auth,
  access("root"),
  controller.getAllManagers.bind(controller)
);

module.exports = router;
