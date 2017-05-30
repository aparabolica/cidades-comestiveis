#!/bin/bash
set -e
# allow the container to be started with `--user`
if [ "$1" = 'node' ] || [ "$1" = 'nodemon' ]; then
  echo "Updating permissions..."
  chown -R $APP_USER:$APP_USER $HOME
  echo "Compiling assets..."
  gosu $APP_USER:$APP_USER $HOME/app/node_modules/grunt-cli/bin/grunt build
  echo "Executing process..."
  exec gosu $APP_USER:$APP_USER "$@"
fi
exec "$@"
