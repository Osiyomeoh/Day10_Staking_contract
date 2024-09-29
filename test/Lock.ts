import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Staking", function () {
  async function deployStakingFixture() {
    const ONE_ETH = hre.ethers.parseEther("1");
    const REWARD_RATE = hre.ethers.parseEther("0.1"); // 0.1 ETH per second

    const [owner, staker1, staker2] = await hre.ethers.getSigners();

    const Staking = await hre.ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(REWARD_RATE);

    // Fund the contract with some ETH for rewards
    await owner.sendTransaction({
      to: await staking.getAddress(),
      value: hre.ethers.parseEther("100"),
    });

    return { staking, REWARD_RATE, ONE_ETH, owner, staker1, staker2 };
  }

  describe("Deployment", function () {
    it("Should set the right reward rate", async function () {
      const { staking, REWARD_RATE } = await loadFixture(deployStakingFixture);
      expect(await staking.rewardRate()).to.equal(REWARD_RATE);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake ETH", async function () {
      const { staking, ONE_ETH, staker1 } = await loadFixture(deployStakingFixture);
      await staking.connect(staker1).stake({ value: ONE_ETH });
      expect(await staking.stakedBalance(staker1.address)).to.equal(ONE_ETH);
      expect(await staking.totalStaked()).to.equal(ONE_ETH);
    });

    it("Should emit Staked event", async function () {
      const { staking, ONE_ETH, staker1 } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(staker1).stake({ value: ONE_ETH }))
        .to.emit(staking, "Staked")
        .withArgs(staker1.address, ONE_ETH);
    });

    it("Should not allow staking 0 ETH", async function () {
      const { staking, staker1 } = await loadFixture(deployStakingFixture);
      await expect(staking.connect(staker1).stake({ value: 0 })).to.be.revertedWith("Cannot stake 0");
    });
  });

  describe("Withdrawing", function () {
    it("Should allow users to withdraw staked ETH", async function () {
      const { staking, ONE_ETH, staker1 } = await loadFixture(deployStakingFixture);
      await staking.connect(staker1).stake({ value: ONE_ETH });
      await staking.connect(staker1).withdraw(ONE_ETH);
      expect(await staking.stakedBalance(staker1.address)).to.equal(0);
      expect(await staking.totalStaked()).to.equal(0);
    });

    it("Should emit Withdrawn event", async function () {
      const { staking, ONE_ETH, staker1 } = await loadFixture(deployStakingFixture);
      await staking.connect(staker1).stake({ value: ONE_ETH });
      await expect(staking.connect(staker1).withdraw(ONE_ETH))
        .to.emit(staking, "Withdrawn")
        .withArgs(staker1.address, ONE_ETH);
    });

    it("Should not allow withdrawing more than staked", async function () {
      const { staking, ONE_ETH, staker1 } = await loadFixture(deployStakingFixture);
      await staking.connect(staker1).stake({ value: ONE_ETH });
      await expect(staking.connect(staker1).withdraw(ONE_ETH * 2n)).to.be.revertedWith("Insufficient balance");
    });
  });

 
});