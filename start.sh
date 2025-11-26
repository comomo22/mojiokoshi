#!/bin/bash
# Whisper Webアプリ起動スクリプト

cd "$(dirname "$0")"

echo "================================"
echo "Whisper文字起こしWebアプリ"
echo "================================"
echo ""
echo "起動しています..."
echo ""

python3 app.py
