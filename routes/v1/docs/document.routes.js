const express = require("express");
const controller = require("../../../controllers/docs/document.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");
const multer = require("multer");

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const router = express.Router();

router.post(
  "/:id/:type/:documentId",
  auth,
  access("root"),
  upload.single("file"),
  controller.uploadDocument
);

router.get(
  "/:id/:type/:documentId",
  auth,
  access("label"),
  uploadTrack.single("file"),
  controller.downloadDocument
);

router.delete(
  "/:id/:type/:documentId",
  auth,
  access("root"),
  controller.deleteDocument
);

module.exports = router;
