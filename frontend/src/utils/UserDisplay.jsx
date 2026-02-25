export function isDeletedUser(username) {
  return username === "__DELETED_USER__" || username === "Deleted User";
}

export function displayUsername(username) {
  if (isDeletedUser(username)) return "Deleted User";
  return username || "Chef";
}