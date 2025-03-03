const express = require("express");
const controller = require("../../../controllers/label/artist.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.patch("/:id", auth, access("root"), controller.updateStageName);
router.patch("/:id/link", auth, access("root"), controller.linkManager);
router.get("/:ids", auth, access("label"), controller.getArtistsByIds);
router.get("/", auth, access("root"), controller.getAllArtists);

module.exports = router;
