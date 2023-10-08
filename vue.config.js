const { defineConfig } = require("@vue/cli-service");
const fs = require("fs");
module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  devServer: {
    host: "0.0.0.0",
    port: 8080,
    https: {
      key: fs.readFileSync("./certs/cert.key"),
      cert: fs.readFileSync("./certs/cert.crt"),
      ca: fs.readFileSync("./certs/ca.crt"),
    },
  },
});
