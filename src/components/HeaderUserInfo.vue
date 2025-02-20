<template>
  <v-menu bottom left>
    <template v-slot:activator="{ on, attrs }">
      <div class="d-flex align-center mr-4" v-bind="attrs" v-on="on">
        <div class="d-flex align-center">
          <div style="cursor: pointer">
            <v-img src="@/assets/user-profile-sample.png" max-width="35" />
          </div>
          <div>
            <!-- :class="hover ? 'primary--text' : ''" -->
            <div class="ml-3 text-left">
              {{ name }}
            </div>
            <div class="ml-3 light_primary--text" style="font-size: 14px">
              {{ balance }} DBIO
            </div>
          </div>
        </div>
      </div>
    </template>
    <div class="mt-11">
      <v-card>
        <v-list>
          <v-list-item two-line @click="openWalletBinding">
            <v-list-item-action>
              <v-icon>mdi-wallet</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Wallet Binding</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item two-line @click="logOut">
            <v-list-item-action>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Log Out</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
  </v-menu>
</template>


<script>
import { mapState, mapMutations, mapActions } from "vuex";
import localStorage from "@/lib/local-storage";
import { ethAddressByAccountId } from "@/lib/polkadotProvider/query/userProfile";
import { queryBalance } from "@/lib/polkadotProvider/query/balance";
import { getBalanceETH } from "@/lib/metamask/wallet.js";
import { fromEther } from "@/lib/balance-format"

export default {
  name: "HeaderUserInfo",
  computed: {
    ...mapState({
      walletBalance: (state) => state.substrate.walletBalance,
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      metamaskWalletAddress: (state) => state.metamask.metamaskWalletAddress,
      metamaskWalletBalance: (state) => state.metamask.metamaskWalletBalance,
    }),
  },
  data: () => ({
    isLoading: false,
    balance: 0,
    name: "",
  }),
  methods: {
    ...mapMutations({
      setWalletBalance: "substrate/SET_WALLET_BALANCE",
      clearWallet: "substrate/CLEAR_WALLET",
      setMetamaskAddress: "metamask/SET_WALLET_ADDRESS",
      setMetamaskBalance: "metamask/SET_WALLET_BALANCE",
    }),
    ...mapActions({
      clearAuth: "auth/clearAuth",
    }),
    async getBalance(balanceNummber) {
      const balance = Number(await fromEther(balanceNummber)).toFixed(3)
      this.balance = balance.replace(/\.000/,'')
      if (this.balance == "0") {
        this.balance = "0";
      }
    },
    async fetchWalletBalance() {
      try {
        this.isLoading = true;
        const balanceNummber = await queryBalance(
          this.api,
          this.wallet.address
        );
        this.getBalance(balanceNummber);
        this.name = this.wallet.meta.name;
        this.setWalletBalance(balanceNummber);
        this.isLoading = false;
      } catch (err) {
        console.error(err);
        this.isLoading = false;
      }
    },
    logOut() {
      this.clearAuth();
      localStorage.clear();
      this.$store.dispatch("lab/setProvideService", {})
      this.$store.commit("substrate/SET_IS_SERVICES_EXIST", false)
      this.$router.push("/login");
    },
    openWalletBinding() {
      this.$emit("showWalletBinding", true);
    },
    async checkMetamaskAddress() {
      if (this.metamaskWalletAddress == "") {
        const ethRegisterAddress = await ethAddressByAccountId(
          this.api,
          this.wallet.address
        );
        if (ethRegisterAddress != null) {
          this.setMetamaskAddress(ethRegisterAddress);
        }
      }
    },
  },
  watch: {
    async wallet() {
      await this.fetchWalletBalance();
    },
    async metamaskWalletAddress() {
      let balance = 0;
      if (this.metamaskWalletAddress != "") {
        balance = await getBalanceETH(this.metamaskWalletAddress);
      }
      this.setMetamaskBalance(balance);
    },
    walletBalance() {
      this.getBalance(this.walletBalance);
    },
  },
  async mounted() {
    await this.fetchWalletBalance();
    await this.checkMetamaskAddress();
  },
};
</script>

<style>
</style>
