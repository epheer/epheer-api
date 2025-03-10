const express = require("express");
const controller = require("../../../controllers/label/track.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.post(
  "/:id",
  auth,
  access("label"),
  controller.createTrack.bind(controller)
);
router.put(
  "/:id/:trackId",
  auth,
  access("label"),
  controller.updateTrack.bind(controller)
);
router.patch(
  "/:id",
  auth,
  access("label"),
  controller.reorderTracks.bind(controller)
);
router.delete(
  "/:id/:trackId",
  auth,
  access("label"),
  controller.deleteTrack.bind(controller)
);

module.exports = router;
