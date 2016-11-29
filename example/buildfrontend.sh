#!/bin/bash -e

set -e

export DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

docker run -ti --rm \
  -v ${DIR}/frontend/src:/app/src \
  -v ${DIR}/frontend/www:/app/www \
  -v ${DIR}/frontend/dist:/app/dist \
  binocaros/passport-slim-frontend-build \
  $@