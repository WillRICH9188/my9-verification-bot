# Telegram 验证机器人

## 安装
npm install

## 复制环境变量
cp .env.example .env
编辑 .env 填入你的 BOT_TOKEN 和 GROUP_INVITE_LINK

## 本地测试
node index.js
在 Telegram 访问:
https://t.me/你的Bot?start=ref001

## 部署到 Railway
将本仓库上传 GitHub → 使用 Railway 新项目 → 
设置环境变量 BOT_TOKEN, GROUP_INVITE_LINK 和 PORT=3000
点击 Deploy，部署完成Bot即可上线。
