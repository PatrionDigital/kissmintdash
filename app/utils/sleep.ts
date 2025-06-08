/**
 * Returns a promise that resolves after the specified number of milliseconds
 * @param ms Number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Creates a promise that can be resolved or rejected from outside
 * @returns An object containing the promise, resolve, and reject functions
 */
export const createDeferred = <T>() => {
  let resolve: (value: T | PromiseLike<T>) => void = () => {};
  let reject: (reason?: Error) => void = () => {};
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

export default sleep;
