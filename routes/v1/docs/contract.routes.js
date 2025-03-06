const express = require("express");
const controller = require("../../../controllers/docs/contract.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.post("/:id", auth, access("root"), controller.createContract);
router.post("/:id/appendix", auth, access("root"), controller.createAppendix);
router.patch("/:id", auth, access("root"), controller.updateContract);
router.patch(
  "/appendix/:apeendixNumber",
  auth,
  access("root"),
  controller.updateAppendix
);
router.post(
  "/:id/termination",
  auth,
  access("root"),
  controller.createTermination
);
router.patch(
  "/:id/termination",
  auth,
  access("root"),
  controller.confirmTermination
);
router.get("/:id", auth, access("label"), controller.getContractByArtist);
router.get("/", auth, access("root"), controller.getAllContracts);

module.exports = router;
