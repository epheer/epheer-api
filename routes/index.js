const express = require("express");
const router = express.Router();

const routes = [{ path: "/v1", route: require("./v1") }];

routes.forEach(({ path, route }) => {
  router.use(path, route);
});

module.exports = router;
