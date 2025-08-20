#!/bin/bash

# Test script to validate tag version extraction logic
# This simulates the GitHub Actions workflow logic

echo "Testing version extraction logic from GitHub Actions workflow..."

# Test cases
test_cases=(
    "v1.2.3:1.2.3"
    "1.2.3:1.2.3"
    "v0.1.0:0.1.0"
    "2.0.0-beta:2.0.0-beta"
    "v3.1.0-rc1:3.1.0-rc1"
)

for test_case in "${test_cases[@]}"; do
    tag_name="${test_case%:*}"
    expected="${test_case#*:}"
    
    # Simulate the GitHub Actions logic: remove 'v' prefix if present
    version="${tag_name#v}"
    
    if [ "$version" = "$expected" ]; then
        echo "✅ $tag_name -> $version (expected: $expected)"
    else
        echo "❌ $tag_name -> $version (expected: $expected)"
    fi
done

echo "
This validates that the Docker workflow will correctly tag images:
- Git tag 'v1.2.3' -> Docker images 'etendo/etendo_ui:1.2.3' and 'etendo/etendo_ui:latest'
- Git tag '1.2.3' -> Docker images 'etendo/etendo_ui:1.2.3' and 'etendo/etendo_ui:latest'"