---
title: 手写一遍 Vue 3 响应式：Proxy、依赖收集与触发更新
date: 2026-10-28
summary: 不读源码，先用两百行代码跑通 reactive / effect / computed 三条主线，理解「数据变了视图为什么跟着变」。
tags: [Vue 3, 响应式, 源码]
---

面试被问到「Vue 3 响应式原理」时，能背出「用 Proxy 代替 Object.defineProperty」只是第一层。再问一句「依赖是怎么收集的、什么时候触发」，很多人就卡住了。这篇笔记用最小实现把这条链路走一遍。

## 三个核心角色

Vue 3 的响应式系统里只有三个关键角色：

- **reactive**：把一个普通对象变成响应式代理。
- **effect**：一个会被重复执行的函数（渲染函数就是一个 effect）。
- **依赖表**：记录「哪个属性被哪个 effect 用过」。

关系是：读取属性时收集依赖，修改属性时找到依赖并重新执行。

## reactive：用 Proxy 拦截读写

```js
const targetMap = new WeakMap() // target -> (key -> Set<effect>)

function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      const result = Reflect.get(obj, key, receiver)
      track(obj, key)          // 读的时候收集
      return typeof result === 'object' ? reactive(result) : result
    },
    set(obj, key, value, receiver) {
      const ok = Reflect.set(obj, key, value, receiver)
      trigger(obj, key)        // 写的时候通知
      return ok
    }
  })
}
```

`WeakMap` 的选择是有意的：当目标对象不再被引用时，依赖表会自动被回收，不需要手动清理。这一点比 Vue 2 的 `defineProperty` 方案省心得多——Vue 2 必须递归遍历对象，给每个属性单独定义 getter/setter，新增属性还检测不到。

## effect 与依赖收集

```js
let activeEffect = null

function effect(fn) {
  const wrapped = () => {
    activeEffect = wrapped
    fn()
    activeEffect = null
  }
  wrapped()
  return wrapped
}

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}
```

`activeEffect` 这个全局变量是整个机制的枢纽：执行 effect 前把它设成自己，函数内部的任何 `reactive` 读取都会顺手把当前 effect 记进依赖表，执行完再清空。

## 触发更新

```js
function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep) dep.forEach((fn) => fn())
}
```

到这里，一个最小的响应式就跑起来了：

```js
const state = reactive({ count: 0 })

effect(() => {
  console.log('count 变了：', state.count)
})

state.count++   // 自动打印 "count 变了：1"
```

## 为什么要有 computed 和 scheduler

上面的实现在真实场景里会出两个问题。

**第一，重复计算。** 多个 effect 依赖同一个属性，改一次属性会同步执行多次。Vue 的解法是给 effect 加 `scheduler`，把同一轮微任务里的多次触发合并成一次，这就是「异步批量更新」的来源——也是 `nextTick` 存在的原因。

**第二，派生值。** 如果某个值是由其他响应式数据算出来的，每次读取都重算一次太浪费。`computed` 的做法是：内部建一个带 `dirty` 标记的 effect，只有依赖变了才把标记置为脏，下次读取时才重新求值。

```js
function computed(getter) {
  let dirty = true
  let value
  const runner = effect(getter, {
    scheduler: () => { dirty = true }
  })
  return {
    get value() {
      if (dirty) {
        value = runner()
        dirty = false
      }
      return value
    }
  }
}
```

这个「脏标记 + 惰性求值」的思路，在前端缓存、虚拟 DOM diff 里到处都是，不只是 Vue 在用。

## 和 Vue 2 的对比

| 维度 | Vue 2 defineProperty | Vue 3 Proxy |
| --- | --- | --- |
| 新增/删除属性 | 检测不到，需 `$set` | 天然支持 |
| 数组索引赋值 | 需要重写数组方法 | 天然支持 |
| 初始化成本 | 递归遍历所有属性 | 懒代理，访问时才递归 |
| 浏览器兼容 | IE9+ | 不支持 IE |

最后一行是 Vue 3 放弃 IE 的技术原因，不是「不想支持」，而是 Proxy 无法 polyfill。

## 用这套理解去读源码

有了上面这条链路，再去看 `@vue/reactivity` 的源码，结构就会非常清晰：`baseHandlers` 对应 Proxy 的 handler，`Dep` 类对应 Set + 订阅者，`effect` 的 `scheduler` 对应组件更新队列。剩下的只是边界处理和性能优化。

配套的可运行版本我放在仓库的 `examples/reactivity/` 下，改改数字就能直观看到收集和触发的时机。
