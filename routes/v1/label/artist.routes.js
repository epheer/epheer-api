const express = require("express");
const controller = require("../../../controllers/label/artist.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");
const query = require("../../../middlewares/query.middleware");

const router = express.Router();

router.patch(
  "/:id/name",
  auth,
  access("root"),
  controller.updateStageName.bind(controller)
);
router.patch(
  "/:id/manager",
  auth,
  access("root"),
  controller.linkManager.bind(controller)
);
router.get(
  "/:ids",
  auth,
  access("label"),
  controller.getArtistsByIds.bind(controller)
);
router.get(
  "/",
  auth,
  access("root"), query,
  controller.getAllArtists.bind(controller)
);

module.exports = router;
