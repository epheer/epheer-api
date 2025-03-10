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
  controller.uploadDocument.bind(controller)
);

router.get(
  "/:id/:type/:documentId",
  auth,
  access("label"),
  controller.downloadDocument.bind(controller)
);

router.delete(
  "/:id/:type/:documentId",
  auth,
  access("root"),
  controller.deleteDocument.bind(controller)
);

module.exports = router;
