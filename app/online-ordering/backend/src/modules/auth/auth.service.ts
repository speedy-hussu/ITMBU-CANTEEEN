import bcrypt from "bcryptjs";

export const verifyUser = async (enrollmentId: string, password: string) => {
  // Use .trim() to ensure no hidden spaces are messing up the hash
  // 1. Log with markers to see hidden spaces

  const user = {
    enrollmentId: "23C11036",
    password: "Husain@17",
  };
  const inputID = enrollmentId.trim().toUpperCase();
  const dbID = user.enrollmentId.trim().toUpperCase();
  if (inputID !== dbID) {
    console.log("❌ ID mismatch");
    console.log(`Checking ID: |${enrollmentId}|`);
    console.log(`Checking Pass: |${password}|`);
    return null;
  }

  // 2. Compare using the trimmed pass
  const isMatch = user.password === password ? true : false;
  console.log("🔍Match in Service:", isMatch);
  console.log(user, "from service");
  return isMatch ? user : null;
};
