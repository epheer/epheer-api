const express = require("express");
const controller = require("../../../controllers/label/release.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");
const query = require("../../../middlewares/query.middleware");

const router = express.Router();

router.post(
  "/:id/new",
  auth,
  access("label"),
  controller.createRelease.bind(controller)
);
router.put(
  "/:id",
  auth,
  access("label"),
  controller.updateRelease.bind(controller)
);
router.patch(
  "/:id",
  auth,
  access("label"),
  controller.saveRelease.bind(controller)
);
router.patch(
  "/:id/status",
  auth,
  access("manager"),
  controller.updateStatus.bind(controller)
);
router.get(
  "/:id",
  auth,
  access("label"),
  controller.getReleaseById.bind(controller)
);
router.get(
  "/artists/:ids",
  auth,
  access("label"), query,
  controller.getReleasesByArtists.bind(controller)
);
router.get(
  "/",
  auth,
  access("root"), query,
  controller.getAllReleases.bind(controller)
);

module.exports = router;
