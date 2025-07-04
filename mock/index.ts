if (typeof window === "undefined") {
} else {
  const { worker } = require("./browser");
  worker.start();
}
