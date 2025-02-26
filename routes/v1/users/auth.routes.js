const express = require("express");
const controller = require("../../../controllers/users/auth.controller");
const auth = require("../../../middlewares/auth.middleware");
const access = require("../../../middlewares/access.middleware");

const router = express.Router();

router.post("/register", auth, access("root"), controller.registration);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/refresh", controller.refresh);
router.post("/:id/deactivate", auth, access("root"), controller.deactivate);
router.post("/:id/unblock", auth, access("root"), controller.unblock);
router.put(
  "/:id/password",
  auth,
  access("personal"),
  controller.changePassword
);
router.put("/:id/email", auth, access("personal"), controller.changeEmail);

module.exports = router;
