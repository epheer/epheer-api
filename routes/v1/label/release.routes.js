const express = require("express");
const controller = require("../../../controllers/label/release.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.post("/:id/new", auth, access("label"), controller.createRelease);
router.put("/:id", auth, access("label"), controller.updateRelease);
router.patch("/:id", auth, access("label"), controller.saveRelease);
router.patch("/:id/status", auth, access("manager"), controller.updateStatus);
router.get("/:id", auth, access("label"), controller.getReleaseById);
router.get("/artists/:ids", auth, access("label"), controller.createRelease);
router.get("/", auth, access("root"), controller.createRelease);

module.exports = router;
