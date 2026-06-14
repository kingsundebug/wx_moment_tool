#!/bin/sh
# 将云函数目录链接到 uni-app 编译产物，便于微信开发者工具上传部署
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/unpackage/dist/dev/mp-weixin"
if [ ! -d "$DIST" ]; then
  echo "未找到编译目录 $DIST，请先运行到微信开发者工具"
  exit 1
fi
ln -sfn "$ROOT/cloudfunctions" "$DIST/cloudfunctions"
echo "已链接 cloudfunctions -> $DIST/cloudfunctions"
