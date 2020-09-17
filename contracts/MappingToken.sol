pragma solidity 0.4.26;

import './components/StandardToken.sol';
import './components/Admin.sol';

contract MappingToken is StandardToken, Admin {
    using SafeMath for uint;
    /****************************************************************************
     **
     ** MODIFIERS
     **
     ****************************************************************************/
    modifier onlyMeaningfulValue(uint value) {
        require(value > 0, "Value is null");
        _;
    }

    modifier onlyAdminOrOwner() {
        require(mapAdmin[msg.sender] || msg.sender == owner, "not admin or owner");
        _;
    }

    /****************************************************************************
     **
     ** EVENTS
     **
     ****************************************************************************/

    ///@notice Initialize the TokenManager address
    ///@dev Initialize the TokenManager address
    ///@param tokenName The token name to be used
    ///@param tokenSymbol The token symbol to be used
    ///@param tokenDecimal The token decimals to be used
    constructor(string tokenName, string tokenSymbol, uint8 tokenDecimal)
        public
    {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimal;
    }

    /****************************************************************************
     **
     ** MANIPULATIONS
     **
     ****************************************************************************/

    /// @notice Create token
    /// @dev Create token
    /// @param account Address will receive token
    /// @param value Amount of token to be minted
    function mint(address account, uint value)
        external
        onlyAdminOrOwner
        onlyMeaningfulValue(value)
    {
        balances[account] = balances[account].add(value);
        totalSupply = totalSupply.add(value);

        emit Transfer(address(0), account, value);
    }

    /// @notice Burn token
    /// @dev Burn token
    /// @param account Address of whose token will be burnt
    /// @param value Amount of token to be burnt
    function burn(address account, uint value)
        external
        onlyAdminOrOwner
        onlyMeaningfulValue(value)
    {
        balances[account] = balances[account].sub(value);
        totalSupply = totalSupply.sub(value);

        emit Transfer(account, address(0), value);
    }

    /// @notice update token name, symbol
    /// @dev update token name, symbol
    /// @param _name token new name
    /// @param _symbol token new symbol
    function update(string _name, string _symbol)
        external
        onlyAdminOrOwner
    {
        name = _name;
        symbol = _symbol;
    }
}