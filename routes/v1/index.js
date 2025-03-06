const express = require("express");
const router = express.Router();

const routes = [
  // users
  { path: "/auth", route: require("./users/auth.routes") },
  { path: "/users", route: require("./users/info.routes") },
  // label
  { path: "/artists", route: require("./label/artist.routes") },
  { path: "/managers", route: require("./label/manager.routes") },
  { path: "/media", route: require("./label/media.routes") },
  { path: "/releases", route: require("./label/release.routes") },
  { path: "/tracks", route: require("./label/track.routes") },
  { path: "/notes", route: require("./label/note.routes") },
];

routes.forEach(({ path, route }) => {
  router.use(path, route);
});

module.exports = router;
