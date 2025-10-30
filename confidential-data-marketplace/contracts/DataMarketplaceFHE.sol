// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DataMarketplaceFHE
 * @notice 基于 FHEVM 的隐私保护数据交易平台
 * @dev 使用全同态加密（FHE）保护数据隐私，支持加密数据查询和统计分析
 * 
 * ⚠️ 重要：本合约部署在 Sepolia 测试网（chainId: 11155111）
 *          使用 Zama 提供的 FHEVM 基础设施
 * 
 * 核心功能：
 * 1. 数据提供者上传加密数据集（euint32）
 * 2. 买家购买查询权限并执行 FHE 运算
 * 3. 通过 Gateway 解密查询结果
 * 4. 自动分配收益（95% 给提供者，5% 平台费）
 * 
 * 技术栈：
 * - FHEVM: Zama 全同态加密虚拟机（Sepolia）
 * - Gateway: gateway.sepolia.zama.ai
 * - euint32: FHE 加密的 32 位无符号整数
 */
contract DataMarketplaceFHE is SepoliaZamaFHEVMConfig, GatewayCaller, Ownable, ReentrancyGuard {
    
    // ==================== 类型定义 ====================
    
    /// @notice 查询状态枚举
    enum QueryStatus {
        PENDING,      // 待处理
        PROCESSING,   // Gateway 解密中
        COMPLETED,    // 已完成
        FAILED,       // 失败
        REFUNDED      // 已退款
    }
    
    /// @notice 查询类型枚举
    enum QueryType {
        COMPUTE_MEAN,     // 计算平均值
        COMPUTE_VARIANCE, // 计算方差
        COUNT_ABOVE,      // 统计大于阈值的数量
        COUNT_BELOW       // 统计小于阈值的数量
    }
    
    // ==================== 数据结构 ====================
    
    /// @notice 数据集结构
    struct Dataset {
        uint256 id;                  // 数据集 ID
        address owner;               // 所有者地址
        string name;                 // 名称（明文，便于检索）
        string description;          // 描述（明文）
        euint32[] encryptedData;     // 🔒 加密数据（FHE）
        uint256 dataSize;            // 数据大小
        uint256 pricePerQuery;       // 每次查询价格（Wei）
        uint256 totalQueries;        // 总查询次数
        uint256 totalRevenue;        // 总收益
        uint256 createdAt;           // 创建时间
        bool active;                 // 是否激活
    }
    
    /// @notice 查询记录结构
    struct Query {
        uint256 id;                  // 查询 ID
        uint256 datasetId;           // 数据集 ID
        address buyer;               // 买家地址
        QueryType queryType;         // 查询类型
        euint32 encryptedParameter;  // 🔒 加密参数（如阈值）
        uint32 decryptedResult;      // 解密后的结果
        QueryStatus status;          // 查询状态
        uint256 price;               // 支付金额
        uint256 timestamp;           // 时间戳
    }
    
    /// @notice Gateway 解密请求记录
    struct DecryptionRequest {
        uint256 queryId;        // 关联的查询 ID
        address requester;      // 请求者地址
        uint256 timestamp;      // 请求时间
        bool processed;         // 是否已处理
    }
    
    // ==================== 状态变量 ====================
    
    uint256 public datasetCount;                                    // 数据集计数器
    uint256 public queryCount;                                      // 查询计数器
    uint256 public constant PLATFORM_FEE_PERCENT = 5;               // 平台费率 5%
    uint256 public constant CALLBACK_GAS_LIMIT = 500000;            // Gateway 回调 Gas 限制
    uint256 public constant QUERY_TIMEOUT = 30 minutes;             // 查询超时时间
    
    mapping(uint256 => Dataset) public datasets;                    // ID -> 数据集
    mapping(uint256 => Query) public queries;                       // ID -> 查询
    mapping(uint256 => DecryptionRequest) public decryptionRequests; // Gateway requestId -> 解密请求
    mapping(uint256 => uint256) public requestIdToQueryId;          // Gateway requestId -> queryId
    
    uint256[] private activeDatasetIds;                             // 活跃数据集 ID 列表
    
    // ==================== 事件 ====================
    
    event DatasetCreated(
        uint256 indexed datasetId,
        address indexed owner,
        string name,
        uint256 dataSize,
        uint256 pricePerQuery
    );
    
    event QueryExecuted(
        uint256 indexed queryId,
        uint256 indexed datasetId,
        address indexed buyer,
        QueryType queryType,
        uint256 price
    );
    
    event DecryptionRequested(
        uint256 indexed requestId,
        uint256 indexed queryId,
        uint256 timestamp
    );
    
    event QueryCompleted(
        uint256 indexed queryId,
        uint32 result
    );
    
    event QueryRefunded(
        uint256 indexed queryId,
        address buyer,
        uint256 amount
    );
    
    // ==================== 构造函数 ====================
    
    constructor() Ownable(msg.sender) {
        // 初始化
    }
    
    // ==================== 核心功能 ====================
    
    /**
     * @notice 上传加密数据集
     * @param name 数据集名称
     * @param description 数据集描述
     * @param inputHandles FHE 加密输入句柄数组（前端用 fhevmjs 生成）
     * @param inputProofs FHE 加密证明数组
     * @param pricePerQuery 每次查询价格（Wei）
     * 
     * @dev 流程：
     * 1. 验证输入
     * 2. 使用 TFHE.asEuint32() 将证明转换为加密数据
     * 3. 存储加密数据到链上
     * 4. 触发 DatasetCreated 事件
     */
    function uploadDataset(
        string memory name,
        string memory description,
        einput[] calldata inputHandles,
        bytes[] calldata inputProofs,
        uint256 pricePerQuery
    ) external {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(inputHandles.length > 0, "Dataset cannot be empty");
        require(inputHandles.length == inputProofs.length, "Handles and proofs length mismatch");
        require(inputHandles.length <= 1000, "Dataset too large");
        require(pricePerQuery > 0, "Price must be positive");
        
        datasetCount++;
        Dataset storage dataset = datasets[datasetCount];
        
        dataset.id = datasetCount;
        dataset.owner = msg.sender;
        dataset.name = name;
        dataset.description = description;
        dataset.dataSize = inputHandles.length;
        dataset.pricePerQuery = pricePerQuery;
        dataset.createdAt = block.timestamp;
        dataset.active = true;
        
        // 🔒 将每个数据点转换为 FHE 加密数据
        for (uint i = 0; i < inputHandles.length; i++) {
            euint32 encryptedValue = TFHE.asEuint32(inputHandles[i], inputProofs[i]);
            dataset.encryptedData.push(encryptedValue);
        }
        
        activeDatasetIds.push(datasetCount);
        
        emit DatasetCreated(
            datasetCount,
            msg.sender,
            name,
            inputHandles.length,
            pricePerQuery
        );
    }
    
    /**
     * @notice 执行查询（购买并请求计算）
     * @param datasetId 数据集 ID
     * @param queryType 查询类型
     * @param parameterHandle 参数的加密输入句柄（如阈值，可选）
     * @param parameterProof 参数的加密证明
     * 
     * @dev 流程：
     * 1. 验证支付和数据集状态
     * 2. 创建查询记录
     * 3. 执行 FHE 运算（链上加密计算）
     * 4. 请求 Gateway 解密结果
     * 5. 等待 Gateway 回调
     */
    function executeQuery(
        uint256 datasetId,
        QueryType queryType,
        einput parameterHandle,
        bytes calldata parameterProof
    ) external payable nonReentrant returns (uint256) {
        Dataset storage dataset = datasets[datasetId];
        require(dataset.active, "Dataset not active");
        require(msg.value >= dataset.pricePerQuery, "Insufficient payment");
        
        queryCount++;
        Query storage query = queries[queryCount];
        
        query.id = queryCount;
        query.datasetId = datasetId;
        query.buyer = msg.sender;
        query.queryType = queryType;
        query.status = QueryStatus.PENDING;
        query.price = msg.value;
        query.timestamp = block.timestamp;
        
        // 如果查询需要参数（如阈值），加密它
        if (parameterProof.length > 0) {
            query.encryptedParameter = TFHE.asEuint32(parameterHandle, parameterProof);
        }
        
        // 🔐 执行 FHE 运算（在加密状态下计算）
        euint32 encryptedResult = _computeEncryptedResult(
            dataset.encryptedData,
            queryType,
            query.encryptedParameter
        );
        
        // 📡 请求 Gateway 解密结果
        uint256[] memory cts = new uint256[](1);
        cts[0] = euint32.unwrap(encryptedResult);
        
        uint256 requestId = Gateway.requestDecryption(
            cts,
            this.callbackQueryResult.selector,
            0,
            block.timestamp + 100,
            false
        );
        
        // 记录请求映射（用于回调时查找）
        requestIdToQueryId[requestId] = queryCount;
        decryptionRequests[requestId] = DecryptionRequest({
            queryId: queryCount,
            requester: msg.sender,
            timestamp: block.timestamp,
            processed: false
        });
        
        query.status = QueryStatus.PROCESSING;
        
        emit QueryExecuted(
            queryCount,
            datasetId,
            msg.sender,
            queryType,
            msg.value
        );
        
        emit DecryptionRequested(
            requestId,
            queryCount,
            block.timestamp
        );
        
        return queryCount;
    }
    
    /**
     * @notice Gateway 回调函数（解密完成后由 Gateway 调用）
     * @param requestId Gateway 请求 ID
     * @param success 解密是否成功
     * @param decryptedCts 解密后的密文数组
     * 
     * @dev 只能由 Gateway 调用（通过 onlyGateway 修饰符）
     * 流程：
     * 1. 验证请求有效性
     * 2. 设置解密结果
     * 3. 分配收益（95% 给提供者，5% 平台费）
     * 4. 触发 QueryCompleted 事件
     */
    function callbackQueryResult(
        uint256 requestId,
        bool success,
        bytes memory decryptedCts
    ) public onlyGateway returns (bool) {
        uint256 queryId = requestIdToQueryId[requestId];
        require(queryId > 0, "Invalid request ID");
        
        Query storage query = queries[queryId];
        Dataset storage dataset = datasets[query.datasetId];
        
        require(!decryptionRequests[requestId].processed, "Already processed");
        
        if (success) {
            // 解码解密结果
            uint32 decryptedResult = abi.decode(decryptedCts, (uint32));
            
            query.decryptedResult = decryptedResult;
            query.status = QueryStatus.COMPLETED;
            decryptionRequests[requestId].processed = true;
            
            // 💰 分配收益
            uint256 platformFee = (query.price * PLATFORM_FEE_PERCENT) / 100;
            uint256 providerRevenue = query.price - platformFee;
            
            dataset.totalQueries++;
            dataset.totalRevenue += providerRevenue;
            
            // 转账给数据提供者
            (bool sent, ) = payable(dataset.owner).call{value: providerRevenue}("");
            require(sent, "Transfer to provider failed");
            
            emit QueryCompleted(queryId, decryptedResult);
        } else {
            // 解密失败，标记为失败状态
            query.status = QueryStatus.FAILED;
            decryptionRequests[requestId].processed = true;
        }
        
        return true;
    }
    
    /**
     * @notice 超时退款（Gateway 解密超时后用户可申请退款）
     * @param queryId 查询 ID
     */
    function refundQuery(uint256 queryId) external nonReentrant {
        Query storage query = queries[queryId];
        require(msg.sender == query.buyer, "Not query owner");
        require(query.status == QueryStatus.PROCESSING, "Invalid status");
        require(block.timestamp > query.timestamp + QUERY_TIMEOUT, "Query not expired");
        
        query.status = QueryStatus.REFUNDED;
        
        (bool sent, ) = payable(query.buyer).call{value: query.price}("");
        require(sent, "Refund failed");
        
        emit QueryRefunded(queryId, query.buyer, query.price);
    }
    
    // ==================== FHE 计算函数 ====================
    
    /**
     * @notice 执行 FHE 加密运算（根据查询类型）
     * @dev 所有运算在加密状态下进行，不解密原始数据
     */
    function _computeEncryptedResult(
        euint32[] storage data,
        QueryType queryType,
        euint32 parameter
    ) internal returns (euint32) {
        if (queryType == QueryType.COMPUTE_MEAN) {
            return _computeMean(data);
        } else if (queryType == QueryType.COMPUTE_VARIANCE) {
            return _computeVariance(data);
        } else if (queryType == QueryType.COUNT_ABOVE) {
            return _countAbove(data, parameter);
        } else {
            return _countBelow(data, parameter);
        }
    }
    
    /**
     * @notice 计算平均值（FHE）
     * @dev sum = Σ(data[i]), mean = sum / length
     */
    function _computeMean(euint32[] storage data) internal returns (euint32) {
        require(data.length > 0, "Empty dataset");
        
        euint32 sum = TFHE.asEuint32(0);
        for (uint i = 0; i < data.length; i++) {
            sum = TFHE.add(sum, data[i]);
        }
        return TFHE.div(sum, uint32(data.length));
    }
    
    /**
     * @notice 计算方差（FHE）
     * @dev variance = Σ((x - mean)²) / n
     * 简化版本：variance ≈ Σ(x²)/n - mean²
     */
    function _computeVariance(euint32[] storage data) internal returns (euint32) {
        require(data.length > 0, "Empty dataset");
        
        // 计算平均值
        euint32 mean = _computeMean(data);
        
        // 计算平方和
        euint32 sumSquaredDiff = TFHE.asEuint32(0);
        for (uint i = 0; i < data.length; i++) {
            // (x - mean)²
            euint32 diff = TFHE.sub(data[i], mean);
            euint32 squaredDiff = TFHE.mul(diff, diff);
            sumSquaredDiff = TFHE.add(sumSquaredDiff, squaredDiff);
        }
        
        return TFHE.div(sumSquaredDiff, uint32(data.length));
    }
    
    /**
     * @notice 统计大于阈值的数量（FHE）
     * @dev count = Σ(data[i] > threshold ? 1 : 0)
     */
    function _countAbove(euint32[] storage data, euint32 threshold) internal returns (euint32) {
        require(data.length > 0, "Empty dataset");
        
        euint32 count = TFHE.asEuint32(0);
        euint32 one = TFHE.asEuint32(1);
        
        for (uint i = 0; i < data.length; i++) {
            ebool isAbove = TFHE.gt(data[i], threshold);
            // 如果 isAbove 为 true，加 1；否则加 0
            euint32 increment = TFHE.select(isAbove, one, TFHE.asEuint32(0));
            count = TFHE.add(count, increment);
        }
        return count;
    }
    
    /**
     * @notice 统计小于阈值的数量（FHE）
     * @dev count = Σ(data[i] < threshold ? 1 : 0)
     */
    function _countBelow(euint32[] storage data, euint32 threshold) internal returns (euint32) {
        require(data.length > 0, "Empty dataset");
        
        euint32 count = TFHE.asEuint32(0);
        euint32 one = TFHE.asEuint32(1);
        
        for (uint i = 0; i < data.length; i++) {
            ebool isBelow = TFHE.lt(data[i], threshold);
            euint32 increment = TFHE.select(isBelow, one, TFHE.asEuint32(0));
            count = TFHE.add(count, increment);
        }
        return count;
    }
    
    // ==================== 查询函数 ====================
    
    /**
     * @notice 获取活跃数据集列表
     */
    function getActiveDatasets() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint i = 0; i < activeDatasetIds.length; i++) {
            if (datasets[activeDatasetIds[i]].active) {
                activeCount++;
            }
        }
        
        uint256[] memory active = new uint256[](activeCount);
        uint256 index = 0;
        for (uint i = 0; i < activeDatasetIds.length; i++) {
            if (datasets[activeDatasetIds[i]].active) {
                active[index] = activeDatasetIds[i];
                index++;
            }
        }
        return active;
    }
    
    /**
     * @notice 获取数据集信息（不含加密数据）
     */
    function getDataset(uint256 datasetId) external view returns (
        uint256 id,
        address owner,
        string memory name,
        string memory description,
        uint256 dataSize,
        uint256 pricePerQuery,
        uint256 totalQueries,
        uint256 totalRevenue,
        uint256 createdAt,
        bool active
    ) {
        Dataset storage dataset = datasets[datasetId];
        return (
            dataset.id,
            dataset.owner,
            dataset.name,
            dataset.description,
            dataset.dataSize,
            dataset.pricePerQuery,
            dataset.totalQueries,
            dataset.totalRevenue,
            dataset.createdAt,
            dataset.active
        );
    }
    
    /**
     * @notice 获取查询信息
     */
    function getQuery(uint256 queryId) external view returns (
        uint256 id,
        uint256 datasetId,
        address buyer,
        QueryType queryType,
        uint256 parameter,
        uint32 result,
        QueryStatus status,
        uint256 price,
        uint256 timestamp
    ) {
        Query storage query = queries[queryId];
        return (
            query.id,
            query.datasetId,
            query.buyer,
            query.queryType,
            0, // parameter 是加密的，不能直接返回
            query.decryptedResult,
            query.status,
            query.price,
            query.timestamp
        );
    }
    
    /**
     * @notice 获取数据集数量
     */
    function getDatasetCount() external view returns (uint256) {
        return datasetCount;
    }
    
    /**
     * @notice 获取查询数量
     */
    function getQueryCount() external view returns (uint256) {
        return queryCount;
    }
    
    // ==================== 管理员函数 ====================
    
    /**
     * @notice 停用数据集（仅所有者）
     */
    function deactivateDataset(uint256 datasetId) external {
        Dataset storage dataset = datasets[datasetId];
        require(msg.sender == dataset.owner, "Not dataset owner");
        dataset.active = false;
    }
    
    /**
     * @notice 提取平台费用（仅合约所有者）
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool sent, ) = payable(owner()).call{value: balance}("");
        require(sent, "Withdrawal failed");
    }
}

