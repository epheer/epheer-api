const express = require("express");
const controller = require("../../../controllers/label/media.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");
const multer = require("multer");

const uploadCover = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const uploadTrack = multer({
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const router = express.Router();

router.post(
  "/:id/:releaseId/cover",
  auth,
  access("label"),
  uploadCover.single("file"),
  controller.uploadCover
);

router.post(
  "/:id/:releaseId/tracks",
  auth,
  access("label"),
  uploadTrack.single("file"),
  controller.uploadTrack
);

router.get(
  "/:id/:releaseId/cover/:size",
  auth,
  access("label"),
  controller.getCover
);

router.get(
  "/:id/:releaseId/tracks/:fileName",
  auth,
  access("label"),
  controller.getTrack
);

router.get(
  "/:id/:releaseId/:fileName/download",
  auth,
  access("label"),
  controller.downloadFile
);

router.delete(
  "/:id/:releaseId/:fileName",
  auth,
  access("label"),
  controller.deleteFile
);

module.exports = router;
