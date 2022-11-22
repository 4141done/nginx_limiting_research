function limitableUri(r) {
  return r.variables.request_uri.split("?")[0];
}

const INCREMENT_BY = 1;

async function staticWindowRateLimiter(r) {
  if (!r.variables.http_user_id || !r.variables.http_account_id) {
    return r.return(
      401,
      JSON.stringify({
        error: "'User-Id' and 'Account-Id' headers are required",
      })
    );
  }
  r.error(`User id: ${r.variables.http_user_id}`);
  r.error(`Account id: ${r.variables.http_account_id}`);
  if (!r.variables.countnode) {
    r.variables.countnode = r.variables.server_addr;
  }

  const globalRateLimitStatus = limitStatus(
    r.variables.global_counter,
    r.variables.global_request_quota
  );

  r.headersOut["Account-Limit"] = globalRateLimitStatus.limit;
  r.headersOut["Account-Limit-Used"] = globalRateLimitStatus.limitUsed;
  r.variables.global_counter = globalRateLimitStatus.limitUsed;

  if (globalRateLimitStatus.limitExceeded) {
    const perUserRateLimitStatus = limitStatus(
      r.variables.user_level_counter,
      r.variables.user_request_quota
    );

    r.headersOut["User-Limit"] = perUserRateLimitStatus.limit;
    r.headersOut["User-Limit-Used"] = perUserRateLimitStatus.limitUsed;
    r.variables.user_level_counter = perUserRateLimitStatus.limitUsed;

    if (perUserRateLimitStatus.limitExceeded) {
      return doLimitExceeded(r);
    }

    await doProxy(r);
  }

  await doProxy(r);
}

function limitStatus(rawRequestCount, rawQuota, increment) {
  const incrementBy = increment || 1;
  const quota = parseInt(rawQuota, 10);
  let potentialRequestCount = incrementBy;
  let completedRequestCount = 0;

  if (rawRequestCount) {
    completedRequestCount = parseInt(rawRequestCount, 10);
    potentialRequestCount = completedRequestCount + incrementBy;
  }

  const limitExceeded = potentialRequestCount > quota;

  return {
    limitExceeded: limitExceeded,
    limit: quota,
    limitUsed: limitExceeded ? completedRequestCount : potentialRequestCount,
  };
}

function doLimitExceeded(r) {
  return r.return(
    429,
    JSON.stringify({
      error: "rate limit exceeded",
    })
  );
}

async function doProxy(r) {
  const backend_reply = await r.subrequest("/do_proxy");
  r.return(backend_reply.status, backend_reply.responseBody);
}

export default { staticWindowRateLimiter, limitableUri };
