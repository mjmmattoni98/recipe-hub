import "dotenv/config";
import { auth } from "@/lib/auth";
import { env } from "@/env";

const [name, email, password] = process.argv.slice(2);

async function main() {
  if (!name || !email || !password) {
    console.error(
      "Usage: pnpm tsx scripts/create-user.ts <name> <email> <password>",
    );
    process.exit(1);
  }

  console.log(`Creating user ${email}...`);
  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: new Headers({
        "x-admin-secret": env.BETTER_AUTH_SECRET,
      }),
    });
    console.log("User created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to create user:", error);
    process.exit(1);
  }
}

await main();
