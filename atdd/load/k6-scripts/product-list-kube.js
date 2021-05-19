import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    // Ramp-up from 1 to 20 virtual users (VUs) in 30s
    { duration: "30s", target: 20 },

    // Stay at rest on 20 VUs for 30s
    { duration: "30s", target: 20 },

    // Ramp-down from 20 to 0 VUs for 10s
    { duration: "10s", target: 0 },
  ],
};

export default function () {
  const response = http.get("http://localhost:32300/api/v1/product", {
    headers: { Accepts: "application/json" },
  });
  check(response, { "status is 200": (r) => r.status === 200 });
  check(response, { "Total is 31": (r) => (r.json()["total"] = 31) });
  check(response, {
    "Product ID 2 is 43 Piece dinner Set": (r) =>
      (r.json()["products"][1]["product_name"] = "43 Piece dinner Set"),
  });
  // sleep(0.3);
}
