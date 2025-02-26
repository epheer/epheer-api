const models = {
  // users
  User: require("./users/user.model"),
  Token: require("./users/token.model"),
  Info: require("./users/info.model"),
  // label
  Artist: require("./label/artist.model"),
  Release: require("./label/release.model"),
  Track: require("./label/track.model"),
  Note: require("./label/note.model"),
  // finances
  Royalty: require("./finances/royalty.model"),
  // docs
  Contract: require("./docs/contract.model"),
};

Object.entries(models).forEach(([key, value]) => {
  module.exports[key] = value;
});
