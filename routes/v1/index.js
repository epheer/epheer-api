const express = require("express");
const router = express.Router();

const routes = [{ path: "/auth", route: require("./users/auth.routes") }];

routes.forEach(({ path, route }) => {
  router.use(path, route);
});

module.exports = router;
