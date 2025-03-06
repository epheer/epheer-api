const express = require("express");
const controller = require("../../../controllers/finances/royalty.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.patch("/:id", auth, access("artist"), controller.updatePaymentInfo);
router.post("/:id/income", auth, access("root"), controller.addIncome);
router.post("/:id/payout", auth, access("root"), controller.payout);
router.patch("/:id/block", auth, access("root"), controller.toggleBlock);
router.get("/:id", auth, access("label"), controller.getArtistRoyalties);
router.get("/active", auth, access("root"), controller.getAllActiveRoyalties);

module.exports = router;
