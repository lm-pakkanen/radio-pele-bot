export const getSong = async (url) => {
  try {
    return { success: true, url };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};
