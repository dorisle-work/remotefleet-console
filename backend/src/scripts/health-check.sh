#!/usr/bin/env bash
set -Eeuo pipefail

CPU=$(top -bn1 | awk '/Cpu\(s\)/{print 100 - $8}' | cut -d. -f1)
MEM=$(free | awk '/Mem:/{printf "%.0f", $3/$2 * 100}')
DISK=$(df -P / | awk 'NR==2{print $5}' | tr -d '%')

echo "cpu=${CPU}"
echo "mem=${MEM}"
echo "disk=${DISK}"
