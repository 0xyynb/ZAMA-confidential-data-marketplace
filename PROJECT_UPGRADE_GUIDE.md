# 🚀 FHEVM 项目升级指南

> **基于 Zama 获奖项目的最佳实践**  
> 更新日期：2025-10-29  
> 参考项目：Lunarys, OTC-FHE, UNIversal Privacy Hook, Belief Protocol

---

## 📊 执行摘要

### 当前项目问题诊断

| 问题 | 严重程度 | 影响 | 预计修复时间 |
|------|---------|------|------------|
| ❌ 缺少 Relayer 轮询集成 | 🔴 致命 | 解密永远不会完成 | 4小时 |
| ❌ 缺少请求ID映射系统 | 🔴 致命 | 无法追踪解密状态 | 2小时 |
| ❌ Gas Limit = 0 | 🔴 致命 | 回调必然失败 | 30分钟 |
| ⚠️ 缺少状态机枚举 | 🟠 严重 | 容易产生竞态条件 | 1小时 |
| ⚠️ 无超时处理 | 🟠 严重 | 资金可能被锁定 | 2小时 |
| ⚠️ 无重试机制 | 🟡 中等 | 用户体验差 | 1.5小时 |

**总预计升级时间：11小时**（1.5个工作日）

---

## 🎯 升级优先级路线图

### Phase 1: 关键修复（必须完成）⏰ 6.5小时

```
Day 1 上午：
├─ [2h] 添加请求ID映射系统
├─ [1h] 实现状态机枚举
└─ [0.5h] 修复 Gas Limit 配置

Day 1 下午：
└─ [4h] 集成 Relayer 轮询系统
```

### Phase 2: 增强功能（强烈推荐）⏰ 3.5小时

```
Day 2 上午：
├─ [2h] 添加超时退款机制
└─ [1.5h] 实现重试功能
```

### Phase 3: 优化体验（锦上添花）⏰ 2小时

```
Day 2 下午（可选）：
├─ [1h] 批量解密支持
└─ [1h] 应急管理员解锁
```

---

## 📁 文件修改清单

### 需要修改的文件

```
contracts/
├─ GuessGameFHE_v2.sol          [重度修改]
└─ SimpleVotingTest.sol         [轻度修改]

frontend/src/
├─ hooks/
│  ├─ useContract.js            [重度修改]
│  └─ useDecryption.js          [新建]
├─ components/
│  ├─ GameDetail.jsx            [中度修改]
│  └─ DecryptionProgress.jsx   [新建]
└─ utils/
   └─ relayerClient.js          [新建]

scripts/
└─ deploy_fhe_v3.js             [新建]
```

---

## 🔧 详细升级步骤

## Step 1: 修改智能合约（关键）

### 1.1 添加状态定义和映射

