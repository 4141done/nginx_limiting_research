function limitableUri(r) {
  return r.variables.request_uri.split("?")[0];
}

async function staticWindowRateLimiter(r) {
  r.error(`The qouta is ${r.variables.quota}`);
  const requestCount = r.variables.counter
    ? parseInt(r.variables.counter, 10)
    : 1;
  const quota = parseInt(r.variables.quota, 10);

  r.headersOut["Limit"] = r.variables.quota;

  if (requestCount >= quota) {
    r.headersOut["Limit-Used"] = r.variables.counter;
    return r.return(
      429,
      JSON.stringify({
        error: "rate limit exceeded",
      })
    );
  }

  if (!r.variables.counter) {
    r.variables.counter = requestCount;
    r.variables.countnode = r.variables.server_addr;
  } else {
    r.variables.counter = requestCount + 1;
  }
  r.headersOut["Limit-Used"] = r.variables.counter;
  const backend_reply = await r.subrequest("/do_proxy");
  r.return(backend_reply.status, backend_reply.responseBody);
}

export default { staticWindowRateLimiter, limitableUri };
