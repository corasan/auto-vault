/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "auto-vault-server",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      providers: {
        aws: {
          profile: input.stage === "production" ? "henrypl-prod" : "henrypl-dev"
        }
      }
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("auto-vault-vpc");
    const cluster = new sst.aws.Cluster("auto-vault-cluster", { vpc });
    new sst.aws.Service("auto-vault-service", {
        cluster,
        loadBalancer: {
          ports: [{ listen: "80/http", forward: "3000/http" }],
        },
        dev: {
          command: "bun dev",
        },
      });
  },
});
