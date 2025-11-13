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
    .parse(process.env["SKIP_ENV_VALIDATION"]);

  try {
    return (skipEnvValidation ? envSchema.partial() : envSchema).parse(
      process.env,
    ) as z.infer<typeof envSchema>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("✖ Invalid environment variables:", z.formatError(error));

      throw new Error("Invalid environment variables");
    }

    throw error;
  }
}
