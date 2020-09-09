const {
    deploy2
} = require("./deploySwitch");

let deployContract = async function(deployer,network, accounts) {};

if (deploy2) {
    const CrossDelegate = artifacts.require('CrossDelegate');
    const CrossProxy = artifacts.require('CrossProxy');

    deployContract = async function(deployer,network, accounts) {
        // deploy CrossProxy
        await deployer.deploy(CrossProxy);
        let crossProxy = await CrossProxy.deployed();

        await deployer.deploy(CrossDelegate);
        let crossDelegate = await CrossDelegate.deployed();

        await crossProxy.upgradeTo(crossDelegate.address);
    };
}

module.exports = deployContract;