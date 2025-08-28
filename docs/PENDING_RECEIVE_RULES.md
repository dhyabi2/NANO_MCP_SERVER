# Pending Receive Rules and Guidelines

## Overview
The Pending Receive functionality is a critical component that handles the reception of pending NANO transactions. This document outlines the rules and guidelines that must be followed when working with this functionality.

## Critical Rules

1. **Isolation Rule**
   - The Pending Receive functionality MUST remain isolated from the main MCP setup
   - It MUST use its own configuration, endpoints, and service layer
   - NO mixing with existing MCP endpoints or configurations is allowed

2. **Configuration Rules**
   - All configuration MUST be loaded from `pending-receive.config.js`
   - Environment variables for this functionality MUST be prefixed with `PENDING_`
   - Default values MUST be provided for all configuration options

3. **Endpoint Rules**
   - All endpoints MUST be under the `/pending-receive` prefix
   - Rate limiting MUST be applied to all endpoints
   - Each endpoint MUST validate all input parameters
   - Private keys MUST only be transmitted over HTTPS

4. **Processing Rules**
   - Maximum number of pending blocks processed in one request MUST be limited
   - Work generation MUST use appropriate difficulty levels
   - Failed blocks MUST not prevent processing of subsequent blocks
   - All processing results MUST be logged

5. **Security Rules**
   - Private keys MUST never be logged
   - Rate limiting MUST be enforced
   - All requests MUST be validated against defined schemas
   - Error messages MUST not expose internal details

## Implementation Guidelines

1. **Error Handling**
   - All errors MUST be caught and properly handled
   - Error responses MUST follow a consistent format
   - Sensitive information MUST not be included in error messages

2. **Logging**
   - All critical operations MUST be logged
   - Logs MUST include request IDs for tracking
   - Sensitive data MUST be redacted from logs

3. **Performance**
   - Work generation SHOULD be optimized
   - Large numbers of pending blocks SHOULD be processed in batches
   - Response times SHOULD be monitored

4. **Testing**
   - All endpoints MUST have corresponding tests
   - Edge cases MUST be tested
   - Load testing MUST be performed

## API Endpoints

1. `GET /pending-receive/blocks`
   - Gets pending blocks for an account
   - Rate limited to prevent abuse
   - Returns detailed block information

2. `POST /pending-receive/process`
   - Processes a single pending block
   - Requires account and private key
   - Returns processing result

3. `POST /pending-receive/receive-all`
   - Processes all pending blocks for an account
   - Requires account and private key
   - Returns detailed processing results

## Configuration

The configuration file (`pending-receive.config.js`) controls:
- RPC node settings
- Rate limiting parameters
- Work difficulty levels
- Maximum blocks per request
- Logging settings

## Error Handling

All errors must be handled according to these categories:
1. Validation Errors (400)
2. Rate Limit Errors (429)
3. Processing Errors (500)
4. Network Errors (503)

## Monitoring

The following metrics should be monitored:
1. Number of pending blocks processed
2. Processing success rate
3. Response times
4. Error rates
5. Rate limit hits

## Security Considerations

1. Private keys must only be transmitted over HTTPS
2. Rate limiting must be properly configured
3. Input validation must be thorough
4. Error messages must not expose internal details

## Maintenance

1. Regular review of rate limits
2. Monitoring of error rates
3. Updates to difficulty levels as needed
4. Regular security audits
