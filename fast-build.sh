#!/bin/bash

# fast-build.sh - 快速打包脚本

echo "🚀 开始快速打包 Electron 应用..."

# 设置环境变量
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
export ELECTRON_REBUILD_SKIP=true

# 检查是否已经构建过 Vite
if [ ! -d "dist" ]; then
  echo "📦 首次构建，编译前端代码..."
  BUILD_TARGET=electron pnpm vite build
else
  echo "✅ 跳过前端编译（如需重新编译，请删除 dist 目录）"
fi

# 根据平台选择构建命令
case "$(uname -s)" in
  Darwin*)
    echo "🍎 检测到 macOS，构建 Mac 应用..."
    # 检测 CPU 架构
    if [ "$(uname -m)" = "arm64" ]; then
      echo "💻 构建 Apple Silicon (ARM64) 版本..."
      electron-builder --mac --arm64 --dir
    else
      echo "💻 构建 Intel (x64) 版本..."
      electron-builder --mac --x64 --dir
    fi
    ;;
  Linux*)
    echo "🐧 检测到 Linux，构建 Linux 应用..."
    electron-builder --linux --dir
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo "🪟 检测到 Windows，构建 Windows 应用..."
    electron-builder --win --x64 --dir
    ;;
  *)
    echo "❌ 未知操作系统"
    exit 1
    ;;
esac

echo ""
echo "✨ 构建完成！"
echo "📂 输出目录: release/6.1.0/"
echo ""
echo "💡 提示："
echo "  - 使用 --dir 只构建目录，不打包成安装文件（最快）"
echo "  - 移除 --dir 可打包成 .dmg / .exe / .AppImage"
