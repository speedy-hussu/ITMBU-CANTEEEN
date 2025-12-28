import bcrypt from "bcryptjs";

export const verifyUser = async (enrollmentId: string, password: string) => {
  // Use .trim() to ensure no hidden spaces are messing up the hash
  // 1. Log with markers to see hidden spaces
  console.log(`Checking ID: |${enrollmentId}|`);
  console.log(`Checking Pass: |${password}|`);

  const user = {
    enrollmentId: "STU1001",
    password: "password123",
  };

  if (enrollmentId !== user.enrollmentId) {
    console.log("❌ ID mismatch");
    return null;
  }

  // 2. Compare using the trimmed pass
  const isMatch = user.password === password ? true : false;
  console.log("🔍Match in Service:", isMatch);
  console.log(user, "from service");
  return isMatch ? user : null;
};
