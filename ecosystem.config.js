module.exports = {
  apps: [
    {
      name: "memefactory-api",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "memefactory-stream",
      script: "dist/workers/twitter-stream.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "memefactory-poll",
      script: "dist/workers/twitter-poll.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "memefactory-scorer",
      script: "dist/workers/scorer.js",
      instances: 2,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "memefactory-launcher",
      script: "dist/workers/launcher.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "memefactory-treasury",
      script: "dist/workers/treasury.js",
      instances: 1,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
