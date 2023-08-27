export const delay = async (delayMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, delayMs);
  });
