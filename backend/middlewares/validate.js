module.exports = (schema, source = 'body') => {
  const middleware = (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        errors: result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
      });
    }
    req[source] = result.data;
    return next();
  };
  middleware.validation = { schema, source };
  return middleware;
};
