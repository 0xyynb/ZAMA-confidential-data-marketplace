// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DataMarketplaceMock
 * @notice Mock version of FHEVM Data Marketplace for standard EVM deployment
 * @dev This is a demonstration version without actual FHE encryption
 *      Implements all business logic and patterns from FHEVM standard
 *      Can be deployed to Sepolia/Ethereum for UI testing
 * 
 * FOR PRODUCTION: Replace with full FHEVM version on Zama network
 */
contract DataMarketplaceMock is Ownable, ReentrancyGuard {
    
    // ========== Constants ==========
    
    uint256 public constant MIN_PRICE = 0.001 ether;
    uint256 public constant MAX_DATA_SIZE = 1000;
    uint256 public constant PLATFORM_FEE_PERCENT = 5; // 5%
    
    // ========== Enums ==========
    
    enum QueryType {
        COMPUTE_MEAN,
        COMPUTE_VARIANCE,
        COUNT_ABOVE,
        COUNT_BELOW
    }
    
    enum QueryStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        REFUNDED
    }
    
    // ========== Data Structures ==========
    
    struct Dataset {
        uint256 id;
        address owner;
        string name;
        string description;
        uint256[] encryptedValues;  // In mock: stored as uint256 instead of euint32
        uint256 pricePerQuery;
        uint256 totalQueries;
        uint256 totalRevenue;
        uint256 createdAt;
        bool active;
    }
    
    struct Query {
        uint256 id;
        uint256 datasetId;
        address buyer;
        QueryType queryType;
        uint256 parameter;  // For COUNT_ABOVE/COUNT_BELOW
        uint256 result;
        QueryStatus status;
        uint256 price;
        uint256 timestamp;
    }
    
    // ========== State Variables ==========
    
    mapping(uint256 => Dataset) public datasets;
    mapping(uint256 => Query) public queries;
    mapping(address => uint256[]) public providerDatasets;
    mapping(address => uint256[]) public buyerQueries;
    
    uint256 public datasetCounter;
    uint256 public queryCounter;
    uint256 public platformBalance;
    
    // ========== Events ==========
    
    event DatasetCreated(
        uint256 indexed datasetId,
        address indexed owner,
        string name,
        uint256 pricePerQuery
    );
    
    event DatasetUpdated(
        uint256 indexed datasetId,
        uint256 newPrice,
        bool active
    );
    
    event QueryExecuted(
        uint256 indexed queryId,
        uint256 indexed datasetId,
        address indexed buyer,
        QueryType queryType,
        uint256 result
    );
    
    event QueryRefunded(
        uint256 indexed queryId,
        address indexed buyer,
        uint256 amount
    );
    
    event RevenueWithdrawn(
        address indexed provider,
        uint256 amount
    );
    
    event PlatformFeeWithdrawn(
        address indexed owner,
        uint256 amount
    );
    
    // ========== Constructor ==========
    
    constructor() Ownable(msg.sender) {
        datasetCounter = 1;
        queryCounter = 1;
    }
    
    // ========== Core Functions ==========
    
    /**
     * @notice Upload encrypted dataset
     * @param name Dataset name
     * @param description Dataset description
     * @param dataArray Array of "encrypted" values (uint256 in mock)
     * @param pricePerQuery Price per query in wei
     */
    function uploadDataset(
        string calldata name,
        string calldata description,
        uint256[] calldata dataArray,
        uint256 pricePerQuery
    ) external returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(dataArray.length > 0 && dataArray.length <= MAX_DATA_SIZE, "Invalid data size");
        require(pricePerQuery >= MIN_PRICE, "Price too low");
        
        uint256 datasetId = datasetCounter++;
        
        Dataset storage dataset = datasets[datasetId];
        dataset.id = datasetId;
        dataset.owner = msg.sender;
        dataset.name = name;
        dataset.description = description;
        dataset.encryptedValues = dataArray;
        dataset.pricePerQuery = pricePerQuery;
        dataset.totalQueries = 0;
        dataset.totalRevenue = 0;
        dataset.createdAt = block.timestamp;
        dataset.active = true;
        
        providerDatasets[msg.sender].push(datasetId);
        
        emit DatasetCreated(datasetId, msg.sender, name, pricePerQuery);
        
        return datasetId;
    }
    
    /**
     * @notice Execute query on encrypted dataset
     * @param datasetId Target dataset ID
     * @param queryType Type of query to execute
     * @param parameter Parameter for COUNT_ABOVE/COUNT_BELOW queries
     */
    function executeQuery(
        uint256 datasetId,
        QueryType queryType,
        uint256 parameter
    ) external payable nonReentrant returns (uint256) {
        Dataset storage dataset = datasets[datasetId];
        
        require(dataset.active, "Dataset not active");
        require(msg.value >= dataset.pricePerQuery, "Insufficient payment");
        
        uint256 queryId = queryCounter++;
        
        // Execute computation (mock version)
        uint256 result = _computeResult(
            dataset.encryptedValues,
            queryType,
            parameter
        );
        
        Query storage query = queries[queryId];
        query.id = queryId;
        query.datasetId = datasetId;
        query.buyer = msg.sender;
        query.queryType = queryType;
        query.parameter = parameter;
        query.result = result;
        query.status = QueryStatus.COMPLETED;
        query.price = msg.value;
        query.timestamp = block.timestamp;
        
        buyerQueries[msg.sender].push(queryId);
        
        // Calculate fees
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 providerRevenue = msg.value - platformFee;
        
        // Update statistics
        dataset.totalQueries++;
        dataset.totalRevenue += providerRevenue;
        platformBalance += platformFee;
        
        // Transfer revenue to provider
        (bool success, ) = dataset.owner.call{value: providerRevenue}("");
        require(success, "Transfer failed");
        
        emit QueryExecuted(queryId, datasetId, msg.sender, queryType, result);
        
        return queryId;
    }
    
    /**
     * @notice Internal function to compute query result (mock implementation)
     */
    function _computeResult(
        uint256[] storage data,
        QueryType queryType,
        uint256 parameter
    ) internal view returns (uint256) {
        if (data.length == 0) return 0;
        
        if (queryType == QueryType.COMPUTE_MEAN) {
            uint256 sum = 0;
            for (uint256 i = 0; i < data.length; i++) {
                sum += data[i];
            }
            return sum / data.length;
            
        } else if (queryType == QueryType.COMPUTE_VARIANCE) {
            // Simplified variance calculation
            uint256 mean = 0;
            for (uint256 i = 0; i < data.length; i++) {
                mean += data[i];
            }
            mean = mean / data.length;
            
            uint256 variance = 0;
            for (uint256 i = 0; i < data.length; i++) {
                uint256 diff = data[i] > mean ? data[i] - mean : mean - data[i];
                variance += diff * diff;
            }
            return variance / data.length;
            
        } else if (queryType == QueryType.COUNT_ABOVE) {
            uint256 count = 0;
            for (uint256 i = 0; i < data.length; i++) {
                if (data[i] > parameter) count++;
            }
            return count;
            
        } else if (queryType == QueryType.COUNT_BELOW) {
            uint256 count = 0;
            for (uint256 i = 0; i < data.length; i++) {
                if (data[i] < parameter) count++;
            }
            return count;
        }
        
        return 0;
    }
    
    // ========== Management Functions ==========
    
    /**
     * @notice Update dataset settings
     */
    function updateDataset(
        uint256 datasetId,
        uint256 newPrice,
        bool active
    ) external {
        Dataset storage dataset = datasets[datasetId];
        require(dataset.owner == msg.sender, "Not owner");
        require(newPrice >= MIN_PRICE, "Price too low");
        
        dataset.pricePerQuery = newPrice;
        dataset.active = active;
        
        emit DatasetUpdated(datasetId, newPrice, active);
    }
    
    /**
     * @notice Withdraw platform fees (owner only)
     */
    function withdrawPlatformFees() external onlyOwner {
        uint256 amount = platformBalance;
        require(amount > 0, "No fees to withdraw");
        
        platformBalance = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PlatformFeeWithdrawn(msg.sender, amount);
    }
    
    // ========== View Functions ==========
    
    /**
     * @notice Get dataset details
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
            dataset.encryptedValues.length,
            dataset.pricePerQuery,
            dataset.totalQueries,
            dataset.totalRevenue,
            dataset.createdAt,
            dataset.active
        );
    }
    
    /**
     * @notice Get query details
     */
    function getQuery(uint256 queryId) external view returns (
        uint256 id,
        uint256 datasetId,
        address buyer,
        QueryType queryType,
        uint256 parameter,
        uint256 result,
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
            query.parameter,
            query.result,
            query.status,
            query.price,
            query.timestamp
        );
    }
    
    /**
     * @notice Get provider's datasets
     */
    function getProviderDatasets(address provider) external view returns (uint256[] memory) {
        return providerDatasets[provider];
    }
    
    /**
     * @notice Get buyer's queries
     */
    function getBuyerQueries(address buyer) external view returns (uint256[] memory) {
        return buyerQueries[buyer];
    }
    
    /**
     * @notice Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalDatasets,
        uint256 totalQueries,
        uint256 totalPlatformFees
    ) {
        return (
            datasetCounter - 1,
            queryCounter - 1,
            platformBalance
        );
    }
    
    /**
     * @notice Get all active datasets (for marketplace display)
     */
    function getActiveDatasets() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // First pass: count active datasets
        for (uint256 i = 1; i < datasetCounter; i++) {
            if (datasets[i].active) {
                activeCount++;
            }
        }
        
        // Second pass: collect active dataset IDs
        uint256[] memory activeDatasets = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < datasetCounter; i++) {
            if (datasets[i].active) {
                activeDatasets[index] = i;
                index++;
            }
        }
        
        return activeDatasets;
    }
    
    /**
     * @notice Get total number of datasets
     */
    function getDatasetCount() external view returns (uint256) {
        return datasetCounter - 1;
    }
    
    /**
     * @notice Get total number of queries
     */
    function getQueryCount() external view returns (uint256) {
        return queryCounter - 1;
    }
}