**文件：** `contracts/GuessGameFHE_v2.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

contract GuessGameFHE_v3 is GatewayCaller {
    
    // ==================== 新增：状态枚举 ====================
    enum GameStatus {
        ACTIVE,           // 游戏进行中
        PENDING_DECRYPT,  // 等待解密
        COMPLETED,        // 已完成
        CANCELLED,        // 已取消
        EXPIRED           // 已过期
    }
    
    // ==================== 新增：解密请求结构 ====================
    struct DecryptionRequest {
        uint256 gameId;
        address requester;
        uint256 timestamp;
        uint8 retryCount;
        bool processed;
    }
    
    // ==================== 修改：Game 结构 ====================
    struct Game {
        uint256 id;
        address owner;
        euint32 encryptedTarget;
        euint32 encryptedGuess;
        uint32 revealedTarget;    // 解密后的值
        uint32 revealedGuess;     // 解密后的值
        uint256 entryFee;
        uint256 createdAt;
        uint256 expiresAt;        // 新增：过期时间
        GameStatus status;        // 修改：使用枚举
        address winner;
    }
    
    // ==================== 新增：映射系统 ====================
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(uint256 => uint256) public gameToRequestId;  // 游戏ID -> 请求ID
    mapping(uint256 => uint256) public requestIdToGame;  // 请求ID -> 游戏ID
    
    // ==================== 新增：配置常量 ====================
    uint256 public constant CALLBACK_GAS_LIMIT = 500000;
    uint256 public constant REQUEST_TIMEOUT = 30 minutes;
    uint256 public constant GAME_DURATION = 24 hours;
    uint8 public constant MAX_RETRIES = 3;
    
    // ==================== 新增：事件系统 ====================
    event DecryptionRequested(
        uint256 indexed requestId, 
        uint256 indexed gameId, 
        uint256 timestamp
    );
    
    event DecryptionCompleted(
        uint256 indexed requestId,
        uint256 indexed gameId,
        uint32 target,
        uint32 guess
    );
    
    event DecryptionFailed(
        uint256 indexed requestId,
        uint256 indexed gameId,
        string reason
    );
    
    event DecryptionRetrying(
        uint256 indexed requestId,
        uint8 retryCount
    );
    
    event GameExpired(
        uint256 indexed gameId,
        uint256 timestamp
    );
    
    event EmergencyResolved(
        uint256 indexed gameId,
        address resolver
    );
    
    // ==================== 修改：创建游戏 ====================
    function createGame(
        einput encryptedTarget,
        bytes calldata inputProof,
        uint256 entryFee
    ) external payable returns (uint256 gameId) {
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(entryFee >= 0.001 ether, "Entry fee too low");
        
        gameId = gameCounter++;
        
        euint32 target = TFHE.asEuint32(encryptedTarget, inputProof);
        TFHE.allowThis(target);
        TFHE.allow(target, msg.sender);
        
        games[gameId] = Game({
            id: gameId,
            owner: msg.sender,
            encryptedTarget: target,
            encryptedGuess: TFHE.asEuint32(0),
            revealedTarget: 0,
            revealedGuess: 0,
            entryFee: entryFee,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + GAME_DURATION,  // 新增
            status: GameStatus.ACTIVE,                   // 修改
            winner: address(0)
        });
        
        emit GameCreated(gameId, msg.sender, entryFee);
    }
    
    // ==================== 新增：请求解密（核心功能）====================
    function requestDecryption(uint256 gameId) 
        external 
        returns (uint256 requestId) 
    {
        Game storage game = games[gameId];
        
        // 验证游戏状态
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(block.timestamp >= game.expiresAt, "Game not ended");
        require(
            block.timestamp < game.expiresAt + REQUEST_TIMEOUT,
            "Too late to request decryption"
        );
        
        // 准备加密值
        euint32[] memory values = new euint32[](2);
        values[0] = game.encryptedTarget;
        values[1] = game.encryptedGuess;
        
        // ✅ 关键步骤：授权给 Gateway
        for (uint256 i = 0; i < values.length; i++) {
            TFHE.allow(values[i], Gateway.GATEWAY_CONTRACT_ADDRESS);
        }
        
        // 转换为 uint256 数组
        uint256[] memory cts = new uint256[](2);
        cts[0] = Gateway.toUint256(values[0]);
        cts[1] = Gateway.toUint256(values[1]);
        
        // ✅ 关键修复：请求解密（正确的参数）
        requestId = Gateway.requestDecryption(
            cts,
            this._handleDecryptionCallback.selector,  // 回调函数
            CALLBACK_GAS_LIMIT,                       // ✅ 修复：足够的 Gas
            block.timestamp + REQUEST_TIMEOUT,        // ✅ 修复：合理的超时
            false                                     // 不是单用户解密
        );
        
        // ✅ 关键新增：记录请求映射
        decryptionRequests[requestId] = DecryptionRequest({
            gameId: gameId,
            requester: msg.sender,
            timestamp: block.timestamp,
            retryCount: 0,
            processed: false
        });
        
        gameToRequestId[gameId] = requestId;
        requestIdToGame[requestId] = gameId;
        
        // 更新游戏状态
        game.status = GameStatus.PENDING_DECRYPT;
        
        emit DecryptionRequested(requestId, gameId, block.timestamp);
    }
    
    // ==================== 修改：Gateway 回调 ====================
    function _handleDecryptionCallback(
        uint256 requestId,
        uint32 decryptedTarget,
        uint32 decryptedGuess
    ) public onlyGateway {
        DecryptionRequest storage request = decryptionRequests[requestId];
        
        // ✅ 新增：完整的验证
        require(request.timestamp > 0, "Invalid request ID");
        require(!request.processed, "Request already processed");
        require(
            block.timestamp <= request.timestamp + REQUEST_TIMEOUT,
            "Request expired"
        );
        
        uint256 gameId = request.gameId;
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.PENDING_DECRYPT, "Invalid game state");
        
        // 更新解密结果
        game.revealedTarget = decryptedTarget;
        game.revealedGuess = decryptedGuess;
        game.status = GameStatus.COMPLETED;
        
        // 计算获胜者
        _determineWinner(gameId);
        
        // 标记已处理
        request.processed = true;
        
        emit DecryptionCompleted(requestId, gameId, decryptedTarget, decryptedGuess);
    }
    
    // ==================== 新增：重试机制 ====================
    function retryDecryption(uint256 gameId) external returns (uint256 newRequestId) {
        uint256 oldRequestId = gameToRequestId[gameId];
        DecryptionRequest storage request = decryptionRequests[oldRequestId];
        Game storage game = games[gameId];
        
        // 验证可以重试
        require(game.status == GameStatus.PENDING_DECRYPT, "Game not pending decrypt");
        require(!request.processed, "Request already processed");
        require(request.retryCount < MAX_RETRIES, "Max retries exceeded");
        require(
            block.timestamp > request.timestamp + 5 minutes,
            "Too soon to retry"
        );
        
        // 增加重试计数
        request.retryCount++;
        emit DecryptionRetrying(oldRequestId, request.retryCount);
        
        // 重新提交解密请求
        newRequestId = _resubmitDecryptionRequest(gameId);
        
        return newRequestId;
    }
    
    // ==================== 新增：超时取消 ====================
    function cancelExpiredGame(uint256 gameId) external {
        Game storage game = games[gameId];
        
        require(
            game.status == GameStatus.PENDING_DECRYPT || 
            game.status == GameStatus.ACTIVE,
            "Cannot cancel this game"
        );
        
        require(
            block.timestamp > game.expiresAt + REQUEST_TIMEOUT,
            "Game not expired yet"
        );
        
        // 退款给所有参与者
        _refundParticipants(gameId);
        
        game.status = GameStatus.EXPIRED;
        emit GameExpired(gameId, block.timestamp);
    }
    
    // ==================== 新增：应急处理 ====================
    function emergencyResolve(
        uint256 gameId,
        uint32 target,
        uint32 guess
    ) external onlyOwner {
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.PENDING_DECRYPT, "Invalid state");
        require(
            block.timestamp > game.expiresAt + 1 days,
            "Too early for emergency resolve"
        );
        
        game.revealedTarget = target;
        game.revealedGuess = guess;
        game.status = GameStatus.COMPLETED;
        
        _determineWinner(gameId);
        
        emit EmergencyResolved(gameId, msg.sender);
    }
    
    // ==================== 内部辅助函数 ====================
    
    function _resubmitDecryptionRequest(uint256 gameId) 
        internal 
        returns (uint256 requestId) 
    {
        Game storage game = games[gameId];
        
        euint32[] memory values = new euint32[](2);
        values[0] = game.encryptedTarget;
        values[1] = game.encryptedGuess;
        
        for (uint256 i = 0; i < values.length; i++) {
            TFFE.allow(values[i], Gateway.GATEWAY_CONTRACT_ADDRESS);
        }
        
        uint256[] memory cts = new uint256[](2);
        cts[0] = Gateway.toUint256(values[0]);
        cts[1] = Gateway.toUint256(values[1]);
        
        requestId = Gateway.requestDecryption(
            cts,
            this._handleDecryptionCallback.selector,
            CALLBACK_GAS_LIMIT,
            block.timestamp + REQUEST_TIMEOUT,
            false
        );
        
        // 创建新的请求记录
        uint256 oldRequestId = gameToRequestId[gameId];
        uint8 oldRetryCount = decryptionRequests[oldRequestId].retryCount;
        
        decryptionRequests[requestId] = DecryptionRequest({
            gameId: gameId,
            requester: msg.sender,
            timestamp: block.timestamp,
            retryCount: oldRetryCount,
            processed: false
        });
        
        gameToRequestId[gameId] = requestId;
        requestIdToGame[requestId] = gameId;
        
        emit DecryptionRequested(requestId, gameId, block.timestamp);
    }
    
    function _determineWinner(uint256 gameId) internal {
        Game storage game = games[gameId];
        
        uint32 difference = game.revealedGuess > game.revealedTarget
            ? game.revealedGuess - game.revealedTarget
            : game.revealedTarget - game.revealedGuess;
        
        // 实现获胜逻辑
        if (difference <= 10) {
            game.winner = game.owner; // 示例
            // 分配奖金
            payable(game.winner).transfer(game.entryFee * 2);
        }
    }
    
    function _refundParticipants(uint256 gameId) internal {
        Game storage game = games[gameId];
        payable(game.owner).transfer(game.entryFee);
    }
    
    // ==================== 查询函数 ====================
    
    function getDecryptionStatus(uint256 gameId) 
        external 
        view 
        returns (
            uint256 requestId,
            uint256 timestamp,
            uint8 retryCount,
            bool processed,
            GameStatus status
        ) 
    {
        requestId = gameToRequestId[gameId];
        DecryptionRequest memory request = decryptionRequests[requestId];
        
        return (
            requestId,
            request.timestamp,
            request.retryCount,
            request.processed,
            games[gameId].status
        );
    }
}
```

