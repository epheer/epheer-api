const express = require("express");
const controller = require("../../../controllers/docs/contract.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");
const query = require("../../../middlewares/query.middleware");

const router = express.Router();

router.post(
  "/:id",
  auth,
  access("root"),
  controller.createContract.bind(controller)
);
router.post(
  "/:id/appendix",
  auth,
  access("root"),
  controller.createAppendix.bind(controller)
);
router.patch(
  "/:id",
  auth,
  access("root"),
  controller.updateContract.bind(controller)
);
router.patch(
  "/appendix/:apeendixNumber",
  auth,
  access("root"),
  controller.updateAppendix.bind(controller)
);
router.post(
  "/:id/termination",
  auth,
  access("root"),
  controller.createTermination.bind(controller)
);
router.patch(
  "/:id/termination",
  auth,
  access("root"),
  controller.confirmTermination.bind(controller)
);
router.get(
  "/:id",
  auth,
  access("label"),
  controller.getContractByArtist.bind(controller)
);
router.get(
  "/",
  auth,
  access("root"), query,
  controller.getAllContracts.bind(controller)
);

module.exports = router;
