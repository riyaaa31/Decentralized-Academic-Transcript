const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {

  // Reusable deployment fixture
  async function deployLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
    const lockedAmount = ONE_GWEI;

    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  // -----------------------
  // ✅ Deployment Tests
  // -----------------------
  describe("Deployment", function () {
    it("Should set the correct unlock time", async function () {
      const { lock, unlockTime } = await loadFixture(deployLockFixture);
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should assign the owner correctly", async function () {
      const { lock, owner } = await loadFixture(deployLockFixture);
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should accept and store the locked ETH", async function () {
      const { lock, lockedAmount } = await loadFixture(deployLockFixture);
      const contractBalance = await ethers.provider.getBalance(lock.target);
      expect(contractBalance).to.equal(lockedAmount);
    });

    it("Should revert if unlock time is not in the future", async function () {
      const currentTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(
        Lock.deploy(currentTime, { value: 1 })
      ).to.be.revertedWith("Unlock time should be in the future");
    });
  });

  // -----------------------
  // ✅ Withdrawal Tests
  // -----------------------
  describe("Withdrawals", function () {

    describe("Validations", function () {
      it("Should revert if withdrawal is attempted before unlock time", async function () {
        const { lock } = await loadFixture(deployLockFixture);
        await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
      });

      it("Should revert if called by non-owner after unlock time", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(deployLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith("You aren't the owner");
      });

      it("Should succeed when owner withdraws after unlock time", async function () {
        const { lock, unlockTime } = await loadFixture(deployLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).to.not.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit a Withdrawal event", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(deployLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // anyValue matches the timestamp
      });
    });

    describe("Transfers", function () {
      it("Should transfer locked funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(deployLockFixture);
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });

  });
});
