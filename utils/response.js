function sendSuccess({
  reply,
  message,
  data = {},
  statusCode = 200,
  extraData = {},
}) {
  reply.code(statusCode).send({
    status: "success",
    message,
    data,
    ...extraData,
  });
}

function sendError({ reply, message, statusCode = 400 }) {
  reply.code(statusCode).send({
    status: "error",
    message,
  });
}

module.exports = { sendSuccess, sendError };