---

## Step 2: 前端 Relayer 集成（关键）

### 2.1 创建 Relayer 客户端

**文件：** `frontend/src/utils/relayerClient.js`

```javascript
// utils/relayerClient.js

/**
 * Relayer 客户端（基于 Lunarys 最佳实践）
 */

const RELAYER_CONFIG = {
  sepolia: {
    url: 'https://gateway.sepolia.zama.ai/v1/public-decrypt',
    chainId: 11155111
  },
  local: {
    url: 'http://localhost:8545',
    chainId: 31337
  }
};

export class RelayerClient {
  constructor(network = 'sepolia') {
    this.config = RELAYER_CONFIG[network];
    if (!this.config) {
      throw new Error(`Unsupported network: ${network}`);
    }
  }
  
  /**
   * 轮询 Gateway 解密结果（核心功能）
   */
  async pollDecryption(requestId, contractAddress, options = {}) {
    const {
      maxAttempts = 60,      // 5分钟（60次 * 5秒）
      interval = 5000,       // 5秒一次
      onProgress = null      // 进度回调
    } = options;
    
    console.log('🔐 开始轮询 Gateway 解密...', {
      requestId: requestId.toString(),
      maxAttempts,
      estimatedTime: `${(maxAttempts * interval) / 1000}秒`
    });
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 调用进度回调
        if (onProgress) {
          onProgress({
            current: attempt,
            total: maxAttempts,
            percentage: Math.round((attempt / maxAttempts) * 100)
          });
        }
        
        // 请求 Gateway
        const response = await fetch(this.config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            handle: requestId.toHexString ? requestId.toHexString() : `0x${requestId.toString(16)}`,
            contractAddress: contractAddress,
            chainId: this.config.chainId
          })
        });
        
        // 成功获取解密结果
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Gateway 解密完成（第 ${attempt} 次尝试）`, data);
          return {
            success: true,
            data,
            attempts: attempt
          };
        }
        
        // 404 表示还未准备好
        if (response.status === 404) {
          console.log(`⏳ 尝试 ${attempt}/${maxAttempts}：解密尚未完成...`);
        } else {
          console.warn(`⚠️ Gateway 返回异常状态: ${response.status}`);
        }
        
      } catch (error) {
        console.warn(`⚠️ 轮询尝试 ${attempt} 失败:`, error.message);
      }
      
      // 等待下一次尝试
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // 超时
    throw new Error(`Gateway 解密超时（已尝试 ${maxAttempts} 次，共 ${(maxAttempts * interval) / 1000}秒）`);
  }
  
  /**
   * 检查 Gateway 健康状态
   */
  async checkHealth() {
    try {
      const baseUrl = this.config.url.replace('/v1/public-decrypt', '');
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Gateway 健康检查失败:', error);
      return false;
    }
  }
}

