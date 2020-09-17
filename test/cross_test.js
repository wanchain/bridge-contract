const CrossProxy = artifacts.require('CrossProxy');
const CrossDelegate = artifacts.require('CrossDelegate');
const MappingToken = artifacts.require('MappingToken');

const assert = require('chai').assert;
const optimist = require("optimist");

const currNetwork = optimist.argv.network || "development";
const from = require('../truffle-config').networks[currNetwork].from;
const ADDRESS_0 = "0x0000000000000000000000000000000000000000";
const ERROR_INFO = 'it should be throw error';

const newCross = async (owner) => {
  // const crossProxy = await CrossProxy.new({from: owner});
  // const crossDelegate = await CrossDelegate.new({from: owner});
  // await crossProxy.upgradeTo(crossDelegate.address);

  const crossProxy = await CrossProxy.deployed();
  const crossDelegate = await CrossDelegate.deployed();

  // console.log(`crossDelegate = ${crossDelegate.address}`);
  // console.log(`crossProxy = ${crossProxy.address}`);
  return {crossProxy: crossProxy, crossDelegate: crossDelegate}
}

contract('CrossDelegate', (accounts) => {
  const [owner_bk, admin_bk, tokenAdmin, user, other] = accounts;
  const owner = from || owner_bk;
  const admin = admin_bk.toLowerCase() === owner.toLowerCase() ? owner_bk : admin_bk;

  const newDaiToken = {name:"wanNewDAI@Ethereum", symbol:"wanNewDAI", decimals:18};
  const daiToken = {name:"wanDAI@Ethereum", symbol:"wanDAI", decimals:18};
  const ethToken = {name:"wanETH@Ethereum", symbol:"wanETH", decimals:18};
  const btcToken = {name:"wanBTC@Ethereum", symbol:"wanBTC", decimals:8};
  const eosToken = {name:"wanEOS@Ethereum", symbol:"wanEOS", decimals:4};
  const wanToken = {name:"WAN@Ethereum", symbol:"WAN", decimals:18};

  let crossDelegateProxy;
  let crossDelegateInstance;
  let shadowAddress = {
    DAI: null,
    ETH: null,
    BTC: null,
    EOS: null
  };
  let wanTokenInstance;

  before("init", async () => {
    const { crossProxy, crossDelegate } = await newCross(owner);
    crossDelegateProxy = await CrossDelegate.at(crossProxy.address);
    crossDelegateInstance = crossDelegate

    wanTokenInstance = await MappingToken.new(wanToken.name, wanToken.symbol, wanToken.decimals);
  });

  describe('normal', () => {
    it('good token manager example', async function() {

      let receipt = await crossDelegateProxy.addToken(daiToken.name, daiToken.symbol, daiToken.decimals, {from: owner});
      // check AddToken event log
      const addDAIEvent = receipt.logs[0].args;
      assert.ok(addDAIEvent.tokenAddress != ADDRESS_0, "check token address [DAI] failed");
      assert.equal(daiToken.name, addDAIEvent.name, "check token name [DAI] failed");
      assert.equal(daiToken.symbol, addDAIEvent.symbol, "check token symbol [DAI] failed");
      assert.equal(daiToken.decimals, addDAIEvent.decimals.toNumber(), "check token decimals [DAI] failed");
      shadowAddress.DAI = addDAIEvent.tokenAddress;

      receipt = await crossDelegateProxy.addToken(ethToken.name, ethToken.symbol, ethToken.decimals, {from: owner});
      // check AddToken event log
      const addETHEvent = receipt.logs[0].args;
      assert.ok(addETHEvent.tokenAddress != ADDRESS_0, "check token address [ETH] failed");
      assert.equal(ethToken.name, addETHEvent.name, "check token name [ETH] failed");
      assert.equal(ethToken.symbol, addETHEvent.symbol, "check token symbol [ETH] failed");
      assert.equal(ethToken.decimals, addETHEvent.decimals.toNumber(), "check token decimals [ETH] failed");
      shadowAddress.ETH = addETHEvent.tokenAddress;

      receipt = await crossDelegateProxy.addToken(btcToken.name, btcToken.symbol, btcToken.decimals, {from: owner});
      // check AddToken event log
      const addBTCEvent = receipt.logs[0].args;
      assert.ok(addBTCEvent.tokenAddress != ADDRESS_0, "check token address [BTC] failed");
      assert.equal(btcToken.name, addBTCEvent.name, "check token name [BTC] failed");
      assert.equal(btcToken.symbol, addBTCEvent.symbol, "check token symbol [BTC] failed");
      assert.equal(btcToken.decimals, addBTCEvent.decimals.toNumber(), "check token decimals [BTC] failed");
      shadowAddress.BTC = addBTCEvent.tokenAddress;

      gas1 = await crossDelegateProxy.addToken.estimateGas(eosToken.name, eosToken.symbol, eosToken.decimals, {from: owner});
      // console.log(`addToken estimate = ${gas1}`);
      receipt = await crossDelegateProxy.addToken(eosToken.name, eosToken.symbol, eosToken.decimals, {from: owner});
      // console.log(`addToken used = ${receipt.receipt.gasUsed}`);
      // check AddToken event log
      const addEOSEvent = receipt.logs[0].args;
      assert.ok(addEOSEvent.tokenAddress != ADDRESS_0, "check token address [EOS] failed");
      assert.equal(eosToken.name, addEOSEvent.name, "check token name [EOS] failed");
      assert.equal(eosToken.symbol, addEOSEvent.symbol, "check token symbol [EOS] failed");
      assert.equal(eosToken.decimals, addEOSEvent.decimals.toNumber(), "check token decimals [EOS] failed");
      shadowAddress.EOS = addEOSEvent.tokenAddress;

      receipt = await crossDelegateProxy.addAdmin(admin, {from: owner});
      // check addAdmin event log
      assert.equal(admin.toLowerCase(), receipt.logs[0].args.admin.toLowerCase(), "check admin address failed");
      // console.log("addAdmin", admin);

      const addMultiTokenAdmin = Object.values(shadowAddress).map(async(tokenAddress) => {
        // console.log("add admin for", tokenAddress);
        receipt = await crossDelegateProxy.addTokenAdmin(tokenAddress, tokenAdmin, {from: owner});
        // check addTokenAdmin event log
        const addTokenAdminEvent = receipt.logs[0].args;
        assert.equal(tokenAdmin.toLowerCase(), addTokenAdminEvent.admin.toLowerCase(), `check token [${tokenAddress}] admin address failed`);
      });
      await Promise.all(addMultiTokenAdmin);

      const mintValue = 100;
      const adminValue = 80;
      const userValue = mintValue - adminValue;

      const token = await MappingToken.at(shadowAddress.DAI);
      gas1 = await crossDelegateProxy.mintToken.estimateGas(token.address, user, mintValue, {from: admin});
      // console.log(`mintToken estimate = ${gas1}`);
      receipt = await crossDelegateProxy.mintToken(token.address, user, mintValue, {from: admin});
      // console.log(`mintToken used = ${receipt.receipt.gasUsed}`);
      // check mintToken event log
      const mintOwnerTokenEvent = receipt.logs[0].args;
      assert.equal(token.address, mintOwnerTokenEvent.tokenAddress, "check token address [mint] failed");
      assert.equal(user.toLowerCase(), mintOwnerTokenEvent.to.toLowerCase(), "check to address [mint] failed");
      assert.equal(mintValue, mintOwnerTokenEvent.value.toNumber(), "check value [mint] failed");

      await token.transfer(admin, adminValue, {from: user});

      gas1 = await crossDelegateProxy.burnToken.estimateGas(token.address, userValue, user, {from: user});
      // console.log(`burnToken estimate = ${gas1}`);
      receipt = await crossDelegateProxy.burnToken(token.address, userValue, user, {from: user});
      // console.log(`burnToken used = ${receipt.receipt.gasUsed}`);
      // check burnToken event log
      const burnTokenEvent = receipt.logs[0].args;
      assert.equal(token.address, burnTokenEvent.tokenAddress, "check token address [burn] failed");
      assert.equal(user.toLowerCase(), burnTokenEvent.destAccount.toLowerCase(), "check destAccount address [burn] failed");
      assert.equal(userValue, burnTokenEvent.value.toNumber(), "check value [burn] failed");

      gas1 = await token.burn.estimateGas(admin, adminValue, {from: tokenAdmin});
      // console.log(`token burn estimate = ${gas1}`);
      receipt = await token.burn(admin, adminValue, {from: tokenAdmin});
      // console.log(`token burn used = ${receipt.receipt.gasUsed}`);
      // check burn event log
      const tokenBrunEvent = receipt.logs[0].args;
      assert.equal(admin.toLowerCase(), tokenBrunEvent._from.toLowerCase(), "check token burn from failed");
      assert.equal(ADDRESS_0, tokenBrunEvent._to.toLowerCase(), "check token burn to failed");
      assert.equal(adminValue, tokenBrunEvent._value.toNumber(), "check token burn value failed");

      assert.equal(web3.utils.toBN(await token.balanceOf(admin)).toNumber(), 0, "check admin balance failed");
      assert.equal(web3.utils.toBN(await token.balanceOf(user)).toNumber(), 0, "check user balance failed");

      receipt = await crossDelegateProxy.updateToken(token.address, newDaiToken.name, newDaiToken.symbol);
      // check UpdateToken event log
      const updateTokenEvent = receipt.logs[0].args;
      assert.equal(token.address.toLowerCase(), updateTokenEvent.tokenAddress.toLowerCase(), "check token address [update] failed");
      assert.equal(newDaiToken.name, updateTokenEvent.name, "check token name [update] failed");
      assert.equal(newDaiToken.symbol, updateTokenEvent.symbol, "check token symbol [update] failed");

      const removeMultiTokenAdmin = Object.values(shadowAddress).map(async(tokenAddress) => {
        // console.log("remove admin for", tokenAddress);
        receipt = await crossDelegateProxy.removeTokenAdmin(tokenAddress, tokenAdmin, {from: owner});
        // check removeTokenAdmin event log
        const removeTokenAdminEvent = receipt.logs[0].args;
        assert.equal(tokenAdmin.toLowerCase(), removeTokenAdminEvent.admin.toLowerCase(), `check removed token [${tokenAddress}] admin address failed`);
      });
      await Promise.all(removeMultiTokenAdmin);

      const obj = await crossDelegateProxy.removeAdmin(admin, {from: owner});
      assert.equal(obj.receipt.status, true, "check remove admin status failed");
      // check RemoveAdmin event log
      const removeAdminEvent = obj.logs[0].args;
      assert.equal(admin.toLowerCase(), removeAdminEvent.admin.toLowerCase(), "check removed admin failed");

      const origOwner = await token.owner();
      assert.equal(origOwner, crossDelegateProxy.address, "check token owner failed");
      receipt = await crossDelegateProxy.changeTokenOwner(token.address, user, {from: owner});
      // check changeTokenOwner event log
      const changeTokenOwnerEvent = receipt.logs[0].args;
      assert.equal(origOwner.toLowerCase(), changeTokenOwnerEvent.previousOwner.toLowerCase(), "check previous owner failed");
      assert.equal(user.toLowerCase(), changeTokenOwnerEvent.newOwner.toLowerCase(), "check new owner failed");

      // changeOwner
      // console.log("origOwner", origOwner);
      await token.changeOwner(other, {from: user});
      const newOwner = await token.newOwner();
      assert.equal(newOwner.toLowerCase(), other.toLowerCase(), "check changeOwner new owner failed");

      // acceptOwnership
      await token.acceptOwnership({from: other});

      // restore owner
      // console.log("origOwner", origOwner);
      await token.transferOwner(origOwner, {from: other});

      const tokenOwner = await token.owner();
      assert.equal(tokenOwner.toLowerCase(), crossDelegateProxy.address.toLowerCase(), "restore owner failed");
    });
  });

  describe('addToken', () => {
    it('Not owner', async function() {
      try {
        await crossDelegateProxy.addToken(eosToken.name, eosToken.symbol, eosToken.decimals, {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Not owner");
      }
    });
  });

  describe('updateToken', () => {
    it('Not owner', async function() {
      try {
        await crossDelegateProxy.updateToken(shadowAddress.EOS, eosToken.name, eosToken.symbol, {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Not owner");
      }
    });
  });

  describe('addTokenAdmin', () => {
    it('Not owner', async function() {
      try {
        await crossDelegateProxy.addTokenAdmin(shadowAddress.EOS, admin, {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Not owner");
      }
    });
  });

  describe('removeTokenAdmin', () => {
    it('Not owner', async function() {
      try {
        await crossDelegateProxy.removeTokenAdmin(shadowAddress.EOS, admin, {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Not owner");
      }
    });
  });

  // describe('fallback', () => {
  //   it('revert', async function() {
  //     try {
  //       const { tokenManagerDelegate } = await newTokenManager(accounts);
  //       const r = await web3.eth.sendTransaction({from: owner, to: tokenManagerDelegate.address});
  //     } catch (e) {
  //       const isHave = e.message.includes("revert Not support");
  //       if (isHave) {
  //         assert.ok("fallback is right");
  //         return;
  //       }
  //     }
  //     assert.fail("fallback error");
  //   });
  // });

  describe('mintToken', () => {
    it('add admin', async function() {
      await crossDelegateProxy.addAdmin(admin, {from: owner});
    });
    it('not admin', async function() {
      try {
        await crossDelegateProxy.mintToken(shadowAddress.EOS, admin, web3.utils.toWei("1"), {from: owner});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "not admin");
      }
    });
    it('not admin or owner', async function() {
      try {
        await crossDelegateProxy.mintToken(wanTokenInstance.address, admin, web3.utils.toWei("1"), {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "not admin or owner");
      }
    });
    it('Value is null', async function() {
      try {
        await crossDelegateProxy.mintToken(shadowAddress.EOS, admin, 0, {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Value is null");
      }
    });
    it('remove admin', async function() {
      await crossDelegateProxy.removeAdmin(admin, {from: owner});
    })
  });

  describe('upgradeTo', () => {
    it('check implementation', async function() {
      try {
        let crossProxy = await CrossProxy.at(crossDelegateProxy.address);
        let imp = await crossProxy.implementation();
        assert.equal(imp.toLowerCase(), crossDelegateInstance.address.toLowerCase(), "check proxy implementation failed")
      } catch (err) {
        assert.fail(err);
      }
    });
    it('Cannot upgrade to the same implementation', async function() {
      const crossProxy = await CrossProxy.at(crossDelegateProxy.address);

      try {
        await crossProxy.upgradeTo(crossDelegateInstance.address);
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Cannot upgrade to the same implementation");
      }
    });
    it('Cannot upgrade to the same implementation', async function() {
      const crossProxy = await CrossProxy.at(crossDelegateProxy.address);

      try {
        await crossProxy.upgradeTo(ADDRESS_0);
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Cannot upgrade to invalid address");
      }
    });
    it('Not owner', async function() {
      const crossProxy = await CrossProxy.at(crossDelegateProxy.address);

      try {
        await crossProxy.upgradeTo(ADDRESS_0, {from: admin});
        assert.fail(ERROR_INFO);
      } catch (err) {
        assert.include(err.toString(), "Not owner");
      }
    })
  })
})
