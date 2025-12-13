export function validateCredentials(
  username: string,
  password: string,
  role: string
) {
  if (role === "POS") {
    return username === process.env.POS_USER && password === process.env.POS_PASS;
  }

  if (role === "KDS") {
    return username === process.env.KDS_USER && password === process.env.KDS_PASS;
  }

  if (role === "ADMIN") {
    return username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS;
  }

  return false;
}
