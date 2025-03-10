const express = require("express");
const controller = require("../../../controllers/users/auth.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.post(
  "/register",
  auth,
  access("root"),
  controller.registration.bind(controller)
);
router.post("/login", controller.login.bind(controller));
router.post("/logout", controller.logout.bind(controller));
router.get("/refresh", controller.refresh.bind(controller));
router.post(
  "/:id/deactivate",
  auth,
  access("root"),
  controller.deactivate.bind(controller)
);
router.post(
  "/:id/unblock",
  auth,
  access("root"),
  controller.unblock.bind(controller)
);
router.put(
  "/:id/password",
  auth,
  access("personal"),
  controller.changePassword.bind(controller)
);
router.put(
  "/:id/email",
  auth,
  access("personal"),
  controller.changeEmail.bind(controller)
);

module.exports = router;
