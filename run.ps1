.#!/bin/bash
set -e
pushd front_end
echo "Drawing content"
tsc --strict content.ts
echo "Type-checking the front end"
tsc --strict main.ts
popd
echo "Type-checking the back end"
pushd back_end
python3 -m mypy main.py --strict --ignore-missing-imports
echo "Running"
python3 main.py
popd
echo "Done"
