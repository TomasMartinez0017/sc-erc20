// SPDX-License-Identifier: MIT LICENSE

pragma solidity 0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20_Maker is ERC20, ERC20Burnable, Ownable {

  mapping(address => uint256) private _balances;
  mapping(address => bool) controllers;

  uint256 private _totalSupply;
  uint256 private MAXSUP;
  uint256 constant MAXIMUMSUPPLY = 1000000 * 10**18;

  constructor() ERC20("COIN", "SCC") Ownable(msg.sender) {
    _mint(msg.sender, 1000 * 10**18);
    _totalSupply = 1000 * 10**18;
  }

  function mint(address to, uint256 amount) external {
    require(controllers[msg.sender], "Only controllers can mint");
    require(
      (MAXSUP + amount) <= MAXIMUMSUPPLY,
      "Maximum supply has been reached"
    );
    _totalSupply += amount;
    MAXSUP += amount;
    _balances[to] += amount;
    _mint(to, amount);
  }

  function burnFrom(address account, uint256 amount) public override {
    if (controllers[msg.sender]) {
      _burn(account, amount);
    } else {
      super.burnFrom(account, amount);
    }
  }

  function addController(address controller) external onlyOwner {
    controllers[controller] = true;
  }

  function removeController(address controller) external onlyOwner {
    controllers[controller] = false;
  }

  function isController(address account) public view returns (bool) {
    return controllers[account];
  }

  function totalSupply() public view override returns (uint256) {
    return _totalSupply;
  }

  function maxSupply() public pure returns (uint256) {
    return MAXIMUMSUPPLY;
  }

  function increaseAllowance(address spender, uint256 addedValue) public onlyOwner returns (bool) {
    uint256 currentAllowance = allowance(msg.sender, spender);
    _approve(msg.sender, spender, currentAllowance + addedValue);
    return true;
  }

  function decreaseAllowance(address spender, uint256 subtractedValue) public onlyOwner returns (bool) {
    uint256 currentAllowance = allowance(msg.sender, spender);
    require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
    _approve(msg.sender, spender, currentAllowance - subtractedValue);
    return true;
  }
}