import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const saltRounds = 10;

export async function hashString(str: string): Promise<string> {
  const hashedString = await bcrypt.hash(str, saltRounds);

  return hashedString;
}

export async function compareHash(
  str: string,
  hashedString: string
): Promise<boolean> {
  return bcrypt.compare(str, hashedString);
}

export async function generateToken(_id: string): Promise<string> {
  const token = jwt.sign(
    {
      userId: _id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  return token;
}
