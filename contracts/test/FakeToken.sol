pragma solidity 0.4.24;

import "@aragon/os/contracts/lib/token/ERC20.sol";

contract FakeToken is ERC20 {
    function mint(address account, uint256 amount) public returns (bool);
}
