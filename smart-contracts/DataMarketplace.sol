// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/* ── OpenZeppelin ─────────────────────────────────────────────── */
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DatasetMarketplace is ReentrancyGuard {
    using Counters  for Counters.Counter;
    using SafeERC20 for IERC20;

/* ───────────────────────── Config ────────────────────────────── */
    IERC20 public immutable usdc;
    Counters.Counter private _nextId;

    constructor(address usdcAddr) {
        require(usdcAddr != address(0), "USDC addr = 0");
        usdc = IERC20(usdcAddr);
    }

/* ───────────────────────── Types ─────────────────────────────── */
    enum Visibility { Public, Private }

    struct Core {
        uint256     id;
        uint8       version;
        address     owner;
        uint256     price;           // 6-dec USDC
        Visibility  visibility;
        uint256     balance;
        string      name;
        string      description;
    }
    struct StorageInfo { bytes encryptedCid; bytes encSymKey; }
    struct HFDatasetMeta { string path; string config; string split; string revision; }
    struct ModelMeta   { string name; uint64 taskSmallId; uint64 nodeSmallId;
                          uint64 pricePerMilCU; uint64 maxNumCU; }
    struct DatasetMeta { uint256 numRows; uint256 numTokens; bool populated; }

/* ───────────────────────── Storage ───────────────────────────── */
    mapping(uint256 => Core)                private _core;
    mapping(uint256 => StorageInfo)         private _storageInfo;
    mapping(uint256 => HFDatasetMeta)       private _hfMeta;
    mapping(uint256 => ModelMeta)           private _modelMeta;
    mapping(uint256 => DatasetMeta)         private _meta;
    mapping(uint256 => uint256)             private _downloads;
    mapping(uint256 => mapping(address => bool)) private _allow;

    /** ▲ new: keep an *ordered* buyers list so we can enumerate later */
    mapping(uint256 => address[])           private _buyersList;

/* ───────────────────────── Events ───────────────────────────── */
    event DatasetMinted(uint256 indexed id, address indexed owner);
    event DatasetLocked(uint256 indexed id, uint8 version, Visibility vis);
    event DatasetPurchased(uint256 indexed id, address indexed buyer, uint256 price);
    event BalanceWithdrawn(uint256 indexed id, address indexed to, uint256 amount);

/* ───────────────────────── Errors ───────────────────────────── */
    error NoAccess();
    error AlreadyLocked();
    error DatasetNotPublic();
    error ZeroPriceDownload();

/* ─────────────────── Creator workflow ───────────────────────── */
    function mintDataset(
        string calldata hfPath, string calldata hfConfig,
        string calldata hfSplit, string calldata hfRevision,
        Visibility vis, string calldata name, string calldata description,
        uint256 priceUSDC,
        string calldata modelName, uint64 taskSmallId, uint64 nodeSmallId,
        uint64 pricePerMilCU, uint64 maxNumCU
    ) external returns (uint256 id) {
        id = _nextId.current(); _nextId.increment();

        _core[id] = Core({
            id: id, version: 0, owner: msg.sender, price: priceUSDC,
            visibility: vis, balance: 0, name: name, description: description
        });
        _hfMeta[id]    = HFDatasetMeta(hfPath, hfConfig, hfSplit, hfRevision);
        _modelMeta[id] = ModelMeta(modelName, taskSmallId, nodeSmallId,
                                   pricePerMilCU, maxNumCU);
        emit DatasetMinted(id, msg.sender);
    }

    function lockDataset(
        uint256 id, bytes calldata encryptedCid, bytes calldata encSymKey,
        uint256 numRows, uint256 numTokens
    ) external {
        Core storage c = _core[id];
        if (msg.sender != c.owner) revert NoAccess();
        if (c.version != 0)        revert AlreadyLocked();

        _storageInfo[id] = StorageInfo(encryptedCid, encSymKey);
        _meta[id]        = DatasetMeta(numRows, numTokens, true);
        c.version = 1;

        emit DatasetLocked(id, 1, c.visibility);
    }

/* ─────────────────── Buyer workflow ─────────────────────────── */
    function downloadDataset(uint256 id) external nonReentrant {
        Core storage c = _core[id];
        if (c.visibility != Visibility.Public) revert DatasetNotPublic();
        if (c.price == 0)                       revert ZeroPriceDownload();

        usdc.safeTransferFrom(msg.sender, address(this), c.price);

        c.balance      += c.price;
        _downloads[id] += 1;
        _allow[id][msg.sender] = true;
        _buyersList[id].push(msg.sender);   // ▲ record buyer for getter

        emit DatasetPurchased(id, msg.sender, c.price);
    }

/* ─────────────────── Owner tools ────────────────────────────── */
    function changeName(uint256 id, string calldata newName) external { _onlyOwner(id); _core[id].name  = newName; }
    function changeDescription(uint256 id, string calldata d) external { _onlyOwner(id); _core[id].description = d; }
    function changePrice(uint256 id, uint256 p) external { _onlyOwner(id); _core[id].price = p; }

    function withdrawBalance(uint256 id, address to) external nonReentrant {
        _onlyOwner(id);
        Core storage c = _core[id];
        uint256 amt = c.balance;
        c.balance = 0;
        usdc.safeTransfer(to, amt);
        emit BalanceWithdrawn(id, to, amt);
    }

/* ─────────────────── READ-ONLY GETTERS ──────────────────────── */
/** Core summary (same as before) */
    function getCore(uint256 id) external view returns (
        uint8 version, address owner, uint256 price,
        Visibility vis, uint256 balance, uint256 downloads,
        string memory name, string memory description
    ) {
        Core storage c = _core[id];
        version     = c.version;
        owner       = c.owner;
        price       = c.price;
        vis         = c.visibility;
        balance     = c.balance;
        downloads   = _downloads[id];
        name        = c.name;
        description = c.description;
    }

/** ▲ visibility helpers */
    function isPublic(uint256 id) external view returns (bool) {
        return _core[id].visibility == Visibility.Public;
    }
    function getVisibility(uint256 id) external view returns (Visibility) {
        return _core[id].visibility;
    }

/** ▲ owner / balance / price */
    function getOwner(uint256 id) external view returns (address)      { return _core[id].owner; }
    function getBalance(uint256 id) external view returns (uint256)    { return _core[id].balance; }
    function getPrice(uint256 id)   external view returns (uint256)    { return _core[id].price; }

/** ▲ encrypted CID + key */
    function getStorageInfo(uint256 id) external view returns (bytes memory, bytes memory) {
        StorageInfo storage s = _storageInfo[id];
        return (s.encryptedCid, s.encSymKey);
    }

/** ▲ Hugging Face source metadata */
    function getHFDatasetMeta(uint256 id) external view returns (
        string memory path, string memory config, string memory split, string memory revision
    ) {
        HFDatasetMeta storage m = _hfMeta[id];
        return (m.path, m.config, m.split, m.revision);
    }

/** ▲ Generated-dataset stats */
    function getDatasetMeta(uint256 id) external view returns (
        uint256 numRows, uint256 numTokens, bool populated
    ) {
        DatasetMeta storage m = _meta[id];
        return (m.numRows, m.numTokens, m.populated);
    }

/** ▲ Model provenance + compute limits */
    function getModelMeta(uint256 id) external view returns (
        string memory name, uint64 taskSmallId, uint64 nodeSmallId,
        uint64 pricePerMilCU, uint64 maxNumCU
    ) {
        ModelMeta storage m = _modelMeta[id];
        return (m.name, m.taskSmallId, m.nodeSmallId, m.pricePerMilCU, m.maxNumCU);
    }
    function getComputeLimits(uint256 id) external view returns (uint64 pricePerMilCU, uint64 maxNumCU) {
        ModelMeta storage m = _modelMeta[id];
        return (m.pricePerMilCU, m.maxNumCU);
    }

/** ▲ Buyer enumeration & checks */
    function getBuyerCount(uint256 id) external view returns (uint256) {
        return _buyersList[id].length;
    }
    function getBuyerAt(uint256 id, uint256 index) external view returns (address) {
        require(index < _buyersList[id].length, "index OOB");
        return _buyersList[id][index];
    }
    function isBuyer(uint256 id, address user) external view returns (bool) {
        return _allow[id][user];
    }

/** Existing decrypt helper retained */
    function canDecrypt(uint256 id, address user) external view returns (bool) {
        Core storage c = _core[id];
        return (user == c.owner) || _allow[id][user];
    }

/* ─────────────────── internal guard ─────────────────────────── */
    function _onlyOwner(uint256 id) private view {
        if (msg.sender != _core[id].owner) revert NoAccess();
    }
}
