import z from "zod";

export const env = parseAndValidateEnv({
  SESSION_SECRET: z.preprocess(
    (value) =>
      process.env.NODE_ENV === "development" && value == null
        ? "unsafe_dev_secret"
        : value,
    z.string().min(1, "SESSION_SECRET is required"),
  ),
  SLACK_CHANNEL: z.string().min(1, "SLACK_CHANNEL is required"),
  SLACK_TOKEN: z.string().min(1, "SLACK_TOKEN is required"),
});

function parseAndValidateEnv<T extends Record<string, z.ZodTypeAny>>(
  schema: T,
) {
  const envSchema = z.object(schema);

  const skipEnvValidation = z
    .stringbool()
    .default(false)
    .parse(process.env["SKIP_ENV_VALIDATION"]);

  const result = (
    skipEnvValidation ? envSchema.partial() : envSchema
  ).safeParse(process.env) as z.ZodSafeParseResult<z.infer<typeof envSchema>>;

  if (!result.success) {
    console.error(
      `✖ Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );

    throw new Error(
      "Invalid environment variables. Check the console output above for details.",
    );
  }

  return result.data;
}
