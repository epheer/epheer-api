const express = require("express");
const controller = require("../../../controllers/finances/royalty.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.patch(
  "/:id",
  auth,
  access("artist"),
  controller.updatePaymentInfo.bind(controller)
);
router.post(
  "/:id/income",
  auth,
  access("root"),
  controller.addIncome.bind(controller)
);
router.post(
  "/:id/payout",
  auth,
  access("root"),
  controller.payout.bind(controller)
);
router.patch(
  "/:id/block",
  auth,
  access("root"),
  controller.toggleBlock.bind(controller)
);
router.get(
  "/:id",
  auth,
  access("label"),
  controller.getArtistRoyalties.bind(controller)
);
router.get(
  "/active",
  auth,
  access("root"),
  controller.getAllActiveRoyalties.bind(controller)
);

module.exports = router;
