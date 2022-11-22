# Limiter
A test repo to show various types of rate limiting.

## Background and Terminology
There are many different kinds of rate limiting algorithms.  They are enumerated below.  However, there are some elements that are common to all strategies that should be considered first.

### Limiting key
What are we limiting by?  Does a single API serve as the "bucket" of available requests?  Are we not keeping track of users but limiting per endpoint?

### Memory Requirements
How much memory are we going to use keeping track of requests in order to limit by our chosen key?  Some strategies require that we keep more or less data in memory per "bucket".

### Distributed Resolution
Closely related to memory requirements, but also how data is kept in sync across gateways so we can have many gateways that all understand the limits.

If there are high memory requirements and we are replicating data, we may run into issues.  Likewise if we are using a shared memory store such as redis will we have locking issues or suffer from transfer overhead?

## Strategies
### Static Window
This is the simplest and most common type of rate limiting. A certain number of requests is allowed per time period.  Until the time period has elapsed additional requests above the limit will return a `429`.  Once the limit resets, you suddenly have all your availability again.

