import { defineRailway, github, preserve, project, service } from "railway/iac";
// Railway records this name as the owner of the service; renaming it needs `railway config partials transfer`.
export const partial = "simon.dev";
export default defineRailway((ctx) => {
  const production = ctx.isEnvironment("production");
  const simonDev = service("simon.dev", {
    source: github("simonkberg/simon.dev", { checkSuites: false }),
    deploy: {
      limitOverride: { containers: { cpu: 1, memoryBytes: 2147483648 } },
      // testing is the template PR previews copy, so they get one replica that sleeps when idle.
      sleepApplication: !production,
    },
    healthcheck: "/health",
    replicas: { "europe-west4-drams3a": production ? 2 : 1 },
    domains: production ? ["simon.dev"] : [],
    networking: { privateNetworkEndpoint: "simon-dev" },
    env: {
      ANTHROPIC_API_KEY: preserve(),
      DISCORD_BOT_TOKEN: preserve(),
      DISCORD_CHANNEL_ID: preserve(),
      DISCORD_GUILD_ID: preserve(),
      LAST_FM_API_KEY: preserve(),
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: preserve(),
      SESSION_SECRET: preserve(),
      TURSO_AUTH_TOKEN: preserve(),
      TURSO_DATABASE_URL: preserve(),
    },
  });

  return project("simon.dev", {
    variables: { managed: true },
    resources: [simonDev],
  });
});
