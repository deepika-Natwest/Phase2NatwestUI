const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "";

export const getImageUrl = (imageName) => {
  return `${IMAGE_BASE_URL}/${imageName}`;
};
