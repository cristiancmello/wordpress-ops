const { exec } = require("shelljs");

const child = exec(
  "cd ../station-maker && cdk deploy --require-approval never",
  {
    silent: true,
    async: true
  }
);

child.stdout.on("data", function(data) {
  console.log(data);
});

child.stderr.on("data", data => {
  console.log(data);
});
