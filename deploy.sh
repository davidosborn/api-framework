#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

APP=davids-server-framework
CLEAN=yes

. ../deploy/cfg.sh
. ../deploy/deploy.sh
