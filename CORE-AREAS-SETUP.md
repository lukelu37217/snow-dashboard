# 核心业务区域配置指南

## ✅ 已完成的优化

你的应用现在只会加载**核心业务区域**的天气数据，大幅减少API调用！

---

## 📍 如何查看和调整你的业务区域

### 步骤1：查看控制台日志

刷新页面后，打开浏览器控制台（F12），你会看到：

```
✅ Core Area Filter: Loading 15 of 237 neighborhoods
📍 Fetching weather for 15 locations: Downtown, Osborne Village, River Heights, ...
```

### 步骤2：确认区域名称

如果某些区域**没有加载**，可能是GeoJSON中的名称不匹配。

**查看所有可用区域名称**：
在控制台运行：
```javascript
fetch('/winnipeg-neighbourhoods.geojson')
  .then(r => r.json())
  .then(d => console.log(d.features.map(f => f.properties.name).sort()))
```

### 步骤3：修改配置文件

编辑文件：`src/config/businessAreas.ts`

```typescript
export const CORE_BUSINESS_AREAS = [
    // 添加你的区域名称（必须与GeoJSON中的name完全匹配）
    "Downtown",
    "Osborne Village",
    "River Heights",
    // ... 添加更多区域
];
```

---

## ⚙️ 配置选项

### 禁用过滤（加载所有237个社区）

在 `src/config/businessAreas.ts` 中：

```typescript
export const ENABLE_CORE_AREA_FILTER = false; // 改为 false
```

⚠️ **警告：这会大幅增加API调用，可能触发限流！**

### 调整最大加载数量

```typescript
export const MAX_NEIGHBORHOODS = 50; // 安全上限
```

即使禁用过滤，也会最多加载50个社区。

---

## 📊 性能对比

| 设置 | 社区数量 | API调用次数 | 加载时间 | 限流风险 |
|------|---------|-----------|---------|---------|
| **核心区域过滤 (推荐)** | 15-30个 | 3-6次 | ~30秒 | 极低 ⭐ |
| 所有社区 (不推荐) | 237个 | 47次+ | ~15分钟 | 极高 ❌ |

---

## 🎯 推荐配置

根据你截图中的红框区域，建议包含：

### Winnipeg市中心核心区（Downtown Core）
- Downtown
- Exchange District
- The Forks
- Chinatown

### 中心居民区（Central Residential）
- Osborne Village
- River Heights
- Wolseley
- Crescentwood
- Fort Rouge
- Riverview

### 商业服务区（Commercial Areas）
- St. Boniface
- Transcona
- Polo Park
- Grant Park

### 工业区（Industrial - 如果需要）
- Inkster Industrial
- Brookside Industrial

---

## 🔧 故障排除

### 问题1：某些区域没有显示

**原因**：GeoJSON中的名称与配置不匹配

**解决**：
1. 在控制台运行上面的查询命令查看所有区域名称
2. 复制**完全一致**的名称到配置文件
3. 注意大小写、空格、特殊字符

### 问题2：还是加载了所有237个社区

**检查**：
```typescript
// 确保这个设置为 true
export const ENABLE_CORE_AREA_FILTER = true;
```

### 问题3：想临时查看所有区域

不需要修改代码，在控制台运行：
```javascript
localStorage.setItem('showAllAreas', 'true');
location.reload();
```

恢复核心区域过滤：
```javascript
localStorage.removeItem('showAllAreas');
location.reload();
```

---

## 📈 API使用优化建议

### 当前配置（15个核心区域）
- 批次大小：5个社区/批次
- 批次数量：3批次
- 每批间隔：30秒
- **总时间：约1.5分钟**
- **API调用：3次**

### 如果扩展到30个区域
- 批次数量：6批次
- **总时间：约3分钟**
- **API调用：6次**

### 如果使用所有237个社区 ❌
- 批次数量：47批次
- **总时间：约23分钟**
- **API调用：47次** → **必定触发限流！**

---

## ✨ 最佳实践

1. **只加载真实服务区域** - 不要加载不提供服务的社区
2. **使用缓存** - 30分钟缓存避免重复调用
3. **避免频繁刷新** - 手动刷新而非自动刷新
4. **监控控制台** - 查看实际加载的区域数量

---

## 🚀 下一步

1. 刷新页面，查看控制台日志
2. 确认加载的区域是否正确
3. 根据需要调整 `businessAreas.ts` 配置
4. 享受快速加载和零限流！

---

**配置文件位置**: `src/config/businessAreas.ts`

**修改后记得保存并刷新页面！**
