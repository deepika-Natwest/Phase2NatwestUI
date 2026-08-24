export const getImageUrl = (path) => {
  if (!path) return "";
  return `${process.env.REACT_APP_API_URL}${path}`;
};
