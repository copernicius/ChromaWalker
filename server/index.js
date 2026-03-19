const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// 1. 基础路由：访问 http://localhost:3000/ 就能看到
app.get('/', (req, res) => {
  res.send('你好！后端服务器已经成功启动了！');
});

// 2. 连接 MongoDB (注意：'mongodb' 是你 docker-compose 里的服务名)
mongoose.connect('mongodb://mongodb:27017/test_db')
  .then(() => console.log('✅ 数据库连接成功！'))
  .catch(err => console.error('❌ 数据库连接失败:', err));

// 3. 开启监听
app.listen(PORT, () => {
  console.log(`🚀 服务器跑起来了：http://localhost:${PORT}`);
})