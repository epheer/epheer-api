const express = require("express");
const router = express.Router();

const routes = [
  { path: "/auth", route: require("./users/auth.routes") },
  { path: "/users", route: require("./users/info.routes") },
  { path: "/artists", route: require("./label/artist.routes") },
  { path: "/managers", route: require("./label/manager.routes") },
  { path: "/media", route: require("./label/media.routes") },
  { path: "/releases", route: require("./label/release.routes") },
];

routes.forEach(({ path, route }) => {
  router.use(path, route);
});

module.exports = router;
