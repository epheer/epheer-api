const express = require("express");
const controller = require("../../../controllers/users/auth.controller");

const router = express.Router();

router.post("/register", controller.registration);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/refresh", controller.refresh);
router.post("/:id/deactivate", controller.deactivate);
router.post("/:id/unblock", controller.unblock);
router.put("/:id/password", controller.changePassword);
router.put("/:id/email", controller.changeEmail);

module.exports = router;
