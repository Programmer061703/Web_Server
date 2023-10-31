.#!/bin/bash
set -e
pushd front_end
echo "Type-checking the front end"
tsc --strict main.ts
echo "Type-checking the back end"
python3 -m mypy call.py --strict --ignore-missing-imports
echo "Running"
python3 call.py
popd
echo "Done"
