export const hasAnyRole = (userRole, allowedRoles = []) => {
  return allowedRoles.includes(userRole);
};