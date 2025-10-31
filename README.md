#  Confidential Data Marketplace
<img width="2560" height="1279" alt="image" src="https://github.com/user-attachments/assets/719b36a8-5751-41dd-919b-94eee4caf065" />

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Zama FHEVM](https://img.shields.io/badge/Zama-FHEVM-purple.svg)](https://www.zama.ai/)

> A privacy-preserving data marketplace powered by Fully Homomorphic Encryption (FHE), enabling secure data trading and computation without exposing raw data.
> 
> 基于全同态加密（FHE）的隐私保护数据市场，支持在不暴露原始数据的情况下进行安全的数据交易和计算。

[Demo](https://confidential-data-marketplace.netlify.app/) | [Documentation](./docs) | [Developer Guide]()

---

```
┌─────────────────────────────────────┐
│ Dilemmas for Data Providers:       │
│ ❌ Data is fully copied once sold  │
│ ❌ Cannot control secondary use of data │
│ ❌ Cannot prove data hasn't been leaked │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Dilemmas for Buyers:                │
│ ❌ Cannot verify data quality before purchase │
│ ❌ Worried about data contamination or falsification │
│ ❌ Need to trust centralized platforms │
└─────────────────────────────────────┘
```

## 📖 Table of Contents | 目录

- [Overview | 项目概述](#overview--项目概述)
- [Features | 核心功能](#features--核心功能)
- [Architecture | 技术架构](#architecture--技术架构)
- [Getting Started | 快速开始](#getting-started--快速开始)
- [User Guide | 使用指南](#user-guide--使用指南)
- [Smart Contracts | 智能合约](#smart-contracts--智能合约)
- [Deployment | 部署信息](#deployment--部署信息)
- [Technology Stack | 技术栈](#technology-stack--技术栈)
- [Roadmap | 未来路线](#roadmap--未来路线)
- [Contributing | 贡献指南](#contributing--贡献指南)
- [License | 许可证](#license--许可证)

---

## 🎯 Overview | 项目概述

### English

**Confidential Data Marketplace** is a decentralized platform that enables secure data trading while preserving privacy. Built on **Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine)**, it allows data providers to monetize their datasets without revealing the raw data, and data buyers to perform computations on encrypted data.

**Key Innovation:**
- 🔐 **Privacy-Preserving**: Data remains encrypted on-chain
- 💰 **Fair Trading**: Automatic payment upon query execution
- 🧮 **Encrypted Computation**: Calculate statistics (mean, variance, count) on encrypted data
- ⚡ **Dual Contract Architecture**: Mock mode for development, FHE mode for production

**Use Cases:**
- Healthcare data sharing (patient records, research data)
- Financial data analytics (market data, trading signals)
- IoT sensor data marketplace
- Research data collaboration

### 中文

**Confidential Data Marketplace** 是一个去中心化的隐私保护数据交易平台。基于 **Zama 的 FHEVM（全同态加密虚拟机）** 构建，允许数据提供者在不泄露原始数据的情况下将数据集变现，同时数据买家可以在加密数据上执行计算。

**核心创新：**
- 🔐 **隐私保护**：数据在链上保持加密状态
- 💰 **公平交易**：查询执行后自动支付
- 🧮 **加密计算**：在加密数据上计算统计信息（均值、方差、计数）
- ⚡ **双合约架构**：Mock 模式用于开发，FHE 模式用于生产

**应用场景：**
- 医疗数据共享（患者记录、研究数据）
- 金融数据分析（市场数据、交易信号）
- 物联网传感器数据市场
- 科研数据协作

---

## ✨ Features | 核心功能

### 1. 🗄️ Dataset Management | 数据集管理

#### English
**Upload Encrypted Datasets**
- Data providers can upload their datasets to the blockchain
- In FHE mode, data is encrypted using Zama's FHE technology
- Each dataset includes: name, description, data array, and price per query
- Datasets are stored on-chain with ownership verification

**What it means:**
Think of it like listing a product on a marketplace, but the product (your data) is locked in a secure box. Only authorized computations can access it without ever opening the box.

**How to use:**
1. Click "Upload Data" in the navigation bar
2. Fill in dataset information:
   - **Name**: A descriptive title (e.g., "Sales Data 2024")
   - **Description**: What the data represents (e.g., "Monthly sales figures")
   - **Data**: Comma-separated numbers (e.g., "100, 200, 150, 300")
   - **Price**: Cost per query in ETH (e.g., "0.001")
3. Click "Upload Dataset"
4. Confirm the transaction in your wallet
5. Wait for confirmation (~15 seconds on Sepolia)

#### 中文
**上传加密数据集**
- 数据提供者可以将数据集上传到区块链
- 在 FHE 模式下，数据使用 Zama 的 FHE 技术加密
- 每个数据集包括：名称、描述、数据数组和每次查询价格
- 数据集存储在链上并进行所有权验证

**这意味着什么：**
把它想象成在市场上列出产品，但产品（您的数据）被锁在一个安全的盒子里。只有授权的计算才能访问它，而无需打开盒子。

**如何使用：**
1. 点击导航栏中的 "Upload Data"（上传数据）
2. 填写数据集信息：
   - **名称**：描述性标题（例如："2024年销售数据"）
   - **描述**：数据代表什么（例如："月度销售数字"）
   - **数据**：逗号分隔的数字（例如："100, 200, 150, 300"）
   - **价格**：每次查询的费用（ETH）（例如："0.001"）
3. 点击 "Upload Dataset"（上传数据集）
4. 在钱包中确认交易
5. 等待确认（Sepolia 上约 15 秒）

---

### 2. 🛒 Marketplace | 数据市场

#### English
**Browse Available Datasets**
- View all available datasets in the marketplace
- See key information: name, description, price, number of queries
- Filter and search datasets (coming soon)
- Access dataset details with one click

**What it means:**
Like browsing a store catalog, you can see what data is available for purchase. Each "product" shows its price and how many times it has been purchased before.

**How to use:**
1. Click "Marketplace" in the navigation bar
2. Browse the list of available datasets
3. Each card shows:
   - **Dataset Name**: Title of the dataset
   - **Description**: What the data contains
   - **Price**: Cost per query in ETH
   - **Data Points**: Number of values in the dataset
   - **Queries**: How many times it has been queried
   - **Owner**: Data provider's address (abbreviated)
4. Click on any dataset card to view details and execute queries

#### 中文
**浏览可用数据集**
- 在市场中查看所有可用数据集
- 查看关键信息：名称、描述、价格、查询次数
- 过滤和搜索数据集（即将推出）
- 一键访问数据集详情

**这意味着什么：**
就像浏览商店目录一样，您可以看到哪些数据可供购买。每个"产品"显示其价格以及之前被购买的次数。

**如何使用：**
1. 点击导航栏中的 "Marketplace"（市场）
2. 浏览可用数据集列表
3. 每张卡片显示：
   - **数据集名称**：数据集的标题
   - **描述**：数据包含的内容
   - **价格**：每次查询的费用（ETH）
   - **数据点数**：数据集中的值数量
   - **查询次数**：被查询的次数
   - **所有者**：数据提供者的地址（缩写）
4. 点击任何数据集卡片查看详情并执行查询

---

### 3. 🔍 Query Execution | 查询执行

#### English
**Perform Computations on Encrypted Data**

The platform supports four types of queries:

**a) Calculate Mean | 计算平均值**
- **What it does**: Computes the average of all values in the dataset
- **Example**: For data [100, 200, 150, 300, 250], the mean is 200
- **Use case**: Understanding the central tendency of data
- **No parameter required**

**b) Calculate Variance | 计算方差**
- **What it does**: Measures how spread out the values are
- **Example**: Higher variance means more variability in the data
- **Use case**: Assessing data consistency and risk
- **No parameter required**

**c) Count Above Threshold | 统计高于阈值**
- **What it does**: Counts how many values exceed a given threshold
- **Example**: For data [100, 200, 150, 300, 250] with threshold 200, the result is 2 (300 and 250)
- **Use case**: Quality control, performance benchmarking
- **Requires parameter**: The threshold value

**d) Count Below Threshold | 统计低于阈值**
- **What it does**: Counts how many values are below a given threshold
- **Example**: For data [100, 200, 150, 300, 250] with threshold 200, the result is 2 (100 and 150)
- **Use case**: Defect analysis, compliance checking
- **Requires parameter**: The threshold value

**How to use:**
1. Navigate to a dataset detail page (click on a dataset in Marketplace)
2. Choose a query type:
   - Click on the appropriate query card
   - For "Count Above" or "Count Below", enter a threshold value
3. Review the query price
4. Click "Execute Query"
5. Confirm payment in your wallet
6. Wait for the result:
   - **Mock Mode**: Instant result (1-2 seconds)
   - **FHE Mode**: 30-60 seconds (Gateway decryption time)
7. View the result displayed on the page

**Payment Flow:**
```
You pay → Query executes → Result returned → Payment split:
  ├─ 95% to data provider (revenue)
  └─ 5% to platform (fee)
```

#### 中文
**在加密数据上执行计算**

平台支持四种查询类型：

**a) 计算平均值 | Calculate Mean**
- **功能**：计算数据集中所有值的平均值
- **示例**：对于数据 [100, 200, 150, 300, 250]，平均值是 200
- **用例**：了解数据的集中趋势
- **无需参数**

**b) 计算方差 | Calculate Variance**
- **功能**：测量值的分散程度
- **示例**：方差越高，数据变化越大
- **用例**：评估数据一致性和风险
- **无需参数**

**c) 统计高于阈值 | Count Above Threshold**
- **功能**：统计有多少值超过给定阈值
- **示例**：对于数据 [100, 200, 150, 300, 250]，阈值 200，结果是 2（300 和 250）
- **用例**：质量控制、性能基准测试
- **需要参数**：阈值

**d) 统计低于阈值 | Count Below Threshold**
- **功能**：统计有多少值低于给定阈值
- **示例**：对于数据 [100, 200, 150, 300, 250]，阈值 200，结果是 2（100 和 150）
- **用例**：缺陷分析、合规检查
- **需要参数**：阈值

**如何使用：**
1. 导航到数据集详情页（在市场中点击数据集）
2. 选择查询类型：
   - 点击相应的查询卡片
   - 对于"统计高于"或"统计低于"，输入阈值
3. 查看查询价格
4. 点击 "Execute Query"（执行查询）
5. 在钱包中确认支付
6. 等待结果：
   - **Mock 模式**：即时结果（1-2 秒）
   - **FHE 模式**：30-60 秒（Gateway 解密时间）
7. 查看页面上显示的结果

**支付流程：**
```
您支付 → 执行查询 → 返回结果 → 支付分配：
  ├─ 95% 给数据提供者（收入）
  └─ 5% 给平台（手续费）
```

---

### 4. 📊 Dashboard | 数据面板

#### English
**Monitor Your Activity**
- View your uploaded datasets
- Track total queries received
- Monitor revenue earned
- See platform statistics

**What it means:**
Your personal control panel showing all your activity on the platform - like a business dashboard showing sales and revenue.

**How to use:**
1. Click "Dashboard" in the navigation bar
2. View statistics:
   - **Total Datasets**: Number of datasets you've uploaded
   - **Total Queries**: Number of times your datasets have been queried
   - **Total Revenue**: Total earnings in ETH
   - **Platform Stats**: Overall marketplace statistics
3. See detailed breakdown of each dataset:
   - Name and description
   - Number of queries
   - Revenue generated
   - Active status

#### 中文
**监控您的活动**
- 查看您上传的数据集
- 跟踪收到的查询总数
- 监控赚取的收入
- 查看平台统计信息

**这意味着什么：**
您的个人控制面板，显示您在平台上的所有活动 - 就像显示销售和收入的商业仪表板。

**如何使用：**
1. 点击导航栏中的 "Dashboard"（仪表板）
2. 查看统计信息：
   - **总数据集数**：您上传的数据集数量
   - **总查询数**：您的数据集被查询的次数
   - **总收入**：总收入（ETH）
   - **平台统计**：整体市场统计
3. 查看每个数据集的详细分类：
   - 名称和描述
   - 查询次数
   - 产生的收入
   - 活跃状态

---

### 5. 🔄 Contract Mode Switching | 合约模式切换

#### English
**Toggle Between Mock and FHE Modes**

The platform supports two operational modes:

**Mock Mode (📝)**
- **What it is**: Development and demonstration mode
- **How it works**: Data is stored in plaintext, computations are instant
- **Best for**: Testing, demonstrations, development
- **Advantages**: Fast, no Gateway delays, always available
- **Network**: Sepolia Testnet
- **Contract**: `0x9e138064d8B68E027c8Fe0C4da03325C91cecaeb`

**FHE Mode (🔐)**
- **What it is**: Production mode with real encryption
- **How it works**: Data is encrypted with FHE, computations on encrypted data
- **Best for**: Real-world applications, privacy-critical use cases
- **Advantages**: True privacy preservation, regulatory compliance
- **Network**: Sepolia Testnet (with Zama FHEVM)
- **Contract**: `0x39adb32637D1E16C1Cd7159EE3a24C13c161FE69`
- **Note**: Gateway integration in progress

**How to switch:**
1. Look for the dropdown menu in the top-right corner (next to Sepolia)
2. Click on it to see options:
   - 📝 Mock Mode
   - 🔐 FHE Mode
3. Select your preferred mode
4. Page will automatically reload
5. Current mode is displayed with an icon next to the network name

**Visual Indicators:**
- **Mock Mode**: Blue badge with 📝 icon
- **FHE Mode**: Purple badge with 🔐 icon

#### 中文
**在 Mock 和 FHE 模式之间切换**

平台支持两种操作模式：

**Mock 模式 (📝)**
- **是什么**：开发和演示模式
- **工作原理**：数据以明文存储，计算即时完成
- **最适合**：测试、演示、开发
- **优势**：快速，无 Gateway 延迟，始终可用
- **网络**：Sepolia 测试网
- **合约**：`0x9e138064d8B68E027c8Fe0C4da03325C91cecaeb`

**FHE 模式 (🔐)**
- **是什么**：具有真实加密的生产模式
- **工作原理**：数据使用 FHE 加密，在加密数据上计算
- **最适合**：实际应用、隐私关键用例
- **优势**：真正的隐私保护、合规性
- **网络**：Sepolia 测试网（使用 Zama FHEVM）
- **合约**：`0x39adb32637D1E16C1Cd7159EE3a24C13c161FE69`
- **注意**：Gateway 集成进行中

**如何切换：**
1. 查找右上角的下拉菜单（Sepolia 旁边）
2. 点击它查看选项：
   - 📝 Mock 模式
   - 🔐 FHE 模式
3. 选择您喜欢的模式
4. 页面将自动重新加载
5. 当前模式以图标显示在网络名称旁边

**视觉指示器：**
- **Mock 模式**：带 📝 图标的蓝色徽章
- **FHE 模式**：带 🔐 图标的紫色徽章

---

## 🏗️ Architecture | 技术架构

### System Overview | 系统概述

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │   Wallet   │  │   ethers.js │  │  Contract Interaction│ │
│  │ Connection │  │     v6      │  │      Layer           │ │
│  └────────────┘  └─────────────┘  └──────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
           ┌────────────────────────────────┐
           │   useContractMode Hook         │
           │   (Mode Detection & Switching) │
           └────────┬───────────────┬───────┘
                    │               │
          ┌─────────▼──────┐   ┌───▼──────────────┐
          │  Mock Mode     │   │   FHE Mode       │
          │  useContract   │   │   useContractFHE │
          └────────┬───────┘   └───┬──────────────┘
                   │               │
                   ▼               ▼
   ┌───────────────────────┐   ┌─────────────────────────┐
   │ DataMarketplaceMock   │   │  DataMarketplaceFHE     │
   │ (Sepolia Testnet)     │   │  (Sepolia + Zama)       │
   │ 0x9e138064...         │   │  0x39adb326...          │
   │                       │   │                         │
   │ - Plaintext storage   │   │  - FHE encryption       │
   │ - Instant computation │   │  - euint32 types        │
   │ - Direct payment      │   │  - Gateway decryption   │
   └───────────────────────┘   └─────────┬───────────────┘
                                          │
                                          ▼
                               ┌──────────────────────┐
                               │   Zama Gateway       │
                               │   (Decryption)       │
                               │ gateway.sepolia.     │
                               │ zama.ai              │
                               └──────────────────────┘
```

### Dual Contract Architecture | 双合约架构

**English:**
The platform uses a **dual contract architecture** for maximum flexibility:

1. **Mock Contract**: For development, testing, and demonstrations
   - Immediate results
   - No external dependencies
   - Always available

2. **FHE Contract**: For production with real privacy
   - Encrypted data storage
   - Homomorphic computations
   - Gateway-based decryption

Both contracts implement the same interface, allowing seamless switching via frontend configuration.

**中文：**
平台使用 **双合约架构** 以实现最大灵活性：

1. **Mock 合约**：用于开发、测试和演示
   - 即时结果
   - 无外部依赖
   - 始终可用

2. **FHE 合约**：用于具有真实隐私的生产环境
   - 加密数据存储
   - 同态计算
   - 基于 Gateway 的解密

两个合约实现相同的接口，允许通过前端配置无缝切换。

---

## 🚀 Getting Started | 快速开始

### Prerequisites | 前置要求

**English:**
- Node.js v18+ and npm
- MetaMask or OKX Wallet browser extension
- Sepolia testnet ETH (get from [faucet](https://sepoliafaucet.com/))
- Git

**中文：**
- Node.js v18+ 和 npm
- MetaMask 或 OKX Wallet 浏览器扩展
- Sepolia 测试网 ETH（从 [水龙头](https://sepoliafaucet.com/) 获取）
- Git

### Installation | 安装

```bash
# Clone the repository | 克隆仓库
git clone https://github.com/your-username/confidential-data-marketplace.git
cd confidential-data-marketplace

# Install dependencies | 安装依赖
npm install
cd frontend && npm install
```

### Configuration | 配置

```bash
# Create environment file | 创建环境文件
cp .env.example .env

# Edit .env with your settings | 编辑 .env 文件
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

### Running Locally | 本地运行

```bash
# Terminal 1: Start local Hardhat network (optional) | 终端 1：启动本地 Hardhat 网络（可选）
npx hardhat node

# Terminal 2: Deploy contracts | 终端 2：部署合约
npx hardhat run scripts/deploy.js --network sepolia

# Terminal 3: Start frontend | 终端 3：启动前端
cd frontend
npm run dev

# Open browser | 打开浏览器
# Visit http://localhost:3000
```

### Testing | 测试

```bash
# Run contract tests | 运行合约测试
npx hardhat test

# Run frontend tests | 运行前端测试
cd frontend && npm test
```

---

## 📝 Smart Contracts | 智能合约

### Mock Contract | Mock 合约

**Deployment | 部署地址**: `0x9e138064d8B68E027c8Fe0C4da03325C91cecaeb` (Sepolia)

**Key Functions | 主要函数:**

```solidity
// Upload a dataset | 上传数据集
function uploadDataset(
    string memory name,
    string memory description,
    uint256[] memory dataArray,
    uint256 pricePerQuery
) external returns (uint256 datasetId)

// Execute a query | 执行查询
function executeQuery(
    uint256 datasetId,
    QueryType queryType,
    uint256 parameter
) external payable returns (uint256 queryId)

// Get dataset information | 获取数据集信息
function getDataset(uint256 datasetId) 
    external view returns (Dataset memory)

// Get query result | 获取查询结果
function getQuery(uint256 queryId) 
    external view returns (Query memory)
```

### FHE Contract | FHE 合约

**Deployment | 部署地址**: `0x39adb32637D1E16C1Cd7159EE3a24C13c161FE69` (Sepolia)

**Key Differences | 主要差异:**

```solidity
// Upload encrypted dataset | 上传加密数据集
function uploadDataset(
    string memory name,
    string memory description,
    einput[] calldata inputHandles,    // ⚠️ FHE encrypted inputs
    bytes[] calldata inputProofs,      // ⚠️ FHE proofs
    uint256 pricePerQuery
) external returns (uint256 datasetId)

// Execute query on encrypted data | 在加密数据上执行查询
function executeQuery(
    uint256 datasetId,
    QueryType queryType,
    einput parameterHandle,            // ⚠️ FHE encrypted parameter
    bytes calldata parameterProof
) external payable returns (uint256 queryId)

// Gateway callback for decryption | Gateway 解密回调
function callbackQueryResult(
    uint256 requestId,
    bool success,
    bytes memory decryptedCts
) public onlyGateway
```

**FHE Types | FHE 类型:**
- `euint32`: Encrypted 32-bit unsigned integer | 加密的 32 位无符号整数
- `einput`: Encrypted input handle | 加密输入句柄
- `ebool`: Encrypted boolean | 加密布尔值

---

## 🌐 Deployment | 部署信息

### Live Deployments | 实时部署

| Component | Network | Address | Status |
|-----------|---------|---------|--------|
| **Mock Contract** | Sepolia | `0x9e138064d8B68E027c8Fe0C4da03325C91cecaeb` | ✅ Active |
| **FHE Contract** | Sepolia | `0x39adb32637D1E16C1Cd7159EE3a24C13c161FE69` | ✅ Deployed |
| **Frontend** | Netlify | [Link](https://confidential-data-marketplace.netlify.app/) |  ✅ Active |

### Network Information | 网络信息

**Sepolia Testnet:**
- **Chain ID**: 11155111
- **RPC URL**: `https://ethereum-sepolia-rpc.publicnode.com`
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com

### Verified Contracts | 已验证合约

Both contracts are verified on Etherscan for transparency:
- [Mock Contract on Etherscan](https://sepolia.etherscan.io/address/0x9e138064d8B68E027c8Fe0C4da03325C91cecaeb)
- [FHE Contract on Etherscan](https://sepolia.etherscan.io/address/0x39adb32637D1E16C1Cd7159EE3a24C13c161FE69)

---

## 🛠️ Technology Stack | 技术栈

### Smart Contracts | 智能合约
- **Solidity** 0.8.24
- **Hardhat** - Development environment
- **FHEVM** - Zama's Fully Homomorphic Encryption library
- **OpenZeppelin** - Security standards

### Frontend | 前端
- **React** 18.2.0 - UI framework
- **Vite** 5.0.8 - Build tool
- **ethers.js** 6.9.0 - Ethereum interaction
- **Tailwind CSS** 3.3.6 - Styling
- **React Router** 6.20.0 - Navigation
- **Lucide React** - Icons

### FHEVM Integration | FHEVM 集成
- **fhevmjs** 0.6.2 - FHE SDK
- **fhevm** - Smart contract library
- **fhevm-core-contracts** - Core FHEVM contracts

### Development Tools | 开发工具
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🗺️ Roadmap | 未来路线

> 📋 For detailed roadmap, see [ROADMAP.md](./ROADMAP.md) | 详细路线图请查看 [ROADMAP.md](./ROADMAP.md)

### 🎯 Key Milestones | 关键里程碑

| Milestone | Target Date | Status | Description EN | 描述 ZH |
|-----------|-------------|--------|----------------|---------|
| **MVP Launch** | ✅ Oct 2025 | **Completed** | Mock version with full functionality | MVP 上线（Mock 版本）|
| **FHEVM Integration** | Nov 2025 | **70% Complete** | True FHE encryption operational | FHEVM 集成完成 |
| **Zama Developer Program** | Nov 2025 | **In Progress** | Competition submission | 参加 Zama 开发者计划 |
| **Advanced Features** | Q1 2026 | Planned | Enhanced query types and UX | 高级功能上线 |
| **Mainnet Deployment** | Q2 2026 | Planned | Production launch | 主网部署 |
| **Mobile Apps** | Q3 2026 | Planned | iOS & Android release | 移动应用发布 |

---

### Phase 1: Foundation ✅ (Q3 2025) - **COMPLETED** | 基础阶段 - **已完成**

**Smart Contracts | 智能合约**
- [x] Mock contract implementation (plaintext for testing) | Mock 合约实现
- [x] Dataset upload and query execution | 数据集上传和查询执行
- [x] Payment and revenue distribution (95%/5%) | 支付和收入分配
- [x] Deployment to Sepolia testnet | 部署到 Sepolia 测试网

**Frontend Application | 前端应用**
- [x] Modern React + Vite + Tailwind CSS stack | 现代化技术栈
- [x] Wallet integration (MetaMask, OKX) | 钱包集成
- [x] Complete user interface (5 pages) | 完整用户界面（5个页面）
- [x] Responsive design + Dark mode | 响应式设计 + 暗色模式

**Documentation | 文档**
- [x] Comprehensive README (English + Chinese) | 完整的 README（双语）
- [x] User manual and development guides | 用户手册和开发指南
- [x] Feature information UI integration | 功能说明 UI 集成

---

### Phase 2: FHEVM Integration 🚧 (Q4 2025) - **70% COMPLETE** | FHEVM 集成 - **70% 完成**

**FHE-Enabled Contract | FHE 智能合约**
- [x] `DataMarketplaceFHE` contract development | FHE 合约开发
- [x] FHE data types integration (`euint32`, `einput`) | FHE 数据类型集成
- [x] Encrypted computation implementation | 加密计算实现
- [x] Deployment to Sepolia with FHEVM config | 使用 FHEVM 配置部署
- [ ] Gateway polling for decryption results (**Next**) | Gateway 解密结果轮询（**下一步**）
- [ ] End-to-end FHE testing | 端到端 FHE 测试

**Frontend Integration | 前端集成**
- [x] Dual contract architecture (Mock/FHE) | 双合约架构
- [x] FHEVM SDK integration | FHEVM SDK 集成
- [x] Manual mode switching UI | 手动模式切换 UI
- [ ] Input encryption for uploads | 上传的输入加密
- [ ] Result decryption handling | 结果解密处理

**Target Completion: November 2025** | **目标完成：2025年11月**

---

### Phase 3: Enhancement 📋 (Q1 2026) - **PLANNED** | 增强阶段 - **计划中**

**Advanced Features | 高级功能**
- [ ] Advanced query types (regression, correlation) | 高级查询类型
- [ ] Dataset categories, tags, and search | 数据集分类、标签和搜索
- [ ] User profiles and reputation system | 用户档案和声誉系统
- [ ] Data visualization for results | 结果数据可视化
- [ ] Multi-language support (EN, ZH, ES, FR) | 多语言支持

**Analytics | 分析**
- [ ] Provider analytics dashboard | 提供者分析仪表板
- [ ] Revenue trends and forecasting | 收入趋势和预测
- [ ] Platform statistics | 平台统计

**Target Completion: Q1 2026** | **目标完成：2026年第一季度**

---

### Phase 4: Production 🔮 (Q2-Q3 2026) - **FUTURE** | 生产阶段 - **未来**

**Network Expansion | 网络扩展**
- [ ] Zama Devnet migration (when available) | 迁移到 Zama Devnet
- [ ] Ethereum mainnet deployment | 以太坊主网部署
- [ ] Layer 2 integration (Arbitrum, Optimism) | Layer 2 集成
- [ ] Cross-chain support | 跨链支持

**Governance & Tokenomics | 治理与代币**
- [ ] Platform governance token (DAO) | 平台治理代币
- [ ] Staking mechanism | 质押机制
- [ ] Token-based incentives | 基于代币的激励

**Enterprise Features | 企业功能**
- [ ] API for programmatic access | 程序化访问 API
- [ ] Private data marketplaces | 私有数据市场
- [ ] SLA guarantees | SLA 保证

**Target Completion: Q3 2026** | **目标完成：2026年第三季度**

---

### Phase 5: Ecosystem 🌟 (2026+) - **VISION** | 生态系统 - **愿景**

**Mobile & Integrations | 移动端与集成**
- [ ] iOS and Android applications | iOS 和 Android 应用
- [ ] Integration with major data providers | 与主要数据提供者集成
- [ ] Healthcare, finance, IoT marketplaces | 医疗、金融、物联网市场

**Developer Tools | 开发者工具**
- [ ] SDK for multiple languages | 多语言 SDK
- [ ] CLI tools and testing framework | CLI 工具和测试框架
- [ ] Developer community program | 开发者社区计划

**Target: 2026-2027** | **目标：2026-2027年**

---

### 📊 Success Metrics | 成功指标

**By Q1 2026:**
- 🎯 **Active Users**: 1,000+ | **活跃用户**：1,000+
- 🎯 **Datasets**: 100+ | **数据集**：100+
- 🎯 **Total Volume**: $10,000+ | **总交易量**：$10,000+
- 🎯 **GitHub Stars**: 500+ | **GitHub 星标**：500+

**By Q3 2026:**
- 🎯 **Active Users**: 10,000+ | **活跃用户**：10,000+
- 🎯 **Datasets**: 1,000+ | **数据集**：1,000+
- 🎯 **Total Volume**: $100,000+ | **总交易量**：$100,000+
- 🎯 **Provider Revenue**: Average $100/month | **提供者收入**：平均 $100/月

---

## 📚 Documentation | 文档

### Available Documents | 可用文档

- **[Detailed Roadmap](./ROADMAP.md)** - Complete project roadmap with milestones (English + Chinese) | 完整的项目路线图
- **[Developer Guide](./FHEVM_开发标准与解决方案手册.md)** - Comprehensive development standards (Chinese) | 开发标准手册
- **[Development Experience](./🎓-从Mock到FHE的完整开发经验.md)** - Lessons learned from Mock to FHE (Chinese) | 开发经验总结
- **[User Manual](./用户测试手册.md)** - User testing guide (Chinese) | 用户测试手册

### API Documentation | API 文档

Coming soon | 即将推出

---

## 🤝 Contributing | 贡献指南

### English

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

**Areas we need help with:**
- 🐛 Bug fixes and testing
- 📝 Documentation improvements
- 🌐 Translations (especially English)
- 🎨 UI/UX enhancements
- 🔐 Security audits

### 中文

我们欢迎贡献！您可以这样帮助：

1. **Fork 仓库**
2. **创建功能分支**：`git checkout -b feature/amazing-feature`
3. **提交更改**：`git commit -m 'Add amazing feature'`
4. **推送到分支**：`git push origin feature/amazing-feature`
5. **打开 Pull Request**

**我们需要帮助的领域：**
- 🐛 Bug 修复和测试
- 📝 文档改进
- 🌐 翻译（尤其是英文）
- 🎨 UI/UX 增强
- 🔐 安全审计

---

## 🔒 Security | 安全

### Audits | 审计

- No formal audit yet | 尚未进行正式审计
- Community review welcome | 欢迎社区审查

### Reporting Vulnerabilities | 报告漏洞

**English:**
If you discover a security vulnerability, please email us at:
- **Email**: security@your-project.com
- **Please DO NOT** open a public issue

**中文：**
如果您发现安全漏洞，请发送电子邮件至：
- **电子邮件**：security@your-project.com
- **请不要**公开提交 issue

---

## 📄 License | 许可证

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

本项目采用 **MIT 许可证** - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 Acknowledgments | 致谢

### English

- **[Zama](https://www.zama.ai/)** - For the groundbreaking FHEVM technology
- **[OpenZeppelin](https://openzeppelin.com/)** - For secure smart contract libraries
- **[Hardhat](https://hardhat.org/)** - For excellent development tools
- **[React](https://reactjs.org/)** & **[Vite](https://vitejs.dev/)** - For modern frontend tools

Special thanks to the **Zama Developer Program** for inspiring this project.

### 中文

- **[Zama](https://www.zama.ai/)** - 提供突破性的 FHEVM 技术
- **[OpenZeppelin](https://openzeppelin.com/)** - 提供安全的智能合约库
- **[Hardhat](https://hardhat.org/)** - 提供出色的开发工具
- **[React](https://reactjs.org/)** & **[Vite](https://vitejs.dev/)** - 提供现代化的前端工具

特别感谢 **Zama Developer Program** 激发了这个项目的灵感。

---

## 📞 Contact | 联系方式

- **Website**: [your-website.com]
- **Email**: contact@your-project.com
- **Twitter**: [@your_project]
- **Discord**: [Your Discord Server]
- **GitHub**: [github.com/your-username/confidential-data-marketplace]

---

## 📊 Project Statistics | 项目统计

![GitHub stars](https://img.shields.io/github/stars/your-username/confidential-data-marketplace)
![GitHub forks](https://img.shields.io/github/forks/your-username/confidential-data-marketplace)
![GitHub issues](https://img.shields.io/github/issues/your-username/confidential-data-marketplace)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/confidential-data-marketplace)

---

<div align="center">

**Made with ❤️ and 🔐 by [Your Team Name]**

**使用 ❤️ 和 🔐 制作**

[⬆ Back to Top | 返回顶部](#-confidential-data-marketplace)

</div>