export default RelayerClient;
```

### 2.2 创建解密 Hook

**文件：** `frontend/src/hooks/useDecryption.js`

```javascript
// hooks/useDecryption.js

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import RelayerClient from '../utils/relayerClient';

/**
 * 完整的解密流程 Hook
 */
export function useDecryption(contract) {
  const [status, setStatus] = useState('idle'); // idle, requesting, polling, waiting, success, failed
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const relayerClient = new RelayerClient('sepolia'); // 或从配置读取
  
  /**
   * 完整的解密请求流程
   */
  const requestDecryption = useCallback(async (gameId) => {
    try {
      setStatus('requesting');
      setProgress(0);
      setError(null);
      setResult(null);
      
      console.log('🎮 开始解密游戏:', gameId);
      
      // ===== Step 1: 提交链上解密请求 =====
      setProgress(10);
      const tx = await contract.requestDecryption(gameId);
      console.log('📝 交易已提交:', tx.hash);
      
      setProgress(20);
      const receipt = await tx.wait();
      console.log('✅ 交易已确认');
      
      // ===== Step 2: 从事件中获取 requestId =====
      setProgress(30);
      const event = receipt.events?.find(
        (e) => e.event === 'DecryptionRequested'
      );
      
      if (!event) {
        throw new Error('未找到 DecryptionRequested 事件');
      }
      
      const requestId = event.args.requestId;
      console.log('🔑 解密请求ID:', requestId.toString());
      
      // ===== Step 3: 轮询 Gateway（关键步骤）=====
      setStatus('polling');
      console.log('⏳ 开始轮询 Gateway...');
      
      await relayerClient.pollDecryption(
        requestId,
        contract.address,
        {
          onProgress: (pollProgress) => {
            // 30-80% 分配给轮询阶段
            const percentage = 30 + (pollProgress.percentage * 0.5);
            setProgress(Math.round(percentage));
            console.log(`轮询进度: ${pollProgress.current}/${pollProgress.total}`);
          }
        }
      );
      
      console.log('✅ Gateway 解密完成');
      
      // ===== Step 4: 等待链上回调完成 =====
      setStatus('waiting');
      setProgress(85);
      console.log('⏳ 等待链上回调...');
      
      await waitForCallbackCompletion(gameId, (waitProgress) => {
        const percentage = 85 + (waitProgress * 0.15);
        setProgress(Math.round(percentage));
      });
      
      // ===== Step 5: 获取最终结果 =====
      setProgress(95);
      const gameInfo = await contract.games(gameId);
      
      const decryptionResult = {
        gameId,
        target: gameInfo.revealedTarget,
        guess: gameInfo.revealedGuess,
        winner: gameInfo.winner,
        status: gameInfo.status
      };
      
      setProgress(100);
      setStatus('success');
      setResult(decryptionResult);
      
      console.log('🎉 解密流程完成!', decryptionResult);
      
      return decryptionResult;
      
    } catch (err) {
      console.error('❌ 解密失败:', err);
      setStatus('failed');
      setError(err.message);
      throw err;
    }
  }, [contract]);
  
  /**
   * 等待链上回调完成
   */
  const waitForCallbackCompletion = async (gameId, onProgress) => {
    const MAX_WAIT = 120; // 2分钟
    const INTERVAL = 2000; // 2秒
    
    for (let i = 0; i < MAX_WAIT; i++) {
      onProgress(i / MAX_WAIT);
      
      const game = await contract.games(gameId);
      
      // status: 0=ACTIVE, 1=PENDING_DECRYPT, 2=COMPLETED, 3=CANCELLED, 4=EXPIRED
      if (game.status === 2) {
        console.log('✅ 回调已在链上完成');
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, INTERVAL));
    }
    
    throw new Error('等待回调超时 - 请检查合约状态或重试');
  };
  
  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);
  
  return {
    requestDecryption,
    status,
    progress,
    error,
    result,
    reset
  };
}

