export const delay = async (delayMs) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delayMs);
  });
