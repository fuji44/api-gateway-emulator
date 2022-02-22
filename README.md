# API Gateway Emulator

It is a very simple gateway server that mimics the behavior of Google Cloud API Gateway.

This gateway is not intended for full emulation. The following is a task list.

- Read the `authorization` header of the request to check for authentication.
  - Unlike the real Gateway, the authentication settings are read from environment variables.
- Set the Base64URL-encoded authenticated user information in the `x-apigateway-api-userinfo` request header.
- Copy the value of the `authorization` header into the request header `x-forwarded-authorization`.
  - Since the `authorization` is not rewritten like in the real API Gateway, it is passed to the target API with the same value set.
- Forwards the request with the header added to the target URL and returns the received response.
  - Unlike the actual Gateway, the target URL is read from an environment variable. Also, it cannot be specified individually for each path.

It is intended to be used when developing in a local environment. Please use the real thing in a production environment.

## Usage

This is an example of authenticating with Auth0 and accessing the API on `localhost:5050`.

### yarn

```sh
# Build
yarn build

# Run
TARGET_URL=http://localhost:5050 \
OAUTH_JWKS_URI=https://YOUR_TENANT_ID.auth0.com/.well-known/jwks.json \
OAUTH_ISSUER=https://YOUR_TENANT_ID.auth0.com/ \
OAUTH_AUDIENCE=YOUR_AUTH0_API_AUDIENCE \
yarn start

# Request target API resource via Gateway
curl --request GET \
  --url "http://localhost:3000/api/users/xxxx" \
  --header 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

By creating an `.env` file in the project root, you don't need to specify environment variables when executing commands.

### Docker

```sh
# Build
docker build -t api-gateway-emulator .

# Run
docker run -it --rm -p 3000:3000 \
  -e TARGET_URL=http://host.docker.internal:5050 \
  -e OAUTH_JWKS_URI=https://YOUR_TENANT_ID.auth0.com/.well-known/jwks.json \
  -e OAUTH_ISSUER=https://YOUR_TENANT_ID.auth0.com/ \
  -e OAUTH_AUDIENCE=YOUR_AUTH0_API_AUDIENCE \
  api-gateway-emulator

# Request target API resource via Gateway
curl --request GET \
  --url "http://localhost:3000/api/users/xxxx" \
  --header 'authorization: Bearer YOUR_ACCESS_TOKEN'
```

It is also a good idea to use the `--env-file` option to easily specify environment variables.

## Options

The behavior can be changed by specifying the following environment variables.

```ini
# Require: Target API URL
TARGET_URL=http://localhost:5050
# Option: Target Base Path
BASE_PATH=/
# Option: Listen port
PORT=3000
# Option: Verbose log output
VERBOSE=true

# Require: OAuth2 configs
# e.g. Auth0
OAUTH_JWKS_URI=https://YOUR_TENANT_ID.auth0.com/.well-known/jwks.json
OAUTH_ISSUER=https://YOUR_TENANT_ID.auth0.com/
OAUTH_AUDIENCE=YOUR_AUTH0_API_AUDIENCE
# Option: comma-separated signing algorithms
OAUTH_TOKEN_SIGN_ALGORITHMS=RS256
```

## License

The MIT License.

Copyright (c) 2021 Yoshihiro Fujimoto