export default useDecryption;
```

### 2.3 创建进度组件

**文件：** `frontend/src/components/DecryptionProgress.jsx`

```jsx
// components/DecryptionProgress.jsx

import React from 'react';
import { Loader, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function DecryptionProgress({ status, progress, error }) {
  
  const statusConfig = {
    idle: {
      icon: Clock,
      text: '准备解密',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100'
    },
    requesting: {
      icon: Loader,
      text: '提交解密请求...',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    polling: {
      icon: Loader,
      text: 'Gateway 解密中...',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    waiting: {
      icon: Loader,
      text: '等待链上回调...',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50'
    },
    success: {
      icon: CheckCircle,
      text: '解密完成！',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    failed: {
      icon: XCircle,
      text: '解密失败',
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    }
  };
  
  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;
  
  return (
    <div className={`p-6 rounded-lg ${config.bgColor} border-2 border-${config.color.replace('text-', '')}`}>
      {/* 状态标题 */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${config.color} ${status !== 'success' && status !== 'failed' ? 'animate-spin' : ''}`} />
        <span className={`text-lg font-semibold ${config.color}`}>
          {config.text}
        </span>
      </div>
      
      {/* 进度条 */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              status === 'success' ? 'bg-green-500' : 
              status === 'failed' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1 text-center">
          {progress}%
        </p>
      </div>
      
      {/* 阶段说明 */}
      {status === 'polling' && (
        <p className="text-sm text-gray-600 text-center">
          正在等待 Zama Gateway 完成 FHE 解密...
          <br />
          预计需要 30-60 秒
        </p>
      )}
      
      {status === 'waiting' && (
        <p className="text-sm text-gray-600 text-center">
          Gateway 已解密，等待智能合约回调...
          <br />
          通常只需几秒钟
        </p>
      )}
      
      {/* 错误信息 */}
      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700">
          <strong>错误：</strong> {error}
        </div>
      )}
      
      {/* 成功信息 */}
      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-700">
          ✅ 游戏结果已成功解密并上链
        </div>
      )}
    </div>
  );
}
```

### 2.4 修改游戏详情页

**文件：** `frontend/src/components/GameDetail.jsx`

```jsx
// components/GameDetail.jsx

import React, { useState, useEffect } from 'react';
import { useContract } from '../hooks/useContract';
import { useDecryption } from '../hooks/useDecryption';
import DecryptionProgress from './DecryptionProgress';

export default function GameDetail({ gameId }) {
  const { getContract, getFheStatus } = useContract();
  const [gameInfo, setGameInfo] = useState(null);
  const [contract, setContract] = useState(null);
  const [showDecryptionModal, setShowDecryptionModal] = useState(false);
  
  const {
    requestDecryption,
    status: decryptStatus,
    progress: decryptProgress,
    error: decryptError,
    result: decryptResult,
    reset: resetDecryption
  } = useDecryption(contract);
  
  useEffect(() => {
    loadGameInfo();
  }, [gameId]);
  
  const loadGameInfo = async () => {
    const contractInstance = await getContract();
    setContract(contractInstance);
    
    const game = await contractInstance.games(gameId);
    setGameInfo({
      id: gameId,
      owner: game.owner,
      revealedTarget: game.revealedTarget,
      revealedGuess: game.revealedGuess,
      entryFee: game.entryFee,
      createdAt: new Date(Number(game.createdAt) * 1000),
      expiresAt: new Date(Number(game.expiresAt) * 1000),
      status: game.status,
      winner: game.winner
    });
  };
  
  const handleRequestDecryption = async () => {
    try {
      setShowDecryptionModal(true);
      resetDecryption();
      
      const result = await requestDecryption(gameId);
      
      console.log('解密结果:', result);
      
      // 刷新游戏信息
      await loadGameInfo();
      
      // 3秒后自动关闭
      setTimeout(() => {
        setShowDecryptionModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('解密失败:', error);
      // 保持模态框打开以显示错误
    }
  };
  
  const handleRetryDecryption = async () => {
    try {
      const tx = await contract.retryDecryption(gameId);
      await tx.wait();
      
      // 重新开始解密流程
      await handleRequestDecryption();
      
    } catch (error) {
      console.error('重试失败:', error);
      alert('重试失败: ' + error.message);
    }
  };
  
  if (!gameInfo) {
    return <div>加载中...</div>;
  }
  
  const now = Date.now();
  const hasEnded = now >= gameInfo.expiresAt.getTime();
  const isPendingDecrypt = gameInfo.status === 1;
  const isCompleted = gameInfo.status === 2;
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">游戏 #{gameId}</h1>
      
      {/* 游戏信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">状态</p>
            <p className="text-lg font-semibold">
              {isPendingDecrypt && '🔐 解密中'}
              {isCompleted && '✅ 已完成'}
              {!isPendingDecrypt && !isCompleted && '🎮 进行中'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">结束时间</p>
            <p className="text-lg font-semibold">
              {gameInfo.expiresAt.toLocaleString()}
            </p>
          </div>
          
          {isCompleted && (
            <>
              <div>
                <p className="text-sm text-gray-500">目标数字</p>
                <p className="text-2xl font-bold text-blue-600">
                  {gameInfo.revealedTarget}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">猜测数字</p>
                <p className="text-2xl font-bold text-purple-600">
                  {gameInfo.revealedGuess}
                </p>
              </div>
              
              {gameInfo.winner !== '0x0000000000000000000000000000000000000000' && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">获胜者</p>
                  <p className="text-lg font-semibold text-green-600">
                    {gameInfo.winner}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 操作按钮 */}
      {hasEnded && !isCompleted && !isPendingDecrypt && (
        <button
          onClick={handleRequestDecryption}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          🔓 请求解密游戏结果
        </button>
      )}
      
      {isPendingDecrypt && (
        <div className="space-y-3">
          <button
            onClick={handleRetryDecryption}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            🔄 重试解密
          </button>
          
          <p className="text-sm text-gray-600 text-center">
            解密正在进行中，通常需要 1-2 分钟。
            <br />
            如果长时间未完成，可以尝试重试。
          </p>
        </div>
      )}
      
      {/* 解密进度模态框 */}
      {showDecryptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <DecryptionProgress 
              status={decryptStatus}
              progress={decryptProgress}
              error={decryptError}
            />
            
            {decryptStatus === 'failed' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleRequestDecryption}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  重试
                </button>
                <button
                  onClick={() => setShowDecryptionModal(false)}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  关闭
                </button>
              </div>
            )}
            
            {decryptStatus === 'success' && (
              <div className="mt-4">
                <button
                  onClick={() => setShowDecryptionModal(false)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  查看结果
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Step 3: 测试和验证

### 3.1 测试脚本

**文件：** `scripts/test_decryption.js`

```javascript
// scripts/test_decryption.js

const hre = require("hardhat");

async function main() {
  console.log("🧪 测试完整解密流程...\n");
  
  // 1. 获取合约
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const Contract = await hre.ethers.getContractFactory("GuessGameFHE_v3");
  const contract = Contract.attach(contractAddress);
  
  const [signer] = await hre.ethers.getSigners();
  console.log("👤 测试账户:", signer.address);
  
  // 2. 创建测试游戏
  console.log("\n📝 创建测试游戏...");
  const targetNumber = 42;
  // 这里需要加密 targetNumber（使用 FHEVM SDK）
  // const { handle, proof } = await encryptNumber(targetNumber);
  
  // 暂时跳过，假设游戏已创建
  const gameId = 0;
  
  // 3. 请求解密
  console.log("\n🔓 请求解密...");
  const tx = await contract.requestDecryption(gameId);
  console.log("交易哈希:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ 交易已确认");
  
  // 4. 获取请求ID
  const event = receipt.events.find(e => e.event === "DecryptionRequested");
  const requestId = event.args.requestId;
  console.log("🔑 请求ID:", requestId.toString());
  
  // 5. 检查解密状态
  console.log("\n📊 检查解密状态...");
  const status = await contract.getDecryptionStatus(gameId);
  console.log("状态:", {
    requestId: status.requestId.toString(),
    timestamp: new Date(Number(status.timestamp) * 1000).toLocaleString(),
    retryCount: status.retryCount,
    processed: status.processed,
    gameStatus: status.status
  });
  
  // 6. 等待回调（实际中由 Gateway 自动触发）
  console.log("\n⏳ 等待 Gateway 回调...");
  console.log("（在生产环境中，前端会轮询 Gateway）");
  
  // 7. 轮询游戏状态
  console.log("\n🔍 轮询游戏状态...");
  for (let i = 0; i < 30; i++) {
    const game = await contract.games(gameId);
    
    if (game.status === 2) { // COMPLETED
      console.log("\n🎉 解密完成!");
      console.log("目标数字:", game.revealedTarget);
      console.log("猜测数字:", game.revealedGuess);
      console.log("获胜者:", game.winner);
      break;
    }
    
    console.log(`尝试 ${i + 1}/30: 状态=${game.status}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Step 4: 部署新版本

### 4.1 部署脚本

**文件：** `scripts/deploy_fhe_v3.js`

```javascript
// scripts/deploy_fhe_v3.js

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 部署 GuessGameFHE_v3...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 部署账户:", deployer.address);
  console.log("💰 余额:", hre.ethers.utils.formatEther(
    await deployer.getBalance()
  ), "ETH\n");
  
  // 部署
  const Contract = await hre.ethers.getContractFactory("GuessGameFHE_v3");
  console.log("📦 开始部署...");
  
  const contract = await Contract.deploy();
  await contract.deployed();
  
  console.log("✅ 合约已部署!");
  console.log("📍 地址:", contract.address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${contract.address}`);
  
  // 保存部署信息
  const deployment = {
    network: hre.network.name,
    contractName: "GuessGameFHE_v3",
    address: contract.address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: contract.deployTransaction.blockNumber,
    transactionHash: contract.deployTransaction.hash
  };
  
  fs.writeFileSync(
    `deployments/GuessGameFHE_v3_${hre.network.name}.json`,
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("\n💾 部署信息已保存");
  
  // 验证合约（Sepolia）
  if (hre.network.name === "sepolia") {
    console.log("\n⏳ 等待 5 个区块确认后验证合约...");
    await contract.deployTransaction.wait(5);
    
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: []
      });
      console.log("✅ 合约已在 Etherscan 验证");
    } catch (error) {
      console.log("⚠️ 验证失败:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 📋 升级检查清单

### 合约层面
- [ ] ✅ 添加 `GameStatus` 枚举
- [ ] ✅ 添加 `DecryptionRequest` 结构
- [ ] ✅ 添加请求ID映射系统
- [ ] ✅ 修改 `requestDecryption` 函数（Gas + 超时）
- [ ] ✅ 完善 `_handleDecryptionCallback` 验证
- [ ] ✅ 实现 `retryDecryption` 功能
- [ ] ✅ 实现 `cancelExpiredGame` 功能
- [ ] ✅ 实现 `emergencyResolve` 功能
- [ ] ✅ 添加完整的事件系统
- [ ] ✅ 编译无错误
- [ ] ✅ 单元测试通过

### 前端层面
- [ ] ✅ 创建 `RelayerClient` 工具类
- [ ] ✅ 创建 `useDecryption` Hook
- [ ] ✅ 创建 `DecryptionProgress` 组件
- [ ] ✅ 修改游戏详情页集成解密
- [ ] ✅ 添加重试按钮
- [ ] ✅ 添加进度展示
- [ ] ✅ 测试完整流程

### 部署层面
- [ ] ✅ 本地测试部署
- [ ] ✅ Sepolia 测试网部署
- [ ] ✅ 合约验证（Etherscan）
- [ ] ✅ 前端配置更新
- [ ] ✅ 完整端到端测试

---

## 🎯 预期效果

升级后，您的项目将具备：

✅ **生产级的解密系统**
- 完整的请求追踪
- 自动 Relayer 轮询
- 实时进度显示

✅ **企业级的容错能力**
- 超时自动处理
- 用户手动重试
- 管理员应急解锁

✅ **优秀的用户体验**
- 清晰的状态提示
- 实时进度反馈
- 友好的错误处理

✅ **竞争力提升**
- 符合获奖项目标准
- 代码质量大幅提升
- 可参赛 Zama Developer Program

---

## 🚀 立即开始

```bash
# 1. 备份现有项目
git checkout -b upgrade-decryption
git add .
git commit -m "backup before upgrade"

# 2. 开始升级
# 按照上述步骤逐个修改文件

# 3. 测试
cd contracts
npx hardhat compile
npx hardhat test

cd ../frontend
npm install
npm run dev

# 4. 部署
npx hardhat run scripts/deploy_fhe_v3.js --network sepolia
```

---

**升级完成后，您的项目将具备参赛 Zama Developer Program 的实力！** 🏆

有任何问题随时问我！💪


