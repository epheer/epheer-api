const express = require("express");
const controller = require("../../../controllers/label/track.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.post("/:id", auth, access("label"), controller.createTrack);
router.put("/:id/:trackId", auth, access("label"), controller.updateTrack);
router.patch("/:id", auth, access("label"), controller.reorderTracks);
router.delete("/:id/:trackId", auth, access("label"), controller.deleteTrack);

module.exports = router;
