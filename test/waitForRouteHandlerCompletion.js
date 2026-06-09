const waitForRouteHandlerCompletion = async (func, req, res) => {
  let next;
  const promise = new Promise((resolve, reject) => {
    next = jest.fn((error) => {
      if (error) return reject(error);
      resolve();
    });
    res.on("finish", () => {
      resolve();
    });
  });

  try {
    await func(req, res, next);
  } catch (error) {
    return next(error); 
  }

  await promise;
  return next;
};

module.exports = waitForRouteHandlerCompletion;